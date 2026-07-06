# 测试覆盖缺口分析

> V16.4 Final | 14 test suites | 72 ESM + 34 engine + 12×N smoke assertions

## 一、覆盖矩阵

### 数据层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| `skills.js/mjs` | ✅ auditfix3-8 | ✅ esm_smoke (50 keys) | 无 |
| `jobs.js/mjs` | ✅ | ✅ esm_smoke (134 entries) | 无 |
| `experiences.js/mjs` | ✅ | ✅ esm_smoke | 无 |
| `items.js/mjs` | ✅ | ✅ esm_smoke (parseItemData) | 无 |
| `dev_logs.js/mjs` | ✅ | ✅ esm_smoke | 无 |
| `utils.js/mjs` | ✅ 间接 | ⬜ | **新增，无独立测试** |
| `logger.js/mjs` | ✅ 间接 | ⬜ | **新增，无独立测试** |

### 引擎层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| `coc.js/mjs` | ✅ | ✅ 51 assertions | HealingEngine 未测试 |
| `checkSkill` | ✅ | ✅ 3 cases | extreme difficulty 未测试 |
| `CombatEngine` | ✅ | ✅ compareSuccess + calculateDamage | resolveCombatExchange 边界未覆盖 |
| `applyAgeModifiers` | ✅ | ✅ 3 age brackets | 边界值 (14, 15, 19, 40, 70+) 未全覆盖 |
| `getSkillValue` | ✅ | ✅ 7 alias patterns | enemy 角色路径未测试 |
| `isVisibleSkillName` | ✅ | ✅ | 无 |

### 工具层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| `definitions.js/mjs` | ✅ auditfix8 (schema audit) | ✅ esm_smoke (buildTools/getSchema) | 无 |
| `handlers/*.js` | ✅ auditfix7_handler | ⬜ | **无 ESM 导入测试** |
| `handlers/index.js` | ✅ | ✅ esm_smoke | 无 |

### 状态层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| `state/core.js` | ✅ | ⬜ | **需 window.Vue，无法 Node 测试** |
| `state/ui.js` | ✅ auditfix3 (compactChatHistory) | ⬜ | showToast/confirmAction 边界未测试 |
| `state/gameplay.js` | ✅ auditfix4-8 | ⬜ | 大部分 smoke 覆盖 |
| `state/persistence.js` | ✅ auditfix7_migration | ⬜ | saveGame/loadGame 边界未测试 |
| `state.js` | ✅ | ⬜ | **需 window.Vue** |

### AI 层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| `ai/network.js` | ✅ | ✅ esm_smoke (import verify) | fetchWithTimeout/fetchAiCompletionWithRetry 需网络 mock |
| `ai/tool_dispatch.js` | ✅ | ✅ esm_smoke (import verify) | normalizeToolValue 边界未测试 |
| `ai_logic.js` | ✅ auditfix8 | ⬜ | **需 window.CoCState/Engine，无法 Node 测试** |

### UI 层
| 模块 | .js smoke | .mjs smoke | 覆盖缺口 |
|------|----------|-----------|---------|
| 13 components | ✅ auditfix7_browser | ⬜ | **需完整 DOM 环境** |
| 4 views | ✅ | ⬜ | **需完整 DOM 环境** |

## 二、缺口汇总

| 严重度 | 数量 | 说明 |
|--------|------|------|
| 🔴 阻塞 | 0 | 所有功能路径有覆盖 |
| 🟡 需 jsdom | 6 | state/ai/components/views 的 ESM 测试需要浏览器模拟 |
| 🟢 边界未覆盖 | 4 | HealingEngine, extreme difficulty, enemy路径, age边界 |
| ⚪ 新模块 | 2 | utils.js, logger.js 无独立测试 |

## 三、建议补充的测试

### 高优先级 (🟡)
1. **ESM state 测试** — 使用 jsdom 模拟 `window.Vue` + `localStorage`，测试 state import 链
2. **ESM ai_logic 测试** — mock `CoCState`/`CoCEngine`，测试 `processTools` 调度逻辑

### 中优先级 (🟢)
3. **HealingEngine** — mock 角色 + 物品，测试 applyHealing 各分支
4. **checkSkill extreme** — 补充 extreme 难度测试 (target = skill/5)
5. **applyAgeModifiers 边界** — age 14 (no change), 15, 19, 40, 70
6. **getSkillValue enemy 路径** — `char.isEnemy` 分支

### 低优先级 (⚪)
7. `normalizeToolValue` — string/number/array/object 各类型边界
8. `fetchWithTimeout` — AbortController mock 超时场景

## 五、已补充（2026-07-05 可选增强 backlog）

| 套件 | 路径 | 覆盖 |
|------|------|------|
| 存档 fixture 迁移 | `tests/save_migration_smoke.js` + `tests/fixtures/saves/v1–v7` | migrateSaveData / loadGame 全版本 |
| 大厅→战斗→存读 flow | `tests/flow_lobby_combat_smoke.js` | enterModule → start_combat → save → load（Node VM） |
| UI 纯函数 | `tests/ui/component_helpers_smoke.mjs` | combat_ui_helpers + chat_format_helpers |
| jsdom DOM 解析 | `tests/ui/dom_parse_smoke.mjs` | 最小 jsdom 依赖验证（AUDIT4-P3-08） |

## 六、2026-07-06 补充

| 套件 | 路径 | 覆盖 |
|------|------|------|
| utils/logger ESM | `tests/esm_utils_smoke.mjs` | safeJsonParse/Clone + CoCLog |
| tool_dispatch 边界 | `tests/esm_tool_dispatch.mjs` | normalizeToolValue 类型强制 |
| a11y 回归 | `tests/a11y_smoke.js` | P1/P2 模式存在于 .mjs 源码 |
| ESM Phase 2 引导 | `tests/esm_phase2_boot_smoke.mjs` | `?esm=1` 门闩 + coc.mjs 导入 |

运行：`npm test`（**39 suites**）或单独 `npm run test:e2e`。

## 四、工具建议

`jsdom` 已安装；最小套件见 `tests/ui/dom_parse_smoke.mjs`。扩展浏览器 mock 可参考：
```js
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>', { url: 'http://localhost' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
// Mock Vue reactive
globalThis.window.Vue = { reactive: x => x, ref: v => ({ value: v }), ... };
```

然后可以编写 `tests/esm_state.mjs` 和 `tests/esm_ai.mjs`。
