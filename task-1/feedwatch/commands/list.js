import chalk from 'chalk';
import Table from 'cli-table3';
import { listFeeds } from '../lib/store.js';

function formatDate(value) {
  if (!value) return '-';
  return value;
}

export function register(program) {
  program
    .command('list')
    .description('List all registered feeds')
    .action(() => {
      const feeds = listFeeds();
      if (feeds.length === 0) {
        console.log(chalk.gray('No feeds registered. Use `feedwatch add <name> <url>`.'));
        return;
      }

      const table = new Table({
        head: ['name', 'URL', 'last-fetched', 'new-items'],
        style: { head: ['white'] },
        wordWrap: true,
        colWidths: [12, 35, 18, 10],
      });

      for (const f of feeds) {
        table.push([f.name, f.url, formatDate(f.lastFetchedAt), String(f.newItemCount)]);
      }

      console.log(table.toString());
    });
}

