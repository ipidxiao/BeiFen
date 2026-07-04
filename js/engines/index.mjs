// Engine assembly — import order matches index.html script chain
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
