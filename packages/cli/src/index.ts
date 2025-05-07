#!/usr/bin/env node
import { Command } from 'commander';
import { generateScaffold } from './commands/generateScaffold'; // Updated import

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

program.parse(process.argv);
