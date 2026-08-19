#!/usr/bin/env node
/**
 * Compare TranslatePipe / instant() keys in src/app against ar.json + en.json.
 * Usage: node scripts/i18n-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const APP = join(ROOT, 'src', 'app');
const I18N = join(ROOT, 'src', 'assets', 'i18n');

const KEY_RES = [
  /(?:['"`])([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)(?:['"`])\s*\|\s*translate/g,
  /(?:i18n|translate)\.instant\(\s*(['"`])([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)\1/g,
  /(?:titleKey|bodyKey|labelKey|quoteKey|subtitleKey|eyebrowKey|emptyTitleKey|emptyBodyKey|confirmKey|cancelKey)\s*[:=]\s*(['"`])([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)\1/g,
  /\[(?:titleKey|bodyKey|labelKey|quoteKey|subtitleKey|eyebrowKey)\]\s*=\s*(['"`])([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)\1/g,
];

const SKIP_PREFIX = new Set(['http', 'https', 'www']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, files);
    } else if (/\.(ts|html)$/.test(name) && !name.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

function flatten(node, prefix = '', out = new Map()) {
  if (node == null) return out;
  if (typeof node === 'string') {
    if (prefix) out.set(prefix, node);
    return out;
  }
  if (typeof node !== 'object' || Array.isArray(node)) return out;
  for (const [k, v] of Object.entries(node)) {
    const next = prefix ? `${prefix}.${k}` : k;
    flatten(v, next, out);
  }
  return out;
}

function extractKeys(text) {
  const found = new Set();
  for (const re of KEY_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const key = m[2] || m[1];
      if (!key || key.includes('{{')) continue;
      const root = key.split('.')[0];
      if (SKIP_PREFIX.has(root)) continue;
      found.add(key);
    }
  }
  return found;
}

function loadJson(name) {
  return JSON.parse(readFileSync(join(I18N, name), 'utf8'));
}

const used = new Set();
for (const file of walk(APP)) {
  for (const key of extractKeys(readFileSync(file, 'utf8'))) {
    used.add(key);
  }
}

const en = flatten(loadJson('en.json'));
const ar = flatten(loadJson('ar.json'));

const missingEn = [...used].filter((k) => !en.has(k)).sort();
const missingAr = [...used].filter((k) => !ar.has(k)).sort();
const onlyEn = [...en.keys()].filter((k) => !ar.has(k)).sort();
const onlyAr = [...ar.keys()].filter((k) => !en.has(k)).sort();

const lines = [];
const fail = (msg) => lines.push(msg);

if (missingEn.length) {
  fail(`\nUsed keys missing in en.json (${missingEn.length}):`);
  for (const k of missingEn) fail(`  - ${k}`);
}
if (missingAr.length) {
  fail(`\nUsed keys missing in ar.json (${missingAr.length}):`);
  for (const k of missingAr) fail(`  - ${k}`);
}
if (onlyEn.length) {
  fail(`\nKeys in en.json but not ar.json (${onlyEn.length}):`);
  for (const k of onlyEn) fail(`  - ${k}`);
}
if (onlyAr.length) {
  fail(`\nKeys in ar.json but not en.json (${onlyAr.length}):`);
  for (const k of onlyAr) fail(`  - ${k}`);
}

console.log(
  `i18n audit: ${used.size} used keys, ${en.size} en leaves, ${ar.size} ar leaves`
);

if (lines.length) {
  console.error(lines.join('\n'));
  process.exit(1);
}

console.log('OK: dictionaries match each other and cover used keys.');
