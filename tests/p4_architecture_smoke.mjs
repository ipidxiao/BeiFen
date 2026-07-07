/**
 * P4 architecture slice smoke — OPT-027/029/031/033/036 file-level checks.
 */
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// OPT-027: items_db deprecation shim re-exports unified DB
const { CoCItemDB } = await import('../js/data/items_db.mjs');
assert(CoCItemDB && CoCItemDB.weapons, 'items_db.mjs re-exports CoCItemDB');

// OPT-029: state contract
const { STATE_CONTRACT_VERSION, STATE_CONTRACT_SUMMARY } = await import('../js/state/state_contract.mjs');
assert(STATE_CONTRACT_VERSION, 'state contract version');
assert(STATE_CONTRACT_SUMMARY.primaryGlobal === 'window.CoCState', 'state contract names CoCState');

// OPT-031: coc.js thin assembly + engines split
const cocJs = fs.readFileSync(path.join(root, 'js/coc.js'), 'utf8');
assert(cocJs.split('\n').length < 50, 'coc.js is thin assembly layer');
for (const eng of ['sanity', 'wound', 'combat', 'mythos', 'healing']) {
    assert(fs.existsSync(path.join(root, `js/engines/${eng}.js`)), `engine ${eng}.js exists`);
}

// OPT-036: globals registry
const { GLOBALS_REGISTRY, listDeprecatedGlobals } = await import('../js/core/globals_registry.mjs');
assert(GLOBALS_REGISTRY.CoCState, 'registry lists CoCState');
assert(listDeprecatedGlobals().includes('CoCLondonKpEngine'), 'registry marks deprecated alias');

// OPT-028: char_creator in components/
assert(fs.existsSync(path.join(root, 'js/components/char_creator.mjs')), 'char_creator in components/');

console.log('p4_architecture_smoke: P4 slice file checks OK');
