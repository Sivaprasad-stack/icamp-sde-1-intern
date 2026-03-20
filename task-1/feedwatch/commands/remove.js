import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { readStore, removeFeed } from '../lib/store.js';

export function register(program) {
  program
    .command('remove <name>')
    .description('Remove a feed')
    .action(async (name) => {
      try {
        const store = readStore();
        if (!store.feeds[name]) {
          const message = `Unknown feed: ${name}`;
          console.error(chalk.red(message));
          process.exitCode = 1;
          return;
        }

        const ok = await confirm({ message: `Remove feed "${name}"?` });
        if (!ok) return;

        await removeFeed(name);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(message));
        process.exitCode = 1;
      }
    });
}

