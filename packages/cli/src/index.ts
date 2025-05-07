#!/usr/bin/env node
import { Command } from 'commander';
import { generateScaffold } from './commands/generateScaffold';
import { integrateRepo } from './commands/integrateRepo'; // New import

const program = new Command();

program
  .name('monorepo-cli')
  .description('CLI for managing the ecommerce monorepo')
  .version('1.0.0');

const generate = program.command('generate')
  .alias('g')
  .description('Generate a new app or package');

generate
  .command('app <appName>')
  .alias('a')
  .description('Generate a new application template within the apps/ directory')
  .action(async (appName: string) => {
    await generateScaffold(appName, 'app');
  });

generate
  .command('package <packageName>')
  .alias('p')
  .description('Generate a new package template within the packages/ directory')
  .action(async (packageName: string) => {
    await generateScaffold(packageName, 'package');
  });

const integrate = program.command('integrate')
  .alias('i')
  .description('Integrate an existing Git repository as a new app or package');

integrate
  .command('repo <repoUrl> <name> <type>')
  .alias('r')
  .description('Clones a Git repository and attempts to integrate it. Type must be "app" or "package".')
  .action(async (repoUrl: string, name: string, type: string) => {
    if (type !== 'app' && type !== 'package') {
      console.error('Error: type must be "app" or "package".');
      process.exit(1);
    }
    await integrateRepo(repoUrl, name, type as 'app' | 'package');
  });

program.parse(process.argv);
