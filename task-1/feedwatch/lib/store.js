import fs from 'fs';
import os from 'os';
import path from 'path';

function getStoreDir() {
  if (process.env.FEEDWATCH_STORE_DIR) return process.env.FEEDWATCH_STORE_DIR;
  return path.join(os.homedir(), '.feedwatch');
}

function getStorePath() {
  return path.join(getStoreDir(), 'store.json');
}

function getSeenShapeSafe(store) {
  if (!store || typeof store !== 'object') return { feeds: {}, seen: {} };
  const feeds = store.feeds && typeof store.feeds === 'object' ? store.feeds : {};
  const seen = store.seen && typeof store.seen === 'object' ? store.seen : {};
  return { feeds, seen };
}

export function readStore() {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) return { feeds: {}, seen: {} };

  const raw = fs.readFileSync(storePath, 'utf8').trim();
  if (!raw) return { feeds: {}, seen: {} };

  const parsed = JSON.parse(raw);
  return getSeenShapeSafe(parsed);
}

async function atomicWriteFile(storePath, content) {
  const storeDir = path.dirname(storePath);
  await fs.promises.mkdir(storeDir, { recursive: true });

  const tmpPath = storePath + '.tmp';
  await fs.promises.writeFile(tmpPath, content, 'utf8');

  // Windows rename behaviour differs; remove destination first when needed.
  try {
    await fs.promises.rename(tmpPath, storePath);
  } catch (err) {
    try {
      await fs.promises.unlink(storePath);
    } catch {
      // ignore; destination might not exist
    }
    await fs.promises.rename(tmpPath, storePath);
  }
}

export async function writeStoreAtomic(store) {
  const storePath = getStorePath();
  const normalized = getSeenShapeSafe(store);
  const content = JSON.stringify(normalized, null, 2) + '\n';
  await atomicWriteFile(storePath, content);
}

export async function addFeed({ name, url }) {
  const store = readStore();
  if (store.feeds[name]) {
    const e = new Error(`Feed name already exists: ${name}`);
    e.code = 'E_DUPLICATE';
    throw e;
  }

  store.feeds[name] = {
    url,
    lastFetchedAt: null,
    newItemCount: 0,
  };

  await writeStoreAtomic(store);
}

export async function removeFeed(name) {
  const store = readStore();
  if (!store.feeds[name]) {
    const e = new Error(`Unknown feed: ${name}`);
    e.code = 'E_NOT_FOUND';
    throw e;
  }

  delete store.feeds[name];
  delete store.seen[name];

  await writeStoreAtomic(store);
}

export function listFeeds() {
  const store = readStore();
  const names = Object.keys(store.feeds).sort((a, b) => a.localeCompare(b));
  return names.map((name) => {
    const f = store.feeds[name] || {};
    return {
      name,
      url: f.url || '',
      lastFetchedAt: f.lastFetchedAt || null,
      newItemCount: typeof f.newItemCount === 'number' ? f.newItemCount : 0,
    };
  });
}

