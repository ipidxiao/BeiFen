// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC State Gameplay — combat, dice, clues, map, growth, NPC.
 *
 * Factory receives the core state object and returns all gameplay mutation methods.
 */
export const CoCStateGameplay = (function() {
    const create = function(core) {
        const { gameState, addJournalEntry } = core;

        // ═══ Combat ═══
        const _rollD10 = () => Math.floor(Math.random() * 10) + 1;

        const startCombat = (enemies, location, notes) => {
            gameState.combat.enemies = enemies.map(e => ({
                id: 'enemy_' + Date.now() + Math.random(),
                name: e.name, description: e.description || '',
                hp: e.hp || 10, maxHp: e.hp || 10,
                armor: e.armor || 0, isEnemy: true, isDefeated: false
            }));
            const order = [];
            gameState.roster.filter(c => c.isActive && c.attrs).forEach(c => {
                order.push({ id: c.name, name: c.name, initiative: ((c.attrs && c.attrs.DEX) || 50) + _rollD10(), isEnemy: false });
            });
            gameState.combat.enemies.forEach((e, i) => {
                order.push({ id: e.id, name: e.name, initiative: 40 + _rollD10() * 2, isEnemy: true });
            });
            order.sort((a, b) => b.initiative - a.initiative);
            gameState.combat.initiativeOrder = order;
            gameState.combat.currentTurnIdx = 0;
            gameState.combat.round = 1;
            gameState.combat.location = location || gameState.currentLocation;
            gameState.combat.notes = notes || '';
            gameState.combat.active = true;
            addJournalEntry({ type: 'combat_start', summary: `战斗开始：${enemies.map(e=>e.name).join('、')} @ ${gameState.combat.location}` });
        };

        const _isActiveCombatant = (turn) => {
            if (!turn) return false;
            if (turn.isEnemy) {
                const e = gameState.combat.enemies.find(en => en.id === turn.id || en.name === turn.name);
                return !!(e && !e.isDefeated && e.hp > 0);
            }
            return !!gameState.roster.find(c => c.name === turn.name && c.isActive && c.hp > 0);
        };

        const cleanupInitiativeOrder = () => {
            if (!gameState.combat || !Array.isArray(gameState.combat.initiativeOrder)) return 0;
            const before = gameState.combat.initiativeOrder.length;
            const activeOrder = gameState.combat.initiativeOrder.filter(_isActiveCombatant);
            gameState.combat.initiativeOrder.splice(0, gameState.combat.initiativeOrder.length, ...activeOrder);
            if (activeOrder.length === 0) {
                gameState.combat.currentTurnIdx = 0;
            } else {
                const current = Number.isFinite(gameState.combat.currentTurnIdx) ? gameState.combat.currentTurnIdx : 0;
                gameState.combat.currentTurnIdx = Math.max(0, Math.min(current, activeOrder.length - 1));
            }
            return before - activeOrder.length;
        };

        const endCombat = (outcome, notes) => {
            gameState.combat.active = false;
            const outcomeLabels = { victory:'胜利', defeat:'败北', fled:'撤退', other:'结束' };
            addJournalEntry({ type: 'combat_end', summary: `战斗${outcomeLabels[outcome] || outcome}：${notes || ''}` });
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `⚔️ [战斗结束] ${outcomeLabels[outcome] || outcome}${notes ? '：' + notes : ''}` });
        };

        const updateEnemy = (name, hpChange, note) => {
            const e = gameState.combat.enemies.find(en => en.name === name);
            if (!e) return false;
            e.hp = Math.max(0, e.hp + hpChange);
            if (e.hp <= 0) {
                e.isDefeated = true;
                addJournalEntry({ type: 'combat', summary: `${name} 被击败！` });
                cleanupInitiativeOrder();
            }
            if (note) addJournalEntry({ type: 'combat', summary: `${name} ${note}（HP: ${e.hp}/${e.maxHp}）` });
            return true;
        };

        const advanceTurn = () => {
            if (!gameState.combat.active) return;
            cleanupInitiativeOrder();
            const activeOrder = gameState.combat.initiativeOrder;
            if (activeOrder.length === 0) {
                gameState.combat.currentTurnIdx = 0;
                return;
            }
            gameState.combat.currentTurnIdx++;
            if (gameState.combat.currentTurnIdx >= activeOrder.length) {
                gameState.combat.currentTurnIdx = 0;
                gameState.combat.round++;
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `⚔️ ── 第 ${gameState.combat.round} 回合 ──` });
            }
        };

        // ═══ Dice ═══
        const _parseDice = (notation) => {
            const m = notation.trim().match(/^(\d+)d(\d+)(?:([kl])(\d+))?([+\-]\d+)?$/i);
            if (!m) return null;
            const [, n, sides, keepMode, keepN, modStr] = m;
            const count = Math.min(+n, 20), s = Math.min(+sides, 1000);
            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * s) + 1);
            let kept = [...rolls];
            if (keepMode && keepMode.toLowerCase() === 'k') kept = [...rolls].sort((a,b)=>b-a).slice(0, Math.min(+(keepN||1), count));
            if (keepMode && keepMode.toLowerCase() === 'l') kept = [...rolls].sort((a,b)=>a-b).slice(0, Math.min(+(keepN||1), count));
            const mod = modStr ? +modStr : 0;
            const total = kept.reduce((s,r)=>s+r,0) + mod;
            return { rolls, kept, total, mod, count, sides: s, keepMode: keepMode||null, keepN: keepN?+keepN:null };
        };

        const rollCustomDice = (notation, label, rolledBy, context) => {
            const parsed = _parseDice(notation);
            if (!parsed) return null;
            const entry = { id: Date.now(), notation, label: label||notation, ...parsed, rolledBy: rolledBy||'守秘人', context: context||'', ts: Date.now() };
            gameState.diceHistory.unshift(entry);
            if (gameState.diceHistory.length > 30) gameState.diceHistory.pop();
            addJournalEntry({ type: 'dice', summary: `${entry.rolledBy} 掷 ${notation}：${parsed.total}${label?'（'+label+'）':''}` });
            return entry;
        };

        const _getCharacterSkillValue = (character, skillName, fallback = 50) => {
            const engine = window.CoCEngine;
            const raw = engine && typeof engine.getSkillValue === 'function'
                ? engine.getSkillValue(character, skillName)
                : (character.skills?.[skillName] ?? character.skillAllocations?.[skillName]);
            const numeric = Number(raw);
            return Number.isFinite(numeric) ? numeric : fallback;
        };

        const groupRoll = (charNames, skillName, context) => {
            const results = [];
            const targets = charNames.length ? gameState.roster.filter(c=>charNames.includes(c.name)&&c.isActive) : gameState.roster.filter(c=>c.isActive);
            targets.forEach(c => {
                const skillVal = _getCharacterSkillValue(c, skillName, 50);
                const roll = Math.floor(Math.random()*100)+1;
                const fumbleThreshold = skillVal < 50 ? 96 : 100;
                const level = roll===1?'大成功':roll<=skillVal*0.2?'极难成功':roll<=skillVal*0.5?'困难成功':roll<=skillVal?'成功':roll>=fumbleThreshold?'大失败':'失败';
                results.push({ name:c.name, roll, skillVal, level });
            });
            const entry = { id: Date.now(), notation:'群体检定', label:skillName, rolls:results.map(r=>r.roll), kept:results.map(r=>r.roll), total:0, mod:0, count:results.length, sides:100, rolledBy:'守秘人', context, isGroup:true, groupResults:results, ts: Date.now() };
            gameState.diceHistory.unshift(entry);
            if (gameState.diceHistory.length > 30) gameState.diceHistory.pop();
            addJournalEntry({ type: 'dice', summary: `群体【${skillName}】检定：${results.map(r=>r.name+'→'+r.level).join('，')}` });
            return entry;
        };

        // ═══ Clue Board ═══
        const addClue = (id, title, content, type, relatedIds, location) => {
            const existing = gameState.clueBoard.clues.find(c => c.id === id);
            if (existing) {
                existing.content = content || existing.content;
                if (relatedIds) relatedIds.forEach(rid => { if (!existing.relatedIds.includes(rid)) existing.relatedIds.push(rid); });
                return existing;
            }
            const clue = { id: id || 'clue_' + Date.now(), title, content: content || '', type: type || 'physical', status: 'new', relatedIds: relatedIds || [], note: '', location: location || gameState.currentLocation, discoveredAt: gameState.chatHistory.length };
            gameState.clueBoard.clues.push(clue);
            (relatedIds || []).forEach(rid => { linkClues(clue.id, rid, ''); });
            addJournalEntry({ type: 'clue', summary: `发现线索：【${title}】（${type || '物证'}）` });
            return clue;
        };

        const linkClues = (fromId, toId, note) => {
            if (fromId === toId) return;
            const exists = gameState.clueBoard.links.some(l => (l.from===fromId&&l.to===toId)||(l.from===toId&&l.to===fromId));
            if (!exists) gameState.clueBoard.links.push({ from: fromId, to: toId, note: note || '' });
        };

        const markClueStatus = (id, status, note) => {
            const c = gameState.clueBoard.clues.find(c => c.id === id);
            if (!c) return false;
            c.status = status || c.status;
            if (note) c.note = note;
            return true;
        };

        const clearClueBoard = () => {
            gameState.clueBoard.clues.splice(0);
            gameState.clueBoard.links.splice(0);
        };

        // ═══ Scene Map ═══
        const createMap = (title, rooms) => {
            gameState.sceneMap.title = title || gameState.currentLocation;
            gameState.sceneMap.rooms = (rooms || []).map(r => ({
                id: r.id || 'r' + Date.now() + Math.random(),
                name: r.name || '未知房间',
                status: r.status || 'unknown',
                x: r.x || 0, y: r.y || 0,
                connections: r.connections || [],
                note: r.note || ''
            }));
            gameState.sceneMap.currentRoomId = null;
            addJournalEntry({ type: 'map', summary: `场景地图已更新：${title}（${gameState.sceneMap.rooms.length} 个房间）` });
        };

        const updateRoom = (roomId, status, note) => {
            const r = gameState.sceneMap.rooms.find(rm => rm.id === roomId || rm.name === roomId);
            if (!r) return false;
            if (status) r.status = status;
            if (note) r.note = note;
            return true;
        };

        const setPosition = (roomId) => {
            const prev = gameState.sceneMap.rooms.find(rm => rm.status === 'current');
            if (prev && prev.status === 'current') prev.status = 'explored';
            const r = gameState.sceneMap.rooms.find(rm => rm.id === roomId || rm.name === roomId);
            if (!r) return false;
            r.status = 'current';
            gameState.sceneMap.currentRoomId = r.id;
            gameState.currentLocation = r.name;
            if (!gameState.knownLocations.includes(r.name)) gameState.knownLocations.push(r.name);
            return true;
        };

        // ═══ Character Growth ═══
        const _d = (n) => Math.floor(Math.random() * n) + 1;

        const rollImprovement = (charName, skillName) => {
            const c = gameState.roster.find(r => r.name === charName);
            if (!c) return null;
            const entry = (c.skillsUsedThisSession || []).find(s => s.name === skillName);
            const curVal = Number(entry?.currentValue ?? _getCharacterSkillValue(c, skillName, 0));
            const roll = _d(100);
            let gained = 0;
            if (roll > curVal) {
                gained = _d(10);
                const newVal = Math.min(99, curVal + gained);
                c.skills = c.skills || {};
                c.skills[skillName] = newVal;
                c.skillAllocations = c.skillAllocations || {};
                c.skillAllocations[skillName] = newVal;
                addJournalEntry({ type: 'growth', charName, summary: `技能成长：【${skillName}】${curVal} → ${newVal}（骰出${roll}，提升${gained}）` });
            } else {
                addJournalEntry({ type: 'growth', charName, summary: `技能检定失败：【${skillName}】无提升（骰出${roll}/${curVal}）` });
            }
            c.skillsUsedThisSession = (c.skillsUsedThisSession || []).filter(s => s.name !== skillName);
            return { roll, gained, oldVal: curVal, newVal: Math.min(99, curVal + gained), success: gained > 0 };
        };

        const rollEduImprovement = (charName) => {
            const c = gameState.roster.find(r => r.name === charName);
            if (!c || !c.attrs) return null;
            const edu = c.attrs.EDU || 0;
            const threshold = Math.min(99, edu * 5);
            const roll = _d(100);
            let gained = 0;
            if (roll > threshold) {
                gained = _d(10);
                c.attrs.EDU = Math.min(99, edu + gained);
                addJournalEntry({ type: 'growth', charName, summary: `教育成长：EDU ${edu} → ${c.attrs.EDU}（骰出${roll}）` });
            } else {
                addJournalEntry({ type: 'growth', charName, summary: `教育成长失败：EDU无变化（骰出${roll}/${threshold}）` });
            }
            return { roll, gained, oldVal: edu, newVal: c.attrs.EDU, success: gained > 0 };
        };

        const applyAging = (charName) => {
            const c = gameState.roster.find(r => r.name === charName);
            if (!c || !c.attrs) return null;
            const oldAge = c.age || 25;
            c.age = oldAge + 1;
            const age = c.age;
            let effects = [];
            if ([40, 50, 60, 70, 80].includes(age)) {
                const strLoss = 2, conLoss = 2, dexLoss = 1;
                c.attrs.STR = Math.max(1, (c.attrs.STR || 50) - strLoss);
                c.attrs.CON = Math.max(1, (c.attrs.CON || 50) - conLoss);
                c.attrs.DEX = Math.max(1, (c.attrs.DEX || 50) - dexLoss);
                const eduGain = _d(10);
                c.attrs.EDU = Math.min(99, (c.attrs.EDU || 60) + eduGain);
                effects = [`STR-${strLoss}`, `CON-${conLoss}`, `DEX-${dexLoss}`, `EDU+${eduGain}`];
                addJournalEntry({ type: 'growth', charName, summary: `年龄效应（${age}岁）：${effects.join('、')}` });
            } else {
                addJournalEntry({ type: 'growth', charName, summary: `年龄增长：${oldAge}岁 → ${age}岁` });
            }
            return { oldAge, age, effects };
        };

        const clearSessionSkills = () => {
            gameState.roster.forEach(c => { c.skillsUsedThisSession = []; });
        };

        const removeCharacterAt = (index) => {
            const idx = Number(index);
            if (!Number.isInteger(idx) || idx < 0 || idx >= gameState.roster.length) return false;
            const [removed] = gameState.roster.splice(idx, 1);
            clampSelectedCharIndex(gameState);
            cleanupInitiativeOrder();
            if (removed && removed.name) {
                addJournalEntry({ type: 'roster', summary: `调查员离队：${removed.name}` });
            }
            return true;
        };

        // ═══ NPC Registry ═══
        const addNpc = (npcData) => {
            const existing = gameState.npcRegistry.find(n => n.name === npcData.name);
            if (existing) {
                if (npcData.description) existing.description = npcData.description;
                if (npcData.relation) existing.relation = npcData.relation;
                if (npcData.status) existing.status = npcData.status;
                return existing;
            }
            const npc = {
                id: 'npc_' + Date.now() + Math.random(),
                name: npcData.name,
                description: npcData.description || '',
                relation: npcData.relation || '未知',
                status: npcData.status || 'alive',
                firstSeen: gameState.currentLocation,
                firstSeenAt: new Date().toISOString(),
                notes: []
            };
            gameState.npcRegistry.push(npc);
            return npc;
        };

        const updateNpcStatus = (name, status, note) => {
            const npc = gameState.npcRegistry.find(n => n.name === name);
            if (!npc) return false;
            npc.status = status;
            if (note) npc.notes.push({ text: note, at: new Date().toISOString() });
            return true;
        };

        const addNpcNote = (npcId, text) => {
            const npc = gameState.npcRegistry.find(n => n.id === npcId);
            if (!npc) return;
            npc.notes.push({ text, at: new Date().toISOString() });
        };

        return { startCombat, endCombat, updateEnemy, advanceTurn, cleanupInitiativeOrder,
                 rollCustomDice, groupRoll,
                 addClue, linkClues, markClueStatus, clearClueBoard,
                 createMap, updateRoom, setPosition,
                 rollImprovement, rollEduImprovement, applyAging, clearSessionSkills, removeCharacterAt,
                 addNpc, updateNpcStatus, addNpcNote };
    };
    return { create };
})();
