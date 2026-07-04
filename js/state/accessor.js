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

    return {
        // ── 角色操作 ──
        getRoster:       function() { return ensure().gameState.roster; },
        getActiveChar:   function() { var r = ensure().gameState.roster; return r.length > 0 ? r[0] : null; },
        addToRoster:     function(c) { ensure().gameState.roster.push(c); },
        findChar:        function(name) { return ensure().gameState.roster.find(function(c) { return c.name === name; }); },

        // ── 消息/UI ──
        showToast:       function(msg, type, opts) { var s = ensure(); if (s.showToast) s.showToast(msg, type, opts); },
        pushMessage:     function(msg) { var s = ensure(); if (s.pushMessageBatched) s.pushMessageBatched(msg); },
        getChatHistory:  function() { return ensure().gameState.chatHistory; },
        isLoading:       function() { return ensure().gameState.isLoading; },

        // ── 战斗 ──
        getCombat:       function() { return ensure().gameState.combat; },
        isCombatActive:  function() { var c = ensure().gameState.combat; return c && c.active; },
        getEnemies:      function() { var c = ensure().gameState.combat; return c ? c.enemies || [] : []; },

        // ── 场景/线索 ──
        getCurrentLocation: function() { return ensure().gameState.currentLocation; },
        getSceneMap:     function() { return ensure().gameState.sceneMap; },
        getClueBoard:    function() { return ensure().gameState.clueBoard; },

        // ── 物品 ──
        getInventory:    function(charName) { var c = charName ? this.findChar(charName) : this.getActiveChar(); return c ? c.inventory || [] : []; },
        getEquipment:    function(charName) { var c = charName ? this.findChar(charName) : this.getActiveChar(); return c ? c.equipment || {} : {}; },

        // ── NPC ──
        getNpcRoster:    function() { return ensure().gameState.npcRoster || []; },
        getNpcRegistry:  function() { return ensure().gameState.npcRegistry || []; },

        // ── 存档 ──
        saveGame:        function(slot) { var s = ensure(); if (s.saveGame) s.saveGame(slot); },
        loadGame:        function(slot) { var s = ensure(); if (s.loadGame) s.loadGame(slot); },

        // ── 导航 ──
        switchScreen:    function(screen) { var s = ensure(); if (s.switchScreen) s.switchScreen(screen); },
        getActiveTab:    function() { return ensure().activeStoryTab; },

        // ── 底层引用 (迁移过渡期) ──
        getState:        function() { return ensure(); },
        getGameState:    function() { return ensure().gameState; }
    };
})();
