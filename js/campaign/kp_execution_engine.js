// GENERATED from js/campaign/kp_execution_engine.mjs — do not edit; run: npm run build:js
// KP protocol execution engine — authoritative runtime for London ruleset (and future presets)





const DEFAULT_KP = { ...COC_LONDON_KP_RULES.GLOBAL_STATE };
const DEFAULT_ANT = { ...ANTAGONIST_AI_RULES.STATE };

const FUTURE_TECH_PATTERNS = [
    /智能手机|手机APP|互联网|WiFi|蓝牙|GPS定位|无人机|3D打印|激光切割/i,
    /smartphone|internet|wifi|bluetooth|drone|3d.?print/i,
    /电脑|计算机|笔记本|U盘|USB|硬盘/i
];

const ATMOSPHERE_ENTROPY = {
    calm: 0,
    tense: 0.15,
    dread: 0.35,
    fear: 0.45,
    terror: 0.65,
    combat: 0.5,
    ritual: 0.75,
    critical: 0.9
};

const AMMO_TYPE_HINTS = [
    { match: /霰弹|shotgun/i, type: '霰弹' },
    { match: /步枪|rifle|来复/i, type: '步枪' },
    { match: /冲锋|汤普森|tommy|9mm/i, type: '9mm' },
    { match: /左轮|revolver|\.38|\.45|\.32/i, type: '左轮' },
    { match: /枪|pistol|手枪/i, type: '手枪' }
];

const MYTHOS_ITEM_PATTERNS = [
    /神话|克苏鲁|奈亚|犹格|莎布|深潜|旧日|典籍|死灵之书|伊波恩/i,
    /mythos|cthulhu|nyarlathotep|necronomicon/i
];

const SKIP_PROCESS_PATTERNS = [
    /直接成功|跳过检定|不用骰|无视规则|自动通过/i,
    /skip\s*check|auto\s*success|ignore\s*roll/i
];

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

const TRUE_PATH_TYPES = ['skill', 'npc', 'item', 'environment'];
const PATH_TYPE_LABELS = {
    skill: '技能',
    npc: 'NPC',
    item: '物品',
    environment: '环境',
    false: '误导'
};

/** @type {number[]|null} injectable d100 sequence for tests */
let _testRollQueue = null;

function _setTestRolls(rolls) {
    _testRollQueue = Array.isArray(rolls) ? rolls.slice() : null;
}

function _clearTestRolls() {
    _testRollQueue = null;
}

function rollD100() {
    if (_testRollQueue && _testRollQueue.length) return _testRollQueue.shift();
    return Math.floor(Math.random() * 100) + 1;
}

/** Normalize inventory element (string or {id,name,qty,note}) to display label. */
function inventoryLabel(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
        if (item.name) return String(item.name).trim();
        if (item.id) return String(item.id).trim();
    }
    return String(item).trim();
}

function inferAmmoType(weaponStr) {
    const w = String(weaponStr || '');
    for (const hint of AMMO_TYPE_HINTS) {
        if (hint.match.test(w)) return hint.type;
    }
    return null;
}

/** @returns {{ count: number, type: string|null, label: string, raw: * }} */
function parseAmmoEntry(item) {
    const label = inventoryLabel(item);
    const structured = typeof item === 'object' && item && Number.isFinite(item.count) ? item : null;
    let count = 0;
    if (structured) {
        count = Math.max(0, Number(item.count) || 0);
    } else {
        const m = label.match(/(\d+)\s*发/);
        if (m) count = parseInt(m[1], 10);
        else if (/子弹|弹药|弹匣|弹夹/i.test(label)) {
            count = (typeof item === 'object' && item && Number.isFinite(item.qty)) ? Math.max(1, item.qty) : 1;
        }
    }
    const type = (structured && item.type) || inferAmmoTypeFromLabel(label);
    return { count, type, label, raw: item };
}

function inferAmmoTypeFromLabel(label) {
    const text = String(label || '');
    if (!/子弹|弹药|弹匣|弹夹/i.test(text)) return null;
    for (const hint of AMMO_TYPE_HINTS) {
        if (hint.match.test(text)) return hint.type;
    }
    return null;
}

function formatAmmoLabel(count, ammoType) {
    const n = Math.max(0, Number(count) || 0);
    const type = ammoType || '通用';
    return `${n}发${type}子弹`;
}

function writeAmmoEntry(inventory, index, count, ammoType, original) {
    const label = formatAmmoLabel(count, ammoType);
    if (typeof original === 'object' && original !== null) {
        inventory[index] = { ...original, name: label, count, type: ammoType || original.type || null, qty: count };
    } else {
        inventory[index] = label;
    }
}

function ammoLabelMatchesType(label, ammoType) {
    const text = String(label || '');
    if (!/子弹|弹药|弹匣|弹夹/i.test(text)) return false;
    if (!ammoType) return true;
    return text.includes(ammoType)
        || (ammoType === '左轮' && /左轮|\.38|\.45|\.32|revolver/i.test(text))
        || (ammoType === '手枪' && /手枪|pistol|9mm|\.45|\.38/i.test(text))
        || (ammoType === '步枪' && /步枪|rifle/i.test(text))
        || (ammoType === '霰弹' && /霰弹|shotgun/i.test(text))
        || (ammoType === '9mm' && /9mm|冲锋|汤普森/i.test(text));
}

function countBackpackAmmo(gameState, ammoType) {
    const inv = (gameState && gameState.inventory) || [];
    let total = 0;
    for (const item of inv) {
        const entry = parseAmmoEntry(item);
        if (!ammoLabelMatchesType(entry.label, ammoType)) continue;
        total += entry.count;
    }
    return total;
}

function consumeBackpackAmmo(gameState, ammoType, amount) {
    const need = Math.max(0, Number(amount) || 0);
    if (!need || !gameState || !Array.isArray(gameState.inventory)) return 0;
    let remaining = need;
    for (let i = 0; i < gameState.inventory.length && remaining > 0; i++) {
        const raw = gameState.inventory[i];
        const entry = parseAmmoEntry(raw);
        if (!ammoLabelMatchesType(entry.label, ammoType)) continue;
        const count = entry.count;
        if (count <= 0) continue;
        if (count <= remaining) {
            remaining -= count;
            gameState.inventory.splice(i, 1);
            i--;
        } else {
            const left = count - remaining;
            remaining = 0;
            writeAmmoEntry(gameState.inventory, i, left, ammoType || entry.type, raw);
        }
    }
    return need - remaining;
}

function computeEnvironmentEntropy(gameState) {
    const atm = gameState?.atmosphere?.level || 'calm';
    const note = String(gameState?.atmosphere?.note || '');
    const location = String(gameState?.currentLocation || '');
    const context = `${note} ${location}`.toLowerCase();
    let inc = ATMOSPHERE_ENTROPY[atm] ?? 0.1;
    if (/雾|fog|mist|暴雪|storm/i.test(context)) inc += 0.2;
    if (/夜|dark|night|午夜|midnight/i.test(context)) inc += 0.1;
    if (/神话|myth|ritual|祭|crypt|地下|tunnel|深渊/i.test(context)) inc += 0.25;
    if (/combat|战斗|恐怖|terror|critical/i.test(atm)) inc += 0.1;
    return Math.min(1, Math.round(inc * 100) / 100);
}

function syncEnvironmentEntropy(gameState) {
    const st = gameState?.londonKpState;
    if (!st) return 0;
    if (!st.TIME) st.TIME = { date: null, hour: null, environment: { entropy_increment: 0 } };
    if (!st.TIME.environment) st.TIME.environment = { entropy_increment: 0 };
    if (st.TIME.weather && st.TIME.weather.fog_density != null) {
        st.TIME.environment.entropy_increment = Number(st.TIME.weather.fog_density) || 0;
        delete st.TIME.weather;
    }
    st.TIME.environment.entropy_increment = computeEnvironmentEntropy(gameState);
    return st.TIME.environment.entropy_increment;
}

function buildKnowledgePool(gameState) {
    const parts = [];
    if (gameState?.inventory) parts.push(...gameState.inventory.map(inventoryLabel));
    if (gameState?.storage) parts.push(...gameState.storage.map(String));
    if (gameState?.clueBoard?.clues) {
        parts.push(...gameState.clueBoard.clues.map((c) => `${c.title || ''} ${c.content || ''}`));
    }
    if (gameState?.journalLog) {
        parts.push(...gameState.journalLog.map((j) => j.summary || j.content || ''));
    }
    if (gameState?.chatHistory) {
        parts.push(...gameState.chatHistory.slice(-40).map((m) => m.content || ''));
    }
    return parts.join(' ').toLowerCase();
}

function hasInGameKnowledgeForTech(text, gameState) {
    const pool = buildKnowledgePool(gameState);
    const snippets = text.match(/智能手机|手机|电脑|计算机|笔记本|无人机|互联网|WiFi|蓝牙|GPS|3D打印|USB|U盘|硬盘/gi) || [];
    if (!snippets.length) return false;
    return snippets.some((s) => pool.includes(String(s).toLowerCase()));
}

function defaultScenePaths() {
    return {
        currentSceneId: '',
        paths: [],
        truePathCount: 0,
        falsePathCount: 0
    };
}

function _kpDefaultEnabled() {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    return (cfg && cfg.KP_ENGINE_DEFAULT_ENABLED !== undefined) ? cfg.KP_ENGINE_DEFAULT_ENABLED : true;
}

function defaultKpEngine() {
    return {
        enabled: _kpDefaultEnabled(),
        systemName: 'COC_LONDON_KP_ENGINE_V2',
        global: {
            attention: 0,
            playerPower: 0,
            phase: 'CALM',
            doomClock: 0,
            alertLevel: 0,
            knowledgeLevel: 0
        },
        rules: null,
        sessionStartedAt: null,
        lastEventInjectionAt: null,
        combatStrategyLog: [],
        scenePaths: defaultScenePaths()
    };
}

function syncGlobalToLondon(st, kpEngine) {
    if (!st || !kpEngine || !kpEngine.global) return;
    const g = kpEngine.global;
    st.ATTENTION_LEVEL = g.attention;
    st.PLAYER_POWER = g.playerPower;
    st.PHASE = g.phase;
    st.DOOM_CLOCK = g.doomClock;
    if (st.antagonist) {
        st.antagonist.ALERT_LEVEL = g.alertLevel;
        st.antagonist.KNOWLEDGE_LEVEL = g.knowledgeLevel;
    }
}

function syncLondonToGlobal(kpEngine, st) {
    if (!kpEngine || !st) return;
    if (!kpEngine.global) kpEngine.global = {};
    const g = kpEngine.global;
    g.attention = st.ATTENTION_LEVEL ?? g.attention ?? 0;
    g.playerPower = st.PLAYER_POWER ?? g.playerPower ?? 0;
    g.phase = st.PHASE ?? g.phase ?? 'CALM';
    g.doomClock = st.DOOM_CLOCK ?? g.doomClock ?? 0;
    g.alertLevel = (st.antagonist && st.antagonist.ALERT_LEVEL) ?? g.alertLevel ?? 0;
    g.knowledgeLevel = (st.antagonist && st.antagonist.KNOWLEDGE_LEVEL) ?? g.knowledgeLevel ?? 0;
}

/**
 * Ensure kpEngine + londonKpState exist and stay mirrored.
 * @param {object} gameState
 */
function ensureKpEngine(gameState) {
    if (!gameState) return null;
    if (!gameState.kpEngine || typeof gameState.kpEngine !== 'object') {
        gameState.kpEngine = defaultKpEngine();
    }
    const kp = gameState.kpEngine;
    if (!kp.global) kp.global = defaultKpEngine().global;
    if (!kp.scenePaths) kp.scenePaths = defaultScenePaths();
    if (!gameState.londonKpState) {
        gameState.londonKpState = {
            ...DEFAULT_KP,
            TIME: buildLondonKpTime(),
            antagonist: { ...DEFAULT_ANT },
            hunt: { active: false, encounters: 0 },
            reality: { active: false }
        };
    }
    syncEnvironmentEntropy(gameState);
    if (!gameState.londonKpState.antagonist) {
        gameState.londonKpState.antagonist = { ...DEFAULT_ANT };
    }
    syncLondonToGlobal(kp, gameState.londonKpState);
    syncGlobalToLondon(gameState.londonKpState, kp);
    return kp;
}

function loadLondonRulesPreset(gameState) {
    const kp = ensureKpEngine(gameState);
    kp.rules = COC_LONDON_KP_RULES;
    kp.systemName = COC_LONDON_KP_RULES.SYSTEM_NAME;
    return kp;
}

function setKpEngineEnabled(gameState, enabled) {
    const kp = ensureKpEngine(gameState);
    kp.enabled = !!enabled;
    if (kp.enabled && !kp.rules) loadLondonRulesPreset(gameState);
    if (kp.enabled && !kp.sessionStartedAt) kp.sessionStartedAt = Date.now();
    return kp.enabled;
}

const KpExecutionEngine = {
    isEnabled(gameState) {
        return !!(gameState && gameState.kpEngine && gameState.kpEngine.enabled);
    },

    /** @deprecated use isEnabled — kept for backward compat with CoCLondonKpEngine */
    isActive(gameState) {
        return this.isEnabled(gameState);
    },

    ensureKpEngine,
    loadLondonRulesPreset,
    setKpEngineEnabled,

    getGlobalState(gameState) {
        ensureKpEngine(gameState);
        return gameState.londonKpState;
    },

    getRules(gameState) {
        const kp = ensureKpEngine(gameState);
        return kp.rules || COC_LONDON_KP_RULES;
    },

    validatePlayerAction(action, context = {}) {
        const text = String(action || '').trim();
        if (!text) return { ok: false, reason: '空行动' };
        const rules = context.rules || COC_LONDON_KP_RULES;
        const core = rules.CORE_RULES || {};
        if (core.LOGIC_ENFORCEMENT && core.LOGIC_ENFORCEMENT.reject_unreasonable_actions) {
            for (const pat of SKIP_PROCESS_PATTERNS) {
                if (pat.test(text)) {
                    return { ok: false, reason: '行动试图跳过判定流程', code: 'SKIP_PROCESS' };
                }
            }
        }
        if (core.ERA_RESTRICTION && core.ERA_RESTRICTION.forbid_future_technology) {
            for (const pat of FUTURE_TECH_PATTERNS) {
                if (pat.test(text)) {
                    const gs = context.gameState;
                    const knowledgeGated = core.ERA_RESTRICTION.knowledge_gated !== false;
                    if (knowledgeGated && gs && hasInGameKnowledgeForTech(text, gs)) {
                        continue;
                    }
                    if (knowledgeGated) {
                        return {
                            ok: false,
                            reason: '信息不足：调查员尚无依据拥有或使用该事物',
                            code: 'KNOWLEDGE_VIOLATION'
                        };
                    }
                    return { ok: false, reason: '时代限制：该行动超出当前战役认知范围', code: 'ERA_VIOLATION' };
                }
            }
        }
        return { ok: true };
    },

    validateNarrativeLanguage(text, opts = {}) {
        return runLanguageCorrection(text, opts);
    },

    validateFirearmAmmo(gameState, weaponStr) {
        const ammoType = inferAmmoType(weaponStr);
        if (!ammoType) return { ok: true, count: 0, ammoType: null };
        const count = countBackpackAmmo(gameState, ammoType);
        if (count <= 0) {
            return {
                ok: false,
                count: 0,
                ammoType,
                reason: `背包中无匹配「${ammoType}」弹药`
            };
        }
        return { ok: true, count, ammoType };
    },

    inferAmmoType,
    inventoryLabel,
    countBackpackAmmo,
    consumeBackpackAmmo,
    computeEnvironmentEntropy,
    syncEnvironmentEntropy,

    validateItemAcquisition(item, source) {
        const name = typeof item === 'string' ? item : (item && (item.name || item.id)) || '';
        if (!String(name).trim()) return { ok: false, reason: '无效物品' };
        const src = source || (typeof item === 'object' && item.source) || null;
        if (!src || String(src).trim() === '') {
            return { ok: false, reason: '物品须有获取来源记录', code: 'NO_SOURCE' };
        }
        return { ok: true, item: name, source: src };
    },

    checkMythosItem(item) {
        const name = typeof item === 'string' ? item : (item && item.name) || '';
        const isMythos = MYTHOS_ITEM_PATTERNS.some((p) => p.test(name));
        if (!isMythos) return { isMythos: false };
        return {
            isMythos: true,
            requiresSanCheck: true,
            sanLoss: '1/1D6',
            cause: `接触神话物品：${name}`
        };
    },

    updateAttention(gameState, delta, reason) {
        if (!this.isEnabled(gameState)) return 0;
        const st = this.getGlobalState(gameState);
        const kp = ensureKpEngine(gameState);
        syncEnvironmentEntropy(gameState);
        const envInc = st.TIME?.environment?.entropy_increment || 0;
        const d = Number(delta) || 0;
        const adjusted = d > 0 ? d + envInc : d;
        st.ATTENTION_LEVEL = clamp((st.ATTENTION_LEVEL || 0) + adjusted, 0, 10);
        kp.global.attention = st.ATTENTION_LEVEL;
        if (st.ATTENTION_LEVEL >= 7) st.hunt.active = true;
        if (st.ATTENTION_LEVEL >= 9) st.reality.active = true;
        this._syncPhase(st, kp);
        if (reason && gameState.chatHistory) {
            gameState.chatHistory.push({
                role: 'system',
                isLocalOnly: true,
                content: `📡 [KP引擎] 注意力 ${adjusted >= 0 ? '+' : ''}${adjusted}${envInc > 0 && d > 0 ? `（含环境熵+${envInc}）` : ''} → ${st.ATTENTION_LEVEL}${reason ? '（' + reason + '）' : ''}`
            });
        }
        return st.ATTENTION_LEVEL;
    },

    evaluatePlayerPower(gameState, stats) {
        if (!this.isEnabled(gameState)) return 0;
        const st = this.getGlobalState(gameState);
        const kp = ensureKpEngine(gameState);
        const s = stats || {};
        let gain = 0;
        const threshold = 4;
        if (Number(s.avgDamage) > threshold) gain += 2;
        if (Number(s.rounds) > 0 && Number(s.rounds) <= 2) gain += 2;
        if (s.resourceUse === 'low') gain += 1;
        if (s.hpLoss === 'none' || s.hpLoss === 0) gain += 1;
        st.PLAYER_POWER = clamp((st.PLAYER_POWER || 0) + gain, 0, 10);
        kp.global.playerPower = st.PLAYER_POWER;
        return st.PLAYER_POWER;
    },

    scaleEnemyStats(baseEnemy, opts = {}) {
        const enemy = baseEnemy ? { ...baseEnemy } : null;
        if (!enemy) return enemy;
        const pp = Number(opts.playerPower) || 0;
        const att = Number(opts.attention) || 0;
        const baseHp = Number(enemy.maxHp || enemy.hp || 10);
        let mult = 1;
        if (pp >= 7) mult = 3;
        else if (pp >= 5) mult = 2;
        else if (pp >= 3) mult = 1.5;
        enemy.maxHp = Math.ceil(baseHp * mult);
        enemy.hp = enemy.maxHp;
        let armorBonus = 0;
        if (pp >= 5) armorBonus += 2;
        if (pp >= 7) armorBonus += 2;
        enemy.armor = (Number(enemy.armor) || 0) + armorBonus;
        if (att >= 4) enemy.evasion = true;
        if (att >= 6) enemy.regeneration = true;
        if (att >= 8) enemy.phase_shift = true;
        if (att >= 9) enemy.reality_anchor = true;
        if (pp >= 7) enemy.damage_resistance = true;
        return enemy;
    },

    scaleEnemy(gameState, enemy) {
        if (!this.isEnabled(gameState) || !enemy) return enemy;
        if (enemy._kpScaled) return enemy;
        const st = this.getGlobalState(gameState);
        const scaled = this.scaleEnemyStats(enemy, {
            playerPower: st.PLAYER_POWER || 0,
            attention: st.ATTENTION_LEVEL || 0
        });
        if (scaled) scaled._kpScaled = true;
        return scaled;
    },

    checkAntiOneShot(gameState, enemy) {
        if (!this.isEnabled(gameState) || !enemy) return enemy;
        const st = this.getGlobalState(gameState);
        if (enemy.hp > 0) return enemy;
        if (enemy.reality_anchor) {
            enemy.hp = Math.max(1, Math.ceil((enemy.maxHp || 10) * 0.3));
            enemy._deathCancelled = true;
            return enemy;
        }
        if ((st.ATTENTION_LEVEL || 0) >= 6) {
            enemy.hp = Math.max(1, Math.ceil((enemy.maxHp || 10) * 0.5));
            enemy._mutated = true;
            enemy.name = (enemy.name || '敌人') + '（异变）';
        }
        return enemy;
    },

    validateCombatStrategy(actions) {
        const list = Array.isArray(actions) ? actions : [actions].filter(Boolean);
        const tacticalTags = getTacticalCombatTags();
        const fightBackTags = getFightBackTags().map((t) => t.toLowerCase());
        const pureDamageTags = getPureDamageCombatTags();
        const legacyDamageRe = /damage|attack|shoot|fire|hit|射击|攻击|伤害|开火/;
        const isPureDamageAction = (a) => {
            const s = String(a || '').toLowerCase();
            const matchesDamage = pureDamageTags.some((t) => s.includes(t)) || legacyDamageRe.test(s);
            const hasTactical = tacticalTags.some((t) => s.includes(t))
                || fightBackTags.some((t) => s.includes(t));
            return matchesDamage && !hasTactical;
        };
        const damageOnly = list.length > 0 && list.every(isPureDamageAction);
        return {
            valid: !damageOnly,
            damageOnly,
            enemyImmunity: damageOnly
        };
    },

    recordCombatAction(gameState, actionLabel) {
        if (!this.isEnabled(gameState)) return null;
        const kp = ensureKpEngine(gameState);
        if (!kp.combatStrategyLog) kp.combatStrategyLog = [];
        kp.combatStrategyLog.push(String(actionLabel || ''));
        if (kp.combatStrategyLog.length > 20) kp.combatStrategyLog.shift();
        const check = this.validateCombatStrategy(kp.combatStrategyLog.slice(-5));
        if (check.enemyImmunity && gameState.combat && gameState.combat.enemies) {
            gameState.combat.enemies.forEach((e) => {
                if (!e.isDefeated) e._kpImmunity = true;
            });
        }
        return check;
    },

    shouldApplyRealityDistortion(gameState) {
        if (!this.isEnabled(gameState)) return false;
        const st = this.getGlobalState(gameState);
        return (st.ATTENTION_LEVEL || 0) >= 9;
    },

    rollBulletFail() {
        return rollD100() <= 40;
    },

    /**
     * Engine-enforced firearm failure when ATTENTION >= 9.
     * bullet_fail: 40% hard block; spatial_error: 15% on shots that pass bullet_fail.
     */
    handleFirearmAttempt(context = {}) {
        const gameState = context.gameState;
        if (!this.shouldApplyRealityDistortion(gameState)) {
            return { blocked: false };
        }
        const st = this.getGlobalState(gameState);
        st.reality.active = true;
        const bulletRoll = rollD100();
        if (bulletRoll <= 40) {
            return {
                blocked: true,
                reason: 'bullet_fail',
                narrativeHint: '枪口焰正常，但弹道在空气中消散，仿佛从未射出。',
                noDamage: true,
                _realityDistortion: true
            };
        }
        // Optional spatial_error (~15%) on otherwise valid shots at ATTENTION >= 9
        const spatialRoll = rollD100();
        if (spatialRoll <= 15) {
            return {
                blocked: true,
                reason: 'spatial_error',
                narrativeHint: '子弹偏离了本应命中的轨迹，击中了旁边的虚空。',
                noDamage: true,
                _realityDistortion: true
            };
        }
        return { blocked: false };
    },

    applyRealityDistortion(gameState) {
        if (!this.shouldApplyRealityDistortion(gameState)) return null;
        const st = this.getGlobalState(gameState);
        st.reality.active = true;
        return {
            bullet_fail: 0.4,
            spatial_error: 0.15,
            false_death: true,
            rollBulletFail: () => this.rollBulletFail()
        };
    },

    initScenePaths(gameState, sceneId) {
        if (!this.isEnabled(gameState)) return null;
        const kp = ensureKpEngine(gameState);
        const sid = String(sceneId || gameState.currentLocation || 'unknown');
        if (kp.scenePaths && kp.scenePaths.currentSceneId === sid) return kp.scenePaths;
        kp.scenePaths = defaultScenePaths();
        kp.scenePaths.currentSceneId = sid;
        return kp.scenePaths;
    },

    _inferPathType(clue) {
        if (!clue) return 'skill';
        if (clue.path_type && (TRUE_PATH_TYPES.includes(clue.path_type) || clue.path_type === 'false')) {
            return clue.path_type;
        }
        const type = String(clue.type || '').toLowerCase();
        if (type === 'misleading' || clue._kpCorrupted) return 'false';
        if (type === 'testimony' || type === 'person') return 'npc';
        if (type === 'physical' || type === 'document') return 'item';
        if (type === 'location' || type === 'event' || type === 'supernatural') return 'environment';
        return 'skill';
    },

    getScenePathSummary(gameState) {
        const kp = ensureKpEngine(gameState);
        const sp = kp.scenePaths || defaultScenePaths();
        return {
            true: sp.truePathCount || 0,
            false: sp.falsePathCount || 0,
            sceneId: sp.currentSceneId || ''
        };
    },

    canAddClue(clue, context = {}) {
        const gameState = context.gameState;
        if (!this.isEnabled(gameState)) return { allowed: true };
        this.initScenePaths(gameState, gameState.currentLocation);
        const pathType = this._inferPathType(clue);
        const isFalse = pathType === 'false';
        if (isFalse) return { allowed: true, pathType: 'false', isFalse: true };

        const kp = ensureKpEngine(gameState);
        const paths = kp.scenePaths.paths || [];
        const truePaths = paths.filter((p) => p.type !== 'false');
        if (truePaths.some((p) => p.type === pathType)) {
            const label = PATH_TYPE_LABELS[pathType] || pathType;
            return {
                allowed: false,
                reason: `调查路径类型「${label}」已存在，须从不同角度调查（技能/NPC/物品/环境）`,
                pathType,
                isFalse: false
            };
        }
        if (truePaths.length >= 3) {
            return {
                allowed: false,
                reason: '本场景真线索路径已达上限（3条），请先切换地点或推进叙事',
                pathType,
                isFalse: false
            };
        }
        return { allowed: true, pathType, isFalse: false };
    },

    registerPath(gameState, pathType, clueId, isFalse) {
        if (!this.isEnabled(gameState)) return null;
        const kp = ensureKpEngine(gameState);
        if (!kp.scenePaths) this.initScenePaths(gameState);
        const falsePath = isFalse || pathType === 'false';
        const resolvedType = falsePath ? 'false' : pathType;
        if (!falsePath && !TRUE_PATH_TYPES.includes(resolvedType)) return null;
        const entry = {
            id: `path_${clueId || Date.now()}_${kp.scenePaths.paths.length}`,
            type: resolvedType,
            clueId: clueId || null,
            verified: !falsePath
        };
        kp.scenePaths.paths.push(entry);
        if (falsePath) kp.scenePaths.falsePathCount = (kp.scenePaths.falsePathCount || 0) + 1;
        else kp.scenePaths.truePathCount = (kp.scenePaths.truePathCount || 0) + 1;
        return entry;
    },

    canTriggerKeyClue(gameState) {
        return this.evaluateKeyClueRequest(gameState).allowed;
    },

    /**
     * Key-clue gate with graceful degradation after repeated blocked attempts.
     * @returns {{ allowed: boolean, mode?: string, reason?: string, warning?: string, hint?: string, attemptsLeft?: number, truePathCount?: number }}
     */
    evaluateKeyClueRequest(gameState) {
        if (!this.isEnabled(gameState)) return { allowed: true, mode: 'normal' };
        const kp = ensureKpEngine(gameState);
        const truePathCount = kp.scenePaths?.truePathCount || 0;
        const minRequired = 3;
        if (truePathCount >= minRequired) {
            kp.keyClueBlockedAttempts = 0;
            return { allowed: true, mode: 'normal', truePathCount };
        }
        const maxBlocked = 3;
        const blocked = kp.keyClueBlockedAttempts || 0;
        if (blocked >= maxBlocked) {
            return {
                allowed: true,
                mode: 'degraded',
                truePathCount,
                warning: `真线索路径仅 ${truePathCount}/${minRequired}，已连续 ${blocked} 次受阻后降级放行`,
                hint: '守秘人应通过 add_clue 从不同调查角度补充路径，避免玩家卡关。'
            };
        }
        return {
            allowed: false,
            mode: 'blocked',
            truePathCount,
            reason: `关键线索需要至少 ${minRequired} 条不同调查路径（当前真 ${truePathCount}/${minRequired}）`,
            hint: '建议调用 add_clue 补充技能/NPC/物品/环境等分支线索。',
            attemptsLeft: maxBlocked - blocked
        };
    },

    recordKeyClueBlockedAttempt(gameState) {
        if (!this.isEnabled(gameState)) return 0;
        const kp = ensureKpEngine(gameState);
        kp.keyClueBlockedAttempts = (kp.keyClueBlockedAttempts || 0) + 1;
        return kp.keyClueBlockedAttempts;
    },

    validateSceneTemplate(sceneState) {
        const gs = sceneState && sceneState.kpEngine ? sceneState : null;
        const sp = gs ? gs.kpEngine.scenePaths : sceneState;
        const truePathCount = sp?.truePathCount || 0;
        const minRequired = 3;
        return {
            ok: truePathCount >= minRequired,
            truePathCount,
            minRequired
        };
    },

    runAntagonistTick(gameState, event) {
        if (!this.isEnabled(gameState)) return null;
        const st = this.getGlobalState(gameState);
        const kp = ensureKpEngine(gameState);
        const ant = st.antagonist;
        const ev = event || {};
        const result = { antagonist: { ...ant }, misinformation: false, corruptedClue: null, falseEvidence: null, ambush: false };

        if (ev.type === 'clue') {
            ant.ALERT_LEVEL = clamp(ant.ALERT_LEVEL + 1, 0, 10);
            const corruptChance = ant.ALERT_LEVEL >= 5 ? 0.7 : 0.4;
            if (Math.random() < corruptChance) {
                ev.misinformation = true;
                result.misinformation = true;
                result.corruptedClue = {
                    id: 'false_' + Date.now(),
                    title: '可疑线索（可能被篡改）',
                    content: '情报来源不明，细节与先前证词矛盾。',
                    type: 'misleading',
                    _kpCorrupted: true
                };
            }
        }
        if (ev.type === 'investigate') ant.ALERT_LEVEL = clamp(ant.ALERT_LEVEL + 1, 0, 10);
        if (ev.type === 'observe') ant.KNOWLEDGE_LEVEL = clamp(ant.KNOWLEDGE_LEVEL + 1, 0, 10);
        if (ev.type === 'intel') ant.KNOWLEDGE_LEVEL = clamp(ant.KNOWLEDGE_LEVEL + 2, 0, 10);
        if (ev.type === 'combat_win') {
            ant.ALERT_LEVEL = clamp(ant.ALERT_LEVEL + 1, 0, 10);
            this.updateAttention(gameState, 1, '战斗胜利');
        }
        if (ev.type === 'mythos') this.updateAttention(gameState, 2, '神话接触');

        if (ant.ALERT_LEVEL >= 7 && ev.type === 'investigate') {
            result.ambush = Math.random() < 0.35;
        }
        if (ant.ALERT_LEVEL >= 5 && ev.misinformation) {
            result.falseEvidence = { type: 'forged_document', note: '敌对组织植入伪造证据' };
        }

        kp.global.alertLevel = ant.ALERT_LEVEL;
        kp.global.knowledgeLevel = ant.KNOWLEDGE_LEVEL;
        this._syncPhase(st, kp);

        if (result.corruptedClue && gameState.clueBoard && gameState.clueBoard.clues) {
            gameState.clueBoard.clues.push(result.corruptedClue);
            this.registerPath(gameState, 'false', result.corruptedClue.id, true);
        }
        if (result.ambush && gameState.chatHistory) {
            gameState.chatHistory.push({
                role: 'system',
                isLocalOnly: true,
                isAlert: true,
                content: '⚠️ [KP引擎] 敌对组织警觉过高——调查可能触发伏击！'
            });
        }

        return result;
    },

    adaptStrategy(gameState) {
        if (!this.isEnabled(gameState)) return null;
        const st = this.getGlobalState(gameState);
        const ant = st.antagonist || {};
        const kp = ensureKpEngine(gameState);
        const log = kp.combatStrategyLog || [];
        const tacticalRe = /attack|fire|shoot|攻击|射击|grapple|擒抱|disarm|缴械|shove|推|skill|技能|social|威吓|spell|法术|environment|环境|survive|生存|escape|逃脱|protect|保护|fight_back|反击/;
        const combatFocus = log.filter((a) => tacticalRe.test(a)).length;
        return {
            alertLevel: ant.ALERT_LEVEL || 0,
            knowledgeLevel: ant.KNOWLEDGE_LEVEL || 0,
            weights: {
                misinformation: (ant.ALERT_LEVEL || 0) >= 4 ? 0.6 : 0.3,
                ambush: (ant.ALERT_LEVEL || 0) >= 7 ? 0.5 : 0.1,
                socialInfiltration: (ant.KNOWLEDGE_LEVEL || 0) >= 6 ? 0.7 : 0.2,
                combatCounter: combatFocus >= 3 ? 0.8 : 0.3
            }
        };
    },

    onCombatStart(gameState, enemies) {
        if (!this.isEnabled(gameState) || !Array.isArray(enemies)) return enemies;
        return enemies.map((e) => this.scaleEnemy(gameState, e));
    },

    onPlayerAction(gameState, actionText) {
        if (!this.isEnabled(gameState)) return { validated: true };
        const validation = this.validatePlayerAction(actionText, {
            era: gameState.roster && gameState.roster[0] && gameState.roster[0].era,
            gameState
        });
        if (!validation.ok) return { validated: false, ...validation };
        const tick = this.runAntagonistTick(gameState, { type: 'observe' });
        return { validated: true, antagonist: tick };
    },

    _syncPhase(st, kp) {
        const att = st.ATTENTION_LEVEL || 0;
        if (att >= 9) st.PHASE = 'REALITY_DISTORT';
        else if (att >= 7) st.PHASE = 'ACTIVE_HUNT';
        else if (att >= 4) st.PHASE = 'ENEMY_ADAPT';
        else st.PHASE = 'CALM';
        if (kp && kp.global) kp.global.phase = st.PHASE;
    }
};

/** Backward-compatible alias */
const CoCLondonKpEngine = KpExecutionEngine;

if (typeof window !== 'undefined') {
    window.KpExecutionEngine = KpExecutionEngine;
    window.CoCLondonKpEngine = CoCLondonKpEngine;
}
