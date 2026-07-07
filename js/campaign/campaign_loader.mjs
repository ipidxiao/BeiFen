// Campaign loader — hydrate master state into gameState

import { CAMPAIGN_MASTER_STATE, getLocationLabel, buildLondonKpTime } from '../data/campaigns/masks_london_master_state.mjs';
import { MASKS_LONDON_CATALOG } from '../data/campaigns/masks_london_catalog.mjs';
import { COC_LONDON_KP_RULES } from '../data/campaigns/masks_london_kp_rules.mjs';
import { ANTAGONIST_AI_RULES } from '../data/campaigns/masks_london_antagonist_rules.mjs';
import { CoCLondonKpEngine, setKpEngineEnabled, loadLondonRulesPreset, ensureKpEngine } from './london_kp_engine.mjs';

const INVESTIGATOR_MAP = {
    V_Leader: { name: 'V', jobName: '领队', player: '领队' },
    Xiu_Avenger: { name: '修', jobName: '复仇者', player: '修' },
    Hugo_Scholar: { name: '雨果', jobName: '学者', player: '雨果' },
    Neil_Engineer: { name: '尼尔', jobName: '工程师', player: '尼尔' }
};

const DEFAULT_ATTRS = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 60, POW: 60, EDU: 60, LUCK: 50 };

function buildMinimalChar(key, data) {
    const meta = INVESTIGATOR_MAP[key] || { name: key, jobName: '调查员', player: key };
    const maxHp = Number(data.max_hp) || Number(data.hp) || 10;
    const hp = Number(data.hp) || maxHp;
    const san = Number(data.san) || 50;
    const active = data.status === 'Active';
    return {
        name: meta.name,
        jobName: meta.jobName,
        player: meta.player,
        hp,
        sanity: san,
        attrs: { ...DEFAULT_ATTRS },
        derived: { hp, maxHp, mp: 10, san, db: '0', build: 0, mov: 8 },
        skills: {},
        backstory: { description: data.condition || data.note || '', ideology: '', significantPeople: '', meaningfulLocations: '', treasuredPossessions: '', traits: '', injuries: '', phobias: '', encounters: '' },
        expName: '面具·伦敦',
        isInsane: false,
        isActive: active,
        hasMajorWound: false,
        isDying: false,
        isUnconscious: !active,
        equipment: { head: null, acc1: null, acc2: null, hands: null, feet: null, weapon: null },
        campaignKey: key,
        campaignCondition: data.condition || data.note || ''
    };
}

function flattenInventory(registry) {
    const items = [];
    if (!registry || typeof registry !== 'object') return items;
    const walk = (obj, prefix) => {
        Object.entries(obj).forEach(([k, v]) => {
            const label = prefix ? `${prefix}/${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v) && (v.holder || v.status || v.quantity)) {
                items.push({ name: label.replace(/_/g, ' '), detail: JSON.stringify(v), source: 'campaign_archive' });
            } else if (typeof v === 'string') {
                items.push({ name: label.replace(/_/g, ' '), detail: v, source: 'campaign_archive' });
            } else if (v && typeof v === 'object') {
                walk(v, label);
            }
        });
    };
    walk(registry, '');
    return items;
}

/**
 * Build condensed state summary for AI context injection.
 * @param {object} gameState
 * @returns {string}
 */
export function buildCampaignContextSummary(gameState) {
    const archive = gameState.campaignArchive || CAMPAIGN_MASTER_STATE.campaign_master_state;
    const anchor = archive.system_anchor || {};
    const roster = archive.investigator_roster || {};
    const kp = gameState.londonKpState || {};
    const ant = kp.antagonist || {};
    const lines = [
        '【面具·伦敦战役 — 当前存档摘要】',
        `地点：${getLocationLabel()}；时间：${(anchor.current_time || '').replace(/_/g, ':')}`,
        `目标：${(anchor.core_objective || '').replace(/_/g, ' ')}`,
        `威胁：${(anchor.immediate_threats || []).map((t) => t.replace(/_/g, ' ')).join('；')}`,
        `引擎：ATTENTION=${kp.ATTENTION_LEVEL ?? 0} PLAYER_POWER=${kp.PLAYER_POWER ?? 0} PHASE=${kp.PHASE ?? 'CALM'} DOOM=${kp.DOOM_CLOCK ?? 0}`,
        `敌对组织：警戒${ant.ALERT_LEVEL ?? 0} 情报${ant.KNOWLEDGE_LEVEL ?? 0} 掌控${ant.CONTROL_LEVEL ?? 0}`,
        '调查员：' + Object.entries(roster).map(([k, v]) => {
            const n = (INVESTIGATOR_MAP[k] || {}).name || k;
            if (v.status === 'Offline') return `${n}(离线)`;
            return `${n} HP${v.hp}/${v.max_hp} SAN${v.san}`;
        }).join(' | ')
    ];
    return lines.join('\n');
}

/**
 * Load masks_london campaign into gameState.
 * @param {object} gameState
 * @param {{ preserveChat?: boolean }} [opts]
 * @returns {boolean}
 */
export function loadMasksLondonCampaign(gameState, opts) {
    if (!gameState) return false;
    const preserveChat = opts && opts.preserveChat;
    const master = CAMPAIGN_MASTER_STATE.campaign_master_state;
    const anchor = master.system_anchor;

    gameState.activeCampaign = MASKS_LONDON_CATALOG.id;
    gameState.campaignArchive = JSON.parse(JSON.stringify(master));
    gameState.londonKpState = {
        ...JSON.parse(JSON.stringify(COC_LONDON_KP_RULES.GLOBAL_STATE)),
        TIME: buildLondonKpTime(anchor.current_time),
        PHASE: 'ACTIVE_HUNT',
        ATTENTION_LEVEL: 7,
        PLAYER_POWER: 5,
        DOOM_CLOCK: 8,
        antagonist: { ...ANTAGONIST_AI_RULES.STATE, ALERT_LEVEL: 6, KNOWLEDGE_LEVEL: 5, CONTROL_LEVEL: 4 },
        hunt: { active: true, encounters: 2 },
        reality: { active: false }
    };

    gameState.roster.splice(0);
    Object.entries(master.investigator_roster).forEach(([key, data]) => {
        gameState.roster.push(buildMinimalChar(key, data));
    });

    const locLabel = getLocationLabel();
    gameState.currentLocation = locLabel;
    gameState.knownLocations.splice(0, gameState.knownLocations.length, locLabel, '伦敦·苏活区', '泰晤士河秘密码头');
    gameState.atmosphere = { level: 'critical', note: master.environment_interactive_nodes.atmosphere.replace(/_/g, ' ') };

    gameState.inventory.splice(0);
    flattenInventory(master.inventory_registry).forEach((item, i) => {
        gameState.inventory.push({ id: 'camp_inv_' + i, name: item.name, qty: 1, note: item.detail });
    });

    gameState.scenarioRunner = { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null, pendingScenarioId: null };

    if (gameState.aiSettings) {
        gameState.aiSettings.difficultyPreset = MASKS_LONDON_CATALOG.difficultyPreset;
    }

    setKpEngineEnabled(gameState, true);
    loadLondonRulesPreset(gameState);
    ensureKpEngine(gameState);

    if (!preserveChat) {
        const sysPrompt = gameState.chatHistory.find((m) => m.role === 'system' && m.isHidden);
        gameState.chatHistory.splice(0);
        if (sysPrompt) gameState.chatHistory.push(sysPrompt);
        gameState.chatHistory.push({
            role: 'system',
            isLocalOnly: true,
            content: `🎭 [战役] 已加载「${MASKS_LONDON_CATALOG.title}」— ${locLabel}。氧气不足，死亡之口排气阀须在五分钟内操作。`
        });
        gameState.chatHistory.push({
            role: 'assistant',
            content: '地下祭坛的空气像被抽干。臭氧与黑色毒水蒸汽灼烧着肺叶；墙上渗出的红色液体在脉动。死亡之口排气阀被紫色干枯触须缠死，远处的神话实体仍在咆哮。你们还剩不到五分钟。'
        });
    }

    CoCLondonKpEngine.getGlobalState(gameState);
    return true;
}

export function unloadCampaign(gameState) {
    if (!gameState) return;
    const userKpEnabled = !!(gameState.kpEngine && gameState.kpEngine.enabled);
    gameState.activeCampaign = null;
    gameState.campaignArchive = null;
    gameState.londonKpState = null;
    if (gameState.aiSettings && (gameState.aiSettings.difficultyPreset === 'masks_london_kp' || gameState.aiSettings.difficultyPreset === 'divine_war')) {
        gameState.aiSettings.difficultyPreset = 'standard';
    }
    // Campaign-specific london state cleared; respect user's KP toggle (do not re-enable).
    if (userKpEnabled) {
        ensureKpEngine(gameState);
        loadLondonRulesPreset(gameState);
    }
}

export const CoCCampaignLoader = {
    loadMasksLondonCampaign,
    unloadCampaign,
    buildCampaignContextSummary,
    CATALOG: MASKS_LONDON_CATALOG
};

if (typeof window !== 'undefined') {
    window.CoCCampaignLoader = CoCCampaignLoader;
}
