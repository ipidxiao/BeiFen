#!/usr/bin/env node
/**
 * verify_sw_cache.mjs — CI guard: sw.js CACHE_NAME must match asset_manifest getCacheName().
 * Run after build:js (or build_browser --check) to catch stale Service Worker cache buckets.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCacheName } from './asset_manifest.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const swPath = path.join(root, 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');
const expected = getCacheName();

const match = swSource.match(/const CACHE_NAME = '([^']+)'/);
if (!match) {
    console.error('verify_sw_cache: sw.js missing const CACHE_NAME');
    process.exit(1);
}

if (match[1] !== expected) {
    console.error(`verify_sw_cache: CACHE_NAME drift`);
    console.error(`  sw.js:    '${match[1]}'`);
    console.error(`  expected: '${expected}' (from getCacheName())`);
    console.error('Fix: npm run build:js  — or python build.py before release');
    process.exit(1);
}

console.log(`verify_sw_cache: CACHE_NAME=${expected} OK`);
