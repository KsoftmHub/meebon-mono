import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import prompts from 'prompts'; // For user confirmation

type IntegrateType = 'app' | 'package';

async function checkSuitability(repoPath: string): Promise<boolean> {
  // Basic check: does it have a package.json?
  const packageJsonPath = path.join(repoPath, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    console.warn(chalk.yellow('Warning: Cloned repository does not contain a package.json. It might not be a Node.js project.'));
    return false;
  }
  // Add more checks here if needed (e.g., specific build tools, etc.)
  return true;
}

export async function integrateRepo(repoUrl: string, name: string, type: IntegrateType) {
  const projectRoot = path.resolve(__dirname, '../../../../'); // monorepo root
  const baseDir = type === 'app' ? 'apps' : 'packages';
  const targetPath = path.join(projectRoot, baseDir, name);
  const tempClonePath = path.join(projectRoot, '.tmp_clone', name);

  console.log(chalk.blue(`Attempting to integrate repository: ${repoUrl} as ${type} '${name}' into ${targetPath}`));

  if (await fs.pathExists(targetPath)) {
    console.error(chalk.red(`Error: Target path '${targetPath}' already exists.`));
    process.exit(1);
  }
  if (await fs.pathExists(tempClonePath)) {
    await fs.remove(tempClonePath); // Clean up previous temp clone if any
  }
  await fs.ensureDir(tempClonePath);

  try {
    console.log(chalk.cyan(`Cloning ${repoUrl} into a temporary directory...`));
    execSync(`git clone --depth 1 ${repoUrl} ${tempClonePath}`, { stdio: 'inherit' });
    console.log(chalk.green('Repository cloned successfully.'));

    // Remove .git directory from the clone to avoid nested git repositories issues
    // if we are truly "integrating" it as a monorepo package.
    // If the user wants to keep it as a submodule-like entity, this step might be skipped or made optional.
    const clonedGitDir = path.join(tempClonePath, '.git');
    if (await fs.pathExists(clonedGitDir)) {
      const keepGitResponse = await prompts({
        type: 'confirm',
        name: 'value',
        message: `The cloned repository has its own .git directory. Do you want to remove it to integrate it more cleanly into the monorepo? (Recommended for monorepo packages, 'No' will keep it as a nested repository).`,
        initial: true
      });
      if (keepGitResponse.value) {
        await fs.remove(clonedGitDir);
        console.log(chalk.yellow('Removed .git directory from the cloned repository.'));
      } else {
        console.log(chalk.yellow('Kept .git directory. The new component will be a nested Git repository.'));
      }
    }


    const isSuitable = await checkSuitability(tempClonePath);
    if (!isSuitable) {
      const proceedResponse = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'The cloned repository might not be suitable. Do you want to proceed with integration anyway?',
        initial: false
      });
      if (!proceedResponse.value) {
        console.log(chalk.yellow('Integration aborted by user. Cleaning up temporary files.'));
        await fs.remove(tempClonePath);
        process.exit(0);
      }
    }

    await fs.move(tempClonePath, targetPath);
    console.log(chalk.green(`Moved cloned repository to ${targetPath}.`));

    // Update root tsconfig.json
    const rootTsConfigPath = path.join(projectRoot, 'tsconfig.json');
    const rootTsConfig = await fs.readJson(rootTsConfigPath);
    const newReference = { path: `${baseDir}/${name}` };
    if (!rootTsConfig.references.some((ref: { path: string }) => ref.path === newReference.path)) {
      rootTsConfig.references.push(newReference);
      rootTsConfig.references.sort((a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path));
      await fs.writeJson(rootTsConfigPath, rootTsConfig, { spaces: 2 });
      console.log(chalk.green(`Updated root tsconfig.json with reference to ${name}.`));
    }

    console.log(chalk.green(`Successfully integrated repository as ${type}: ${name}`));
    console.log(chalk.yellow(`\nNext steps:`));
    console.log(chalk.yellow(`1. Manually review the integrated '${name}' package/app.`));
    console.log(chalk.yellow(`   - Ensure its 'package.json' is configured correctly for the monorepo (e.g., name, scripts, dependencies).`));
    console.log(chalk.yellow(`   - Adjust its 'tsconfig.json' if necessary to extend the root config and work with project references.`));
    console.log(chalk.yellow(`2. Run 'pnpm install' from the monorepo root.`));
    console.log(chalk.yellow(`3. Test the build and functionality: 'pnpm turbo run build --filter=${name}...`));
    console.log(chalk.magenta(`Important: This integration is basic. You may need to manually adjust build configurations, dependencies, and import paths.`));

  } catch (error) {
    console.error(chalk.red(`Error integrating repository '${repoUrl}':`), error);
    if (await fs.pathExists(targetPath) && !await fs.pathExists(tempClonePath)) { // if move was successful but later error
      console.log(chalk.yellow(`The repository was moved to ${targetPath} but an error occurred later.`));
      const removeResponse = await prompts({
        type: 'confirm',
        name: 'value',
        message: `An error occurred after moving the repository. Do you want to remove the directory ${targetPath}?`,
        initial: true
      });
      if (removeResponse.value) {
        await fs.remove(targetPath);
        console.log(chalk.yellow(`Removed directory ${targetPath}.`));
      }
    } else if (await fs.pathExists(tempClonePath)) {
      await fs.remove(tempClonePath);
    }
    process.exit(1);
  }
}
