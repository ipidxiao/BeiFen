// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/** @returns {boolean} Canonical default lives in js/state/kp_config.mjs */
function _kpDefaultEnabled() {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    return (cfg && cfg.KP_ENGINE_DEFAULT_ENABLED !== undefined) ? cfg.KP_ENGINE_DEFAULT_ENABLED : true;
}

function _applyKpPreferenceToGameState(gameState) {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    if (cfg && cfg.applyKpPreferenceToGameState) cfg.applyKpPreferenceToGameState(gameState);
}

/**
 * CoC State Core — reactive state definitions + basic UI navigation.
 *
 * Owns: gameState (reactive), draftChar (reactive), playerInput (ref),
 *       activeCreatorTab (ref), and basic navigation helpers.
 */
export const CoCStateCore = (function(Vue) {
    if (!Vue) return {};
    const { reactive, ref, nextTick } = Vue;

    const gameState = reactive({
        currentScreen: 'modules',
        activeModuleId: 'default',
        roster: [],
        isLoading: false,
        chatHistory: [],
        activeModal: null,
        currentLocation: "未知的房间",
        knownLocations: ["未知的房间"],
        inventory: [], storage: [],
        journalLog: [],
        npcRegistry: [],
        combat: { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' },
        sceneMap: { title: '', rooms: [], currentRoomId: null },
        clueBoard: { clues: [], links: [] },
        diceHistory: [],
        aiSettings: { baseUrl: "https://api.deepseek.com/chat/completions", apiKey: "", model: "deepseek-chat", difficultyPreset: "standard" },
        atmosphere: { level: 'calm', note: '' },
        scenarioRunner: { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null },
        activeCampaign: null,
        campaignArchive: null,
        kpEngine: {
            enabled: _kpDefaultEnabled(),
            systemName: 'COC_LONDON_KP_ENGINE_V2',
            global: { attention: 0, playerPower: 0, phase: 'CALM', doomClock: 0, alertLevel: 0, knowledgeLevel: 0 },
            rules: null,
            sessionStartedAt: null,
            lastEventInjectionAt: null,
            combatStrategyLog: []
        },
        londonKpState: null,
        selectedCharIndex: 0,
        ui: { toasts: [], confirmDialog: null },
        storageStatus: { usedBytes: 0, quotaBytes: 5 * 1024 * 1024, usedRatio: 0, currentSaveBytes: 0, projectedBytes: 0, projectedRatio: 0, warning: '', lastCheckedAt: null }
    });

    const playerInput = ref("");
    const activeCreatorTab = ref('stats');

    const draftChar = reactive({
        name: "", player: "", job: null, era: "1920s", age: 25,
        attrs: { STR: 0, CON: 0, SIZ: 0, DEX: 0, APP: 0, INT: 0, POW: 0, EDU: 0, LUCK: 0 },
        attrModifiers: { STR: 0, CON: 0, SIZ: 0, DEX: 0, APP: 0, INT: 0, POW: 0, EDU: 0, LUCK: 0 },
        derived: { hp: 0, maxHp: 0, mp: 0, san: 0, db: "0", build: 0, mov: 0 },
        status: { hasMajorWound: false, isDying: false, isUnconscious: false },
        skillAllocations: {}, expPackage: null, sanPenalty: 0, stImportText: "",
        backstory: { description: "", ideology: "", significantPeople: "", meaningfulLocations: "", treasuredPossessions: "", traits: "", injuries: "", phobias: "", encounters: "" }
    });

    _applyKpPreferenceToGameState(gameState);

    if (gameState.chatHistory.length === 0) {
        gameState.chatHistory.push({
            role: 'system', isHidden: true,
            content: `你是《克苏鲁的呼唤(CoC)7版》的无情守秘人(KP)。\n【铁律1-叙事】：前台文本必须是纯粹的恐怖小说描写，禁止在文本里出现"调用工具、加入背包、检定成功"等出戏的系统词汇。禁止加粗。\n【铁律2-机制】：当玩家在剧情中找到、拾取或被赠予实体物品（如手枪、线索、钥匙）时，你绝对不能只在文本里说说！你必须、立刻、静默地调用 [update_inventory] 工具，将物品发放给玩家！\n【铁律3-判定】：玩家进行有风险的动作，必须调用 [request_skill_check] 工具。`
        });
    }

    // Load AI settings: sessionStorage (per-session) first, then localStorage (remembered)
    try {
        const saved = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vue_coc_api_cloud') : null)
            || (typeof localStorage !== 'undefined' ? localStorage.getItem('vue_coc_api_cloud') : null);
        if (saved) gameState.aiSettings = safeJsonParse(saved, gameState.aiSettings);
    } catch(e) {}

    const scrollToBottom = () => { nextTick(() => { let box = document.getElementById('chatContainer'); if(box) box.scrollTop = box.scrollHeight; }); };
    const switchScreen = (s) => { gameState.currentScreen = s; if(s==='story') scrollToBottom(); };
    const showModal = (t) => { gameState.activeModal = t; };
    const closeModal = () => { gameState.activeModal = null; };

    const addJournalEntry = (entry) => {
        gameState.journalLog.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            location: gameState.currentLocation || '未知地点',
            charName: null,
            isSuccess: null,
            ...entry
        });
    };

    return { gameState, playerInput, draftChar, activeCreatorTab, scrollToBottom, switchScreen, showModal, closeModal, addJournalEntry };
})(window.Vue);
