#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { resolveConfig } from './lib/config.js';

function formatSourceLabel(source) {
  switch (source) {
    case 'default':
      return chalk.gray('default');
    case 'file':
      return chalk.yellow('file');
    case 'env':
      return chalk.cyan('env');
    case 'flag':
      return chalk.green('flag');
    default:
      return source;
  }
}

const program = new Command();
program
  .name('feedwatch')
  .description('Monitor RSS and Atom feeds for new items')
  .option('--retries <n>', 'Network retry attempts', (v) => Number.parseInt(v, 10))
  .option('--timeout <ms>', 'HTTP timeout in milliseconds', (v) => Number.parseInt(v, 10))
  .option('--max-items <n>', 'Max items to display per feed', (v) => Number.parseInt(v, 10))
  .option('--log-level <level>', 'Logging level')
  .showHelpAfterError();

program
  .command('config')
  .description('Show resolved configuration')
  .command('show')
  .description('Display resolved config values and their sources')
  .allowUnknownOption(false)
  .action(() => {
    try {
      const opts = program.opts();
      const { config, sources } = resolveConfig(opts);

      const table = new Table({
        head: ['key', 'value', 'source'],
        style: { head: ['white'] },
        colWidths: [18, 18, 10],
        wordWrap: true,
      });

      for (const key of Object.keys(config)) {
        table.push([key, String(config[key]), formatSourceLabel(sources[key])]);
      }

      console.log(table.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(message));
      process.exitCode = 1;
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

