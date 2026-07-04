// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * Deep Verify — exhaustive rules verification for recent CoC 7e fixes.
 * Run: node tests/deep_verify.mjs
 */
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';
import { CoCEngine } from '../js/coc.mjs';

let bugs = [], passed = 0;
const check = (cond, msg) => { if (cond) passed++; else bugs.push('BUG: ' + msg); };

// ═══════════════════════════════════════════════════════
// 1. DB/Build — full range test (every 5 points from 0 to 400)
// ═══════════════════════════════════════════════════════
const dbTable = [
    [0,64,'-2',-2],[65,84,'-1',-1],[85,124,'0',0],
    [125,164,'1D4',1],[165,204,'1D6',2],[205,284,'2D6',3],
    [285,364,'3D6',4],
];
for (const [lo,hi,expDB,expBuild] of dbTable) {
    for (let ss = lo; ss <= hi; ss += Math.max(1, Math.floor((hi-lo)/5))) {
        const a = {STR:Math.floor(ss/2),CON:50,SIZ:Math.ceil(ss/2),DEX:50,APP:50,INT:50,POW:50,EDU:50};
        const d = CoCEngine.calculateDerived(a);
        check(d.db === expDB, `DB STR+SIZ=${ss}: ${d.db} (expected ${expDB})`);
        check(d.build === expBuild, `Build STR+SIZ=${ss}: ${d.build} (expected ${expBuild})`);
    }
}
// Extended formula for 365+ (CoC 7e: build = floor((STR+SIZ-365)/80) + 5)
for (let ss = 365; ss <= 500; ss += 20) {
    const a = {STR:Math.floor(ss/2),CON:50,SIZ:Math.ceil(ss/2),DEX:50,APP:50,INT:50,POW:50,EDU:50};
    const d = CoCEngine.calculateDerived(a);
    const expBuild = Math.floor((ss - 365) / 80) + 5;
    const expDBNum = expBuild - 1;
    check(d.build === expBuild, `Build STR+SIZ=${ss}: ${d.build} (formula gives ${expBuild})`);
    check(d.db === `${expDBNum}D6`, `DB STR+SIZ=${ss}: ${d.db} (expected ${expDBNum}D6)`);
}

// ═══════════════════════════════════════════════════════
// 2. Age modifiers — all boundaries
// ═══════════════════════════════════════════════════════
const base = {STR:50,CON:50,SIZ:50,DEX:50,APP:50,INT:50,POW:50,EDU:50,LUCK:50};

// 2a. Each age bracket
const ageTests = [
    [14, {STR:50}, '14: no change (<15)'],
    [15, {STR:45,EDU:45}, '15: STR-5 EDU-5'],
    [19, {STR:45,EDU:45}, '19: same as 15'],
    [20, {STR:50}, '20: no change'],
    [39, {STR:50}, '39: no change'],
    [40, {STR:45,CON:45,DEX:45,APP:45,EDU:55}, '40: all -5 EDU+5'],
    [49, {STR:45,CON:45,DEX:45,APP:45,EDU:55}, '49: same as 40'],
    [50, {STR:40,CON:40,DEX:40,APP:40,EDU:60}, '50: all -10 EDU+10'],
    [59, {STR:40,CON:40,DEX:40,APP:40,EDU:60}, '59: same as 50'],
    [60, {STR:30,CON:30,DEX:30,APP:35,EDU:65}, '60: -20 APP-15 EDU+15'],
    [69, {STR:30,CON:30,DEX:30,APP:35,EDU:65}, '69: same as 60'],
    [70, {STR:15,CON:15,DEX:15,APP:30,EDU:70}, '70: -40 APP-20 EDU+20'],
    [79, {STR:15,CON:15,DEX:15,APP:30,EDU:70}, '79: same as 70'],
    [80, {STR:15,CON:15,DEX:15,APP:25,EDU:75}, '80: -80 APP-25 EDU+25'],
];
for (const [age, exp, label] of ageTests) {
    const r = CoCEngine.applyAgeModifiers({...base}, age);
    for (const [k,v] of Object.entries(exp)) {
        check(r[k] === v, `Age ${label}: ${k}=${r[k]} (expected ${v})`);
    }
}

// 2b. Clamp to 15 minimum
const weak = {STR:10,CON:10,SIZ:10,DEX:10,APP:10,INT:10,POW:10,EDU:10,LUCK:50};
const aged = CoCEngine.applyAgeModifiers(weak, 80);
check(aged.STR === 15, 'Clamp: STR min 15');
check(aged.CON === 15, 'Clamp: CON min 15');
check(aged.DEX === 15, 'Clamp: DEX min 15');

// 2c. LUCK should NOT be age-modified (CoC 7e rule)
for (const age of [15,25,40,50,60,70,80]) {
    const r = CoCEngine.applyAgeModifiers({...base}, age);
    check(r.LUCK === 50, `LUCK unchanged at age ${age}: ${r.LUCK}`);
}

// ═══════════════════════════════════════════════════════
// 3. MOV — age penalty interaction
// ═══════════════════════════════════════════════════════
const movTests = [
    [25, null, 8, 'base MOV=8'],
    [25, {DEX:40,STR:30,SIZ:50}, 7, 'DEX<SIZ && STR<SIZ → 7'],
    [25, {DEX:60,STR:60,SIZ:50}, 9, 'DEX>SIZ && STR>SIZ → 9'],
    [45, null, 7, 'age 40s: 8-1=7'],
    [55, null, 6, 'age 50s: 8-2=6'],
    [65, null, 5, 'age 60s: 8-3=5'],
    [75, null, 4, 'age 70s: 8-4=4'],
    [85, null, 3, 'age 80s: 8-5=3'],
    [85, {DEX:40,STR:30,SIZ:50}, 2, 'age 80s + slow: 7-5=2'],
    [85, {DEX:15,STR:15,SIZ:80}, 2, 'age 80s: min 1 clamp'],
];
for (const [age, overrides, exp, label] of movTests) {
    const attrs = {...base, ...(overrides || {})};
    const d = CoCEngine.calculateDerived(attrs, age);
    check(d.mov === exp, `MOV ${label}: ${d.mov} (expected ${exp})`);
}

// ═══════════════════════════════════════════════════════
// 4. Template string safety in DB formula
// ═══════════════════════════════════════════════════════
const huge = {STR:250,CON:50,SIZ:250,DEX:50,APP:50,INT:50,POW:50,EDU:50};
const dHuge = CoCEngine.calculateDerived(huge);
check(typeof dHuge.db === 'string', 'DB is string for huge values');
check(dHuge.db.includes('D6'), 'DB formula produces valid string');
check(dHuge.build >= 6, 'Build for STR+SIZ=500 is >=6');

// ═══════════════════════════════════════════════════════
// 5. ESM module consistency
// ═══════════════════════════════════════════════════════
import { CoCBaseSkills } from '../js/data/skills.mjs';
check(Object.keys(CoCBaseSkills).length >= 50, 'base skills in ESM');
check(CoCEngine.BaseSkills['斗殴'].base === CoCBaseSkills['斗殴'].base, 'ESM skill matches engine skill');

// ═══════════════════════════════════════════════════════
// 6. State module integrity  
// ═══════════════════════════════════════════════════════
import { CoCStateCore } from '../js/state/core.mjs';
import { CoCState } from '../js/state/state.mjs';
check(CoCStateCore.gameState !== undefined, 'core exports gameState');
check(CoCState.gameState === CoCStateCore.gameState, 'state shares gameState with core');

// ═══════════════════════════════════════════════════════
// Report
// ═══════════════════════════════════════════════════════
if (bugs.length === 0) {
    console.log(`DEEP VERIFY: 0 bugs, ${passed} checks PASSED ✅`);
} else {
    console.log(`DEEP VERIFY: ${bugs.length} BUGS:`);
    bugs.forEach((b,i) => console.log(`  ${i+1}. ${b}`));
    console.log(`${passed} checks passed`);
}
