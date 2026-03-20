import chalk from 'chalk';
import { addFeed } from '../lib/store.js';

export function register(program) {
  program
    .command('add <name> <url>')
    .description('Register a new feed')
    .action(async (name, url) => {
      try {
        await addFeed({ name, url });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(message));
        process.exitCode = 1;
      }
    });
}

