import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { parseXML } from '../lib/parser.js';
import { resolveConfig } from '../lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(PROJECT_ROOT, 'tests', 'fixtures');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'feedwatch.config.json');

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

function mkTmpDir(baseDir, label) {
  const dir = fs.mkdtempSync(path.join(baseDir, `${label}-`));
  return dir;
}

describe('Parser unit tests', () => {
  it('valid RSS fixture returns correctly normalised items', () => {
    const rss = parseXML(readFixture('rss.xml'));
    expect(Array.isArray(rss)).toBe(true);
    expect(rss.length).toBe(2);

    expect(Object.keys(rss[0]).sort()).toEqual(['description', 'guid', 'link', 'pubDate', 'title'].sort());
    expect(rss[0].title).toBe('Item One');
    expect(rss[0].guid).toBe('g1');
    expect(rss[0].pubDate).toBe('2024-01-01T00:00:00.000Z');
  });

  it('valid Atom fixture returns same normalised shape', () => {
    const atom = parseXML(readFixture('atom.xml'));
    expect(Array.isArray(atom)).toBe(true);
    expect(atom.length).toBe(2);

    expect(Object.keys(atom[0]).sort()).toEqual(['description', 'guid', 'link', 'pubDate', 'title'].sort());
    expect(atom[0].title).toBe('Atom One');
    expect(atom[0].guid).toBe('guid-atom-1');
  });

  it('malformed XML fixture returns [] and does not throw', () => {
    expect(() => parseXML(readFixture('bad.xml'))).not.toThrow();
    const bad = parseXML(readFixture('bad.xml'));
    expect(Array.isArray(bad)).toBe(true);
    expect(bad).toEqual([]);
  });

  it('missing <title> on one item yields title="" (no crash)', () => {
    const rss = parseXML(readFixture('rss.xml'));
    const second = rss[1];
    expect(second.title).toBe('');
  });
});

describe('Config unit tests', () => {
  it('resolveConfig({}) with no file values and no env => defaults with all sources=default', () => {
    // feedwatch.config.json exists in this repo; empty file still counts as no overrides.
    const envBackup = {};
    for (const k of ['FEEDWATCH_RETRIES', 'FEEDWATCH_TIMEOUT', 'FEEDWATCH_MAX_ITEMS', 'FEEDWATCH_LOG_LEVEL']) {
      envBackup[k] = process.env[k];
      delete process.env[k];
    }

    const { config, sources } = resolveConfig({});
    expect(config.retries).toBe(3);
    expect(config.timeout).toBe(8000);
    expect(config.maxItems).toBe(10);
    expect(config.logLevel).toBe('info');
    for (const key of ['retries', 'timeout', 'maxItems', 'logLevel']) {
      expect(sources[key]).toBe('default');
    }

    for (const k of Object.keys(envBackup)) {
      if (envBackup[k] === undefined) delete process.env[k];
      else process.env[k] = envBackup[k];
    }
  });

  it('FEEDWATCH_TIMEOUT=3000 sets timeout with env source', () => {
    const envBackup = process.env.FEEDWATCH_TIMEOUT;
    delete process.env.FEEDWATCH_TIMEOUT;

    process.env.FEEDWATCH_TIMEOUT = '3000';
    const { config, sources } = resolveConfig({});
    expect(config.timeout).toBe(3000);
    expect(sources.timeout).toBe('env');

    if (envBackup === undefined) delete process.env.FEEDWATCH_TIMEOUT;
    else process.env.FEEDWATCH_TIMEOUT = envBackup;
  });

  it('opts.logLevel passed in sets logLevel with flag source', () => {
    const { config, sources } = resolveConfig({ logLevel: 'debug' });
    expect(config.logLevel).toBe('debug');
    expect(sources.logLevel).toBe('flag');
  });

  it('unknown key in config file exits with error', () => {
    const original = fs.existsSync(CONFIG_PATH) ? fs.readFileSync(CONFIG_PATH, 'utf8') : null;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ unknown: 1 }));

    const r = spawnSync('bun', ['feedwatch.js', 'config', 'show'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, FEEDWATCH_STORE_DIR: mkTmpDir(os.tmpdir(), 'dummy-store') },
    });

    fs.writeFileSync(CONFIG_PATH, original ?? '{}');
    expect(r.status).not.toBe(0);
  });
});

describe('Integration tests (spawned processes)', () => {
  let tmpRoot;
  let tmpDir;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'feedwatch-tests-'));
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    tmpDir = mkTmpDir(tmpRoot, 'store');
    process.env.FEEDWATCH_STORE_DIR = tmpDir;
  });

  function run(args, opts = {}) {
    return spawnSync('bun', ['feedwatch.js', ...args], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, FEEDWATCH_STORE_DIR: opts.storeDir || tmpDir },
      ...opts,
    });
  }

  it('add a feed', () => {
    const r = run(['add', 'test', 'http://example.com/rss']);
    expect(r.status).toBe(0);
  });

  it('list after add', () => {
    run(['add', 'test', 'http://example.com/rss']);
    const r = run(['list']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/test/i);
  });

  it('duplicate add errors', () => {
    run(['add', 'test', 'http://example.com/rss']);
    const r = run(['add', 'test', 'http://other.com/rss']);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/already exists/i);
  });

  it('list empty store', () => {
    const r = run(['list']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/no feeds registered/i);
  });

  it('remove unknown feed', () => {
    const r = run(['remove', 'nope']);
    expect(r.status).not.toBe(0);
  });

  it('read unknown feed', () => {
    const r = run(['read', 'nope']);
    expect(r.status).not.toBe(0);
  });

  it('config show', () => {
    const r = run(['config', 'show']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/retries/i);
  });

  it('config show with env', () => {
    const envBackup = process.env.FEEDWATCH_TIMEOUT;
    process.env.FEEDWATCH_TIMEOUT = '1234';

    const r = run(['config', 'show']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/1234/);

    if (envBackup === undefined) delete process.env.FEEDWATCH_TIMEOUT;
    else process.env.FEEDWATCH_TIMEOUT = envBackup;
  });

  it('reports FAILED for unreachable feed without crashing', () => {
    run(['add', 'dead', 'http://127.0.0.1:19999/rss']);
    const r = run(['run']);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/FAILED|failed/i);
    expect(r.stderr).not.toMatch(/unhandledRejection/);
  });
});

