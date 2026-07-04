# Ground Truth Canvas — CoC 7th 引擎 (V16.5 程序员版 — Production Ready)

## 核心不变约束
1. **叙事/机制分离**：AI 生成纯叙事文本；系统处理骰子、HP、背包、地图等所有机制状态。
2. **零停顿执行**：连续叙事驱动，无人工分阶段介入。
3. **数据完整性**：通过 `CoCState`（Vue 3 reactive）持久化到 localStorage，支持多模组独立存档。
4. **工程规范**：遵循 Google Engineering Practices；核心规则计算必须有测试覆盖；禁止 eval / document.write / alert。

## 系统架构

```
CoC 7th Engine (纯前端 SPA)
├── index.html                     # 单入口，所有脚本按依赖顺序加载
├── css/style.css                  # 全局暗色主题样式
├── js/
│   ├── data/                      # 静态游戏数据
│   │   ├── jobs.js                # 职业表 (原 jobs_part1+2 已合并)
│   │   ├── ai_prompt_config.js    # AI守秘人系统提示词 (15法则/武器表/关键词拦截)
│   │   ├── experiences.js         # 经历包
│   │   ├── items.js               # 物品数据
│   │   ├── dev_logs.js            # 开发者日志
│   │   ├── insanity_tables.js     # 理智表(疯狂发作/恐惧症)
│   │   ├── injury_tables.js       # 重伤部位表(D20)
│   │   ├── mythos_tomes.js        # 神话典籍数据
│   │   ├── spells.js              # 法术数据
│   │   ├── npc_templates.js       # NPC/怪物属性模板
│   ├── coc.js                     # CoC 7th 规则引擎 (490行)
│   │   └── 导出: CoCEngine (IIFE → window.CoCEngine)
│   │   └── 职责: 骰子、技能检定、属性衍生、战斗结算、技能别名表
│   ├── core/
│   │   └── context_manager.js     # 长战役消息裁剪器 (199行)
│   │       └── 三元策略: runtime 260条 / save 180条 / API 48条
│   ├── tools/
│   │   ├── definitions.js         # Tool Schema 统一定义 (384行)
│   │   │   └── 导出: CoCToolDefinitions → buildTools() / getSchema()
│   │   └── handlers/              # 8 个领域 Tool Handler 模块
│   │       ├── character.js       # 角色状态 / 技能检定回调
│   │       ├── inventory.js       # 物品增删 / 枪弹分离
│   │       ├── dice.js            # 自定义骰子 / 群体检定 / 对抗
│   │       ├── clues.js           # 线索登记 / 关联 / 状态标记
│   │       ├── map.js             # 地图绘制 / 房间更新 / 位置移动
│   │       ├── combat.js          # 战斗启停 / 敌人更新 / AI攻击
│   │       ├── npc.js             # NPC 注册 / 状态变更
│   │       ├── system.js          # 系统告警 / 开发者日志
│   │       └── index.js           # Tool Handler 注册中心 (91行)
│   │           └── 导出: CoCToolHandlers.create(State, Engine) → handlers{}
│   ├── state.js                   # Vue 3 响应式状态机 (920行)
│   │   └── 导出: CoCState → gameState(reactive) + playerInput(ref)
│   │   └── 职能: 存档管理(LocalStorage SAVE_SCHEMA_VERSION=7)、Toast/Confirm、
│   │            容量估算、多模组切换
│   ├── ai_logic.js                # AI 集成核心 (577行)
│   │   └── 导出: CoCAI (IIFE, 依赖 State + Engine)
│   │   └── 职能: DeepSeek API 调用(带重试/超时)、Tool 调度与回滚、
│   │            技能检定回调、叙事监听器、关键词拦截注入
│   ├── char_creator.js            # 车卡系统 (315行)
│   │   └── 导出: CoCCreator (IIFE, 依赖 State + Engine + Vue)
│   ├── components/                # Vue 组件 (13个)
│   │   ├── story_chat.js          # 聊天消息渲染与输入
│   │   ├── story_char.js          # 角色状态面板
│   │   ├── story_inv.js           # 随身物品
│   │   ├── story_store.js         # 仓库
│   │   ├── story_journal.js       # 日志
│   │   ├── story_npc.js           # NPC 关系网络
│   │   ├── story_combat.js        # 战斗面板
│   │   ├── story_growth.js        # 成长阶段
│   │   ├── story_map.js           # SVG 地图
│   │   ├── story_clues.js         # 线索板
│   │   ├── story_dice.js          # 骰子台(含推动检定)
│   │   ├── sanity_effects.js      # SAN视觉反馈(暗化/震动)
│   │   └── ui_feedback.js         # Toast / Confirm 弹窗
│   ├── views/                     # 页面级视图 (4个)
│   │   ├── lobby_view.js          # 大厅(模组管理/设置/角色)
│   │   ├── creator_view.js        # 角色创建
│   │   ├── story_view.js          # 剧情主界面(Tab 容器)
│   │   └── dev_log_view.js        # 开发者日志
│   └── app.js                     # Vue 应用组装工厂 (40行)
│       └── 安全挂载 + mount('#app')
├── tests/                         # 自动化测试 (12个 smoke + 1个回归)
│   ├── engine_tests.js            # 核心引擎回归 (11 tests)
│   ├── auditfix3_smoke.js         # 基础功能
│   ├── auditfix4_smoke.js         # 角色/背包
│   ├── auditfix5_smoke.js         # 线索/NPC
│   ├── auditfix6_smoke.js         # 战斗/地图
│   ├── auditfix7_migration_smoke.js    # 存档迁移
│   ├── auditfix7_handler_smoke.js      # Handler 注册
│   ├── auditfix7_browser_smoke.js      # 浏览器端
│   ├── auditfix8_malformed_tool_calls_smoke.js  # 异常 Tool Call
│   ├── auditfix8_verification_smoke.js          # 验证
│   ├── auditfix8_secondary_skill_visibility_smoke.js  # 技能可见性
│   ├── auditfix8_review_functional_smoke.js     # 功能回归
│   └── auditfix8_file_integrity_smoke.js        # 文件完整性
└── docs/
    ├── ENGINEERING.md              # 工程规范
    ├── ground_truth_canvas.md      # 本文件
    ├── humanpending.md             # 人工决策待办（当前空）
    └── audit/                      # 审计报告链 (10份)
        ├── AUDITFIX2_REPORT.md ~ AUDITFIX8_REPORT.md
        └── AUDITFIX8_FILE_RECHECK_REPORT.md
```

## 外部依赖
- **Vue 3** (CDN: unpkg) — 响应式 UI 框架
- **Bootstrap 5.3** (CDN: jsdelivr) — UI 组件库
- **Chart.js** (CDN: jsdelivr) — 雷达图/属性可视化
- **DeepSeek API** (`api.deepseek.com/chat/completions`) — AI 叙事引擎

## 关键架构决策
1. **全局命名空间** (`window.*`): 不依赖构建工具，纯 `<script>` 标签按依赖顺序加载。ES Module 迁移是 V17 目标。
2. **Tool 系统分层**: definitions（Schema 定义）→ handlers（领域逻辑）→ index.js（注册中心）→ ai_logic.js（调度），清晰分离。
3. **状态快照回滚**: AI 工具调用前生成快照，执行失败时回滚，保证状态一致性。
4. **防崩溃装甲**: index.html 劫持 JS Error / Promise Rejection / Vue Error / 组件缺失警告，统一展示 fatal error 页面。
5. **叙事监听器**: 正则扫描 AI 叙事文本，自动触发线索发现、场景切换——AI 不必显式调用这些工具也能驱动系统状态。

## 变更历史
- **V16.5 程序员版** (2026-07): 跨角色协作整合 — MANIFEST.yaml文件归属清单(102文件→4角色)、merge.py无损合并脚本(哈希比对+冲突阻止)、PROGRAMMER.md/INTEGRATION.md整合指南。测试覆盖补齐(+23 assertions: HealingEngine/age边界/enemy路径/extreme难度/MajorWound/Sanity/Mythos)。ESM轨道完整同步(coc.mjs+405行,definitions.mjs+50行,persistence.mjs+IDB,ui.mjs+rAF)。安全性增强(story_inv tooltip escapeHtml 7处, Tauri CSP硬化+img-src/font-src/frame-ancestors)。内联样式迁移(42处→CSS工具类)。Tauri图标补齐。18/18测试全绿。
- **V17 RC1** (2026-07): 三大核心机制完善 — 理智系统(临时/不定疯狂/D10发作/恐惧症/狂躁症/现实认知)、魔法典籍系统(5典籍+20法术)、重伤部位系统(D20表+濒死检定)。推动检定(Pushed Roll)、运气消费、22经历包、武器连射、NPC模板(17种)。SAN视觉反馈(暗化/震动/脉冲)。大失败规则修正。CDN全部本地化。18/18测试全绿。
- **V16.4** (2026-06): 文件完整性复核 — 移除发布页测试自动加载、innerHTML 转义防护、文件加载链验证、危险 API 扫描、嵌套 zip 清理。
- **V16.3 AUDITFIX7**: Tool 系统模块化拆分 — 8 个领域 handler 独立文件、Tool 注册中心、存档迁移 Schema v7。
- **V16.2 AUDITFIX6**: 战斗/地图系统深修 — 多轮战斗自动化、地图绘制与房间状态、线索板关联。
- **V16.1 AUDITFIX5**: 长战役优化 — Context Manager 三元裁剪、存档容量预警、消息截断。
- **V16.0** (2026-05-30): 基础重构版本 — 100% 对齐 V15 逻辑，修复 UI 渲染/依赖注入/跨组件状态同步。
- **V15** (2026-05-25): 角色/背包同步修复、气氛持久化、叙事监听器增强。
- **V14** (2026-05-25): 零停顿自动化、CombatEngine 2.0、叙事关键词监听。
