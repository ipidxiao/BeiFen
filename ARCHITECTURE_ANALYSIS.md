# 🔄 CoC 7th Engine 运行时架构分析

> 分析日期: 2026-07-02 | 版本: V17.1 | 代码库: `coc_merged`

---

## 1. 事件流: 完整数据流图

```
┌──────────────────────────────────────────────────────────────────────┐
│                          用户操作层 (DOM)                             │
│  index.html → <view-story> → <story-chat> 输入框                     │
└─────────────┬────────────────────────────────────────────────────────┘
              │ @keyup.enter / @click="handlePlayerAction"
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  StoryChat 组件 (story_chat.js/.mjs)                                 │
│  setup() { return { ...window.CoCState, ...window.CoCAI } }         │
│  直接调用: ai.handlePlayerAction()                                   │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ai_logic.mjs → CoCAI.handlePlayerAction()                          │
│  1. 防重入检查 (gameState.isLoading)                                  │
│  2. 待处理技能检定检查 (hasPending)                                    │
│  3. push user message → gameState.chatHistory                        │
│  4. 调用 triggerAI()                                                 │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ai_logic.mjs → CoCAI.triggerAI(toolRound=0)                        │
│  1. MAX_TOOL_ROUNDS (10) 防护                                        │
│  2. buildAiToolDefinitions() ← tool_dispatch.mjs                    │
│  3. CoCContextManager.buildApiMessages() ← context_manager.mjs      │
│  4. 注入小队状态 + 系统铁律 (10条) 到 user message                     │
│  5. fetchAiCompletionWithRetry() ← network.mjs                      │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ai/network.mjs → fetchAiCompletionWithRetry()                      │
│  ├─ fetchWithTimeout (AbortController, 30s)                         │
│  ├─ isRetryableAiError (AbortError/408/409/425/429/5xx/TypeError)  │
│  ├─ getAiRetryBackoffMs [0, 800, 1600]ms                            │
│  └─ 最多 3 次尝试, 失败抛异常                                         │
│                                                                      │
│  HTTP POST → https://api.deepseek.com/chat/completions              │
└─────────────┬───────────────────────────────────────────────────────┘
              │ AI Response (JSON)
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  triggerAI() 继续:                                                    │
│  1. push assistant message → chatHistory                            │
│  2. narrativeListener() 扫描文本触发自动系统更新                       │
│  3. aiMsg.tool_calls ? → processTools(aiMsg, toolRound)             │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ai_logic.mjs → processTools(aiMsg, toolRound)                      │
│  for each tool_call:                                                 │
│    1. validateToolArguments() ← tool_dispatch.mjs                   │
│       ├─ parseToolArguments (JSON.parse)                            │
│       ├─ normalizeToolValue (type coercion, length caps, enum)      │
│       └─ schema lookup from CoCToolDefinitions                      │
│    2. request_skill_check? → needsUserAction=true, 暂停循环          │
│    3. dispatchToolHandler(toolName, args)                           │
│       ├─ makeToolSnapshot() (JSON深拷贝快照)                          │
│       ├─ toolHandlers[toolName](args)                               │
│       └─ 失败→ restoreToolSnapshot() 回滚                            │
│    4. push tool return → chatHistory                                │
│  if !needsUserAction → await triggerAI(toolRound+1) 循环             │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  tools/handlers/*.mjs → 领域处理器                                    │
│  character | inventory | dice | clues | map | combat | npc |        │
│  mythos | system                                                     │
│                                                                      │
│  每个 handler: (args) → 直接修改 gameState → 返回结果字符串            │
│  典型: update_inventory(args) → gameState.inventory.push(item)      │
│        start_combat(args) → gameState.combat.active = true          │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Vue 响应式系统 → UI 自动更新                                         │
│  gameState (reactive) 变化 → 所有依赖组件重新渲染                      │
│  story_chat / story_char / story_inv / story_combat / ...           │
└─────────────────────────────────────────────────────────────────────┘

                  ┌─────────── 技能检定分支 ───────────┐
                  │  request_skill_check → needsUserAction=true │
                  │  → 大按钮出现 (getPendingCheck)             │
                  │  → 用户点击 → executeSkillCheck()          │
                  │  → Engine.checkSkill() → push result       │
                  │  → triggerAI(toolRound+1) 继续             │
                  └──────────────────────────────────────────┘
```

---

## 2. 状态管理: 模块职责边界

```
┌──────────────────────────────────────────────────────────────┐
│  js/state/state.mjs  (统一入口, 工厂函数)                      │
│  ├─ 组装 4 个子模块 → 合并公共 API                             │
│  ├─ 3 个 Vue.watch (自动存档/聊天压缩/角色清理)                 │
│  └─ 返回 window.CoCState                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ core.mjs ────────────────────────────────────────────┐  │
│  │ 职责: 响应式数据定义 + 基础导航                           │  │
│  │                                                         │  │
│  │ gameState (reactive):                                   │  │
│  │   currentScreen, activeModuleId, roster, chatHistory,  │  │
│  │   activeModal, currentLocation, knownLocations,        │  │
│  │   inventory, storage, journalLog, npcRegistry,         │  │
│  │   combat, sceneMap, clueBoard, diceHistory,            │  │
│  │   aiSettings (含 apiKey), atmosphere,                  │  │
│  │   selectedCharIndex, ui.toasts, ui.confirmDialog,      │  │
│  │   storageStatus                                        │  │
│  │                                                         │  │
│  │ draftChar (reactive):                                   │  │
│  │   name, job, age, attrs{9项}, derived{7项},            │  │
│  │   status{3项}, skillAllocations, backstory{9项}        │  │
│  │                                                         │  │
│  │ playerInput (ref), activeCreatorTab (ref)               │  │
│  │                                                         │  │
│  │ 方法: scrollToBottom, switchScreen, showModal,          │  │
│  │       closeModal, addJournalEntry                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ ui.mjs ──────────────────────────────────────────────┐  │
│  │ 职责: 非阻塞反馈 (Toast/Confirm) + 聊天压缩              │  │
│  │                                                         │  │
│  │ showToast/confirmAction/resolveConfirm                  │  │
│  │ compactChatHistory → 委托 CoCContextManager            │  │
│  │ _safeLocalStorageSetItem (QuotaExceededError 处理)     │  │
│  │ saveSettings, formatText                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ gameplay.mjs ────────────────────────────────────────┐  │
│  │ 职责: 游戏机制突变 (战斗/骰子/线索/地图/成长/NPC)        │  │
│  │                                                         │  │
│  │ Combat: startCombat, endCombat, updateEnemy,           │  │
│  │         advanceTurn, cleanupInitiativeOrder            │  │
│  │ Clues:  addClue, linkClues, markClueStatus,            │  │
│  │         clearClueBoard                                 │  │
│  │ Map:    createMap, updateRoom, setPosition             │  │
│  │ Dice:   rollCustomDice, groupRoll                      │  │
│  │ NPC:    addNpc, updateNpcStatus, addNpcNote            │  │
│  │ Growth: rollImprovement, rollEduImprovement,           │  │
│  │         applyAging, clearSessionSkills                 │  │
│  │ Character: removeCharacterAt                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ persistence.mjs ─────────────────────────────────────┐  │
│  │ 职责: 存档/读档/迁移/模组管理/存储估算                    │  │
│  │                                                         │  │
│  │ Save/Load: saveGame, loadGame, deleteSave,             │  │
│  │            getSaveSlots, getAutoSave                   │  │
│  │ Import/Export: exportGame, importGame                  │  │
│  │ Modules: getModules, createModule, renameModule,       │  │
│  │          deleteModule, enterModule                     │  │
│  │ Migration: migrateSaveData (v1→v7 schema)             │  │
│  │ Storage: getStorageStatus, formatStorageBytes          │  │
│  │ IndexedDB: _idbSave/_idbLoad (fire-and-forget)        │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**职责边界评估**: ✅ 清晰分离。Core 管数据形状，UI 管反馈，Gameplay 管规则突变，Persistence 管序列化。唯一的交叉是 persistence 依赖 uiMod 的 `showToast` 和 `_safeLocalStorageSetItem`。

---

## 3. AI调度链路

```
ai_logic.mjs                     network.mjs              tool_dispatch.mjs
┌──────────────────┐          ┌──────────────────┐       ┌──────────────────────┐
│ CoCAI             │          │ fetchWithTimeout │       │ buildAiToolDefinitions│
│ ├─ handlePlayer   │──HTTP──▶│ (30s Abort)      │       │ validateToolArguments │
│ │  Action()       │          │                  │       │ normalizeToolValue    │
│ ├─ triggerAI()    │          │ fetchAiCompletion│       │ sanitizeToolCallsForApi│
│ │  ├─ buildTools  │◀──resp──│ WithRetry()      │       │ hasValidToolCallId    │
│ │  ├─ buildMsgs   │          │ ┌─ retry 3次     │       │ getToolArgumentSchema │
│ │  ├─ fetch       │          │ ├─ backoff[0,    │       └──────┬───────────────┘
│ │  ├─ narrative   │          │ │  800,1600]ms   │              │
│ │  │  Listener    │          │ └─ 4xx不重试     │              ▼
│ │  └─ processTools│          └──────────────────┘    handlers/index.mjs
│ │     ├─ validate │                                  ┌──────────────────────┐
│ │     ├─ dispatch │──▶toolHandlers[toolName](args)──▶│ CoCToolHandlers      │
│ │     │  snapshot │                                  │  .create(State,Eng) │
│ │     │  rollback │                                  │  ├─ character       │
│ │     └─ recurse  │                                  │  ├─ inventory       │
│ └──────────────────┘                                  │  ├─ dice            │
│ executeSkillCheck()                                   │  ├─ clues           │
│   (用户点击骰子按钮后)                                   │  ├─ map             │
│   → Engine.checkSkill()                               │  ├─ combat          │
│   → triggerAI(toolRound+1)                            │  ├─ npc             │
│                                                       │  ├─ mythos          │
│                                                       │  └─ system          │
│                                                       └──────────────────────┘
```

**关键机制**:
- **Snapshot/Rollback**: `makeToolSnapshot()` 和 `restoreToolSnapshot()` 实现工具调用的事务性（JSON深拷贝）
- **narrativeListener**: 在 AI 文本中扫描关键词，自动触发 `add_clue`, `set_position` 等静默更新
- **MAX_TOOL_ROUNDS=10**: 防止 AI 无限循环调用工具
- **系统铁律注入**: 每次 user message 后追加 10 条铁律 + 小队状态，确保 AI 遵守规则

---

## 4. 组件通信模式

```
                       index.html (Vue App Root)
                       setup() → { ...window.CoCState, ...window.CoCAI }
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                    ▼
        view-lobby       view-creator         view-story
       (lobby_view.js)  (creator_view.js)    (story_view.mjs)
                                                   │
                          ┌────────────────────────┼──────────────────────┐
                          │ props/events          │ 全局引用              │
                          ▼                       ▼                      │
                   ┌──────────────┐    story-chat, story-char,          │
                   │CocToastLayer │    story-inv, story-store,          │
                   │ :toasts=     │    story-journal, story-npc,        │
                   │  gameState   │    story-combat, story-growth,      │
                   │  .ui.toasts  │    story-map, story-clues,          │
                   ├──────────────┤    story-dice                       │
                   │CocConfirm    │                                     │
                   │Dialog        │    每个组件 setup() 中:              │
                   │ :dialog=     │    const state = window.CoCState;   │
                   │  gameState   │    const ai = window.CoCAI;         │
                   │  .ui.confirm │    return { ...state, ...ai };      │
                   │  Dialog      │                                     │
                   └──────────────┘                                     │
```

**模式总结**:

| 模式 | 使用场景 | 示例 |
|------|---------|------|
| 全局引用 `window.CoCState` | 所有子组件读取/写入状态 | `const state = window.CoCState` |
| 全局引用 `window.CoCAI` | 子组件调用 AI 方法 | `ai.handlePlayerAction()` |
| Props 传递 | Toast/Confirm 等纯展示组件 | `:toasts="gameState.ui.toasts"` |
| Events 发射 | 子→父跨 Tab 切换 | `@switch-tab="activeStoryTab = $event"` |
| v-if 条件渲染 | View 级别切换 | `v-if="activeStoryTab === 'chat'"` |
| `window.*` 赋值注册 | IIFE 组件自动注册 | `window.StoryChat = { template, setup }` |
| `$emit` | 子组件通知父组件 | `this.$emit('switch-tab', 'character')` |

---

## 5. 持久化: localStorage + IndexedDB 双写架构

```
saveGame(slotKey, slotName)
│
├─ 1. compactChatHistory('save')      ← CoCContextManager.trimForSave()
├─ 2. _buildSaveData(slotName)        ← 序列化 gameState 为 {version:7, data:{...}}
├─ 3. getStorageStatus(slotKey, ...)   ← 估算存储空间, 更新 gameState.storageStatus
├─ 4. _safeLocalStorageSetItem(key, payload)  ← PRIMARY: localStorage 同步写入
│      └─ QuotaExceededError → showToast + _pushSystemNotice
└─ 5. _idbSave(key, payload)          ← SECONDARY: IndexedDB 异步写入 (fire-and-forget)
       └─ 失败 → showToast('IndexedDB 持久化失败（不影响游戏）')

loadGame(slotKey)
│
└─ localStorage.getItem(prefix + slotKey)
   → migrateSaveData(safeJsonParse(raw))
   → _restoreFromData(save)
      ├─ 清空所有 gameState 数组
      ├─ 重新填充 roster/inventory/chatHistory/...
      ├─ Object.assign(combat/sceneMap/clueBoard/atmosphere)
      └─ compactChatHistory('load')

IndexedDB 读路径:
  _idbLoad(slotKey)  ← 当前从未被调用！
  仅作为写入镜像存在, 无读取回退逻辑
```

**schema 版本**: `SAVE_SCHEMA_VERSION = 7`

**migrateSaveData** 支持 v1→v7 平滑迁移:
- 扁平结构 → 嵌套 `data.{}` 包装
- Enemy ID 规范化 (`enemy_migrated_{idx}_{name}`)
- InitiativeOrder 修复 (isEnemy 标记对齐)
- Chat history trimming via `CoCContextManager.trimForSave()`

---

## 6. ESM vs IIFE: 双轨加载路径

```
┌─────────────────── IIFE 路径 (.js) ───────────────────┐
│  index.html 实际使用的路径                               │
│                                                         │
│  <script src="./js/data/jobs.js">       ← window.CoCJobs │
│  <script src="./js/data/skills.js">     ← window.CoCBaseSkills │
│  <script src="./js/coc.js">             ← window.CoCEngine │
│  <script src="./js/core/context_manager.js"> ← window.CoCContextManager │
│  <script src="./js/tools/definitions.js">    ← window.CoCToolDefinitions │
│  <script src="./js/state/core.js">      ← window.CoCStateCore │
│  <script src="./js/state/ui.js">        ← window.CoCStateUI │
│  <script src="./js/state/gameplay.js">  ← window.CoCStateGameplay │
│  <script src="./js/state/persistence.js"> ← window.CoCStatePersistence │
│  <script src="./js/state.js">           ← window.CoCState (工厂) │
│  <script src="./js/tools/handlers/*.js"> ← window.CoCToolHandlerModules │
│  <script src="./js/ai/network.js">      ← window.fetchAiCompletionWithRetry │
│  <script src="./js/ai/tool_dispatch.js"> ← window.CoCToolHandlers (??) │
│  <script src="./js/ai_logic.js">        ← window.CoCAI │
│  <script src="./js/components/*.js">    ← window.StoryChat/etc │
│  <script src="./js/views/*.js">         ← window.ViewLobby/etc │
│  <script src="./js/app.js">             ← createApp + mount('#app') │
│                                                         │
│  机制: 每个文件通过 window.X = Y IIFE 暴露全局变量       │
│  加载顺序: 严格依赖 <script> 标签顺序                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────── ESM 路径 (.mjs) ────────────────────┐
│  app.mjs 定义的替代入口 (当前未使用！)                     │
│                                                         │
│  import { CoCEngine } from './coc.mjs'                  │
│  import { CoCStateCore } from './state/core.mjs'        │
│  import { CoCStateUI } from './state/ui.mjs'            │
│  import { CoCStateGameplay } from './state/gameplay.mjs'│
│  import { CoCStatePersistence } from './state/persistence.mjs' │
│  import { CoCState } from './state/state.mjs'           │
│  import { CoCAI } from './ai_logic.mjs'                 │
│                                                         │
│  // Backward-compat: 仍然暴露到 window.*                 │
│  window.CoCState = CoCState;                            │
│  window.CoCAI = CoCAI;                                  │
│  ...                                                    │
│                                                         │
│  机制: ES Module import/export, tree-shakable           │
│  加载: <script type="module" src="./js/app.mjs">        │
│         (index.html 中没有此标签！)                       │
└─────────────────────────────────────────────────────────┘
```

### 🔴 双轨风险清单

| 风险 | 严重度 | 描述 |
|------|--------|------|
| **代码不同步** | 🔴 高 | .js 和 .mjs 文件内容可能不同。例如 `coc.js` (1665行) vs `coc.mjs` (881行)，.js 版本有额外的逻辑 |
| **`.js` 未定义导出** | 🟡 中 | `context_manager.js` 使用 `window.CoCContextManager = (function(){...})()` 但 `context_manager.mjs` 使用 `export { CoCContextManager }`。组件通过 `window.CoCContextManager` 访问，如果未来切换到 ESM 且忘记暴露 window，会静默失败 |
| **`.mjs` 路由未测试** | 🟡 中 | `app.mjs` 导入组件使用 `window.ViewLobby` 等，但这些变量仅在 IIFE `.js` 加载后才存在。如果纯 ESM 加载（不先加载 `.js`），所有组件都会 throw |
| **加载顺序依赖** | 🟡 中 | IIFE 路径严重依赖 `<script>` 标签顺序（50+ 个标签），顺序错误会导致运行时 undefined |
| **重复定义冲突** | 🟡 中 | `coc.mjs` 中 `SAVE_SCHEMA_VERSION` 在 persistence.mjs 和 state.mjs 中都有 `const SAVE_SCHEMA_VERSION = 7`（模块级重复） |
| **维护负担** | 🟡 中 | 每个模块需要维护两个文件，约 50 对 .js/.mjs 文件需要同步更新 |
| **index.html 中的 modulepreload 引用 `.js`** | 🟢 低 | `<link rel="modulepreload" href="./js/coc.js">` — 这应该是 `.mjs`，但实际加载的是 IIFE `.js` |

---

## 7. Worker 线程状态

```
┌────────────────────────────────────────────────────────────┐
│  Worker 文件: js/ai/worker.js (94行)                        │
│  Worker 客户端: js/ai/worker_client.js (97行)               │
│                                                             │
│  ❌ 当前状态: 完全未使用                                      │
│                                                             │
│  证据:                                                       │
│  1. index.html 没有加载 worker_client.js                    │
│  2. index.html 没有加载 worker.js (这个是 Worker 脚本)       │
│  3. ai_logic.mjs 直接调用 network.mjs 的                     │
│     fetchAiCompletionWithRetry，不经过 Worker              │
│  4. worker_client.js 中 `window.CoCAIWorker.init()`         │
│     从未被调用                                               │
│                                                             │
│  worker.js 功能: 在 Worker 线程中执行 HTTP fetch + retry    │
│  worker_client.js 功能: 主线程桥接, 失败回退到同步 fetch     │
│                                                             │
│  影响: AI 请求阻塞主线程 (对大文件/慢网络可能卡 UI)           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Service Worker: sw.js (235行)                              │
│                                                             │
│  ✅ 在 index.html 中注册:                                    │
│     navigator.serviceWorker.register('./sw.js')             │
│                                                             │
│  功能: 离线缓存 (Cache API), PWA 支持                       │
│  状态: 已注册但功能有限 (简单缓存策略)                        │
└────────────────────────────────────────────────────────────┘
```

---

## 8. 错误处理: try-catch 覆盖面

```
┌── 全局层 ──────────────────────────────────────────────────────────┐
│  index.html (行24-83):                                              │
│  ├─ window.addEventListener('error')       → showFatalError()      │
│  ├─ window.addEventListener('unhandledrejection') → showFatalError │
│  ├─ console.error 劫持 (Vue 错误检测)      → showFatalError()      │
│  └─ console.warn 劫持 (Vue 组件挂载失败)    → showFatalError()      │
│  ✅ 覆盖: 未捕获的同步/异步错误, Vue 渲染/组件错误                    │
│  🟡 注意: showFatalError() 使用 innerHTML 但有 HTML 转义            │
└────────────────────────────────────────────────────────────────────┘

┌── AI 层 ───────────────────────────────────────────────────────────┐
│  handlePlayerAction() (ai_logic.mjs:59):                           │
│  └─ try { ...await triggerAI() } catch(err) { console.error }     │
│  ⚠️ 风险: 只 log 不反馈用户, 异常可能被吞掉                          │
│                                                                     │
│  triggerAI() (ai_logic.mjs:122):                                    │
│  ├─ try { fetch → processTools }                                   │
│  │  catch(e) { push system error to chatHistory }                  │
│  └─ finally { isLoading=false; compactChat; scrollToBottom }       │
│  ✅ 覆盖: 网络异常, AI 返回格式错误, 超时                             │
│                                                                     │
│  processTools() (ai_logic.mjs:294):                                 │
│  ├─ tool_call shape 校验 (function/method/arguments 格式)           │
│  ├─ validateToolArguments() 参数校验                                │
│  ├─ snapshot/rollback 事务回滚                                      │
│  └─ try { dispatchToolHandler } catch → restoreToolSnapshot        │
│  ✅ 覆盖: 无效 tool_call, 参数错误, handler 异常                     │
└────────────────────────────────────────────────────────────────────┘

┌── 状态/持久化层 ────────────────────────────────────────────────────┐
│  saveGame() (persistence.mjs:373):                                  │
│  └─ try { buildSaveData } catch(e) { showToast + _pushSystemNotice }│
│  ✅ QuotaExceededError 专项处理                                      │
│                                                                     │
│  _safeLocalStorageSetItem() (ui.mjs:77):                            │
│  └─ try { localStorage.setItem } catch(e) { toast + push notice }  │
│  ✅ QuotaExceededError 专项检测                                      │
│                                                                     │
│  loadGame() (persistence.mjs:397):                                  │
│  └─ try { localStorage.getItem → parse → migrate → restore }       │
│     catch(e) { return false }                                      │
│  🟡 破坏的存档静默失败, 不告知用户具体原因                             │
└────────────────────────────────────────────────────────────────────┘

┌── 组件层 ──────────────────────────────────────────────────────────┐
│  app.js: 组件注册失败时 throw Error (会被全局 error handler 捕获)    │
│  ❌ 缺失: 没有 Vue errorBoundary / onErrorCaptured 钩子             │
│  ❌ 缺失: 组件内部 try-catch 极少 (如 story_chat.mjs 的 getPendingCheck│
│           直接访问 gameState.chatHistory, 无 null 保护)              │
└────────────────────────────────────────────────────────────────────┘
```

**错误传播路径总结**:
```
工具 Handler 异常
  → dispatchToolHandler catch
    → restoreToolSnapshot (回滚)
    → 返回错误字符串作为 tool result
      → push 到 chatHistory (作为 tool role message)
        → triggerAI 继续 (AI 看到错误消息自行处理)

AI 网络异常
  → fetchAiCompletionWithRetry 3次重试后抛出
    → triggerAI catch
      → push system error 到 chatHistory
        → isLoading = false
          → UI 显示红色错误提示

持久化异常
  → QuotaExceededError → toast + system notice
  → 其他异常 → toast + console.error
```

---

## 9. 🔴 架构风险清单 (按严重度排序)

### 🔴 严重风险

| # | 风险 | 影响 | 建议 |
|---|------|------|------|
| 1 | **双轨 .js/.mjs 不同步** | 如果有人直接修改 .js 而不同步 .mjs (或反之)，两套路径行为不一致。当前 `.js` 是实际运行路径但 `.mjs` 有更现代的代码结构 | 统一为一种格式，或建立自动化同步脚本 (merge.py 似乎正是做这个的) |
| 2 | **AI API Key 明文存储在 localStorage** | `gameState.aiSettings.apiKey` 存储在 localStorage 中明文可读 | 使用 sessionStorage 或加密存储，至少不在 localStorage 持久化 |
| 3 | **全局变量污染** | 50+ 个 `window.*` 赋值，任何脚本错误都可能覆盖关键变量 | 迁移到 ESM + 模块作用域，减少全局暴露 |
| 4 | **Worker 线程未使用** | AI 请求阻塞主线程，大负载时 UI 可能卡顿 | 集成 `worker_client.js` 或移除死代码 |
| 5 | **IndexedDB 读路径缺失** | 双写但从不读 IndexedDB，localStorage 损坏时无恢复路径 | 实现 `_idbLoad` 作为 localStorage 失败时的回退 |

### 🟡 中等风险

| # | 风险 | 影响 | 建议 |
|---|------|------|------|
| 6 | **组件无 errorBoundary** | 单个 Vue 组件异常可导致整个 app 崩溃 | 添加 `onErrorCaptured` 或 error boundary 组件 |
| 7 | **handlePlayerAction 异常被吞** | `catch(err) { console.error }` 无用户反馈 | 添加 toast 或 system notice |
| 8 | **narrativeListener 假阳性** | 正则匹配可能错误触发 clue/map 更新 | 添加 AI 确认或阈值过滤 |
| 9 | **tool handler snapshot 使用 JSON 深拷贝** | 无法复制函数/循环引用，性能开销大 | 使用 structuredClone 或细化回滚粒度 |
| 10 | **SAVE_SCHEMA_VERSION 多处定义** | `state.mjs`, `persistence.mjs`, `state.js` 各有一份 `const SAVE_SCHEMA_VERSION = 7` | 统一到单一源 |
| 11 | **chatHistory 无上限硬保护** | 仅靠 `compactChatHistory('watch')` 在 280 条触发, 但无硬上限截断 | 添加绝对上限（如 500 条）作为保护 |

### 🟢 低风险

| # | 风险 | 影响 | 建议 |
|---|------|------|------|
| 12 | **modulepreload 指向 .js** | `<link rel="modulepreload" href="./js/coc.js">` 对 IIFE 无效 | 移除或改为 `.mjs` |
| 13 | **Vue 全局构建 (无 tree-shaking)** | `vue.global.prod.js` 包含完整 Vue 运行时, 体积大 | 切换到 ESM 构建 |
| 14 | **组件注册依赖加载顺序** | `app.js` 中用 `if(window.ViewLobby) throw Error` 硬检查 | 使用动态 import 或构建工具 |
| 15 | **无 CSP (Content Security Policy)** | inline style/script 未受限制 | 添加 CSP header |
| 16 | **console.error/warn 劫持脆弱** | 依赖字符串匹配 `'Vue'` 来检测 Vue 错误 | 使用 Vue 官方 `errorHandler` |

---

## 10. 数据流总图 (文本版)

```
用户输入 "我走向门口"
        │
        ▼
[StoryChat] ──(handlePlayerAction)──▶ [CoCAI]
                                         │
                                    push user msg → chatHistory
                                         │
                                    triggerAI(toolRound=0)
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                   buildApiMessages  buildTools   systemPrompt
                   (context_mgr)    (tool_dispatch) (chatHistory)
                          │              │              │
                          └──────────────┼──────────────┘
                                         ▼
                              fetchAiCompletionWithRetry
                              (network.mjs, 3 retries)
                                         │
                              ┌──────────┴──────────┐
                              │  DeepSeek API 响应   │
                              │  {choices:[{message: │
                              │   {content,          │
                              │    tool_calls:[      │
                              │     request_skill_   │
                              │     check, ...]}}]}  │
                              └──────────┬──────────┘
                                         ▼
                              push assistant msg → chatHistory
                                         │
                              narrativeListener(text)
                              ├─ 扫描 "发现线索" → add_clue()
                              └─ 扫描 "走进房间" → set_position()
                                         │
                              processTools(aiMsg, 0)
                                         │
                          ┌──────────────┼──────────────┐
                          ▼                             ▼
                   request_skill_check          其他工具调用
                   (暂停, 显示按钮)              (直接执行)
                          │                             │
                    用户点击按钮                    dispatch → handler
                          │                             │
                   executeSkillCheck              ┌─────┴─────┐
                   → Engine.checkSkill()          │ snapshot  │
                   → push result                  │ 执行handler│
                   → triggerAI(+1)                │ 失败→回滚 │
                                                  └─────┬─────┘
                                                        │
                                                   push tool result
                                                        │
                                                  triggerAI(+1) 继续
                                                        │
                                          ┌─────────────┴─────────────┐
                                          ▼                           ▼
                                    AI 返回纯文本              AI 返回更多 tool_calls
                                    (无 tool_calls)            → processTools 循环
                                          │                    (最多 10 轮)
                                          ▼
                                    gameState.isLoading = false
                                          │
                                    Vue 响应式 → UI 更新
                                          │
                                    ┌─────┴─────────────────────┐
                                    │ story_chat 显示新消息      │
                                    │ story_char 更新 HP/SAN    │
                                    │ story_inv 更新物品列表     │
                                    │ story_combat 显示战斗状态  │
                                    │ story_map 更新当前位置    │
                                    └───────────────────────────┘
                                          
                              自动存档 (8s debounce)
                              → _buildSaveData → localStorage.setItem
                                                → IndexedDB (fire-and-forget)
```

---

*分析完成。本报告基于对代码库中 193 个文件的结构性阅读生成。*
