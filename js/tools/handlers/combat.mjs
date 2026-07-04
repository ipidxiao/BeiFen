// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Combat domain (AUDITFIX8)
 */
export function combat(ctx) {
    const { gameState, Engine, addJournalEntry, startCombat, endCombat, updateEnemy, advanceTurn } = ctx;

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

    return {
        start_combat: (args) => {
            startCombat(args.enemies || [], args.location, args.notes);
            const names = (args.enemies || []).map(e => e.name).join('、');
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚔️ [战斗开始] 敌人：${names}。战斗界面已激活，请查看战斗面板！` });
            return `战斗已开始，敌人：${names}`;
        },
        end_combat: (args) => {
            endCombat(args.outcome, args.notes);
            return '战斗已结束';
        },
        update_enemy: (args) => {
            const e = gameState.combat.enemies.find(en => en.name === args.name);
            if (!e) return `找不到敌人: ${args.name}`;
            const rawChange = Number(args.hp_change) || 0;
            const actualDmg = rawChange < 0 ? Math.max(0, (-rawChange) - (e.armor || 0)) : 0;
            updateEnemy(args.name, rawChange < 0 ? -actualDmg : rawChange, args.note);
            const msg = rawChange < 0 ? pushEnemyDamageNotice(e, actualDmg) : `${args.name} HP 已更新（HP: ${e.hp}/${e.maxHp}）`;
            return msg;
        },
        enemy_attack: (args) => {
            const c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return `找不到目标: ${args.target_name}`;
            const dmg = args.damage || 0;
            const prev = c.hp;
            // Delegate HP change + wound tracking to the character handler
            ctx.dispatch('update_character_status', { target_name: args.target_name, hp_change: -dmg });
            const desc = args.description ? `【${args.enemy_name}】${args.description}，` : `【${args.enemy_name}】发动攻击，`;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚔️ ${desc}造成 ${dmg} 伤害！${args.target_name} HP: ${prev}→${Math.max(0, prev - dmg)}` });
            addJournalEntry({ type: 'hp_loss', charName: c.name, summary: `被${args.enemy_name}攻击，受到 ${dmg} 点伤害（HP: ${Math.max(0, prev - dmg)}/${c.derived?.hp || prev}）` });
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
            // Ammo is tracked in structured c.equipment.ammo; the [弹药:N] tag is kept in sync for compatibility.
            let weaponStr = (c.equipment || {}).weapon || '';
            const weaponBase = weaponStr.split('[')[0].trim() || '武器';
            let ammo = readAmmo(c);
            if (weaponStr.includes('枪') && ammo <= 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ ${c.name} 的枪膛是空的！` });
                return '开火失败：没有子弹。';
            }
            if (ammo > 0) {
                ammo--;
                writeAmmo(c, ammo, weaponBase);
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ 砰！${c.name} 开火 [消耗 1 发子弹，剩余 ${ammo} 发]` });
            }
            const weaponObj = {
                name: weaponBase,
                skill: weaponStr.includes('步枪') ? '步枪' : (weaponStr.includes('霰弹') ? '霰弹枪' : (weaponStr.includes('冲锋') ? '冲锋枪' : '手枪')),
                damage: args.damage || '1D6'
            };
            const result = Engine.CombatEngine.autoResolveExchange(c, enemy, weaponObj, {
                updateEnemy: (name, hp, note) => {
                    updateEnemy(name, hp, note);
                    const updated = gameState.combat.enemies.find(e => e.name === name);
                    if (updated && hp < 0) pushEnemyDamageNotice(updated, -hp);
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
            var ammo = readAmmo(c);
            var rounds = Math.max(1, Math.min(Number(args.rounds) || 3, ammo, 30));

            if (ammo < rounds) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '⚠️ 弹药不足！需要 ' + rounds + ' 发，仅剩 ' + ammo + ' 发。' });
                return '开火失败：弹药不足。';
            }

            var weaponObj = { skill: '手枪', damage: args.damage || '1D6' };
            if (weaponStr.includes('步枪')) weaponObj.skill = '步枪';
            else if (weaponStr.includes('霰弹')) weaponObj.skill = '霰弹枪';
            else if (weaponStr.includes('冲锋')) weaponObj.skill = '冲锋枪';
            else if (weaponStr.includes('机枪')) weaponObj.skill = '机枪';

            var mode = args.mode || 'burst';
            var result = Engine.CombatEngine.resolveBurstFire(c, enemy, weaponObj, rounds, mode);

            // Consume ammo via structured field (keeps the [弹药:N] tag in sync)
            ammo -= rounds;
            writeAmmo(c, ammo, weaponBase);

            // Apply damage to enemy
            if (result.totalDamage > 0) {
                ctx.updateEnemy(enemy.name, -result.totalDamage, result.description);
            }
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '🔫 ' + result.description + ' [剩余弹药:' + ammo + ']' });
            advanceTurn();
            return result.description;
        }
    };
};
