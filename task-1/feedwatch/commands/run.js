import chalk from 'chalk';
import { resolveConfig } from '../lib/config.js';
import { fetchAll } from '../lib/fetcher.js';
import { listFeeds, readStore, writeStoreAtomic } from '../lib/store.js';
import { parseXML } from '../lib/parser.js';

export function register(program) {
  program
    .command('run')
    .option('--all', 'Show all items, not just NEW')
    .description('Fetch registered feeds')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const { config } = resolveConfig(opts);
      const showAll = !!cmdOpts?.all;

      const feeds = listFeeds();
      if (feeds.length === 0) {
        console.log(chalk.gray('No feeds registered. Use `feedwatch add <name> <url>`.'));
        process.exitCode = 0;
        return;
      }

      const feedByName = new Map(feeds.map((f) => [f.name, f]));
      const results = await fetchAll(feeds, config);
      const anyFailed = results.some((r) => r.status === 'failed');

      // Load once so we can write back seen-state atomically.
      const store = readStore();
      const nowIso = new Date().toISOString();

      for (const r of results) {
        if (r.status === 'failed') {
          console.log(chalk.red(`${r.name}: FAILED${r.error ? ` - ${r.error}` : ''}`));
          continue;
        }

        const feedInfo = feedByName.get(r.name);
        const items = parseXML(r.xml || '');
        const seenGuids = new Set(store.seen[r.name] || []);

        const normalizedItems = items.map((it) => {
          const isNew = it.guid && !seenGuids.has(it.guid);
          return { ...it, status: isNew ? 'NEW' : 'SEEN' };
        });

        const newItems = normalizedItems.filter((it) => it.status === 'NEW');
        const currentGuids = normalizedItems.map((it) => it.guid).filter(Boolean);

        if (!store.feeds[r.name]) {
          // Shouldn't happen since `feeds` came from the registry, but keep the store consistent.
          store.feeds[r.name] = { url: feedInfo?.url || '', lastFetchedAt: null, newItemCount: 0 };
        }

        store.feeds[r.name].lastFetchedAt = nowIso;
        store.feeds[r.name].newItemCount = newItems.length;
        store.seen[r.name] = currentGuids;

        const toDisplay = showAll ? normalizedItems : newItems;
        const limited = typeof config.maxItems === 'number' ? toDisplay.slice(0, config.maxItems) : toDisplay;

        // Ticket 1.5 acceptance only cares about NEW/SEEN + new count persistence.
        console.log(`${r.name}: ${newItems.length} new / ${normalizedItems.length} total`);
        for (const it of limited) {
          const statusColour = it.status === 'NEW' ? chalk.green : chalk.gray;
          console.log(statusColour(`- ${it.title || it.guid || it.link}`));
        }
      }

      // Persist seen-state for successful feeds.
      // (Even if some feeds failed, we still update the successful ones.)
      await writeStoreAtomic(store);

      process.exitCode = anyFailed ? 1 : 0;
    });
}

