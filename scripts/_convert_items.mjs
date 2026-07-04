import fs from 'node:fs';

let src = fs.readFileSync('js/data/items.js', 'utf8');
let out = src
  .replace(/window\.CoCItemDB\s*=\s*window\.CoCItemDB\s*\|\|\s*\{\};/, 'export const CoCItemDB = {};')
  .replace(/window\.CoCItemDB/g, 'CoCItemDB')
  .replace(/window\.parseItemData\s*=\s*function/, 'export function parseItemData');
out = '// Merged superset from items.js (authoritative browser source)\n' + out;
fs.writeFileSync('js/data/items.mjs', out);
console.log('items.mjs written', out.length, 'chars');

const shim = `// Thin backward-compatible wrapper — data is now in items.mjs
import { CoCItemDB } from './items.mjs';
export { CoCItemDB };
if (typeof window !== 'undefined') window.CoCItemDB = window.CoCItemDB || CoCItemDB;
`;
fs.writeFileSync('js/data/items_db.mjs', shim);
console.log('items_db.mjs shim written');
