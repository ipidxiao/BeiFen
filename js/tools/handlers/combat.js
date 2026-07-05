// GENERATED from js/tools/handlers/combat.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Combat domain (AUDITFIX8)
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.combat = function(ctx) {
    const { gameState, Engine, addJournalEntry, startCombat, endCombat, updateEnemy, advanceTurn } = ctx;

    const getKpEng = () => {
        const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
        if (cfg && typeof cfg.getKpEngine === 'function') return cfg.getKpEngine();
        if (typeof window !== 'undefined' && window.KpExecutionEngine) return window.KpExecutionEngine;
        if (typeof window !== 'undefined' && window.CoCLondonKpEngine) return window.CoCLondonKpEngine;
        return null;
    };

    const applyFirearmRealityBlock = (firearmCheck, shooter, enemyName) => {
        if (!firearmCheck || !firearmCheck.blocked) return null;
        gameState.chatHistory.push({
            role: 'system',
            isLocalOnly: true,
            isAlert: true,
            content: '现实扭曲：弹道未生效（引擎判定）'
        });
        const reasonLabel = firearmCheck.reason === 'spatial_error' ? '空间错位' : '弹道失效';
        addJournalEntry({
            type: 'combat',
            charName: shooter.name,
            summary: `现实扭曲：${reasonLabel} — 对 ${enemyName || '目标'} 开火无效`,
            _realityDistortion: true
        });
        return `开火失败：现实扭曲（${reasonLabel}）`;
    };

    const pushEnemyDamageNotice = (enemy, actualDmg) => {
        if (!enemy) return '';
        const damage = Math.max(0, Number(actualDmg) || 0);
        const msg = enemy.isDefeated ? `${enemy.name} 已被击败！` : `${enemy.name} 受到 ${damage} 伤害（HP: ${enemy.hp}/${enemy.maxHp}）`;
        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: enemy.isDefeated, content: `${enemy.isDefeated ? '💀' : '🩸'} ${msg}` });
        return msg;
    };

    // ── Ammo: structured c.equipment.ammo = { count, type } with [弹药:N] backward-compat ──
    const parseAmmoTag = (weaponStr) => {
        const m = (weaponStr || '').match(/\[弹药:(\d+)\]/);
        return m ? parseInt(m[1], 10) : null;
    };
    const readAmmo = (c) => {
        const eq = c.equipment || {};
        const tagged = parseAmmoTag(eq.weapon);
        if (tagged !== null) {
            // Inline tag stays authoritative for legacy saves / manual reloads; mirror it into the structured field.
            eq.ammo = { count: tagged, type: (eq.ammo && eq.ammo.type) || null };
            return tagged;
        }
        if (eq.ammo && typeof eq.ammo === 'object' && Number.isFinite(eq.ammo.count)) return eq.ammo.count;
        if (typeof eq.ammo === 'number') return eq.ammo;
        return 0;
    };
    const writeAmmo = (c, count, type) => {
        const eq = c.equipment || (c.equipment = {});
        const safe = Math.max(0, Number(count) | 0);
        eq.ammo = { count: safe, type: type || (eq.ammo && eq.ammo.type) || null };
        // Keep the inline [弹药:N] tag in sync for display, persistence and legacy readers.
        if (typeof eq.weapon === 'string' && eq.weapon) {
            const clean = eq.weapon.replace(/\[弹药:\d+\]/g, '').trim();
            eq.weapon = `${clean} [弹药:${safe}]`;
        }
    };

    const readBackpackAmmo = (weaponStr) => {
        const kpEng = getKpEng();
        if (!kpEng || !kpEng.inferAmmoType || !kpEng.countBackpackAmmo) return null;
        const ammoType = kpEng.inferAmmoType(weaponStr);
        if (!ammoType) return null;
        return { ammoType, count: kpEng.countBackpackAmmo(gameState, ammoType) };
    };
    const spendAmmo = (weaponStr, amount, ammoType) => {
        const kpEng = getKpEng();
        if (kpEng && kpEng.consumeBackpackAmmo && ammoType) {
            kpEng.consumeBackpackAmmo(gameState, ammoType, amount);
            return kpEng.countBackpackAmmo(gameState, ammoType);
        }
        return null;
    };

    const recordKpCombatAction = (label) => {
        const kpEng = getKpEng();
        if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && kpEng.recordCombatAction) {
            return kpEng.recordCombatAction(gameState, label);
        }
        return null;
    };

    const initCombatPowerTrack = () => {
        const active = (gameState.roster || []).filter((c) => c && c.isActive);
        gameState.combat._powerTrack = {
            startHp: active.map((c) => c.hp),
            damageDealt: 0,
            hitCount: 0,
            ammoSpent: 0,
            startRound: gameState.combat.round || 1
        };
        gameState.combat._powerFinalized = false;
    };

    const trackCombatDamage = (actualDmg) => {
        const track = gameState.combat?._powerTrack;
        if (!track) return;
        const dmg = Math.max(0, Number(actualDmg) || 0);
        if (dmg > 0) {
            track.damageDealt += dmg;
            track.hitCount += 1;
        }
    };

    const allEnemiesDefeated = () => {
        const enemies = gameState.combat?.enemies;
        return Array.isArray(enemies) && enemies.length > 0 && enemies.every((e) => e.isDefeated || e.hp <= 0);
    };

    const maybeFinalizeCombatVictory = () => {
        const kpEng = getKpEng();
        if (!kpEng || !kpEng.finalizeCombatPower || !allEnemiesDefeated()) return;
        kpEng.finalizeCombatPower(gameState, 'victory');
    };

    const applyEnemyDamageWithKp = (enemyName, hpChange, note, actionLabel, options = {}) => {
        const e = gameState.combat.enemies.find(en => en.name === enemyName);
        if (!e) return null;
        const rawChange = Number(hpChange) || 0;
        const skipArmor = !!options.skipArmor;
        const actualDmg = rawChange < 0
            ? (skipArmor ? Math.max(0, -rawChange) : Math.max(0, (-rawChange) - (e.armor || 0)))
            : 0;
        const kpEng = getKpEng();
        if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && actionLabel) {
            recordKpCombatAction(actionLabel);
        }
        if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && e._kpImmunity && rawChange < 0) {
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: '🛡️ [KP引擎] 纯伤害策略触发敌人免疫，本次伤害无效化。' });
            return { blocked: true, enemy: e };
        }
        updateEnemy(enemyName, rawChange < 0 ? -actualDmg : rawChange, note);
        if (rawChange < 0) trackCombatDamage(actualDmg);
        if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && e.hp <= 0) {
            kpEng.checkAntiOneShot(gameState, e);
        }
        if (e.hp <= 0 || e.isDefeated) maybeFinalizeCombatVictory();
        return { blocked: false, enemy: e, actualDmg };
    };

    const runManeuverCheck = (actionId, tagLabel, actorName, skillName, difficulty, enemyName) => {
        const c = gameState.roster.find(r => r.name === actorName) || gameState.roster.find(r => r.isActive);
        if (!c) return '错误：找不到该角色';
        recordKpCombatAction(tagLabel);
        const skill = skillName || (actionId === 'dodge' ? '闪避' : '斗殴');
        const res = Engine.checkSkill(skill, c, difficulty || 'normal');
        const tv = res.targetValue ?? res.skillValue;
        gameState.chatHistory.push({
            role: 'system', isLocalOnly: true, isAlert: true,
            content: `⚔️ [${actionId}] ${c.name} ${skill} 检定：${res.level}（${res.rolledValue}/${tv}）`
        });
        if (enemyName) {
            const enemy = gameState.combat.enemies.find(e => e.name === enemyName && !e.isDefeated);
            if (enemy && res.success && actionId === 'disarm') {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🗡️ ${enemy.name} 被缴械！` });
            }
        }
        advanceTurn();
        return `${actionId} 检定 ${res.level}`;
    };

    return {
        start_combat: (args) => {
            let enemies = args.enemies || [];
            const kp = getKpEng();
            if (kp && kp.isEnabled && kp.isEnabled(gameState)) {
                enemies = kp.onCombatStart(gameState, enemies);
            }
            startCombat(enemies, args.location, args.notes);
            initCombatPowerTrack();
            const names = enemies.map(e => e.name).join('、');
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚔️ [战斗开始] 敌人：${names}。战斗界面已激活，请查看战斗面板！` });
            return `战斗已开始，敌人：${names}`;
        },
        end_combat: (args) => {
            const kpEng = getKpEng();
            if (args.outcome === 'victory' && kpEng && kpEng.finalizeCombatPower) {
                kpEng.finalizeCombatPower(gameState, 'victory');
            } else if (gameState.combat) {
                delete gameState.combat._powerTrack;
                gameState.combat._powerFinalized = false;
            }
            endCombat(args.outcome, args.notes);
            return '战斗已结束';
        },
        update_enemy: (args) => {
            const e = gameState.combat.enemies.find(en => en.name === args.name);
            if (!e) return `找不到敌人: ${args.name}`;
            const actionLabel = args.combat_action || 'attack:melee';
            const rawChange = Number(args.hp_change) || 0;
            const outcome = applyEnemyDamageWithKp(args.name, rawChange, args.note, rawChange < 0 ? actionLabel : null);
            if (!outcome) return `找不到敌人: ${args.name}`;
            if (outcome.blocked) return `${args.name} 免疫本次伤害（KP纯伤害策略）`;
            const actualDmg = outcome.actualDmg || 0;
            const msg = rawChange < 0 ? pushEnemyDamageNotice(outcome.enemy, actualDmg) : `${args.name} HP 已更新（HP: ${outcome.enemy.hp}/${outcome.enemy.maxHp}）`;
            return msg;
        },
        enemy_attack: (args) => {
            const c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return `找不到目标: ${args.target_name}`;
            const dmg = args.damage || 0;
            // HP + journal via update_character_status only — avoid duplicate chat/journal
            ctx.dispatch('update_character_status', { target_name: args.target_name, hp_change: -dmg });
            advanceTurn();
            return `${args.target_name} 受到 ${dmg} 点伤害`;
        },
        fire_weapon: (args) => {
            const shooterName = args.shooter_name;
            let c = shooterName ? gameState.roster.find(r => r.name === shooterName) : null;
            if (!c) c = gameState.roster.find(r => r.isActive);
            if (!c) return '错误：找不到该角色';
            const namedEnemy = args.enemy_name ? gameState.combat.enemies.find(e => e.name === args.enemy_name && !e.isDefeated) : null;
            if (args.enemy_name && !namedEnemy) return `找不到敌人: ${args.enemy_name}`;
            const enemy = namedEnemy || gameState.combat.enemies.find(e => !e.isDefeated) || { name: '未知敌人', hp: 10, maxHp: 10, isEnemy: true };
            const kpEng = getKpEng();
            // Ammo: backpack inventory match by gun type (no chambered-state requirement)
            let weaponStr = (c.equipment || {}).weapon || '';
            const inferredAmmoType = (kpEng && kpEng.inferAmmoType) ? kpEng.inferAmmoType(weaponStr) : null;
            const weaponBase = weaponStr.split('[')[0].trim() || '武器';
            const backpackAmmo = readBackpackAmmo(weaponStr);
            let ammo = backpackAmmo ? backpackAmmo.count : readAmmo(c);
            const ammoType = backpackAmmo ? backpackAmmo.ammoType : inferredAmmoType;
            const isFirearm = !!inferredAmmoType;
            if (isFirearm && ammo <= 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ ${c.name} 背包中没有匹配「${ammoType || '该枪型'}」的弹药！` });
                return '开火失败：背包无匹配弹药。';
            }
            if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && kpEng.handleFirearmAttempt) {
                const firearmCheck = kpEng.handleFirearmAttempt({ gameState });
                const blockedMsg = applyFirearmRealityBlock(firearmCheck, c, enemy.name);
                if (blockedMsg) return blockedMsg;
            }
            if (ammo > 0) {
                const remaining = spendAmmo(weaponStr, 1, ammoType);
                if (remaining != null) {
                    ammo = remaining;
                } else {
                    ammo--;
                    writeAmmo(c, ammo, weaponBase);
                }
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ 砰！${c.name} 开火 [消耗 1 发子弹，背包剩余 ${ammo} 发]` });
            }
            const weaponObj = {
                name: weaponBase,
                type: 'firearm',
                malfunction: '00',
                skill: weaponStr.includes('步枪') ? '步枪' : (weaponStr.includes('霰弹') ? '霰弹枪' : (weaponStr.includes('冲锋') ? '冲锋枪' : '手枪')),
                damage: args.damage || '1D6'
            };
            const result = Engine.CombatEngine.autoResolveExchange(c, enemy, weaponObj, {
                updateEnemy: (name, hp, note) => {
                    const outcome = applyEnemyDamageWithKp(name, hp, note, 'attack:fire_weapon:tactical', { skipArmor: true });
                    const updated = outcome && outcome.enemy;
                    if (updated && hp < 0 && !outcome.blocked) pushEnemyDamageNotice(updated, outcome.actualDmg);
                },
                update_character_status: (handlerArgs) => ctx.dispatch('update_character_status', handlerArgs)
            });
            return result.msg;
        },
        spawn_npc: (args) => {
            var tmpl = args.template || '邪教徒';
            var overrides = {};
            if (args.name) overrides.name = args.name;
            if (args.hp) overrides.hp = args.hp;
            if (args.armor != null) overrides.armor = args.armor;
            if (args.description) overrides.description = args.description;
            var npc = window.generateNpcFromTemplate(tmpl, overrides);
            if (!npc) return '错误：未找到模板 ' + tmpl + '。可用模板：' + Object.keys(window.CoCNpcTemplates || {}).join('、');
            gameState.combat.enemies = gameState.combat.enemies || [];
            npc.id = 'npc_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            gameState.combat.enemies.push(npc);
            const order = gameState.combat.initiativeOrder || (gameState.combat.initiativeOrder = []);
            order.push({
                id: npc.id,
                name: npc.name,
                initiative: 40 + Math.floor(Math.random() * 10) + 1,
                isEnemy: true
            });
            order.sort((a, b) => b.initiative - a.initiative);
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true,
                content: '👤 ' + npc.name + ' 登场！(' + npc.description + ')' });
            addJournalEntry({ type: 'npc_spawn', charName: npc.name, summary: '模板:' + tmpl + ' HP:' + npc.hp + ' 护甲:' + npc.armor });
            return npc.name + ' 已生成（模板:' + tmpl + ' HP:' + npc.hp + ' 护甲:' + npc.armor + '）。';
        },
        burst_fire: (args) => {
            var c = gameState.roster.find(function(r) { return r.name === (args.shooter_name || args.target_name); }) || gameState.roster.find(function(r) { return r.isActive; });
            if (!c) return '错误：找不到该角色';
            var namedEnemy = args.enemy_name ? gameState.combat.enemies.find(function(e) { return e.name === args.enemy_name && !e.isDefeated; }) : null;
            if (args.enemy_name && !namedEnemy) return '找不到敌人: ' + args.enemy_name;
            var enemy = namedEnemy || gameState.combat.enemies.find(function(e) { return !e.isDefeated; }) || { name: '未知敌人', hp: 10, maxHp: 10, isEnemy: true };

            var weaponStr = (c.equipment || {}).weapon || '';
            var weaponBase = weaponStr.split('[')[0].trim();
            var kpEngAmmo = getKpEng();
            var inferredAmmoType = (kpEngAmmo && kpEngAmmo.inferAmmoType) ? kpEngAmmo.inferAmmoType(weaponStr) : null;
            var backpackAmmo = readBackpackAmmo(weaponStr);
            var ammo = backpackAmmo ? backpackAmmo.count : readAmmo(c);
            var ammoType = backpackAmmo ? backpackAmmo.ammoType : inferredAmmoType;
            var rounds = Math.max(1, Math.min(Number(args.rounds) || 3, ammo, 30));
            var isFirearm = !!inferredAmmoType;

            if (isFirearm && ammo <= 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '⚠️ 背包中没有匹配「' + (ammoType || '该枪型') + '」的弹药！' });
                return '开火失败：背包无匹配弹药。';
            }

            if (ammo < rounds) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '⚠️ 弹药不足！需要 ' + rounds + ' 发，背包仅剩 ' + ammo + ' 发。' });
                return '开火失败：弹药不足。';
            }

            var weaponObj = { skill: '手枪', damage: args.damage || '1D6' };
            if (weaponStr.includes('步枪')) weaponObj.skill = '步枪';
            else if (weaponStr.includes('霰弹')) weaponObj.skill = '霰弹枪';
            else if (weaponStr.includes('冲锋')) weaponObj.skill = '冲锋枪';
            else if (weaponStr.includes('机枪')) weaponObj.skill = '机枪';

            var mode = args.mode || 'burst';
            var kpEng = getKpEng();
            if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && kpEng.handleFirearmAttempt) {
                var firearmCheck = kpEng.handleFirearmAttempt({ gameState });
                var blockedMsg = applyFirearmRealityBlock(firearmCheck, c, enemy.name);
                if (blockedMsg) {
                    advanceTurn();
                    return blockedMsg;
                }
            }
            var remaining = spendAmmo(weaponStr, rounds, ammoType);
            if (remaining != null) ammo = remaining;
            else {
                ammo -= rounds;
                writeAmmo(c, ammo, weaponBase);
            }
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '🔫 ' + c.name + ' 连射 [' + rounds + ' 发] [背包剩余弹药:' + ammo + ']' });

            var result = Engine.CombatEngine.resolveBurstFire(c, enemy, weaponObj, rounds, mode);
            recordKpCombatAction('attack:fire_weapon:tactical');

            if (result.totalDamage > 0) {
                var dmgOutcome = applyEnemyDamageWithKp(enemy.name, -result.totalDamage, result.description, null, { skipArmor: true });
                if (dmgOutcome && dmgOutcome.blocked) {
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: '🛡️ [KP引擎] 纯伤害策略触发敌人免疫，连射伤害无效化。' });
                }
            }
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '🔫 ' + result.description });
            advanceTurn();
            return result.description;
        },
        dodge: (args) => {
            return runManeuverCheck('dodge', 'survive:dodge', args.actor_name, args.skill_name, args.difficulty, args.enemy_name);
        },
        fight_back: (args) => {
            const c = gameState.roster.find(r => r.name === (args.actor_name || args.target_name)) || gameState.roster.find(r => r.isActive);
            const enemy = gameState.combat.enemies.find(e => e.name === args.enemy_name && !e.isDefeated);
            if (!c || !enemy) return '错误：找不到角色或敌人';
            recordKpCombatAction('fight_back:counter');
            const weaponObj = { skill: args.skill_name || '斗殴', damage: args.damage || '1D3' };
            const result = Engine.CombatEngine.resolveCombatExchange(c, enemy, { weapon: weaponObj, action: 'counter', counterSkill: args.skill_name || '斗殴', counterDamage: args.damage || '1D3' });
            if (result.winner === 'defender' && result.damage > 0) {
                applyEnemyDamageWithKp(enemy.name, -result.damage, result.msg, null, { skipArmor: true });
            }
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '⚔️ ' + result.msg });
            advanceTurn();
            return result.msg;
        },
        disarm: (args) => {
            return runManeuverCheck('disarm', 'disarm:缴械', args.actor_name, args.skill_name, args.difficulty, args.enemy_name);
        },
        grapple: (args) => {
            return runManeuverCheck('grapple', 'grapple:擒抱', args.actor_name, args.skill_name, args.difficulty, args.enemy_name);
        }
    };
};
