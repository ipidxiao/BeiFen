#!/usr/bin/env node
/** Convert window.* data .js files → export const .mjs sources. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'data');
const FILES = ['injury_tables', 'insanity_tables', 'mythos_tomes', 'npc_templates', 'spells'];

for (const base of FILES) {
    const jsPath = path.join(DATA, `${base}.js`);
    let src = fs.readFileSync(jsPath, 'utf8');
    src = src.replace(/^window\.(\w+)\s*=/gm, 'export const $1 =');
    src = src.replace(/^export const (\w+) = function/gm, 'export function $1');
    const mjsPath = path.join(DATA, `${base}.mjs`);
    fs.writeFileSync(mjsPath, src, 'utf8');
    console.log(`WROTE data/${base}.mjs`);
}
