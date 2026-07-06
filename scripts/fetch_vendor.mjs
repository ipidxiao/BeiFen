#!/usr/bin/env node
/**
 * Download pinned vendor assets for offline CDN plan C.
 * Run: node scripts/fetch_vendor.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vendor = path.join(root, 'vendor');

const ASSETS = [
  {
    url: 'https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js',
    file: 'vue.global.prod.js',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    file: 'bootstrap.min.css',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    file: 'chart.min.js',
  },
];

fs.mkdirSync(vendor, { recursive: true });

for (const { url, file } of ASSETS) {
  const dest = path.join(vendor, file);
  process.stdout.write(`fetch ${file} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`${buf.length} bytes`);
}

console.log('fetch_vendor: done');
