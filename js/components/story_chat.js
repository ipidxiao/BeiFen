// GENERATED from js/components/story_chat.mjs — do not edit; run: npm run build:js

window.StoryChat = {
    data() {
        return {
            _vStart: 0,
            _vSize: 30,
            _vHeights: [],
            _avgHeight: 120
        };
    },
    template: `
        <div class="d-flex flex-column flex-grow-1 overflow-hidden p-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h6 class="text-warning m-0 chat-location-header">📍 {{ gameState.currentLocation }}</h6>
                    <div v-if="scenarioModeLabel" class="badge mt-1 chat-mode-badge">{{ scenarioModeLabel }}</div>
                </div>
                <div><button class="btn btn-outline-info btn-sm" @click="showModal('map')">🗺️ 地图</button></div>
            </div>
            
            <div class="chat-box mb-2 flex-grow-1 border border-secondary" ref="chatBox" @scroll="onChatScroll" id="chatContainer" aria-live="polite" aria-atomic="false">
                <div :style="{ height: topSpacer + 'px' }"></div>
                <div v-for="msg in visibleMessages" :key="msg._vid || 0" class="chat-msg">
                    <div v-if="msg.role === 'system' && !msg.isHidden" :class="{'madness-msg': msg.isMadness, 'alert-msg': msg.isAlert, 'sys-msg': !msg.isMadness && !msg.isAlert}">
                        <strong v-if="!msg.isAlert">[系统]</strong> <span class="chat-content">{{ formatChatContent(msg) }}</span>
                    </div>
                    <div v-else-if="msg.role === 'user' && !msg.isHidden" class="user-msg"><strong>[玩家]</strong> {{ msg.content }}</div>
                    <div v-else-if="msg.role === 'assistant' && msg.content" class="kp-msg"><strong>[守秘人]</strong> <span class="chat-content">{{ msg.content }}</span></div>
                    
                    <div v-if="msg.tool_calls && !msg.isResolved" class="p-3 mt-2 border-start border-warning bg-dark rounded shadow-sm chat-pending-check">
                        <strong class="text-warning fs-6">【系统判定待处理】</strong><br>
                        <div v-for="tool in msg.tool_calls" :key="tool.id">
                            <div v-if="tool && tool.function && (tool.function.name === 'request_skill_check' || tool.function.name === 'push_skill_check') && !tool.isResolved" class="mt-2 text-light">
                                👉 命运时刻：<b>{{ tool.target_name || '调查员' }}</b> 请进行 <b>{{ getSafeSkillName(tool) }}</b> 检定<span v-if="tool.isPushed">（推动·更高风险）</span>。
                            </div>
                        </div>
                    </div>
                </div>
                <div :style="{ height: bottomSpacer + 'px' }"></div>
                <div v-if="gameState.isLoading" class="chat-loading">守秘人正在推演中...</div>
            </div>
            
            <div v-if="getPendingCheck()" class="d-grid mb-1">
                <button class="btn btn-warning fw-bold py-3 fs-5" style="box-shadow: 0 0 15px rgba(240, 173, 78, 0.4); border: 2px solid #ffda6a;" @click="executeSkillCheck(getPendingCheck().tool, getPendingCheck().msg, getSafeSkillName(getPendingCheck().tool), getPendingCheck().tool.target_name)">
                    🎲 {{ getPendingCheck().tool.target_name || '调查员' }} 掷骰：【{{ getSafeSkillName(getPendingCheck().tool) }}】
                </button>
            </div>
            <div v-else-if="scenarioChoices.length" class="mb-2 d-flex flex-column gap-1">
                <button v-for="ch in scenarioChoices" :key="ch.id" class="btn btn-outline-warning btn-sm text-start" @click="pickScenarioChoice(ch.id)" :disabled="gameState.isLoading">
                    ▸ {{ ch.label }}
                </button>
            </div>
            <div v-else class="input-group mb-1">
                <button class="btn btn-outline-secondary fw-bold" @click="$emit('switch-tab', 'character')">👥</button>
                <input type="text" class="form-control bg-dark text-light border-secondary" v-model="playerInput" @keyup.enter="handlePlayerAction" :disabled="gameState.isLoading" :placeholder="scenarioChoices.length ? '或输入与选项一致的文字…' : '你要做什么？'">
                <button class="btn btn-warning fw-bold" @click="handlePlayerAction" :disabled="gameState.isLoading">发送</button>
            </div>
        </div>
    `,
    computed: {
        totalMsgs() {
            const h = this.gameState?.chatHistory;
            return h ? h.length : 0;
        },
        visibleMessages() {
            const h = this.gameState?.chatHistory;
            if (!h || h.length === 0) return [];
            const end = Math.min(this._vStart + this._vSize, h.length);
            return h.slice(this._vStart, end);
        },
        topSpacer() {
            return this._spacerBefore(this._vStart);
        },
        bottomSpacer() {
            const end = Math.min(this._vStart + this._vSize, this.totalMsgs);
            return this._spacerBefore(this.totalMsgs) - this._spacerBefore(end);
        },
        scenarioChoices() {
            return this.gameState?.scenarioRunner?.choices || [];
        },
        scenarioModeLabel() {
            const r = window.CoCScenarioRunner;
            return r && r.getModeLabel ? r.getModeLabel() : null;
        }
    },
    methods: {
        _heightAt(index) {
            const h = this._vHeights[index];
            return (h && h > 0) ? h : this._avgHeight;
        },
        _spacerBefore(index) {
            let sum = 0;
            const limit = Math.max(0, Math.min(index, this.totalMsgs));
            for (let i = 0; i < limit; i++) sum += this._heightAt(i);
            return sum;
        },
        onChatScroll() {
            const box = this.$refs.chatBox;
            if (!box) return;
            const scrollTop = box.scrollTop;
            if (this._vHeights.length >= this.totalMsgs && this.totalMsgs > 0) {
                let acc = 0;
                let newStart = 0;
                for (let i = 0; i < this.totalMsgs; i++) {
                    const h = this._heightAt(i);
                    if (acc + h > scrollTop) {
                        newStart = Math.max(0, i - 5);
                        break;
                    }
                    acc += h;
                    newStart = Math.max(0, i - 4);
                }
                if (Math.abs(newStart - this._vStart) > 3) this._vStart = newStart;
                return;
            }
            const newStart = Math.max(0, Math.floor(scrollTop / this._avgHeight) - 5);
            if (Math.abs(newStart - this._vStart) > 3) {
                this._vStart = newStart;
            }
        },
        scrollChatToBottom() {
            this.$nextTick(() => {
                const box = this.$refs.chatBox;
                if (!box) return;
                const h = this.gameState?.chatHistory;
                if (h) {
                    this._vStart = Math.max(0, h.length - this._vSize);
                }
                this.$nextTick(() => {
                    if (box) box.scrollTop = box.scrollHeight;
                });
            });
        },
        pickScenarioChoice(choiceId) {
            if (window.CoCScenarioRunner && window.CoCScenarioRunner.selectChoice) {
                window.CoCScenarioRunner.selectChoice(choiceId);
            }
        },
        formatChatContent(msg) {
            return formatChatContentHelper(msg);
        }
    },
    mounted() {
        this.scrollChatToBottom();
    },
    updated() {
        this.$nextTick(() => {
            const box = this.$refs.chatBox;
            if (!box) return;
            const nodes = box.querySelectorAll('.chat-msg');
            nodes.forEach((el, i) => {
                const idx = this._vStart + i;
                if (idx < this.totalMsgs && el.offsetHeight > 0) {
                    this._vHeights[idx] = el.offsetHeight;
                }
            });
        });
    },
    setup(props, context) {
        const state = window.CoCState;
        const ai = window.CoCAI;
        const gameState = state.gameState;

        // Override the global scrollToBottom to use virtual scroll
        const origScroll = state.scrollToBottom;
        state.scrollToBottom = () => {
            // This is called after AI responses. Use nextTick to let Vue render first.
            setTimeout(() => {
                const instance = context?.exposed || {};
                if (instance.scrollChatToBottom) instance.scrollChatToBottom();
            }, 50);
        };
        
        const getPendingCheck = () => {
            const history = gameState.chatHistory;
            for (let i = history.length - 1; i >= 0; i--) {
                const msg = history[i];
                if (msg.role === 'user') break;
                if (msg.role === 'assistant' && msg.tool_calls && !msg.isResolved) {
                    const tool = msg.tool_calls.find(t => t && t.function && (t.function.name === 'request_skill_check' || t.function.name === 'push_skill_check') && !t.isResolved);
                    if (tool) return { tool, msg };
                }
            }
            return null;
        };
        
        return Object.assign({ getPendingCheck, gameState }, state, ai);
    }
};
