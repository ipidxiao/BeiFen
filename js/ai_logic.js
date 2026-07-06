// GENERATED from js/ai_logic.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================







const _getLanguageFilter = () => {
    if (typeof CoCLanguageFilter !== 'undefined') return CoCLanguageFilter;
    if (typeof window !== 'undefined' && window.CoCLanguageFilter) return window.CoCLanguageFilter;
    return null;
};
/** Prefer CoCKpConfig.getKpEngine() — single accessor in browser; fall back to window globals in VM tests. */
const _getKpEngine = () => {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    if (cfg && typeof cfg.getKpEngine === 'function') {
        const eng = cfg.getKpEngine();
        if (eng) return eng;
    }
    if (typeof window !== 'undefined' && window.KpExecutionEngine) return window.KpExecutionEngine;
    if (typeof window !== 'undefined' && window.CoCLondonKpEngine) return window.CoCLondonKpEngine;
    return { isEnabled: () => false, isActive: () => false, runAntagonistTick: () => null, onPlayerAction: () => ({ validated: true }) };
};
const _getOutputProtocol = () => {
    if (typeof restructureOrReject === 'function') return { restructureOrReject };
    if (typeof window !== 'undefined' && window.CoCOutputProtocol) return window.CoCOutputProtocol;
    return null;
};

/**
 * CoC AI Logic Module (Stable V16 Pro + JSDoc)
 * 
 * 负责处理玩家输入、触发 AI 回复以及执行 AI 调用的工具函数。
 * 包含“叙事监听器”实现，用于静默更新游戏状态。
 * 
 * 💡 贯彻“八荣八耻”：以臆想业务为耻，以复用现有为荣。
 * 本版本完全恢复了 V15 的 triggerAI, toolHandlers, processTools 和 executeSkillCheck 逻辑。
 */

/**
 * @role    程序员 (Programmer)
 * @owner   引擎核心 / AI调度 / 状态管理
 * @caution 策划/美术请勿直接修改此文件
 */
window.CoCAI = (function(State, Engine) {
    if (!State || !Engine) return {}; 
    const { gameState, playerInput, scrollToBottom, closeModal, addJournalEntry, addNpc, updateNpcStatus, startCombat, endCombat, updateEnemy, advanceTurn, createMap, updateRoom, setPosition, addClue, linkClues, markClueStatus, rollCustomDice, groupRoll } = State;
    let isSyntheticMoveInFlight = false;

    /**
     * 安全获取技能名称
     */
    const getSafeSkillName = (tool) => safeJsonParse(tool?.function?.arguments, {}).skill_name || '检定';
    
    /**
     * 移动到指定地点
     */
    const moveToLocation = async (loc) => {
        const target = String(loc || '').trim();
        if (!target) return;
        if (gameState.isLoading || isSyntheticMoveInFlight) {
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '⏳ [移动保护] 守秘人仍在处理上一轮行动，请稍后再移动。' });
            try { scrollToBottom(); } catch(e) {}
            return;
        }
        isSyntheticMoveInFlight = true;
        try {
            closeModal();
            playerInput.value = `我走向【${target.slice(0, 80)}】。`;
            await handlePlayerAction();
        } finally {
            isSyntheticMoveInFlight = false;
        }
    };

    /**
     * 处理玩家动作输入
     */
    const handlePlayerAction = async () => {
        try {
            if (!playerInput.value.trim() || gameState.isLoading) return;
            
            let hasPending = false;
            for (let i = gameState.chatHistory.length - 1; i >= 0; i--) {
                const m = gameState.chatHistory[i];
                if (m.role === 'user') break;
                if (m.role === 'assistant' && m.tool_calls && !m.isResolved && m.tool_calls.some(t => (t.function.name === 'request_skill_check' || t.function.name === 'push_skill_check') && !t.isResolved)) {
                    hasPending = true; break;
                }
            }
            
            if (hasPending) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: '【系统警告】命运已锁定，请先点击上方巨大的按钮进行掷骰！' });
                scrollToBottom(); return;
            }

            const kpEng = _getKpEngine();
            const actionText = playerInput.value.trim();
            if (kpEng.isEnabled && kpEng.isEnabled(gameState)) {
                const pre = kpEng.onPlayerAction ? kpEng.onPlayerAction(gameState, actionText) : kpEng.validatePlayerAction(actionText, { era: gameState.roster[0]?.era });
                if (pre && pre.validated === false) {
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `🚫 [KP引擎] 行动被拒绝：${pre.reason || '不符合规则'}` });
                    scrollToBottom(); return;
                }
            }

            const scenarioRunner = window.CoCScenarioRunner;
            if (scenarioRunner && scenarioRunner.isActive && scenarioRunner.isActive()) {
                const text = playerInput.value.trim();
                playerInput.value = '';
                scrollToBottom();
                scenarioRunner.handleInput(text);
                return;
            }
            
            gameState.chatHistory.push({ role: 'user', content: actionText });
            playerInput.value = ""; scrollToBottom(); 
            await triggerAI();
        } catch (err) {
            CoCLog.error("Player Action Error:", err);
        }
    };

    /** Narrative auto-clue patterns — titleIdx points at the capture group for clue title. */
    const NARRATIVE_CLUE_PATTERNS = [
        { re: /发现(了)?(?:一张|一个|一段|关于)?(.+?)(?:线索|证据|照片|信件|日记|笔记|钥匙|物品|道具|武器)/, titleIdx: 2 },
        { re: /调查(?:到|出)(.+?)(?:真相|内幕|线索|秘密)/, titleIdx: 1 },
        { re: /捡(?:到|起)(了)?(.+?)(?:物品|道具|钥匙|武器|信件|日记|笔记)/, titleIdx: 2 },
        { re: /(?:找到|获得|得到)(了)?(.+?)(?:线索|物品|道具|钥匙|信件|笔记)/, titleIdx: 2 }
    ];

    /** Explicit movement verbs only — no sensory weak matches (AUDIT-P1-14). */
    const NARRATIVE_MOVE_PATTERNS = [
        { re: /(?:走进|进入|来到|到达)(了)?(.+?)(?:房间|大厅|走廊|地下室|办公室|密室|洞穴)/, nameIdx: 2, suffixIdx: null },
        { re: /(?:爬上|爬下|钻入|跳下|推开)(了)?(.+?)(?:楼梯|地道|悬崖|门|通道)/, nameIdx: 2, suffixIdx: null }
    ];

    const _narrativeClueTitleExists = (title) => {
        const t = String(title || '').trim();
        if (t.length < 2) return true;
        return gameState.clueBoard.clues.some((c) => {
            const existing = String(c.title || '').trim();
            return existing.includes(t) || t.includes(existing);
        });
    };

    /** Route auto clues through tool handler (KP canAddClue); skip silently on reject. */
    const _tryNarrativeAddClue = (title, content, type = 'physical') => {
        const trimmed = String(title || '').trim().slice(0, 20);
        if (trimmed.length < 2 || _narrativeClueTitleExists(trimmed)) return;
        if (!toolHandlers.add_clue) return;
        const args = {
            id: 'auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title: trimmed,
            content: content || trimmed,
            type
        };
        const result = toolHandlers.add_clue(args);
        if (String(result).startsWith('错误')) {
            CoCLog.debug('[narrativeListener] auto clue skipped:', result);
        }
    };

    const _resolveNarrativeRoom = (hint) => {
        const name = String(hint || '').trim();
        if (name.length < 2) return null;
        const rooms = gameState.sceneMap?.rooms;
        if (!Array.isArray(rooms) || !rooms.length) return null;
        return rooms.find((r) => {
            const rname = String(r.name || '').trim();
            return rname.length >= 2 && rname.includes(name);
        }) || null;
    };

    const _tryNarrativeMove = (roomHint) => {
        const room = _resolveNarrativeRoom(roomHint);
        if (!room || gameState.currentLocation === room.name) return;
        if (!toolHandlers.set_position) return;
        toolHandlers.set_position({ room_id: room.id });
    };

    /**
     * 叙事监听器：扫描 AI 文本，自动触发系统更新（经 KP 校验，弱匹配不写入）
     * @param {string} text - AI 生成的文本内容
     */
    const narrativeListener = (text) => {
        if (!text) return;
        if (gameState.isLoading) return;
        if (gameState.combat && gameState.combat.active) return;

        for (const { re, titleIdx } of NARRATIVE_CLUE_PATTERNS) {
            const match = text.match(re);
            if (!match || !match[titleIdx]) continue;
            const title = match[titleIdx].trim();
            if (title.length >= 2) _tryNarrativeAddClue(title, match[0]);
        }

        for (const { re, nameIdx, suffixIdx } of NARRATIVE_MOVE_PATTERNS) {
            const match = text.match(re);
            if (!match || !match[nameIdx]) continue;
            const hint = suffixIdx != null && match[suffixIdx]
                ? (match[nameIdx] + match[suffixIdx]).trim()
                : match[nameIdx].trim();
            if (hint.length >= 2) _tryNarrativeMove(hint);
        }
    };

    /**
     * 触发 AI 请求并处理工具调用
     */
    const triggerAI = async (toolRound = 0) => {
        if (toolRound > MAX_TOOL_ROUNDS) {
            const msg = `🛑 [AI保护] 工具调用轮数超过上限（${MAX_TOOL_ROUNDS}）。已中断本轮自动续写，避免循环调用。`;
            CoCLog.error(msg);
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: msg });
            try { scrollToBottom(); } catch(e) {}
            return false;
        }
        gameState._aiBusyCount = (gameState._aiBusyCount || 0) + 1;
        gameState.isLoading = gameState._aiBusyCount > 0;
        scrollToBottom();
        try {
        const tools = buildAiToolDefinitions();
        if (!tools.length) {
            CoCLog.warn('CoCToolDefinitions 未加载或为空；本轮 AI 请求将无法使用工具调用。');
        }

        if (isBrowserOffline()) {
            gameState.chatHistory.push({
                role: 'system',
                isLocalError: true,
                isAlert: true,
                content: '📴 【离线模式】AI 守秘人需要网络连接。请恢复网络后重试，或继续使用骰子、战斗、角色卡、存档等本地功能。'
            });
            return false;
        }

        const apiKey = (gameState.aiSettings && gameState.aiSettings.apiKey || '').trim();
        if (!apiKey) {
            gameState.chatHistory.push({
                role: 'system',
                isLocalError: true,
                isAlert: true,
                content: '🔑 请配置 API Key：在设置中填入密钥后再使用 AI 守秘人。'
            });
            return false;
        }

        const contextSource = (window.CoCContextManager && window.CoCContextManager.buildApiMessages)
            ? window.CoCContextManager.buildApiMessages(gameState.chatHistory)
            : gameState.chatHistory.filter(m => !m.isLocalError && !m.isLocalOnly);
        let lastUserIndex = -1;
        for (let i = contextSource.length - 1; i >= 0; i--) {
            if (contextSource[i] && contextSource[i].role === 'user') { lastUserIndex = i; break; }
        }

        const safeHistory = contextSource.map((m, index, array) => {
            let cleanMsg = { role: m.role };
            if (m.content !== undefined && m.content !== null) cleanMsg.content = m.content; else if (m.role === 'tool') cleanMsg.content = ""; 
            if (m.name) cleanMsg.name = m.name;
            if (m.tool_call_id) cleanMsg.tool_call_id = m.tool_call_id; 
            if (m.tool_calls && m.tool_calls.length > 0) {
                const sanitizedCalls = sanitizeToolCallsForApi(m.tool_calls);
                if (sanitizedCalls.length > 0) cleanMsg.tool_calls = sanitizedCalls;
            }
            
            const activeRoster = gameState.roster.filter(c => c.isActive);
            if (m.role === 'user' && index === lastUserIndex && activeRoster.length > 0) {
                let teamDetails = activeRoster.map(c => {
                    let e = c.equipment || {};
                    let eStr = Object.entries(e).filter(([k,v]) => v).map(([k,v]) => `${k}:${v}`).join(", ") || "无装备";
                    return `【${c.name}】(HP:${c.hp}/${c.derived.hp}, SAN:${c.sanity}, 装备:${eStr})`;
                }).join("\n");
                
                cleanMsg.content += CoCAIPromptConfig.buildSystemInjection(teamDetails, gameState.aiSettings.difficultyPreset || 'standard', gameState);
                const kpEng = _getKpEngine();
                if (kpEng.isEnabled && kpEng.isEnabled(gameState)) {
                    // observe tick runs in onPlayerAction — avoid duplicate KNOWLEDGE increment per turn
                    if (kpEng.adaptStrategy) {
                        const strat = kpEng.adaptStrategy(gameState);
                        if (strat) cleanMsg.content += `\n\n[KP敌对策略权重] ALERT=${strat.alertLevel} KNOW=${strat.knowledgeLevel} misinfo=${strat.weights.misinformation}`;
                    }
                }
                const intercept = CoCAIPromptConfig.matchKeywordIntercept(m.content);
                if (intercept) cleanMsg.content += intercept;
            }
            return cleanMsg;
        });

        try {
            const requestBody = JSON.stringify({ model: gameState.aiSettings.model, messages: safeHistory, tools: tools, tool_choice: "auto" });
            const { response: res, attempts } = await fetchAiCompletionWithRetry(
                gameState.aiSettings.baseUrl,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gameState.aiSettings.apiKey.trim()}` }, body: requestBody },
                AI_REQUEST_TIMEOUT_MS,
                AI_REQUEST_MAX_ATTEMPTS,
                (err, nextAttempt, maxAttempts, delayMs) => {
                    const waitText = delayMs > 0 ? `，${Math.round(delayMs / 100) / 10}秒后重试` : '，立即重试';
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🔁 [AI重试] ${formatAiError(err)}；正在进行第 ${nextAttempt}/${maxAttempts} 次尝试${waitText}。` });
                    try { scrollToBottom(); } catch(_) {}
                }
            );
            const data = await res.json();
            if (attempts > 1) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `✅ [AI连接] 第 ${attempts} 次尝试成功，已恢复叙事。` });
            }
            const aiMsg = data.choices && data.choices[0] && data.choices[0].message;
            if (!aiMsg) throw new Error('AI返回格式缺少 choices[0].message');
            if (aiMsg.content) {
                const kpEng = _getKpEngine();
                const kpOn = kpEng.isEnabled && kpEng.isEnabled(gameState);
                const langFilter = _getLanguageFilter();
                if (langFilter) {
                    const detailed = langFilter.runDetailed ? langFilter.runDetailed(aiMsg.content) : { text: langFilter.run(aiMsg.content), ok: true };
                    if (detailed.rejected) {
                        // Policy: never show raw forbidden phrasing — apply safeFallback mask when rewrite fails.
                        const fallback = langFilter.safeFallback
                            ? langFilter.safeFallback(aiMsg.content)
                            : (detailed.text || '（叙事含禁用句式，已替换为安全表述。）');
                        gameState.chatHistory.push({
                            role: 'system',
                            isLocalOnly: true,
                            isHidden: true,
                            content: kpOn
                                ? '🚫 [KP引擎] 叙事含禁用句式，自动改写失败，已应用安全降级文本（不展示原文）。'
                                : '🚫 [输出质量] 叙事含禁用句式，已应用安全降级文本。'
                        });
                        aiMsg.content = fallback;
                    } else {
                        aiMsg.content = detailed.text || aiMsg.content;
                    }
                    if (gameState.kpEngine && detailed.rewritten) {
                        gameState.kpEngine.lastLanguageRewritten = true;
                    }
                }
                const outProto = _getOutputProtocol();
                if (outProto && outProto.restructureOrReject) {
                    const out = outProto.restructureOrReject(aiMsg.content, { autoFix: true });
                    if (out.restructured) {
                        aiMsg.content = out.text;
                        gameState.chatHistory.push({
                            role: 'system', isLocalOnly: true,
                            content: kpOn ? '📝 [KP引擎] 叙事已按五段协议自动重组。' : '📝 [输出质量] 叙事已按五段协议自动重组。'
                        });
                    } else if (!out.ok) {
                        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isHidden: true, content: out.repromptMessage || '输出协议校验未通过' });
                    }
                }
                if (kpEng.validateNarrativeEra) {
                    const eraCheck = kpEng.validateNarrativeEra(aiMsg.content, { gameState });
                    if (eraCheck && !eraCheck.ok) {
                        if (eraCheck.text) aiMsg.content = eraCheck.text;
                        gameState.chatHistory.push({
                            role: 'system', isLocalOnly: true, isHidden: true,
                            content: kpOn
                                ? `⚠️ [KP引擎] 叙事含时代违禁科技（${eraCheck.code || 'ERA'}）：${eraCheck.reason || ''}（已剥离违禁词）`
                                : `⚠️ [输出质量] 叙事含时代违禁科技（${eraCheck.code || 'ERA'}）：${eraCheck.reason || ''}（已剥离违禁词）`
                        });
                        if (kpEng.isEraStripDegraded && kpEng.isEraStripDegraded(aiMsg.content) && !gameState._eraRepromptAttempted) {
                            gameState._eraRepromptAttempted = true;
                            gameState.chatHistory.push({
                                role: 'system', isLocalOnly: true, isHidden: true,
                                content: kpOn
                                    ? '🔄 [KP引擎] 时代违禁词过多，建议下一轮重新生成叙事（单次提示）。'
                                    : '🔄 [输出质量] 时代违禁词过多，建议下一轮重新生成叙事（单次提示）。'
                            });
                        }
                    }
                }
            }
            aiMsg._toolRound = toolRound;
            gameState.chatHistory.push(aiMsg);
            
            narrativeListener(aiMsg.content);

            if (aiMsg.tool_calls) await processTools(aiMsg, toolRound);
        } catch (e) {
            const attemptsText = e && e.attempts ? `（已尝试 ${e.attempts}/${AI_REQUEST_MAX_ATTEMPTS} 次）` : '';
            const detail = e && e.name === 'AbortError'
                ? `AI请求超过 ${Math.round(AI_REQUEST_TIMEOUT_MS / 1000)} 秒未响应，重试后仍失败${attemptsText}。`
                : `与守秘人的连接中断：${formatAiError(e)}${attemptsText}。请检查网络/API Key/模型设置。`;
            gameState.chatHistory.push({ role: 'system', isLocalError: true, isAlert: true, content: `🔌 【网络异常】${detail}` });
        }
        } finally {
            gameState._aiBusyCount = Math.max(0, (gameState._aiBusyCount || 1) - 1);
            gameState.isLoading = gameState._aiBusyCount > 0;
            try { if (State.compactChatHistory) State.compactChatHistory('ai'); } catch(err){}
            try { scrollToBottom(); } catch(err){}
        }
    };

    /**
     * Create a deep-cloned snapshot of all mutable game state arrays/objects
     * that tool handlers may mutate.  Used for rollback on handler failure.
     * @returns {Object|null} Snapshot, or null if cloning fails
     */
    const makeToolSnapshot = () => safeJsonClone({
        roster: gameState.roster,
        inventory: gameState.inventory,
        combat: gameState.combat,
        chatHistoryLength: gameState.chatHistory.length
    }, null);

    /**
     * Restore all mutable game state from a snapshot previously taken by
     * makeToolSnapshot().  Also truncates chatHistory to its snapshot length.
     * @param {Object|null} snapshot - Snapshot object from makeToolSnapshot()
     */
    const restoreToolSnapshot = (snapshot) => {
        if (!snapshot) return;
        const replaceArray = (target, source) => target.splice(0, target.length, ...(Array.isArray(source) ? source : []));
        replaceArray(gameState.roster, snapshot.roster);
        replaceArray(gameState.inventory, snapshot.inventory);
        if (snapshot.combat) Object.assign(gameState.combat, snapshot.combat);
        if (Number.isFinite(snapshot.chatHistoryLength)) {
            gameState.chatHistory.splice(snapshot.chatHistoryLength);
        }
    };

    /**
     * 处理 AI 调用的工具列表
     */
    /**
     * Process an AI message's tool_calls array: validate arguments, dispatch
     * to domain handlers, collect return values, and auto-continue the AI loop
     * if no user action is needed.  request_skill_check pauses the loop for
     * manual dice rolling.
     * @param {Object} aiMsg - The assistant message with .tool_calls
     * @param {number} [toolRound=0] - Current recursion depth (capped at MAX_TOOL_ROUNDS)
     */
    const processTools = async (aiMsg, toolRound = 0) => {
        let returns = [];
        let needsUserAction = false;
        const pushLocalToolShapeError = (message) => {
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ [Tool格式错误] ${message}` });
        };
        const pushToolReturnOrLocalError = (tool, toolName, content, index = 0) => {
            const name = toolName || 'unknown_tool';
            if (hasValidToolCallId(tool)) {
                returns.push({ role: "tool", name, tool_call_id: tool.id, content });
            } else {
                pushLocalToolShapeError(`#${index + 1} ${name} 缺少有效 tool_call_id：${content}`);
            }
        };

        if (!Array.isArray(aiMsg.tool_calls)) {
            pushLocalToolShapeError('AI 返回的 tool_calls 不是数组，已忽略本轮工具调用，避免污染上下文。');
            aiMsg.isResolved = true;
            return;
        }

        const toolCalls = aiMsg.tool_calls;
        for (let i = 0; i < toolCalls.length; i++) {
            let tool = toolCalls[i];
            if (!tool || typeof tool !== 'object' || !tool.function || typeof tool.function !== 'object') {
                if (tool && typeof tool === 'object') tool.isResolved = true;
                pushLocalToolShapeError(`#${i + 1} tool_call 缺少 function 对象，已忽略以避免生成 orphan tool response。`);
                continue;
            }
            tool.isResolved = false;
            const toolName = typeof tool.function.name === 'string' ? tool.function.name.trim() : '';
            if (!toolName) {
                tool.isResolved = true;
                pushLocalToolShapeError(`#${i + 1} tool_call.function.name 为空或不是字符串，已忽略以避免生成 orphan tool response。`);
                continue;
            }
            if (!hasValidToolCallId(tool)) {
                tool.isResolved = true;
                pushLocalToolShapeError(`#${i + 1} ${toolName} 缺少有效 tool_call_id，已拒绝执行以避免状态变更无法回传。`);
                continue;
            }
            const validation = validateToolArguments(toolName, tool.function.arguments);
            if (!validation.ok) {
                pushToolReturnOrLocalError(tool, toolName, `错误：工具参数校验失败：${validation.error}`, i);
                tool.isResolved = true;
                continue;
            }
            const args = validation.args || {};

            if (toolName === 'request_skill_check' || toolName === 'push_skill_check') {
                if (!hasValidToolCallId(tool)) {
                    pushLocalToolShapeError(`#${i + 1} ${toolName} 缺少有效 tool_call_id，已忽略以避免无法回传检定结果。`);
                    tool.isResolved = true;
                    continue;
                }
                tool.target_name = args.target_name;
                tool.skill_name = args.skill_name;
                tool.isPushed = toolName === 'push_skill_check';
                if (tool.isPushed) {
                    tool.pushed_reason = args.pushed_reason;
                    tool.difficulty = args.difficulty || 'hard';
                }
                needsUserAction = true;
                continue;
            }

            if (!toolHandlers[toolName]) {
                pushToolReturnOrLocalError(tool, toolName, `错误：未知工具 ${toolName || '(空)'}`, i);
                tool.isResolved = true;
                continue;
            }

            const snapshot = makeToolSnapshot();
            let result;
            try {
                result = dispatchToolHandler(toolName, args);
            } catch (err) {
                restoreToolSnapshot(snapshot);
                CoCLog.error(`Tool handler failed: ${toolName}`, err);
                result = `工具执行失败：${toolName}（${err.message || err}）。本次工具状态已回滚。`;
            }

            if (typeof result === 'object' && result !== null && result.forceCheck) {
                pushToolReturnOrLocalError(tool, toolName, result.msg, i);
                let forceSkill = typeof result.forceCheck === 'object' ? result.forceCheck.skill : result.forceCheck;
                let forceTarget = (typeof result.forceCheck === 'object' ? result.forceCheck.target : null) || gameState.roster.find(r => r.isActive)?.name;
                aiMsg.tool_calls.push({ id: 'sys_force_' + Date.now(), type: 'function', function: { name: 'request_skill_check', arguments: JSON.stringify({ skill_name: forceSkill, target_name: forceTarget }) }, isResolved: false });
                needsUserAction = true;
            } else {
                pushToolReturnOrLocalError(tool, toolName, String(result ?? ''), i);
            }
            tool.isResolved = true;
        }
        if (!needsUserAction) aiMsg.isResolved = true;
        if (returns.length > 0) for (let r of returns) gameState.chatHistory.push(r);
        if (returns.length > 0 && !needsUserAction) await triggerAI(toolRound + 1);
    };

    /**
     * 执行技能检定（点击按钮触发）
     */
    const executeSkillCheck = async (tool, msg, skillName, targetName) => {
        try {
            let c = gameState.roster.find(r => r.name === targetName);
            if (!c) {
                tool.isResolved = true;
                gameState.chatHistory.push({ role: "tool", name: tool.function.name, tool_call_id: tool.id, content: `错误：找不到调查员【${targetName}】。请检查名称是否正确，或要求玩家先创建角色。` });
                if (msg.tool_calls.every(t => t.isResolved)) { msg.isResolved = true; await triggerAI((msg._toolRound || 0) + 1); }
                return;
            }
            tool.isResolved = true; 
            const checkDifficulty = tool.isPushed ? (tool.difficulty || 'hard') : 'normal';
            let res = Engine.checkSkill(skillName, c, checkDifficulty);
            const tv = res.targetValue ?? res.skillValue;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `【${c.name}】进行【${skillName}】检定${tool.isPushed ? '（推动·更高风险）' : ''}：骰出 ${res.rolledValue}/${tv}，${res.level}。` }); 
            addJournalEntry({ type: 'skill_check', charName: c.name, summary: `${skillName} 检定 ${res.level}（${res.rolledValue}/${tv}）${tool.isPushed ? ' [推动]' : ''}`, isSuccess: res.rolledValue <= tv });
            
            let toolResultSuffix = '';
            if (tool.isPushed && !res.success) {
                toolResultSuffix = res.level === '大失败'
                    ? ' 【引擎提示】推动检定大失败——须描写比初次失败更严重的不可逆后果（伤亡、暴露、物品损毁等）。'
                    : ' 【引擎提示】推动检定失败——须描写比初次失败更严峻的后果，不可轻描淡写。';
            }

            if (res.rolledValue <= res.skillValue) {
                if (!c.skillsUsedThisSession) c.skillsUsedThisSession = [];
                if (!c.skillsUsedThisSession.some(s => s.name === skillName)) {
                    c.skillsUsedThisSession.push({ name: skillName, currentValue: res.skillValue });
                }
            }

            const scenarioRunner = window.CoCScenarioRunner;
            const isScenarioCheck = msg._scenarioCheck || (scenarioRunner && scenarioRunner.isSkillCheckMessage && scenarioRunner.isSkillCheckMessage(msg));
            if (isScenarioCheck && scenarioRunner && scenarioRunner.onSkillCheckResult) {
                gameState.chatHistory.push({ role: "tool", name: tool.function.name, isHidden: true, tool_call_id: tool.id, content: `结果：${res.level}（${res.rolledValue}/${res.skillValue}）。${toolResultSuffix}` });
                if (msg.tool_calls.every(t => t.isResolved)) msg.isResolved = true;
                scenarioRunner.onSkillCheckResult(res.rolledValue <= res.skillValue, skillName);
                scrollToBottom();
                return;
            }
            
            gameState.chatHistory.push({ role: "tool", name: tool.function.name, isHidden: true, tool_call_id: tool.id, content: `结果：${res.level}（${res.rolledValue}/${res.skillValue}）。继续叙事，禁废话。${toolResultSuffix}` });
            if (msg.tool_calls.every(t => t.isResolved)) { msg.isResolved = true; await triggerAI((msg._toolRound || 0) + 1); }
        } catch(err) {
            CoCLog.error("executeSkillCheck Error:", err);
            tool.isResolved = true;
            if (msg.tool_calls.every(t => t.isResolved)) { msg.isResolved = true; }
        }
    };

    /**
     * Instantiate tool handlers by delegating to window.CoCToolHandlers.create().
     * Falls back to an empty object if the factory is unavailable.
     * @returns {Object} Map of toolName → handler function
     */
    const createToolHandlers = () => {
        const factory = (typeof window !== 'undefined' && window.CoCToolHandlers && typeof window.CoCToolHandlers.create === 'function')
            ? window.CoCToolHandlers.create
            : null;
        const handlers = factory ? factory(State, Engine) : {};
        if (!handlers || typeof handlers !== 'object') return {};
        return handlers;
    };
    const toolHandlers = createToolHandlers();
    const dispatchToolHandler = (toolName, args = {}) => {
        if (!toolHandlers[toolName]) throw new Error(`未知工具 ${toolName || '(空)'}`);
        return toolHandlers[toolName](args || {});
    };


    return { getSafeSkillName, moveToLocation, handlePlayerAction, executeSkillCheck, narrativeListener, triggerAI, processTools, validateToolArguments, buildAiToolDefinitions, dispatchToolHandler, getToolHandlers: () => toolHandlers, getToolCatalogNames: () => (window.CoCToolDefinitions && window.CoCToolDefinitions.getNames ? window.CoCToolDefinitions.getNames() : []), getRegisteredToolNames: () => Object.keys(toolHandlers) };
})(window.CoCState, window.CoCEngine);
