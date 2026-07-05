// GENERATED from js/data/npc_templates.mjs — do not edit; run: npm run build:js
/**
 * CoC 7th Edition NPC & Monster Templates
 * 
 * 标准化属性模板，供 AI 生成 NPC/怪物时使用。
 * 包含常见人类 NPC 原型和神话怪物。
 */
window.CoCNpcTemplates = {
    // ══════════════════════════════════════════
    // 人类 NPC 原型
    // ══════════════════════════════════════════
    '警察': { type: 'human', attrs: { STR: 65, CON: 60, SIZ: 65, DEX: 55, APP: 50, INT: 55, POW: 55, EDU: 55 }, hp: 13, skills: { '斗殴': 60, '手枪': 50, '侦查': 55, '法律': 40, '汽车驾驶': 50 }, armor: 0, weapons: ['警棍 1D6+DB', '左轮手枪 1D10'] },
    '黑帮分子': { type: 'human', attrs: { STR: 60, CON: 55, SIZ: 60, DEX: 50, APP: 45, INT: 45, POW: 45, EDU: 40 }, hp: 12, skills: { '斗殴': 55, '手枪': 45, '恐吓': 50, '潜行': 40 }, armor: 0, weapons: ['黄铜指虎 1D3+1+DB', '手枪 1D10'] },
    '邪教徒': { type: 'human', attrs: { STR: 45, CON: 50, SIZ: 55, DEX: 50, APP: 45, INT: 55, POW: 60, EDU: 50 }, hp: 11, skills: { '神秘学': 50, '斗殴': 40, '匕首': 45, '潜行': 45 }, armor: 0, weapons: ['匕首 1D4+DB'], san: 45 },
    '邪教首领': { type: 'human', attrs: { STR: 50, CON: 55, SIZ: 55, DEX: 55, APP: 50, INT: 70, POW: 75, EDU: 65 }, hp: 11, skills: { '神秘学': 70, '克苏鲁神话': 20, '话术': 65, '斗殴': 45 }, armor: 0, spells: ['僵尸之眼', '枯萎术'], san: 30 },
    '私家侦探': { type: 'human', attrs: { STR: 55, CON: 55, SIZ: 60, DEX: 55, APP: 50, INT: 65, POW: 55, EDU: 60 }, hp: 12, skills: { '侦查': 70, '图书馆使用': 60, '手枪': 50, '潜行': 50, '话术': 55 }, armor: 0, weapons: ['手枪 1D10'] },
    '图书馆管理员': { type: 'human', attrs: { STR: 40, CON: 45, SIZ: 50, DEX: 50, APP: 55, INT: 70, POW: 55, EDU: 75 }, hp: 10, skills: { '图书馆使用': 85, '历史': 65, '外语': 55, '侦查': 45 }, armor: 0 },
    '医生': { type: 'human', attrs: { STR: 45, CON: 50, SIZ: 55, DEX: 60, APP: 55, INT: 70, POW: 55, EDU: 80 }, hp: 11, skills: { '医学': 75, '急救': 70, '药学': 60, '心理学': 55 }, armor: 0 },
    '记者': { type: 'human', attrs: { STR: 45, CON: 50, SIZ: 55, DEX: 55, APP: 55, INT: 65, POW: 55, EDU: 65 }, hp: 11, skills: { '侦查': 60, '话术': 55, '图书馆使用': 55, '摄影': 50, '心理学': 50 }, armor: 0 },
    '士兵': { type: 'human', attrs: { STR: 70, CON: 65, SIZ: 65, DEX: 60, APP: 50, INT: 50, POW: 50, EDU: 50 }, hp: 13, skills: { '步枪': 60, '斗殴': 60, '闪避': 50, '急救': 45, '潜行': 45 }, armor: 2, weapons: ['步枪 2D6+4', '匕首 1D4+DB'] },

    // ══════════════════════════════════════════
    // 神话怪物 (Mythos Monsters)
    // ══════════════════════════════════════════
    '深潜者': { type: 'monster', attrs: { STR: 70, CON: 65, SIZ: 65, DEX: 50, INT: 55, POW: 55 }, hp: 13, db: '1D4', build: 1, mov: 8, skills: { '斗殴': 55, '游泳': 80, '潜行': 50 }, armor: 1, weapons: ['爪 1D6+DB', '矛 1D8+1'], sanLoss: '0/1D6', description: '半人半鱼的深海生物，崇拜大衮和海德拉。' },
    '食尸鬼': { type: 'monster', attrs: { STR: 80, CON: 65, SIZ: 65, DEX: 65, INT: 45, POW: 45 }, hp: 13, db: '1D4', build: 1, mov: 9, skills: { '斗殴': 50, '潜行': 70, '攀爬': 60, '跳跃': 50 }, armor: 1, weapons: ['爪 1D6+DB', '咬 1D6'], sanLoss: '0/1D6', description: '食腐的类人怪物，有橡胶般的皮肤和犬类面部特征。' },
    '米·戈': { type: 'monster', attrs: { STR: 65, CON: 55, SIZ: 60, DEX: 70, INT: 75, POW: 65 }, hp: 12, db: '0', build: 0, mov: 7, skills: { '科学': 80, '电气维修': 70, '斗殴': 45 }, armor: 0, weapons: ['电击枪 1D3+眩晕', '爪 1D6'], sanLoss: '0/1D6', description: '来自犹格斯的真菌型外星生物，擅长外科手术和大脑移植。' },
    '修格斯': { type: 'monster', attrs: { STR: 110, CON: 85, SIZ: 100, DEX: 35, INT: 45, POW: 65 }, hp: 19, db: '2D6', build: 3, mov: 6, skills: { '斗殴': 70 }, armor: 0, weapons: ['碾压 2D6+DB'], sanLoss: '1D6/1D20', description: '巨大的黑色原生质怪物，不断变换形态，是古老者创造的仆从种族。' },
    '拜亚基': { type: 'monster', attrs: { STR: 85, CON: 55, SIZ: 75, DEX: 70, INT: 40, POW: 45 }, hp: 13, db: '1D4', build: 1, mov: 5, fly: 20, skills: { '斗殴': 55, '侦查': 50 }, armor: 2, weapons: ['爪 1D6+DB', '咬 1D6'], sanLoss: '1/1D6', description: '星际飞行的有翼生物，可作为坐骑穿越太空。' },
    '夜魇': { type: 'monster', attrs: { STR: 70, CON: 60, SIZ: 70, DEX: 60, INT: 35, POW: 45 }, hp: 13, db: '1D4', build: 1, mov: 6, fly: 12, skills: { '斗殴': 50, '潜行': 60 }, armor: 0, weapons: ['爪 1D6+DB'], sanLoss: '0/1D6', description: '没有面孔的漆黑飞行怪物，栖息于梦境之地。' },
    '丧尸': { type: 'undead', attrs: { STR: 80, CON: 80, SIZ: 65, DEX: 35, INT: 5, POW: 5 }, hp: 15, db: '1D4', build: 1, mov: 4, skills: { '斗殴': 40 }, armor: 0, weapons: ['抓 1D6+DB', '咬 1D4'], sanLoss: '0/1D8', description: '被魔法或科学复活的尸体，缓慢但不知疲倦。' },
    '幽灵': { type: 'undead', attrs: { INT: 55, POW: 70 }, hp: 0, mov: 0, skills: { '恐吓': 70 }, armor: 0, sanLoss: '0/1D6', description: '无法安息的亡魂。物理攻击无效，只能通过完成遗愿或驱魔仪式来驱逐。' },
    '克苏鲁的星之眷族': { type: 'monster', attrs: { STR: 140, CON: 100, SIZ: 130, DEX: 40, INT: 70, POW: 80 }, hp: 23, db: '3D6', build: 4, mov: 8, swim: 12, skills: { '斗殴': 70 }, armor: 10, weapons: ['触手 2D6+DB'], sanLoss: '1D10/1D100', description: '克苏鲁的巨型仆从，章鱼头的星间巨人。' }
};

/**
 * 从模板生成 NPC/怪物对象
 * @param {string} templateName - 模板名称
 * @param {Object} overrides - 覆写属性
 * @returns {Object} 生成的角色/怪物对象
 */
function generateNpcFromTemplate(templateName, overrides) {
    var tmpl = window.CoCNpcTemplates[templateName];
    if (!tmpl) {
        // 尝试模糊匹配
        for (var key in window.CoCNpcTemplates) {
            if (key.includes(templateName) || templateName.includes(key)) {
                tmpl = window.CoCNpcTemplates[key];
                break;
            }
        }
    }
    if (!tmpl) return null;

    var npc = {
        name: (overrides && overrides.name) || templateName,
        isEnemy: true,
        type: tmpl.type || 'human',
        attrs: Object.assign({}, tmpl.attrs || {}),
        hp: tmpl.hp || 10,
        maxHp: tmpl.hp || 10,
        db: tmpl.db || '0',
        build: tmpl.build || 0,
        mov: tmpl.mov || 7,
        armor: tmpl.armor || 0,
        skills: Object.assign({}, tmpl.skills || {}),
        weapons: (tmpl.weapons || []).slice(),
        description: tmpl.description || '',
        sanLoss: tmpl.sanLoss || ''
    };

    if (tmpl.fly) npc.fly = tmpl.fly;
    if (tmpl.swim) npc.swim = tmpl.swim;
    if (tmpl.spells) npc.spells = tmpl.spells.slice();
    if (tmpl.san) npc.sanity = tmpl.san;

    // Apply overrides
    if (overrides) {
        if (overrides.name) npc.name = overrides.name;
        if (overrides.hp) { npc.hp = Number(overrides.hp); npc.maxHp = Number(overrides.hp); }
        if (overrides.armor != null) npc.armor = Number(overrides.armor);
        if (overrides.description) npc.description = overrides.description;
    }

    return npc;
};
window.generateNpcFromTemplate = generateNpcFromTemplate;
