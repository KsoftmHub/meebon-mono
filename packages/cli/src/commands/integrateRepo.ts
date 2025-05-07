import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import prompts from 'prompts';

type IntegrateType = 'app' | 'package';

function isGitInstalled(): boolean {
  const gitVersion = spawnSync('git', ['--version']);
  if (gitVersion.error || gitVersion.status !== 0) {
    console.error(chalk.red('Error: Git is not installed or not found in PATH. Please install Git to use this feature.'));
    return false;
  }
  console.log(chalk.gray(`Git version found: ${gitVersion.stdout.toString().trim()}`));
  return true;
}

async function checkSuitability(repoPath: string): Promise<boolean> {
  const packageJsonPath = path.join(repoPath, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    console.warn(chalk.yellow('Warning: Cloned repository does not contain a package.json. It might not be a Node.js project.'));
    return false;
  }
  return true;
}

export async function integrateRepo(repoUrl: string, name: string, type: IntegrateType) {
  if (!isGitInstalled()) {
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '../../../../'); // monorepo root
  const baseDir = type === 'app' ? 'apps' : 'packages';
  const targetPath = path.join(projectRoot, baseDir, name);

  console.log(chalk.blue(`Attempting to add repository: ${repoUrl} as submodule '${name}' into ${targetPath}`));

  if (await fs.pathExists(targetPath)) {
    console.error(chalk.red(`Error: Target path '${targetPath}' already exists. Submodule cannot be added here.`));
    process.exit(1);
  }

  try {
    console.log(chalk.cyan(`Adding ${repoUrl} as a submodule at ${baseDir}/${name}...`));
    execSync(`git submodule add ${repoUrl} ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'inherit' });
    execSync(`git submodule update --init --recursive ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'inherit' });
    console.log(chalk.green('Submodule added and initialized successfully.'));

    const isSuitable = await checkSuitability(targetPath);
    if (!isSuitable) {
      const proceedResponse = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'The submodule repository might not be suitable (e.g., missing package.json). Do you want to proceed with tsconfig integration anyway?',
        initial: false
      });
      if (!proceedResponse.value) {
        console.log(chalk.yellow('Integration aborted by user. Removing submodule entry (manual `git rm` might be needed if commit was made).'));
        try {
          execSync(`git submodule deinit -f ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'inherit' });
          execSync(`git rm -f ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'inherit' });
          await fs.remove(path.join(projectRoot, '.git/modules', baseDir, name));
          console.log(chalk.yellow(`Attempted to deinit and remove submodule ${name}. Please verify with 'git status'.`));
        } catch (deinitError) {
          console.error(chalk.red(`Error trying to remove submodule. Please remove it manually: git submodule deinit -f ${baseDir}/${name} && git rm -f ${baseDir}/${name}`), deinitError);
        }
        await fs.remove(targetPath);
        process.exit(0);
      }
    }

    const rootTsConfigPath = path.join(projectRoot, 'tsconfig.json');
    const rootTsConfig = await fs.readJson(rootTsConfigPath);
    const newReference = { path: `${baseDir}/${name}` };
    if (!rootTsConfig.references.some((ref: { path: string }) => ref.path === newReference.path)) {
      rootTsConfig.references.push(newReference);
      rootTsConfig.references.sort((a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path));
      await fs.writeJson(rootTsConfigPath, rootTsConfig, { spaces: 2 });
      console.log(chalk.green(`Updated root tsconfig.json with reference to ${name}.`));
    }

    console.log(chalk.green(`Successfully added submodule and updated tsconfig for ${type}: ${name}`));
    console.log(chalk.yellow(`\nNext steps:`));
    console.log(chalk.yellow(`1. A '.gitmodules' file has been created or updated. Commit this file and the submodule addition to your main repository.`));
    console.log(chalk.yellow(`   Example: git add .gitmodules ${baseDir}/${name} && git commit -m "Add ${name} submodule"`));
    console.log(chalk.yellow(`2. Manually review the integrated '${name}' ${type} within ${targetPath}.`));
    console.log(chalk.yellow(`   - Its 'package.json' might need adjustments to work with the monorepo's dependency management (pnpm workspaces).`));
    console.log(chalk.yellow(`   - You might need to add it to pnpm workspaces if you intend to manage its dependencies via the root pnpm.`));
    console.log(chalk.yellow(`   - Adjust its 'tsconfig.json' if necessary to extend the root config and work with project references.`));
    console.log(chalk.yellow(`3. Run 'pnpm install' from the monorepo root if you've made changes to its package.json or expect pnpm to link it.`));
    console.log(chalk.yellow(`4. Test the build and functionality: 'pnpm turbo run build --filter=${name}...`));
    console.log(chalk.magenta(`Important: Integrating a submodule into a Turborepo/pnpm workspace build flow requires careful manual configuration.`));

  } catch (error) {
    console.error(chalk.red(`Error integrating repository '${repoUrl}' as submodule:`), error);
    if (await fs.pathExists(targetPath)) {
      console.log(chalk.yellow(`An error occurred. The directory ${targetPath} might exist.`));
      const removeResponse = await prompts({
        type: 'confirm',
        name: 'value',
        message: `An error occurred during submodule integration. Do you want to attempt to remove the directory ${targetPath} and any submodule configuration? (Manual 'git' commands might be needed)`,
        initial: true
      });
      if (removeResponse.value) {
        try {
          execSync(`git submodule deinit -f ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'ignore' });
          execSync(`git rm -f ${baseDir}/${name}`, { cwd: projectRoot, stdio: 'ignore' });
          await fs.remove(path.join(projectRoot, '.git/modules', baseDir, name));
        } catch (cleanupError) {
          // ignore
        }
        await fs.remove(targetPath);
        console.log(chalk.yellow(`Attempted to clean up. Please verify with 'git status'.`));
      }
    }
    process.exit(1);
  }
}
