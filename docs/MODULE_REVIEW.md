# 各模块功能完善度与优化建议

> 版本 **V18.1.0** · HEAD `cd111d7` · 基线门禁 **39/39 smoke PASS** · 性质：只读顾问审查

## 一、总览矩阵（模块 × 完善度 × 优先级）

| # | 模块 | 完善度(1-10) | 状态 | 主要缺口 | 优化优先级 |
|---|------|:---:|------|----------|:---:|
| 1 | 大厅 Lobby | 9 | 完善 | 无阻塞；隐私提示/KP tooltip 可补 | P3 |
| 2 | 建卡 Char Creator | 9 | 完善 | 年龄边界单测未全覆盖；Chart 离线降级已做 | P3 |
| 3 | 叙事 Story（chat/journal/dice/push） | 9 | 完善 | pushReason 已接入；无功能缺口 | P3 |
| 4 | 地图/线索 Map & Clues | 8 | 完善（刚修复 a11y） | 键盘/点击语义已统一，建议人工走查 | P2 |
| 5 | 战斗 Combat | 8 | 完善 | 动作菜单为引导非强制（wontfix）；`resolveCombatExchange` 边界未测 | P2 |
| 6 | KP 引擎 | 9 | 完善 | 默认开启+伦敦规则全局（wontfix）；随机分支难测 | P2 |
| 7 | AI 层（logic/network/dispatch/35 工具） | 8 | 完善 | 超时/重试/上限齐全；`ai_logic` 无 Node 层测试 | P3 |
| 8 | 存档 Persistence | 9 | 完善 | v1–v7 迁移+IDB 兜底健壮；saveGame 边界未测 | P3 |
| 9 | 场景/战役 Store | 8 | 完善 | 10 内置+8 可下载；CORS/CDN 有已知边界 | P3 |
| 10 | 状态 State | 8 | 完善 | 需 Vue 环境，Node 层无法直测 | P3 |
| 11 | PWA/构建 | 8 | 完善 | 须走 `python build.py` 注入 SW 哈希 | P2 |
| 12 | UI/组件 | 8 | 完善 | 组件层 jsdom 全量延后 | P2 |
| 13 | 测试/CI | 7 | 良好 | jsdom 偏浅、无真浏览器 E2E | P1→P3 |

**一句话结论**：13 个模块全部达到"功能闭环"，整体就绪度约 **8.5/10，零阻塞项**。剩余项以"测试深度"和"沟通向说明"为主，无功能性硬缺陷。

---

## 二、分模块详述

### 1. 大厅 Lobby（`views/lobby_view.mjs`）— 9/10

- **DONE**：模组 CRUD（新建/改名/删除/进入）、自动存档快速恢复、手动槽位、API Key `rememberKey`（默认会话级）、模组库（内置+可下载）、`publicCatalogBase` 公开资源基址扩展。
- **PARTIAL**：KP 开关有说明但缺少 hover tooltip；设置页缺显式隐私提示（Key 明文存客户端为固有约束）。
- **优化建议**：① KP 开关加 tooltip 说明"默认开启+伦敦规则为底层协议"；② 设置区补一行"API Key 仅存于本机浏览器"隐私说明；③ 模组卡片可显示 KP 开启状态徽标，减少进入后才发现的困惑。

### 2. 建卡 Char Creator（`components/char_creator.mjs`）— 9/10

- **DONE**：三预设 + `roll3D6x5/roll2D6plus6x5` 掷骰、`applyAgeModifiers` 年龄修正、`calculateDerived` 衍生属性、职业（`Engine.Occupations`）、经历包（unlock 技能/bonusPoints/sanLoss）、雷达图（Chart.js，含离线复用实例）、PDF/文本解析导入（中英属性映射）。
- **PARTIAL**：`applyAgeModifiers` 边界值（14/15/19/40/70+）未全覆盖单测（见 `TEST_COVERAGE_GAP`）。
- **优化建议**：① 补年龄分档边界单测；② 雷达图在无 Chart（离线降级）时确认文本回退分支；③ 技能点分配可加"剩余点数=0"的强校验提示。

### 3. 叙事 Story（`story_chat/story_journal/story_dice`）— 9/10

- **DONE**：对话流、日志（`addJournalEntry`）、骰子历史、`push_skill_check`（推动检定，`pushed_reason` 已接入日志）、待检定锁（"命运已锁定"拦截重复输入）、移动保护（`isSyntheticMoveInFlight`）。
- **优化建议**：① 推动检定失败的"更严重后果"目前依赖 AI 叙事，可在引擎侧加一条硬提示；② 长对话已由 `CoCContextManager.trimForSave` 裁剪，建议 UI 提示玩家"历史已压缩"。

### 4. 地图/线索 Map & Clues（`story_map.mjs` / `story_clues.mjs`）— 8/10

- **DONE**：SVG 场景图、连接线、房间状态色/图标、地点列表、线索卡片/关联网视图、KP 调查路径徽标（真 X/3 假 Y）。**刚修复的 a11y**：`toggleRoomDetail`（BUG-002）、`toggleClueDetail`（BUG-001）已存在，SVG 节点键盘 Enter/Space 与点击语义统一（选中切换），"前往此处"按钮单独调用 `goToRoom`。
- **观察（非缺陷）**：`story_clues` 网络视图节点 click 用内联表达式、键盘用 `toggleClueDetail`——二者行为等价但写法不一致，可统一为都调 `toggleClueDetail` 以便回归。
- **优化建议**：① 人工键盘 Tab + 窄屏走查（发布清单已列）；② 大量线索时网络图为网格布局，节点重叠可读性下降，可引入简单力导或分页。

### 5. 战斗 Combat（`engines/combat.mjs` + `tools/handlers/combat`）— 8/10

- **DONE**：对立判定（攻击 vs 闪避/反击）、伤害计算+护甲、连射/全自动（难度递增）、贯穿 `checkImpale`、火器故障 `checkMalfunction`、`autoResolveExchange` 全流程回调、CoC 7e 动作分类进入 prompt。
- **wontfix（设计取舍）**：动作菜单为**引导**而非每回合强制校验（见下文第四节）。
- **PARTIAL**：`resolveCombatExchange` 边界（大失败露破绽、反击优先级）未覆盖单测。
- **优化建议**：① 补 `resolveCombatExchange`/`resolveBurstFire` 边界单测；② `checkMalfunction` 依赖 `Math.random`，可通过可注入骰序（KP 引擎已有 `_setTestRolls` 模式）提高可测性。

### 6. KP 引擎（`campaign/kp_execution_engine.mjs`）— 9/10

- **DONE**：末日时钟（cap 24）、ATTENTION/PLAYER_POWER/PHASE 同步、敌人缩放/反秒杀、纯伤害免疫、现实扭曲（ATTENTION≥9 的 bullet_fail/spatial_error）、反派 tick（误导/伏击/社交渗透）、三路径线索门（含连续受阻后**降级放行**防卡关）、火器弹药门、时代科技门（知识门控）、场景路径规范化。可注入 `_setTestRolls` 便于测试。
- **PARTIAL**：大量随机分支（`Math.random`）路径难以全覆盖；`isActive`/`CoCLondonKpEngine` 为遗留别名（技术债）。
- **优化建议**：① 把 `runAntagonistTick`/`applySocialInfiltration` 的随机源也走可注入队列，提升确定性测试；② 逐步收敛遗留别名到 `KpExecutionEngine` 单一命名。

### 7. AI 层（`ai_logic.mjs` + `ai/network` + `ai/tool_dispatch` + 35 工具）— 8/10

- **DONE**：`buildTools()` 生成 OpenAI 兼容工具（strict `additionalProperties:false`）、本地参数校验 `argumentSchemas`、超时（`AI_REQUEST_TIMEOUT_MS`）、重试退避（`fetchAiCompletionWithRetry`）、工具轮数上限（`MAX_TOOL_ROUNDS`）、语言过滤+时代剥离+输出协议五段式、离线检测。**工具目录恰为 35 个**（与文档一致）。
- **PARTIAL**：`ai_logic` 依赖 `window.CoCState/Engine`，Node 层无法直测（仅导入验证）；`normalizeToolValue` 边界已补 `esm_tool_dispatch`。
- **优化建议**：① 用 jsdom mock `CoCState/CoCEngine` 补 `processTools` 调度单测（文档已列为高优先）；② 工具描述里"【必须调用】"较多，建议梳理成分级（硬必需/软建议），减少模型误触发。

### 8. 存档 Persistence（`state/persistence.mjs`）— 9/10

- **DONE**：v1–v7 迁移（扁平→嵌套、敌人 ID 规范化、先攻序修复、聊天裁剪）、`kpEngine`/`scenePaths` 迁移、瞬时字段 `_` 剥离、localStorage 配额预估+分级告警（80/90/98%）、超阈值/写失败自动 IndexedDB 兜底、导入导出、模组级前缀隔离。
- **PARTIAL**：`saveGame/loadGame` 边界（配额溢出、IDB 不可用）未直测，但有 `save_migration_smoke` + `idb_backup_smoke` 覆盖主路径。
- **优化建议**：① 补 quota-exceeded 模拟单测；② `loadGame` 的 IDB 异步分支返回 `false` 但实际异步恢复，UI 需明确"正在加载"到"加载完成"的二次刷新（当前已 toast，可再加 loading 态）。

### 9. 场景/战役 Store（`scenario/store.mjs` + `campaign/*`）— 8/10

- **DONE**：10 内置场景 + 8 可下载包（含 CC 社区改编）、下载链（公开基址→mirror→同源兜底，无 GitHub/jsDelivr）、IndexedDB 持久 + localStorage 回退（4MB 上限）、伦敦假面战役规则/反派/主状态。
- **已知边界**：itch.io 一键 PDF 导入常因 CORS 失败（架构文档已说明，推荐本地文件选择器）。
- **优化建议**：① 下载失败时把"改用本地 PDF 转换"引导直接做进错误 toast；② `LS_FALLBACK_MAX_BYTES` 超限时给出更明确的清理指引。

### 10. 状态 State（`state/*.mjs`：core/ui/gameplay/selection/kp_config）— 8/10

- **DONE**：Vue 响应式 `gameState`、选中角色裁剪 `clampSelectedCharIndex`、KP 偏好持久（`kp_config`）、`enterModule` 完整重置、Toast/确认框。
- **PARTIAL**：`state/core`、`state.js` 需 `window.Vue`，无法 Node 直测（结构性限制）；`showToast/confirmAction` 边界未测。
- **优化建议**：推进 `?esm=1` Phase 2 与 jsdom + Vue mock 层，逐步把状态层纳入自动化。

### 11. PWA/构建（`sw` + `scripts/build_browser.mjs` + `fetch_vendor` + `asset_manifest`）— 8/10

- **DONE**：单源 `.mjs`→`build:js` 生成 `.js`（`build:js:check` + `verify_browser_exports` 门禁）、SW 相对 scope（子目录部署）、iOS PWA meta、内联 icon sprite（`file://` 可用）、vendor 本地化 + CDN 兜底、SW 内容哈希由 `python build.py` 注入。
- **风险点**：**发布必须走 `python build.py`**，否则 SW 缓存哈希不更新 → 用户拿到旧缓存。
- **优化建议**：① 在 README/发布清单顶部醒目标注"禁止手工打包，必须 `python build.py`"；② CI 增加"SW 哈希与产物一致性"校验，防止漂移。

### 12. UI/组件（13 components + 4 views + `icon_sprite`）— 8/10

- **DONE**：零 `innerHTML/v-html/eval`（零 XSS 面）、响应式面板、空状态、a11y P1/P2（aria-live、键盘焦点）、崩溃页 Vue-only 白名单+转义。
- **PARTIAL**：组件层 jsdom 全量测试延后（需完整 Vue 环境）。
- **优化建议**：① 人工窄屏 + PWA 添加主屏走查；② 抽取更多纯函数到 `*_helpers.mjs`（已有 combat/chat helpers），扩大可单测面。

### 13. 测试/CI — 7/10

- **DONE**：`tests/` 共 46 个文件，`run_all_smoke.js` 聚合 39 套件；`ci:smoke` = 全量 smoke + build drift + exports；迁移 fixture v1–v7；`flow_lobby_combat_smoke` E2E（Node VM）；`deep_verify` 0/179。
- **缺口**：jsdom 层偏浅（state/ai/components 需浏览器模拟）；无真浏览器 Playwright E2E；边界单测（HealingEngine、extreme 难度、enemy 路径、年龄边界）待补。
- **优化建议**：见路线图中期项。

---

## 三、跨模块优化路线图

### 短期（发布前 / P1-P2，沟通与低风险）

1. **复跑门禁**：`npm test`（39/39）+ `npm run ci:smoke`。
2. **发布说明明示两处 wontfix**：战斗动作菜单为引导性、KP 默认开启且伦敦规则为全局底层协议。
3. **构建纪律**：README/清单顶部标注"必须 `python build.py` 出包（自动注入 SW 哈希）"。
4. **人工走查**：键盘 Tab（大厅→建卡→叙事→战斗→存/读档）+ 窄屏 + 断网离线刷新 + PWA 添加主屏。
5. **小补强**：设置页隐私提示 + KP 开关 tooltip。

### 中期（发布后，P3 质量）

6. 补边界单测：`applyAgeModifiers` 分档、`checkSkill` extreme、`resolveCombatExchange`/`resolveBurstFire`、`HealingEngine`、`getSkillValue` enemy 路径、`saveGame` 配额溢出。
7. jsdom + Vue mock 层：`esm_state`/`esm_ai` 深化，纳入 `processTools` 调度测试。
8. KP 引擎/反派 tick 随机源统一走可注入队列，提升确定性回归。
9. 线索网络图布局优化（大量节点重叠可读性）。

### 长期（架构演进，ROADMAP_V18）

10. 引入 Playwright 真浏览器 E2E（替代/补充 Node VM flow）。
11. 推进 ESM Phase 2 完全脱离 `window.*`（`index.html` 现仍保留 IIFE 回退）。
12. `window.*` 全局命名统一 + `.mjs/.js` 双轨收敛；清理 `isActive`/`CoCLondonKpEngine` 遗留别名。

---

## 四、与 wontfix 设计边界的区分（避免误判为缺陷）

| 现象 | 定性 | 依据 |
|------|------|------|
| 战斗不强制每回合展示/确认完整动作菜单 | **设计取舍 / wontfix** | 引擎只强制"纯伤害免疫"等规则，菜单为 prompt/UI 引导；见 `ARCHITECTURE.md` 战斗交互模型 |
| KP 协议引擎默认开启、伦敦规则为全局底层协议 | **设计取舍 / wontfix** | `ROADMAP.md` 已知取舍；`_kpDefaultEnabled` 默认 true |
| itch.io 一键 PDF 导入常失败 | **外部 CORS 约束**，非 bug | 推荐本地文件选择器；`ARCHITECTURE.md` |
| API Key 明文存客户端 | **纯前端固有约束** | 默认仅 `sessionStorage`，可选记住 |
| state/ai/组件层无 Node 单测 | **环境结构性限制** | 需 Vue/DOM，属测试深度而非功能缺口 |
| 发布前人工走查（离线/PWA/Tab） | **QA 流程项**，非代码缺陷 | 发布清单 |

> 本次源码 spot-check **未发现新的、未文档化的严重 bug**：`BUG_FIX_BATCH.md` 记录的 BUG-001/002/003（a11y 键盘 + 死代码 `formatText`）在源码中已确认修复到位（`toggleRoomDetail`/`toggleClueDetail` 存在，`formatText` 已移除）。
