/**
 * Local Scenario Runner — offline narrative driver parallel to AI KP.
 * Uses structured scenario nodes: narrative, choices, skill checks, effects.
 */
import { CoCLog } from '../data/logger.mjs';

export const CoCScenarioRunner = (function (State, Engine, Store) {
    if (!State || !Store) return {};

    const Catalog = Store;

    const { gameState, scrollToBottom, addJournalEntry, addClue, createMap, setPosition, addNpc } = State;

    const defaultRunner = () => ({
        active: false,
        scenarioId: null,
        scenarioTitle: '',
        currentNodeId: null,
        choices: [],
        ended: false,
        flags: {},
        pendingBranch: null
    });

    const ensureRunner = () => {
        if (!gameState.scenarioRunner) gameState.scenarioRunner = defaultRunner();
        return gameState.scenarioRunner;
    };

    const getScenario = () => {
        const r = ensureRunner();
        return r.scenarioId ? Store.getScenario(r.scenarioId) : null;
    };

    const getNode = (nodeId) => {
        const scenario = getScenario();
        if (!scenario || !nodeId) return null;
        return scenario.nodes[nodeId] || null;
    };

    const pushKp = (text) => {
        if (!text) return;
        gameState.chatHistory.push({ role: 'assistant', content: String(text), _scenario: true });
        scrollToBottom();
    };

    const pushSystem = (text, opts = {}) => {
        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, ...opts, content: text });
        scrollToBottom();
    };

    const setChoices = (choices) => {
        const r = ensureRunner();
        r.choices = Array.isArray(choices) ? choices.filter((c) => c && c.label) : [];
    };

    const hasClueOrItem = (runner) => {
        const clues = gameState.clueBoard?.clues || [];
        const inv = gameState.inventory || [];
        const hasBadge = clues.some((c) => c.id === 'dos_badge') || inv.some((i) => String(i.name || i).includes('工牌'));
        const hasArticle = clues.some((c) => c.id === 'dos_article');
        return hasBadge || hasArticle;
    };

    const checkRequires = (choice) => {
        if (!choice.requiresFlag) return true;
        const r = ensureRunner();
        if (choice.requiresFlag === 'has_badge_or_article') {
            if (hasClueOrItem(r)) {
                r.flags.has_badge_or_article = true;
                return true;
            }
            pushSystem('⚠️ 你缺少进入凭据（码头工牌或记者稿件）。试试旅馆或老渔夫路线。', { isAlert: true });
            return false;
        }
        return !!r.flags[choice.requiresFlag];
    };

    const applyEffects = (effects) => {
        if (!effects || typeof effects !== 'object') return;
        if (effects.location) {
            gameState.currentLocation = effects.location;
            if (!gameState.knownLocations.includes(effects.location)) {
                gameState.knownLocations.push(effects.location);
            }
        }
        if (effects.mapRoom && gameState.sceneMap?.rooms?.length) {
            const room = gameState.sceneMap.rooms.find((rm) => rm.id === effects.mapRoom);
            if (room && setPosition) setPosition(room.id);
        }
        if (effects.atmosphere) Object.assign(gameState.atmosphere, effects.atmosphere);
        if (effects.journal && addJournalEntry) {
            addJournalEntry({ type: 'scenario', summary: effects.journal });
        }
        (effects.clues || []).forEach((c) => {
            if (addClue) addClue(c.id, c.title, c.content, c.type);
        });
        (effects.items || []).forEach((it) => {
            const name = it.name || it;
            const qty = it.qty || 1;
            for (let i = 0; i < qty; i++) {
                gameState.inventory.push(typeof it === 'string' ? { name: it, qty: 1 } : { ...it, name, qty: 1 });
            }
            pushSystem(`🎒 [剧本] 获得物品：${name}${qty > 1 ? ' ×' + qty : ''}`);
        });
        if (effects.san && gameState.roster.length) {
            const active = gameState.roster.find((c) => c.isActive) || gameState.roster[0];
            if (active) {
                const loss = Number(effects.san) || 0;
                if (Engine?.SanityEngine?.applySanLoss) {
                    Engine.SanityEngine.applySanLoss(active, loss, '剧本事件');
                } else if (active.sanity != null) {
                    active.sanity = Math.max(0, active.sanity - loss);
                } else if (active.derived?.sanity != null) {
                    active.derived.sanity = Math.max(0, active.derived.sanity - loss);
                }
                pushSystem(`🧠 [SAN] ${active.name} 理智值 -${loss}`);
            }
        }
        (effects.npcs || []).forEach((n) => {
            if (addNpc) addNpc({ name: n.name, description: n.description || '', relation: n.attitude || '未知' });
        });
        if (effects.map && createMap) {
            createMap(effects.map.title || '场景地图', effects.map.rooms || []);
            if (effects.map.currentRoomId && setPosition) setPosition(effects.map.currentRoomId);
        }
    };

    const applySetup = (setup) => {
        if (!setup) return;
        applyEffects(setup);
        if (setup.map && createMap) {
            createMap(setup.map.title, setup.map.rooms);
            if (setup.map.currentRoomId && setPosition) setPosition(setup.map.currentRoomId);
        }
    };

    const resolveBranch = (node, success) => {
        const branch = node.branch || {};
        const nextId = success ? (branch.success || branch.onSuccess) : (branch.failure || branch.onFailure);
        if (nextId) goToNode(nextId);
        else pushSystem('⚠️ [剧本] 分支节点缺少后续定义。', { isAlert: true });
    };

    const queueSkillCheck = (checkConfig, branchNode) => {
        const skill = checkConfig.skill || checkConfig.skill_name || '侦查';
        const target = checkConfig.target
            || checkConfig.target_name
            || gameState.roster.find((c) => c.isActive)?.name
            || gameState.roster[0]?.name
            || '调查员';

        const toolId = 'scenario_check_' + Date.now();
        const msg = {
            role: 'assistant',
            content: `请进行【${skill}】检定。`,
            tool_calls: [{
                id: toolId,
                type: 'function',
                function: {
                    name: 'request_skill_check',
                    arguments: JSON.stringify({ skill_name: skill, target_name: target })
                },
                isResolved: false,
                target_name: target,
                skill_name: skill
            }],
            isResolved: false,
            _scenarioCheck: true,
            _branchNode: branchNode?.id || ensureRunner().currentNodeId
        };
        gameState.chatHistory.push(msg);
        ensureRunner().pendingBranch = { nodeId: msg._branchNode, skill, target };
        scrollToBottom();
    };

    const goToNode = (nodeId) => {
        const r = ensureRunner();
        const node = getNode(nodeId);
        if (!node) {
            pushSystem(`⚠️ [剧本] 找不到节点「${nodeId}」。`, { isAlert: true });
            return false;
        }

        r.currentNodeId = nodeId;
        r.pendingBranch = null;

        if (node.effects) applyEffects(node.effects);
        if (node.narrative) pushKp(node.narrative);

        if (node.end) {
            r.ended = true;
            r.choices = [];
            pushSystem('📜 [本地剧本] 本段剧情已结束。可导出存档或返回大厅选择其他剧本。');
            return true;
        }

        if (node.branch && !node.choices) {
            resolveBranch(node, true);
            return true;
        }

        if (node.choices && node.choices.length) {
            setChoices(node.choices.map((c) => ({
                id: c.id || c.label,
                label: c.label,
                next: c.next,
                skillCheck: c.skillCheck || null,
                effects: c.effects || null,
                requiresFlag: c.requiresFlag || null
            })));
            return true;
        }

        r.choices = [];
        return true;
    };

    const startScenario = (scenarioId) => {
        if (!Store.isAvailable(scenarioId)) {
            CoCLog.error('Scenario not available locally', scenarioId);
            return false;
        }
        const scenario = Store.getScenario(scenarioId);
        const validation = Store.validate(scenario);
        if (!validation.ok) {
            CoCLog.error('Scenario validation failed', validation.errors);
            return false;
        }

        gameState.scenarioRunner = defaultRunner();
        const r = ensureRunner();
        r.active = true;
        r.scenarioId = scenarioId;
        r.scenarioTitle = scenario.title;

        const sysPrompt = gameState.chatHistory.find((m) => m.role === 'system' && m.isHidden);
        gameState.chatHistory.splice(0, gameState.chatHistory.length);
        if (sysPrompt) gameState.chatHistory.push(sysPrompt);

        pushSystem(`📜 [本地剧本模式] 已载入「${scenario.title}」— 完全离线，由内置剧本驱动。`);
        if (scenario.initialLocation) gameState.currentLocation = scenario.initialLocation;
        applySetup(scenario.setup);
        goToNode(scenario.startNode);
        return true;
    };

    const stopScenario = () => {
        gameState.scenarioRunner = defaultRunner();
        setChoices([]);
    };

    const selectChoice = (choiceId) => {
        const r = ensureRunner();
        if (!r.active || r.ended) return false;
        const choice = r.choices.find((c) => c.id === choiceId);
        if (!choice) return false;
        if (!checkRequires(choice)) return false;

        pushSystem(`▸ [行动] ${choice.label}`, { isLocalOnly: true });
        if (choice.effects) applyEffects(choice.effects);

        if (choice.skillCheck) {
            r.pendingBranch = { nextNode: choice.next, fromChoice: choice.id };
            queueSkillCheck(choice.skillCheck, getNode(r.currentNodeId));
            setChoices([]);
            return true;
        }

        setChoices([]);
        if (choice.next) goToNode(choice.next);
        return true;
    };

    const matchChoiceFromText = (text) => {
        const r = ensureRunner();
        if (!r.choices.length) return null;
        const t = text.trim().toLowerCase();
        for (const c of r.choices) {
            const label = (c.label || '').toLowerCase();
            if (t === label || t.includes(label) || label.includes(t)) return c;
        }
        for (const c of r.choices) {
            const id = (c.id || '').toLowerCase();
            if (id && (t === id || t.includes(id))) return c;
        }
        return null;
    };

    const handleInput = (text) => {
        const r = ensureRunner();
        if (!r.active || r.ended) return false;
        const trimmed = String(text || '').trim();
        if (!trimmed) return false;

        gameState.chatHistory.push({ role: 'user', content: trimmed });
        clearPlayerInput();

        const matched = matchChoiceFromText(trimmed);
        if (matched) {
            selectChoice(matched.id);
            return true;
        }

        pushKp('（本地剧本）请从下方选项中选择行动，或输入与选项完全一致的简短指令。自由探索需切换至 AI 守秘人模式（在线）。');
        scrollToBottom();
        return true;
    };

    const clearPlayerInput = () => {
        if (State.playerInput && typeof State.playerInput === 'object' && 'value' in State.playerInput) {
            State.playerInput.value = '';
        }
    };

    const onSkillCheckResult = (success, skillName) => {
        const r = ensureRunner();
        if (!r.active) return false;

        const pending = r.pendingBranch;
        r.pendingBranch = null;

        if (pending?.nextNode) {
            const branchNode = getNode(pending.nextNode);
            if (branchNode) {
                if (branchNode.narrative) pushKp(branchNode.narrative);
                if (branchNode.effects) applyEffects(branchNode.effects);
                if (branchNode.branch) {
                    resolveBranch(branchNode, success);
                    return true;
                }
                if (branchNode.end) {
                    r.currentNodeId = pending.nextNode;
                    r.ended = true;
                    r.choices = [];
                    pushSystem('📜 [本地剧本] 本段剧情已结束。');
                    return true;
                }
                goToNode(pending.nextNode);
                return true;
            }
        }

        const node = getNode(r.currentNodeId);
        if (node?.branch) {
            resolveBranch(node, success);
            return true;
        }

        pushSystem(`【${skillName}】检定${success ? '成功' : '失败'}。继续探索。`);
        return true;
    };

    const isSkillCheckMessage = (msg) => !!(msg && msg._scenarioCheck);

    const isActive = () => {
        const r = ensureRunner();
        return !!(r.active && !r.ended);
    };

    const getModeLabel = () => {
        const r = ensureRunner();
        if (!r.active) return null;
        return r.ended ? `📜 本地剧本·已完结「${r.scenarioTitle}」` : `📜 本地剧本「${r.scenarioTitle}」`;
    };

    return {
        startScenario,
        stopScenario,
        selectChoice,
        handleInput,
        onSkillCheckResult,
        isSkillCheckMessage,
        isActive,
        getModeLabel,
        goToNode,
        getScenario,
        ensureRunner
    };
})(window.CoCState, window.CoCEngine, window.CoCScenarioStore || window.CoCScenarioCatalog);
