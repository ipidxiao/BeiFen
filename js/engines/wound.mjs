// ESM engine module — source for browser build
// Split from js/engines/wound.js
import { CoCInjuryTables } from '../data/injury_tables.mjs';

export function attachMajorWoundEngine(CoCEngine) {
  CoCEngine.MajorWoundEngine = {
    _table: function() { return (CoCInjuryTables || {}).HIT_LOCATION || {}; },

    /**
     * 检查是否触发重伤: 单次伤害 >= maxHP/2
     */
    checkMajorWound: function(ch, damage) {
        if (!ch || !ch.derived || !ch.derived.maxHp) return null;
        var maxHp = ch.derived.maxHp || ch.derived.hp;
        if (damage < maxHp / 2) return null;
        var roll = Math.floor(Math.random() * 20) + 1;
        var loc = this._table()[roll] || { location: '躯干', area: 'torso', consequences: [], conCheck: false, desc: '受到严重伤害。' };
        return { isMajor: true, location: loc, roll: roll, damage: damage, description: loc.desc };
    },

    /**
     * 应用重伤后果
     */
    applyMajorWound: function(ch, wound) {
        if (!ch || !wound) return wound;
        if (!ch.status) ch.status = {};
        ch.status.hasMajorWound = true;
        if (!ch.status.wounds) ch.status.wounds = [];
        ch.status.wounds.push(wound);
        // Apply consequences
        var cqs = wound.location.consequences || [];
        if (cqs.includes('昏迷风险') && wound.location.conCheck) {
            var conRoll = Math.floor(Math.random() * 100) + 1;
            var conAttr = (ch.attrs && ch.attrs.CON) ? ch.attrs.CON * 5 : 50;
            if (conRoll > conAttr) { ch.status.isUnconscious = true; wound.unconscious = true; }
        }
        if (cqs.includes('武器掉落')) {
            if (ch.equipment && ch.equipment.weapon) {
                wound.droppedWeapon = ch.equipment.weapon;
                ch.equipment.weapon = null;
            }
        }
        if (cqs.includes('倒地')) { wound.prone = true; }
        if (cqs.some(function(c) { return c.includes('内出血'); })) { wound.bleeding = true; }
        if (cqs.some(function(c) { return c.includes('力量减半'); })) {
            if (ch.attrs && ch.attrs.STR) ch.attrs.STR = Math.floor(ch.attrs.STR / 2);
        }
        if (cqs.some(function(c) { return c.includes('敏捷减半'); })) {
            if (ch.attrs && ch.attrs.DEX) ch.attrs.DEX = Math.floor(ch.attrs.DEX / 2);
        }
        if (cqs.some(function(c) { return c.includes('体质减半'); })) {
            if (ch.attrs && ch.attrs.CON) ch.attrs.CON = Math.floor(ch.attrs.CON / 2);
        }
        if (cqs.some(function(c) { return c.includes('APP归零'); })) {
            if (ch.attrs && ch.attrs.APP != null) ch.attrs.APP = 0;
        }
        return wound;
    },

    /**
     * 濒死检定: HP <= 0 时 CONx5 检定
     */
    dyingCheck: function(ch) {
        if (!ch || !ch.attrs) return { passed: true, roll: 0, target: 0 };
        var con = ch.attrs.CON || 50;
        var target = con * 5;
        var roll = Math.floor(Math.random() * 100) + 1;
        var passed = roll <= target;
        return {
            passed: passed, roll: roll, target: target,
            description: passed ? ch.name + ' 勉强撑住了 (CONx5检定 ' + roll + '/' + target + ')。'
                : ch.name + ' 的生命之火熄灭了… (CONx5检定 ' + roll + '/' + target + ' 失败) 💀'
        };
    },

    /**
     * 获得所有活跃重伤列表
     */
    getActiveWounds: function(ch) {
        if (!ch || !ch.status || !ch.status.wounds) return [];
        return ch.status.wounds;
    },

    /**
     * 重伤摘要
     */
    getWoundSummary: function(ch) {
        if (!ch || !ch.status || !ch.status.wounds || !ch.status.wounds.length) return '';
        return ch.status.wounds.map(function(w) { return w.location.location; }).join('、');
    }
};
}
