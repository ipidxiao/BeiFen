// V18.1: CoCState 访问器 — 解耦桥接层
// 22个文件通过此访问器操作状态，替代 window.CoCState 裸引用
// 未来可替换为 DI 容器而无需修改调用方

window.CoCStateAccessor = (function() {
    var _state = null;

    function ensure() {
        if (!_state) _state = window.CoCState;
        if (!_state) throw new Error('CoCState 未加载 — 请确认 state.js 在 accessor.js 之前加载');
        return _state;
    }

    function engine() { return window.CoCEngine; }
    function itemDb() { return window.CoCItemDB; }

    return {
        // ── 角色操作 ──
        getRoster:       function() { return ensure().gameState.roster; },
        getActiveChar:   function() { var r = ensure().gameState.roster; return r.length > 0 ? r[0] : null; },
        addToRoster:     function(c) { ensure().gameState.roster.push(c); },
        findChar:        function(name) { return ensure().gameState.roster.find(function(c) { return c.name === name; }); },
        clampSelectedCharIndex: function(gs) { var s = ensure(); return s.clampSelectedCharIndex ? s.clampSelectedCharIndex(gs || s.gameState) : 0; },

        // ── 消息/UI ──
        showToast:       function(msg, type, opts) { var s = ensure(); if (s.showToast) s.showToast(msg, type, opts); },
        pushMessage:     function(msg) { var s = ensure(); if (s.pushMessageBatched) s.pushMessageBatched(msg); },
        getChatHistory:  function() { return ensure().gameState.chatHistory; },
        isLoading:       function() { return ensure().gameState.isLoading; },
        confirmAction:   function(msg, opts) { var s = ensure(); return s.confirmAction ? s.confirmAction(msg, opts) : Promise.resolve(false); },
        scrollToBottom:  function() { var s = ensure(); if (s.scrollToBottom) s.scrollToBottom(); },

        // ── 战斗 ──
        getCombat:       function() { return ensure().gameState.combat; },
        isCombatActive:  function() { var c = ensure().gameState.combat; return c && c.active; },
        getEnemies:      function() { var c = ensure().gameState.combat; return c ? c.enemies || [] : []; },

        // ── 场景/线索 ──
        getCurrentLocation: function() { return ensure().gameState.currentLocation; },
        getSceneMap:     function() { return ensure().gameState.sceneMap; },
        getClueBoard:    function() { return ensure().gameState.clueBoard; },

        // ── 物品/装备 ──
        getInventory:    function(charName) { var c = charName ? this.findChar(charName) : this.getActiveChar(); return c ? c.inventory || [] : []; },
        getEquipment:    function(charName) { var c = charName ? this.findChar(charName) : this.getActiveChar(); return c ? c.equipment || {} : {}; },
        getEquipSlots:   function() { var db = itemDb(); return db && db.EQUIP_SLOTS ? db.EQUIP_SLOTS : {}; },
        resolveItem:     function(item) {
            if (!item) return {};
            if (typeof item === 'object' && item.name) return item;
            var db = itemDb();
            return db && db.resolve ? db.resolve(item) : { name: String(item), category: '杂物', tier: 'C' };
        },
        getSlotForItem:  function(item) { var db = itemDb(); return db && db.getSlotForItem ? db.getSlotForItem(item) : null; },
        canReplaceItem:  function(existing, newcomer) { var db = itemDb(); return db && db.canReplace ? db.canReplace(existing, newcomer) : true; },
        getItemTier:     function(tier) { var db = itemDb(); return db && db.TIERS ? db.TIERS[tier] : null; },

        // ── NPC ──
        getNpcRoster:    function() { return ensure().gameState.npcRegistry || []; },
        getNpcRegistry:  function() { return ensure().gameState.npcRegistry || []; },

        // ── 存档/模组 ──
        saveGame:        function(slot, name) { var s = ensure(); if (s.saveGame) return s.saveGame(slot, name); },
        loadGame:        function(slot) { var s = ensure(); if (s.loadGame) return s.loadGame(slot); return false; },
        deleteSave:      function(slot) { var s = ensure(); if (s.deleteSave) return s.deleteSave(slot); },
        getSaveSlots:    function() { var s = ensure(); return s.getSaveSlots ? s.getSaveSlots() : []; },
        getAutoSave:     function() { var s = ensure(); return s.getAutoSave ? s.getAutoSave() : null; },
        getStorageStatus:function(slot, name, payload) { var s = ensure(); return s.getStorageStatus ? s.getStorageStatus(slot, name, payload) : {}; },
        getModules:      function() { var s = ensure(); return s.getModules ? s.getModules() : []; },
        createModule:    function(name) { var s = ensure(); return s.createModule ? s.createModule(name) : null; },
        renameModule:    function(id, name) { var s = ensure(); return s.renameModule ? s.renameModule(id, name) : false; },
        deleteModule:    function(id) { var s = ensure(); return s.deleteModule ? s.deleteModule(id) : false; },
        enterModule:     function(id) { var s = ensure(); if (s.enterModule) s.enterModule(id); },

        // ── 骰子/检定（引擎代理） ──
        rollCustomDice:  function(notation, label, rolledBy, context) {
            var s = ensure();
            return s.rollCustomDice ? s.rollCustomDice(notation, label, rolledBy, context) : null;
        },
        checkSkill:      function(skillName, char, difficulty, options) {
            var e = engine();
            return e && e.checkSkill ? e.checkSkill(skillName, char, difficulty, options) : null;
        },
        executePushedRoll: function(skillName, char, difficulty) {
            var e = engine();
            return e && e.executePushedRoll ? e.executePushedRoll(skillName, char, difficulty) : null;
        },
        isVisibleSkillName: function(name) {
            var e = engine();
            return e && e.isVisibleSkillName ? e.isVisibleSkillName(name) : true;
        },
        getSkillDef:     function(name) {
            var e = engine();
            return e && e.BaseSkills ? e.BaseSkills[name] : undefined;
        },

        // ── 导航 ──
        switchScreen:    function(screen) { var s = ensure(); if (s.switchScreen) s.switchScreen(screen); },
        getActiveTab:    function() { return ensure().activeStoryTab; },

        // ── 底层引用 (迁移过渡期) ──
        getState:        function() { return ensure(); },
        getGameState:    function() { return ensure().gameState; }
    };
})();
