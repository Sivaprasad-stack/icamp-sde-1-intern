import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'feedwatch.config.json');

export const defaultConfig = {
  retries: 3,
  timeout: 8000,
  maxItems: 10,
  logLevel: 'info',
};

const allowedKeys = new Set(['retries', 'timeout', 'maxItems', 'logLevel']);

function readConfigFileIfPresent() {
  if (!fs.existsSync(CONFIG_PATH)) return {};

  const raw = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid feedwatch.config.json (expected an object)');
  }

  for (const key of Object.keys(parsed)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Unknown config key in feedwatch.config.json: ${key}`);
    }
  }

  return parsed;
}

function applyLayer({ config, sources }, { layerName, values }) {
  for (const [key, value] of Object.entries(values)) {
    if (!allowedKeys.has(key)) continue;
    config[key] = value;
    sources[key] = layerName;
  }
}

export function resolveConfig(opts = {}) {
  const config = { ...defaultConfig };
  const sources = {
    retries: 'default',
    timeout: 'default',
    maxItems: 'default',
    logLevel: 'default',
  };

  // 1) file
  const fileConfig = readConfigFileIfPresent();
  applyLayer({ config, sources }, { layerName: 'file', values: fileConfig });

  // 2) env
  const env = {
    retries: process.env.FEEDWATCH_RETRIES,
    timeout: process.env.FEEDWATCH_TIMEOUT,
    maxItems: process.env.FEEDWATCH_MAX_ITEMS,
    logLevel: process.env.FEEDWATCH_LOG_LEVEL,
  };

  const envValues = {};
  if (env.retries !== undefined) envValues.retries = Number.parseInt(env.retries, 10);
  if (env.timeout !== undefined) envValues.timeout = Number.parseInt(env.timeout, 10);
  if (env.maxItems !== undefined) envValues.maxItems = Number.parseInt(env.maxItems, 10);
  if (env.logLevel !== undefined) envValues.logLevel = env.logLevel;

  applyLayer({ config, sources }, { layerName: 'env', values: envValues });

  // 3) flags
  const flagValues = {};
  if (opts.retries !== undefined) flagValues.retries = opts.retries;
  if (opts.timeout !== undefined) flagValues.timeout = opts.timeout;
  if (opts.maxItems !== undefined) flagValues.maxItems = opts.maxItems;
  if (opts.logLevel !== undefined) flagValues.logLevel = opts.logLevel;

  applyLayer({ config, sources }, { layerName: 'flag', values: flagValues });

  return { config, sources };
}

