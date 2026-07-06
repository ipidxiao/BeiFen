// OPT-018: ESM import chain for tools/handlers/*.mjs
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';
import { CoCToolHandlers } from '../js/tools/handlers/index.mjs';
import { character } from '../js/tools/handlers/character.mjs';
import { inventory } from '../js/tools/handlers/inventory.mjs';
import { dice } from '../js/tools/handlers/dice.mjs';
import { clues } from '../js/tools/handlers/clues.mjs';
import { map } from '../js/tools/handlers/map.mjs';
import { combat } from '../js/tools/handlers/combat.mjs';
import { npc } from '../js/tools/handlers/npc.mjs';
import { mythos } from '../js/tools/handlers/mythos.mjs';
import { system } from '../js/tools/handlers/system.mjs';

const factories = { character, inventory, dice, clues, map, combat, npc, mythos, system };
for (const [name, factory] of Object.entries(factories)) {
    assert.strictEqual(typeof factory, 'function', `${name}.mjs exports factory`);
    const partial = factory({
        gameState: { roster: [], inventory: [], clueBoard: { clues: [], links: [] }, combat: { active: false, enemies: [] }, chatHistory: [] },
        handlers: {},
        dispatch: () => {},
        addJournalEntry: () => {},
        addNpc: () => {},
        updateNpcStatus: () => {},
        startCombat: () => {},
        endCombat: () => {},
        updateEnemy: () => {},
        advanceTurn: () => {},
        createMap: () => {},
        updateRoom: () => {},
        setPosition: () => {},
        addClue: () => {},
        linkClues: () => {},
        markClueStatus: () => {},
        rollCustomDice: () => null,
        groupRoll: () => null,
        State: {},
        Engine: { checkSkill: () => ({ success: true, level: '成功' }) }
    });
    assert(partial && typeof partial === 'object', `${name} factory returns handlers`);
}

assert.strictEqual(typeof CoCToolHandlers.create, 'function', 'CoCToolHandlers.create');
const order = CoCToolHandlers.getModuleOrder();
assert(order.length === 9, 'nine handler modules registered');
assert(CoCToolHandlers.getLoadedModuleNames().length === 9, 'nine modules loaded');

console.log('esm_handlers_smoke: handler ESM imports OK');
