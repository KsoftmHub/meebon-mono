import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import prompts from 'prompts';

type ScaffoldType = 'app' | 'package';

async function isGitSubmodule(projectRoot: string, relativePath: string): Promise<boolean> {
  try {
    // Check if it's listed in .gitmodules
    const gitmodulesPath = path.join(projectRoot, '.gitmodules');
    if (await fs.pathExists(gitmodulesPath)) {
      const gitmodulesContent = await fs.readFile(gitmodulesPath, 'utf-8');
      if (gitmodulesContent.includes(`path = ${relativePath}`)) {
        return true;
      }
    }
    // Fallback check: does it have its own .git file (indicating submodule)
    // or is it a directory with a .git file (less reliable for submodule check but a hint)
    const gitFilePath = path.join(projectRoot, relativePath, '.git');
    if (await fs.pathExists(gitFilePath)) {
      // If .git is a file, it's likely a submodule's gitlink
      const stats = await fs.lstat(gitFilePath);
      if (stats.isFile()) return true;
    }

  } catch (error) {
    console.warn(chalk.yellow(`Could not accurately determine if ${relativePath} is a submodule. Proceeding as regular directory.`), error);
  }
  return false;
}


export async function removeScaffold(name: string, type: ScaffoldType) {
  const projectRoot = path.resolve(__dirname, '../../../../'); // monorepo root
  const baseDir = type === 'app' ? 'apps' : 'packages';
  const relativePath = `${baseDir}/${name}`; // Relative path for git commands
  const scaffoldPath = path.join(projectRoot, relativePath);

  console.log(chalk.blue(`Attempting to remove ${type}: ${name} from ${scaffoldPath}`));

  if (!(await fs.pathExists(scaffoldPath))) {
    console.error(chalk.red(`Error: ${type} '${name}' not found at ${scaffoldPath}`));
    process.exit(1);
  }

  const confirmation = await prompts({
    type: 'confirm',
    name: 'value',
    message: `Are you sure you want to remove ${type} '${name}' from ${relativePath}? This action cannot be undone.`,
    initial: false
  });

  if (!confirmation.value) {
    console.log(chalk.yellow('Removal cancelled by user.'));
    process.exit(0);
  }

  try {
    const isSubmodule = await isGitSubmodule(projectRoot, relativePath);

    if (isSubmodule) {
      console.log(chalk.cyan(`Removing Git submodule '${relativePath}'...`));
      if (!spawnSync('git', ['--version']).error) { // Check if git is installed
        try {
          execSync(`git submodule deinit -f ${relativePath}`, { cwd: projectRoot, stdio: 'inherit' });
          execSync(`git rm -f ${relativePath}`, { cwd: projectRoot, stdio: 'inherit' });

          // Sync submodule configuration to ensure .git/config is updated if needed
          console.log(chalk.cyan(`Synchronizing submodule states...`));
          execSync(`git submodule sync --recursive`, { cwd: projectRoot, stdio: 'inherit' });

          // Attempt to remove the submodule's git directory from .git/modules
          const gitModulesPath = path.join(projectRoot, '.git/modules', relativePath);
          if (await fs.pathExists(gitModulesPath)) {
            await fs.remove(gitModulesPath);
            console.log(chalk.yellow(`Removed submodule's git directory: ${gitModulesPath}`));
          }
          // Also attempt to remove the base directory if it's empty (e.g. .git/modules/apps if no other app submodules exist)
          const parentGitModulesPath = path.dirname(gitModulesPath);
          if (await fs.pathExists(parentGitModulesPath) && (await fs.readdir(parentGitModulesPath)).length === 0) {
            await fs.remove(parentGitModulesPath);
            console.log(chalk.yellow(`Removed empty parent directory in .git/modules: ${parentGitModulesPath}`));
          }

          console.log(chalk.green(`Git submodule '${relativePath}' removed from index. Commit changes to .gitmodules and the removal.`));
        } catch (gitError) {
          console.error(chalk.red(`Error removing Git submodule. You may need to resolve this manually.`));
          console.error(gitError);
          console.log(chalk.yellow(`Attempting to remove directory ${scaffoldPath} anyway...`));
          await fs.remove(scaffoldPath);
        }
      } else {
        console.warn(chalk.yellow('Git not found. Cannot remove as submodule. Will attempt to remove directory only.'));
        await fs.remove(scaffoldPath);
      }
    } else {
      console.log(chalk.cyan(`Removing directory '${scaffoldPath}'...`));
      await fs.remove(scaffoldPath);
    }
    console.log(chalk.green(`Successfully removed directory: ${scaffoldPath}`));

    // Update root tsconfig.json
    const rootTsConfigPath = path.join(projectRoot, 'tsconfig.json');
    if (await fs.pathExists(rootTsConfigPath)) {
      const rootTsConfig = await fs.readJson(rootTsConfigPath);
      const initialLength = rootTsConfig.references.length;
      rootTsConfig.references = rootTsConfig.references.filter(
        (ref: { path: string }) => ref.path !== relativePath
      );
      if (rootTsConfig.references.length < initialLength) {
        await fs.writeJson(rootTsConfigPath, rootTsConfig, { spaces: 2 });
        console.log(chalk.green(`Removed reference to '${relativePath}' from root tsconfig.json.`));
      }
    }


    console.log(chalk.green(`Successfully removed ${type}: ${name}`));
    console.log(chalk.yellow(`\nNext steps:`));
    if (isSubmodule) {
      console.log(chalk.yellow(`1. Commit the changes to '.gitmodules' and the submodule removal.`));
      console.log(chalk.yellow(`   Example: git add .gitmodules && git commit -m "Remove ${name} submodule and ${type}"`));
    }
    console.log(chalk.yellow(`2. Run 'pnpm install' from the monorepo root if pnpm-lock.yaml needs updating.`));
    console.log(chalk.yellow(`3. Verify your project builds and runs as expected.`));

  } catch (error) {
    console.error(chalk.red(`Error removing ${type} '${name}':`), error);
    process.exit(1);
  }
}
