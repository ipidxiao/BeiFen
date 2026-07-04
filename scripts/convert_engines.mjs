#!/usr/bin/env node
/** One-shot: convert js/engines/*.js browser modules → ESM attach*.mjs sources. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENG = path.join(ROOT, 'js', 'engines');

const FLAT = ['dice', 'attributes', 'skills'];
const NESTED = ['combat', 'healing', 'sanity', 'wound', 'mythos', 'environmental', 'poison'];

function toAttachName(base) {
    const cap = base.charAt(0).toUpperCase() + base.slice(1);
    if (base === 'combat') return 'CombatEngine';
    if (base === 'healing') return 'HealingEngine';
    if (base === 'sanity') return 'SanityEngine';
    if (base === 'wound') return 'MajorWoundEngine';
    if (base === 'mythos') return 'MythosEngine';
    if (base === 'environmental') return 'EnvironmentalEngine';
    if (base === 'poison') return 'PoisonEngine';
    return cap + 'Engine';
}

function convertFlat(name) {
    let src = fs.readFileSync(path.join(ENG, `${name}.js`), 'utf8');
    src = src.replace(/^[\s\S]*?\/\*\*[\s\S]*?\*\/\s*/m, '');
    src = src.replace(/window\.CoCEngine\s*=\s*window\.CoCEngine\s*\|\|\s*\{\};?\s*/g, '');
    src = src.replace(/window\.CoCEngine\./g, 'CoCEngine.');
    const assignMatch = src.match(/Object\.assign\(window\.CoCEngine,\s*(\{[\s\S]*\})\s*\);?\s*$/);
    if (!assignMatch) throw new Error(`flat assign not found: ${name}`);
    const body = assignMatch[1];
    const prefix = src.slice(0, assignMatch.index).trim();
    const fn = `export function attach${name.charAt(0).toUpperCase() + name.slice(1)}Engine(CoCEngine) {\n${prefix ? prefix + '\n' : ''}  Object.assign(CoCEngine, ${body});\n}\n`;
    return `// ESM engine module — source for browser build\n// Split from js/engines/${name}.js\n\n${fn}`;
}

function convertNested(name) {
    let src = fs.readFileSync(path.join(ENG, `${name}.js`), 'utf8');
    src = src.replace(/^[\s\S]*?window\.CoCEngine\s*=\s*window\.CoCEngine\s*\|\|\s*\{\};?\s*/m, '');
    const prop = toAttachName(name);
    const re = new RegExp(`window\\.CoCEngine\\.${prop}\\s*=\\s*(\\{[\\s\\S]*\\});?\\s*$`);
    const m = src.match(re);
    if (!m) throw new Error(`nested assign not found: ${name}.${prop}`);
    let body = m[1].replace(/window\.CoCEngine\./g, 'CoCEngine.');
    const fn = `export function attach${prop}(CoCEngine) {\n  CoCEngine.${prop} = ${body};\n}\n`;
    return `// ESM engine module — source for browser build\n// Split from js/engines/${name}.js\n\n${fn}`;
}

for (const n of FLAT) {
    fs.writeFileSync(path.join(ENG, `${n}.mjs`), convertFlat(n), 'utf8');
    console.log(`WROTE engines/${n}.mjs`);
}
for (const n of NESTED) {
    fs.writeFileSync(path.join(ENG, `${n}.mjs`), convertNested(n), 'utf8');
    console.log(`WROTE engines/${n}.mjs`);
}

const index = `// Engine assembly — import order matches index.html script chain
import { attachDiceEngine } from './dice.mjs';
import { attachAttributesEngine } from './attributes.mjs';
import { attachSkillsEngine } from './skills.mjs';
import { attachCombatEngine } from './combat.mjs';
import { attachHealingEngine } from './healing.mjs';
import { attachSanityEngine } from './sanity.mjs';
import { attachMajorWoundEngine } from './wound.mjs';
import { attachMythosEngine } from './mythos.mjs';
import { attachEnvironmentalEngine } from './environmental.mjs';
import { attachPoisonEngine } from './poison.mjs';

export function buildCoCEngine() {
    const CoCEngine = {};
    attachDiceEngine(CoCEngine);
    attachAttributesEngine(CoCEngine);
    attachSkillsEngine(CoCEngine);
    attachCombatEngine(CoCEngine);
    attachHealingEngine(CoCEngine);
    attachSanityEngine(CoCEngine);
    attachMajorWoundEngine(CoCEngine);
    attachMythosEngine(CoCEngine);
    attachEnvironmentalEngine(CoCEngine);
    attachPoisonEngine(CoCEngine);
    return CoCEngine;
}
`;
fs.writeFileSync(path.join(ENG, 'index.mjs'), index, 'utf8');
console.log('WROTE engines/index.mjs');
