# 🏗 CoC 7th Engine — 架构审查报告 (V17.1)

> 审查日期: 2026-07-02 | 审查范围: 60个JS模块 + index.html | 基线: C:/Users/x1767/AppData/Local/Temp/coc_merged

---

## 一、依赖图 (Dependency Graph)

### 1.1 分层架构

```
┌──────────────────────────────────────────────────────────┐
│  VIEW LAYER (4 files)                                    │
│  lobby_view.js · creator_view.js · story_view.js ·       │
│  dev_log_view.js                                         │
├──────────────────────────────────────────────────────────┤
│  COMPONENT LAYER (16 files)                              │
│  story_chat · story_char · story_inv · story_equip ·     │
│  story_store · story_journal · story_npc · story_combat ·│
│  story_growth · story_map · story_clues · story_dice ·   │
│  dice_canvas · canvas_chat · sanity_effects · ui_feedback│
├──────────────────────────────────────────────────────────┤
│  AI LAYER (4 files)                                      │
│  ai_logic.js · ai/network.js · ai/tool_dispatch.js ·     │
│  ai/worker_client.js · ai/worker.js                      │
├──────────────────────────────────────────────────────────┤
│  STATE LAYER (5 files)                                   │
│  state.js → state/core.js · state/ui.js ·                │
│  state/gameplay.js · state/persistence.js                │
├──────────────────────────────────────────────────────────┤
│  ENGINE/CORE LAYER (2 files)                             │
│  coc.js · core/context_manager.js                        │
├──────────────────────────────────────────────────────────┤
│  TOOLS LAYER (10 files)                                  │
│  tools/definitions.js + handlers/{9 domain modules}       │
│  character · inventory · dice · clues · map · combat ·   │
│  mythos · npc · system · index (registry)                │
├──────────────────────────────────────────────────────────┤
│  DATA LAYER (13 files)                                   │
│  jobs · experiences · items_db · items · dev_logs ·      │
│  skills · mythos_tomes · spells · injury_tables ·        │
│  npc_templates · insanity_tables · logger · utils        │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Script Load Order (58 scripts in index.html)

| # | File | Layer | Dependencies (needs loaded first) |
|---|------|-------|-----------------------------------|
| 1 | vendor/vue.global.prod.js | Vendor | — |
| 2 | vendor/chart.min.js | Vendor | — |
| 3 | data/jobs.js | Data | — |
| 4 | data/experiences.js | Data | — |
| 5 | data/items_db.js | Data | — |
| 6 | data/items.js | Data | items_db |
| 7 | data/dev_logs.js | Data | — |
| 8 | data/skills.js | Data | — |
| 9 | data/mythos_tomes.js | Data | — |
| 10 | data/spells.js | Data | — |
| 11 | data/injury_tables.js | Data | — |
| 12 | data/npc_templates.js | Data | — |
| 13 | data/insanity_tables.js | Data | — |
| 14 | coc.js | Engine | data/jobs, data/skills, data/mythos_tomes, data/spells, data/injury_tables, data/insanity_tables |
| 15 | core/context_manager.js | Core | — |
| 16 | tools/definitions.js | Tools | — |
| 17 | data/logger.js | Data/Util | — |
| 18 | data/utils.js | Data/Util | — |
| 19 | state/core.js | State | Vue |
| 20 | state/ui.js | State | core |
| 21 | state/gameplay.js | State | core, CoCEngine |
| 22 | state/persistence.js | State | core, ui, CoCContextManager |
| 23 | state.js | State | core, ui, gameplay, persistence |
| 24-32 | tools/handlers/*.js | Tools | (self-register to window.CoCToolHandlerModules) |
| 33 | tools/handlers/index.js | Tools | all handler modules |
| 34 | char_creator.js | Creator | State, Engine, Vue |
| 35 | ai/network.js | AI | utils (safeJsonParse) |
| 36 | ai/tool_dispatch.js | AI | definitions |
| 37 | ai_logic.js | AI | State, Engine, network, tool_dispatch, definitions, handlers |
| 38-43 | components/*.js (batch1) | Component | State, AI, Engine |
| 44-45 | views/lobby_view.js, views/creator_view.js | View | State, Engine |
| 46-51 | components/*.js (batch2) + audio/sfx.js | Component | State, AI |
| 52 | chat_export.js | Util | State |
| 53-54 | views/story_view.js, views/dev_log_view.js | View | State, AI, all components |
| 55-56 | components/sanity_effects.js, components/ui_feedback.js | Component | State, Vue |
| 57 | app.js | Bootstrap | Vue, all views, all components |

### 1.3 Load Order Issues

| 严重度 | 问题 | 详情 |
|--------|------|------|
| ⚠️ LOW | Views interspersed with Components | `lobby_view.js` + `creator_view.js` (lines 145-146) load BEFORE `story_journal.js` + `story_npc.js` etc (lines 147-152). Current layout is safe since lobby_view does not reference story components, but violates layer ordering principle. |
| ⚠️ LOW | `data/utils.js` positioned at line 117 | Loaded AFTER `tools/definitions.js` (line 115). Since neither definitions.js nor anything before it uses `safeJsonParse`, this is safe. |

---

## 二、循环依赖 (Circular Dependencies)

### 2.1 检查结果: 无直接循环依赖 ✅

经过完整的依赖图分析, **未发现 A→B→A 的直接循环依赖**。

### 2.2 潜在风险点

| 风险 | 文件 | 描述 |
|------|------|------|
| 🟡 LOW | state/persistence.js → window.CoCState | persistence.js 第 655 行访问 `window.CoCState` 用于清理先攻顺序, 而 state.js 依赖 persistence.create()。通过 `if (window.CoCState && ...)` 空检查防御。不构成真正的循环, 但耦合方向不佳。 |
| 🟡 LOW | state/gameplay.js → window.CoCEngine | gameplay.js 第 134 行直接访问 `window.CoCEngine`。应该在 create() 时注入而非直接取全局。不构成循环, 但破坏了依赖注入模式。 |
| 🟡 LOW | state/ui.js → window.CoCContextManager | ui.js 第 64 行直接访问 context_manager。同样应该注入。 |

---

## 三、全局耦合 (Global Coupling)

### 3.1 window.X 命名空间统计

| 指标 | 数值 |
|------|------|
| 总 window.X 赋值 | **55 个** |
| 唯一的 window 命名空间 | **36 个** |
| JS 模块总数 | **60 个** |
| 使用 window.X 的模块 | **58/60 (97%)** |

### 3.2 耦合热力图 (被引用次数)

| 模块 | 被引用文件数 | 引用次数 | 风险 |
|------|-------------|---------|------|
| `window.CoCState` | 22+ | 60+ | 🔴 中心耦合点 |
| `window.CoCItemDB` | 3 | 32+ | 🔴 组件紧耦合 |
| `window.CoCEngine` | 5 | 38 | 🟡 分散耦合 |
| `window.Vue` | 6+ | 8 | 🟡 框架依赖 |
| `window.CoCAI` | 4 | 6 | 🟡 分散耦合 |
| `window.CoCContextManager` | 3 | 5 | 🟢 可接受 |

### 3.3 过度耦合识别

🔴 **`window.CoCState` - 超级耦合点**
- 被 22+ 个文件引用, 成为事实上的全局总线
- 组件、视图、AI 层、工具层都直接依赖它
- ENGINEERING.md 虽然声明了"通过 CoCState 传递数据", 但未解决 State 本身成为 God Object 的问题

🔴 **`window.CoCItemDB` - 数据层被组件层直接修改**
- `story_equip.js` 有 22 处直接引用 `CoCItemDB`
- 甚至在第 19 行直接修改 `window.CoCItemDB.EQUIP_SLOTS = {...}` (组件层修改数据层!)
- `story_inv.js` 有 10 处直接引用

---

## 四、分层违规 (Layer Violations)

### 4.1 违规清单

| # | 严重度 | 违规类型 | 文件 | 行号 | 描述 |
|---|--------|---------|------|------|------|
| 1 | 🔴 CRITICAL | 组件→引擎 | components/story_char.js | 110 | 直接调用 `window.CoCEngine` 进行技能值计算, 应通过 State |
| 2 | 🔴 CRITICAL | 组件→引擎 | components/story_dice.js | 141 | 直接调用 `window.CoCEngine.executePushedRoll`, 应通过 State |
| 3 | 🔴 CRITICAL | 组件→数据 (修改) | components/story_equip.js | 19 | `window.CoCItemDB.EQUIP_SLOTS = {...}` — 组件层直接修改数据层对象 |
| 4 | 🔴 CRITICAL | 组件→数据 | components/story_equip.js | 22处 | 22 次直接访问 `window.CoCItemDB` |
| 5 | 🔴 CRITICAL | 组件→数据 | components/story_inv.js | 10处 | 10 次直接访问 `window.CoCItemDB` |
| 6 | 🟡 MAJOR | 组件→AI | components/story_combat.js | 126 | 直接引用 `window.CoCAI` |
| 7 | 🟡 MAJOR | 组件→AI | components/story_map.js | 148 | 直接引用 `window.CoCAI` |
| 8 | 🟡 MAJOR | 组件→AI | components/story_chat.js | 100 | 直接引用 `window.CoCAI` |
| 9 | 🟡 MAJOR | 视图→引擎 | views/creator_view.js | 199 | 直接引用 `window.CoCEngine` |
| 10 | 🟡 MAJOR | 视图→AI | views/story_view.js | 123 | 直接引用 `window.CoCAI` |
| 11 | 🟡 MAJOR | 状态→引擎 (未注入) | state/gameplay.js | 134 | 应通过 create() 注入 CoCEngine 而非访问全局 |
| 12 | 🟡 MAJOR | 状态→核心 (未注入) | state/ui.js | 64 | 应注入 CoCContextManager 而非访问全局 |
| 13 | ⚠️ MINOR | 状态→DOM | state/core.js | 72 | `document.getElementById` 直接操作 DOM |
| 14 | ⚠️ MINOR | 处理→数据 | tools/handlers/mythos.js | 22 | 直接访问 `CoCMythosTomes` (可接受, 但建议通过 Engine) |
| 15 | ⚠️ MINOR | 处理→数据 | tools/handlers/combat.js | 103 | 直接访问 `CoCNpcTemplates` |
| 16 | ⚠️ MINOR | 处理→数据 | tools/handlers/system.js | 20-23 | 直接访问 `DevLogs` |

### 4.2 分层违规总结

```
期望流向: View → Component → State → Engine → Tools → Data

实际流向:
  ┌──── View ────┐
  │  ↓ (正确)     │───→ Engine (违规)  ← creator_view
  │              │───→ AI (违规)      ← story_view
  └──────────────┘
  ┌─ Component ──┐
  │  ↓ (正确)     │───→ Engine (违规)  ← story_char, story_dice
  │              │───→ AI (违规)      ← story_combat, story_map, story_chat
  │              │───→ Data (严重违规)  ← story_equip, story_inv
  │              │───→ Data (修改!)   ← story_equip (EQUIP_SLOTS)
  └──────────────┘
  ┌─── State ────┐
  │  ↓ (正确)     │───→ Engine (违规)  ← gameplay (should inject)
  │              │───→ Core (违规)    ← ui (should inject)
  └──────────────┘
```

---

## 五、模块内聚 (Module Cohesion)

### 5.1 God Modules (>500 行)

| 模块 | 行数 | 超标倍数 | DOC声称 | 实际偏差 |
|------|------|---------|---------|---------|
| 🔴 **js/coc.js** | **1,665** | 3.33x | 490 | +240% ⚠️ |
| 🔴 **js/state/persistence.js** | **980** | 1.96x | (未列出) | — |
| 🔴 **js/ai_logic.js** | **912** | 1.82x | 403~577 | +58% ⚠️ |

### 5.2 js/coc.js 职责分析 (1665行 = 严重上帝模块)

| 职责块 | 估计行数 | 应拆分? |
|--------|---------|---------|
| 骰子掷骰 + 技能检定 | ~250 | ✅ 可独立 |
| 属性衍生 (HP/MP/SAN/DB/MOV) | ~200 | ✅ 可独立 |
| 战斗结算 (攻击/闪避/伤害) | ~300 | ✅ 可独立 |
| 职业/技能点分配 | ~150 | ✅ 可独立 |
| 神话典籍/法术学习 | ~150 | ✅ 可独立 |
| 理智/疯狂机制 | ~100 | ✅ 可独立 |
| 重伤/伤害表 | ~80 | ✅ 可独立 |
| NPC模板生成 | ~150 | ✅ 可独立 |
| 自检函数 (100+ self-references) | ~100 | ❌ 耦合严重 |

**建议拆分方案**: coc.js 应拆分为 6-8 个子模块:
```
js/engine/
├── dice.js         # 骰子与技能检定
├── attributes.js   # 属性衍生与计算
├── combat.js       # 战斗结算
├── sanity.js       # 理智/疯狂机制
├── tomes.js        # 神话典籍与法术
├── npc.js          # NPC模板生成
└── index.js        # 整合入口 (window.CoCEngine)
```

### 5.3 职责过多的其他模块

| 模块 | 行数 | 混合职责 |
|------|------|---------|
| state/persistence.js | 980 | 存档CRUD + 迁移 + 模组管理 + 存储估算 + 导出/导入 + 容量检查 |
| ai_logic.js | 912 | Prompt构建 + Tool调度 + 技能回调 + 叙事监听 + 关键词注入 + 重试逻辑 |

---

## 六、接口契约 (Interface Contracts)

### 6.1 Engine→Handler→State 调用签名

```
CoCToolHandlers.create(State, Engine) → handlers{}
CoCAI(State, Engine) → { triggerAI, handlePlayerAction, ... }
```

✅ **一致性检查通过**: AI 和 Handler 层都接收 `(State, Engine)` 参数。

### 6.2 State 组合接口

```
CoCStateCore(Vue)              → core { gameState, playerInput, ... }
CoCStateUI.create(core)        → uiMod { showToast, confirmAction, ... }
CoCStateGameplay.create(core)  → gpMod { startCombat, addClue, ... }
CoCStatePersistence.create(core, uiMod) → persistMod { saveGame, loadGame, ... }
```

✅ State 拆分模式一致, 每个子模块通过 `create()` 工厂接收依赖。

### 6.3 接口不一致点

| 问题 | 详情 |
|------|------|
| 🟡 `state/gameplay.js` 未接收 Engine | `create(core)` 应改为 `create(core, engine)`, 现在内部直接引用 `window.CoCEngine` |
| 🟡 `state/persistence.js` 未接收 ContextManager | `create(core, ui)` 应添加 contextManager 参数 |
| 🟡 Tool Handler 模块注册不一致 | 有些是 `window.X = (function(ctx){...})(context)`, 有些是 `window.X.factory = function(ctx){...}` |
| 🟢 `app.js` 安全挂载 (防崩溃) | 组件检查 `if (window.X) app.component(...)` 是正确的防御性模式 |

---

## 七、Vendor 耦合 (CDN vs Local)

### 7.1 当前策略

| 依赖 | 本地路径 | CDN 回退 | 状态 |
|------|---------|---------|------|
| Vue 3 | `vendor/vue.global.prod.js` | `unpkg.com/vue@3/dist/vue.global.js` | ✅ 正确 |
| Bootstrap CSS | `vendor/bootstrap.min.css` | `cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css` | ⚠️ link onerror 不可靠 |
| Chart.js | `vendor/chart.min.js` | `cdn.jsdelivr.net/npm/chart.js` | ✅ 正确 |

### 7.2 Vendor 问题

| 严重度 | 问题 |
|--------|------|
| ⚠️ LOW | Bootstrap CSS 的 CDN fallback 使用 `<link onerror="this.remove()">`, 但 `<link>` 标签的 onerror 事件在部分浏览器不支持。建议改用 JS 方式检测 `document.styleSheets`。 |
| 🟢 NOTE | 三个 vendor 文件总计 ~604KB, 本地化降低了 CDN 依赖风险。 |
| 🟢 NOTE | CDN评估文档 (`docs/cdn-evaluation.md`) 推荐的"混合策略(方案C)"已实施。 |

### 7.3 Service Worker

✅ PWA Service Worker (`sw.js`) 注册了缓存策略, 有助于离线场景。

---

## 八、架构文档一致性 (vs ENGINEERING.md)

### 8.1 行数声称 vs 实际

| 模块 | ENGINEERING.md声称 | 实际行数 | 偏差 |
|------|-------------------|---------|------|
| `coc.js` | 490 | **1,665** | 🔴 +240% |
| `ai_logic.js` | 403~577 | **912** | 🔴 +58% |
| `state.js` | 920 | **150** | 🟡 -84% (已拆分) |
| `ai/network.js` | 84 | **210** | 🟡 +150% |
| `ai/tool_dispatch.js` | 101 | **128** | 🟢 +27% |
| `tools/definitions.js` | 384 | **469** | 🟡 +22% |

### 8.2 文件引用问题

| 问题 | 详情 |
|------|------|
| 🔴 `ground_truth_canvas.md` 版本号错误 | 文档声称 V16.5, 实际代码 V17.1 |
| 🔴 `ground_truth_canvas.md` 引用不存在的文件 | 列出 `jobs_part1.js` / `jobs_part2.js`, 实际为 `jobs.js` |
| 🟡 ENGINEERING.md 过时 | 记录的模块拆分状态已是旧版, ai_logic 被拆分后又被合并 |
| 🟢 ENGINEERING.md 规范仍然有效 | `100-400行` 原则和 `500行阈值` 仍然适用 |

### 8.3 命名规范一致性

✅ 大部分模块遵循 `window.CoCXxx` 命名 (55/55个赋值)
✅ 内部函数使用 camelCase
⚠️ 存在 `window.COC_` 和 `window.CoCXxx` 两个前缀混用:
- `window.COC_LOG_LEVEL` (logger.js, network.js) — 使用下划线
- `window.CoCState` — 使用驼峰
- `window.COC_AI_RETRY_BACKOFF_MS` (network.js)

---

## 九、综合评分

| 维度 | 分数 | 权重 | 加权 |
|------|------|------|------|
| 依赖图完整性 | 9/10 | 15% | 1.35 |
| 循环依赖 | 9/10 | 15% | 1.35 |
| 全局耦合控制 | 4/10 | 15% | 0.60 |
| 分层架构 | 4/10 | 20% | 0.80 |
| 模块内聚 | 3/10 | 15% | 0.45 |
| 接口契约 | 7/10 | 10% | 0.70 |
| Vendor耦合 | 8/10 | 5% | 0.40 |
| 文档一致性 | 3/10 | 5% | 0.15 |

### 🏆 总分: **5.80 / 10** (⚠️ 需要改进)

### 评级: C+ (及格但存在显著架构债务)

---

## 十、修复优先级

### 🔴 P0 — 立即修复 (阻塞性)

| # | 问题 | 修复方案 |
|---|------|---------|
| P0-1 | `coc.js` 1665行上帝模块 | 拆分为 `js/engine/{dice,attributes,combat,sanity,tomes,npc}.js` |
| P0-2 | `story_equip.js` 直接修改 CoCItemDB | 将 EQUIP_SLOTS 初始化移至 data/items_db.js, 组件通过 State 只读访问 |

### 🟡 P1 — 本次修复 (结构改进)

| # | 问题 | 修复方案 |
|---|------|---------|
| P1-1 | 组件跳过State直接访问Engine | 在CoCState上暴露 `checkSkill()`, `executePushedRoll()` 代理方法 |
| P1-2 | 组件跳过State直接访问AI | 在CoCState上暴露 `triggerAI()` 代理, 或通过 props 传递 |
| P1-3 | `state/gameplay.js` 全局访问 Engine | 改为 `create(core, engine)` 注入 |
| P1-4 | `story_equip.js` / `story_inv.js` 绕过State访问ItemDB | 通过 State.getItemInfo() / State.getEquipSlots() 接口访问 |

### 🔵 P2 — 下次迭代 (文档/清理)

| # | 问题 | 修复方案 |
|---|------|---------|
| P2-1 | ENGINEERING.md 行数过时 | 更新实际行数, 标注 coc.js 拆分计划 |
| P2-2 | ground_truth_canvas.md 版本号/文件名错误 | 更新文件列表, 同步版本号 |
| P2-3 | `window.COC_` vs `window.CoC` 前缀混用 | 统一为 `window.CoC` 前缀 |

---

## 附录 A: 完整依赖矩阵

```
文件                            依赖 (window.X)
─────────────────────────────────────────────────────────
data/jobs.js                   CoCJobs
data/experiences.js            CoCExperiences
data/items_db.js               CoCItemDB
data/items.js                  CoCItemDB
data/dev_logs.js               DevLogs
data/skills.js                 CoCBaseSkills
data/mythos_tomes.js           CoCMythosTomes, CoCStudyState
data/spells.js                 CoCSpells
data/injury_tables.js          CoCInjuryTables
data/insanity_tables.js        CoCInsanityTables
data/npc_templates.js          CoCNpcTemplates
data/logger.js                 CoCLog, COC_LOG_LEVEL
data/utils.js                  (none)
coc.js                         CoCEngine, CoCBaseSkills, CoCJobs, CoCSpells,
                               CoCMythosTomes, CoCStudyState, CoCInjuryTables,
                               CoCInsanityTables
core/context_manager.js        CoCContextManager
tools/definitions.js           CoCToolDefinitions
tools/handlers/character.js    CoCToolHandlerModules, CoCEngine
tools/handlers/inventory.js    CoCToolHandlerModules
tools/handlers/dice.js         CoCToolHandlerModules
tools/handlers/clues.js        CoCToolHandlerModules
tools/handlers/map.js          CoCToolHandlerModules
tools/handlers/combat.js       CoCToolHandlerModules, CoCNpcTemplates
tools/handlers/mythos.js       CoCToolHandlerModules, CoCMythosTomes
tools/handlers/npc.js          CoCToolHandlerModules
tools/handlers/system.js       CoCToolHandlerModules, DevLogs
tools/handlers/index.js        CoCToolHandlers, CoCToolHandlerModules
state/core.js                  CoCStateCore, Vue
state/ui.js                    CoCStateUI, CoCContextManager
state/gameplay.js              CoCStateGameplay, CoCEngine
state/persistence.js           CoCStatePersistence, CoCContextManager, CoCState
state.js                       CoCState, CoCStateCore, CoCStateUI,
                               CoCStateGameplay, CoCStatePersistence, Vue
char_creator.js                CoCCreator, CoCState, CoCEngine, CoCExperiences, Vue
ai/network.js                  COC_AI_RETRY_BACKOFF_MS
ai/tool_dispatch.js            CoCToolDefinitions
ai_logic.js                    CoCAI, CoCState, CoCEngine, CoCContextManager,
                               CoCToolDefinitions, CoCToolHandlers
components/story_chat.js       StoryChat, CoCState, CoCAI
components/story_char.js       StoryChar, CoCState, CoCEngine, Vue
components/story_inv.js        StoryInv, CoCState, CoCItemDB, Vue
components/story_equip.js      StoryEquip, CoCState, CoCItemDB, Vue
components/story_store.js      StoryStore, CoCState
components/story_journal.js    StoryJournal, CoCState
components/story_npc.js        StoryNpc, CoCState
components/story_combat.js     StoryCombat, CoCState, CoCAI
components/story_growth.js     StoryGrowth, CoCState
components/story_map.js        StoryMap, CoCState, CoCAI
components/story_clues.js      StoryClues, CoCState
components/story_dice.js       StoryDice, CoCState, CoCEngine
components/canvas_chat.js      CanvasChat, COC_
components/dice_canvas.js      DiceAnim
components/sanity_effects.js   SanityEffects, CoCState, Vue
components/ui_feedback.js      CocToastLayer, CocConfirmDialog, CoCState
views/lobby_view.js            ViewLobby, CoCState
views/creator_view.js          ViewCreator, CoCState, CoCEngine, CoCCreator
views/story_view.js            ViewStory, CoCState, CoCAI, ChatExport, Vue,
                               StoryChat, StoryChar, StoryInv, StoryStore,
                               StoryJournal, StoryNpc, StoryCombat, StoryGrowth,
                               StoryMap, StoryClues, StoryDice, StoryEquip
views/dev_log_view.js          ViewDevLog, CoCState, DevLogs
chat_export.js                 ChatExport
audio/sfx.js                   CoCSFX, AudioContext
app.js                         Vue, CoCState, CoCAI, ViewLobby, ViewCreator,
                               ViewStory, ViewDevLog, CocToastLayer, CocConfirmDialog
```
