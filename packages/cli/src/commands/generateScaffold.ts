import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import {
  getAppPackageJsonTemplate, // Corrected: Was getPackageJsonTemplate for apps
  getPackagePackageJsonTemplate,
  getAppTsConfigTemplate,    // Corrected: Was getTsConfigTemplate for apps
  getPackageTsConfigTemplate,
  getAppIndexTsTemplate,     // Corrected: Was getIndexTsTemplate for apps
  getPackageIndexTsTemplate,
  getGitignoreTemplate
} from '../templates';

type ScaffoldType = 'app' | 'package';

export async function generateScaffold(name: string, type: ScaffoldType) {
  const projectRoot = path.resolve(__dirname, '../../../../'); // monorepo root
  const baseDir = type === 'app' ? 'apps' : 'packages';
  const scaffoldPath = path.join(projectRoot, baseDir, name);

  console.log(chalk.blue(`Generating new ${type}: ${name} at ${scaffoldPath}`));

  // Safety check: valid name (simple check for spaces, can be expanded)
  if (/\s/.test(name)) {
    console.error(chalk.red(`Error: ${type} name '${name}' cannot contain spaces.`));
    process.exit(1);
  }

  if (await fs.pathExists(scaffoldPath)) {
    console.error(chalk.red(`Error: ${type} '${name}' already exists at ${scaffoldPath}`));
    process.exit(1);
  }

  try {
    // Create directory structure
    await fs.ensureDir(scaffoldPath);
    await fs.ensureDir(path.join(scaffoldPath, 'src'));

    // Create package.json
    const packageJsonContent = type === 'app'
      ? getAppPackageJsonTemplate(name) // Uses correct template
      : getPackagePackageJsonTemplate(name);
    await fs.writeFile(path.join(scaffoldPath, 'package.json'), packageJsonContent);

    // Create tsconfig.json
    const tsconfigJsonContent = type === 'app'
      ? getAppTsConfigTemplate() // Uses correct template
      : getPackageTsConfigTemplate();
    await fs.writeFile(path.join(scaffoldPath, 'tsconfig.json'), tsconfigJsonContent);

    // Create src/index.ts
    const indexTsContent = type === 'app'
      ? getAppIndexTsTemplate(name) // Uses correct template
      : getPackageIndexTsTemplate(name);
    await fs.writeFile(path.join(scaffoldPath, 'src', 'index.ts'), indexTsContent);

    // Create .gitignore
    const gitignoreContent = getGitignoreTemplate();
    await fs.writeFile(path.join(scaffoldPath, '.gitignore'), gitignoreContent);

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

    console.log(chalk.green(`Successfully generated ${type}: ${name}`));
    console.log(chalk.yellow(`\nNext steps:`));
    console.log(chalk.yellow(`1. Run 'pnpm install' from the monorepo root to install dependencies for the new ${type}.`));
    console.log(chalk.yellow(`2. Start developing your new ${type}!`));

  } catch (error) {
    console.error(chalk.red(`Error generating ${type} '${name}':`), error);
    if (await fs.pathExists(scaffoldPath)) {
      await fs.remove(scaffoldPath);
    }
    process.exit(1);
  }
}
