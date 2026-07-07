# BUG 修复批次 — 2026-07-06

> 基线：`27939ed` · 门禁：`npm test` 39/39 · `npm run ci:smoke` PASS

## 发现方法

| 步骤 | 结果 |
|------|------|
| `npm test` | 39/39 PASS（修复前无失败） |
| `npm run ci:smoke` | PASS，`build:js --check` 无 drift |
| `tests/deep_verify.mjs` | 0 bugs, 179 checks |
| `docs/PRE_RELEASE_AUDIT.md` P1 | 无阻塞项；P2 wontfix（战斗菜单、KP 全局规则）已排除 |
| TODO/FIXME/HACK grep | 0 命中 |
| `coverage_gap_smoke.js` | ALL PASSED |
| 源码 spot-check | 发现 a11y 键盘处理与死代码问题 |

## BUG 清单

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| BUG-001 | P1 | `story_clues` | 关联视图 SVG 节点 `@keydown` 调用未定义的 `toggleClueDetail`，键盘 Enter/Space 运行时失败 | **fixed** |
| BUG-002 | P2 | `story_map` | 地图 SVG 节点键盘触发 `goToRoom`（AI 移动），鼠标点击仅切换 `selectedRoom`，行为不一致 | **fixed** |
| BUG-003 | P3 | `state/ui` | `formatText` 死导出，从未消费且含 `<br>` 注入模式，与零 XSS 策略不符 | **fixed** |

## 排除项（非 BUG）

| 项 | 原因 |
|----|------|
| 战斗动作菜单非强制 | intentional design / wontfix |
| KP 默认开启 + 伦敦规则全局底层 | intentional design / wontfix |
| 发布前人工走查（离线/PWA/Tab） | QA 流程，非代码缺陷 |
| Playwright E2E / `window.*` 统一 | ROADMAP backlog |
| 设置页隐私提示 / KP tooltip 补强 | P2 增强，大厅已有 KP 说明与密钥存储提示 |

## 修复摘要

- **BUG-001**：在 `story_clues.mjs` 增加 `toggleClueDetail(clue)`，与 click 逻辑一致。
- **BUG-002**：在 `story_map.mjs` 增加 `toggleRoomDetail(room)`；SVG 节点 click/keyboard 统一为选中切换，「前往此处」按钮仍调用 `goToRoom`。
- **BUG-003**：从 `ui.mjs` / `state.mjs` 移除 `formatText`；`npm run build:js` 同步 `.js`。
- **回归**：`a11y_smoke.js` 增加 `toggleClueDetail` / `toggleRoomDetail` 存在性检查。

## 验证

```bash
npm test
npm run ci:smoke
```

---

# BUG 修复批次 — 调查员创建流程 (2026-07-07)

> 门禁：`npm test` · `npm run ci:smoke`

## BUG 清单

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| BUG-004 | P1 | `char_creator` / `creator_view` | 掷骰生成后多维雷达图不显示（Chart.js 已加载但 canvas 未挂载即渲染） | **fixed** |
| BUG-005 | P2 | `creator_view` | 技能分配「+」按住无法连续加点（逻辑已有但未绑定 UI） | **fixed** |
| BUG-006 | P1 | `char_creator` / `story_char` / `lobby_view` | 快速开始预置调查员未写入 `gameState.roster`，剧情人物页空白并陷入重建循环 | **fixed** |

## 修复摘要

- **BUG-004**：`renderRadarChart` 在 `chartUnavailable` 切换与 `v-if` 挂载后双重 `nextTick` 重试；监听 `attrs.STR` 在掷骰后补绘。
- **BUG-005**：本职/兴趣「+」按钮绑定 `mousedown`/`touchstart` → `startAutoAdd`，`mouseup`/`mouseleave`/`touchend` → `stopAutoAdd`。
- **BUG-006**：`applyPreset` 经 `commitPresetToRoster` 直接登记预置角色并跳转剧情；人物页空态增加「创建调查员」「返回大厅」；小队管理页增加返回按钮。

## 验证

```bash
npm run build:js
npm test
npm run ci:smoke
```

新增 `tests/char_creator_flow_smoke.js` 覆盖预置登记与 UI 绑定。

## 复审补丁（2026-07-07 夜）

复审 `5fddcaa` 后确认 BUG-004/005/006 的主修方向正确，但仍有两个端到端缺口：

- **BUG-004 补强**：原 smoke 只检查源码存在重试逻辑，未真正触发 `rollAllStats()`。现已在 VM 中执行浏览器版 `char_creator.js`，掷骰后等待 `nextTick` 并断言雷达图 Chart 实例被创建。
- **BUG-005 补强**：原 smoke 只检查模板绑定，未验证长按定时器。现已直接调用 `startAutoAdd`，模拟延迟后的 interval，断言本职技能会持续 +5，`stopAutoAdd` 会清理定时器。
- **BUG-006 再修**：`startLocalScenario` 的 `pendingScenarioId` 原本只存在 `ViewLobby.data()`，进入创建页时大厅组件卸载，导致「快速开始 → 无角色 → 创建/预置」后无法续接剧本；预置提交后也只依赖 8 秒自动存档 watcher，立即刷新/返回可能丢角色。现改为写入 `gameState.scenarioRunner.pendingScenarioId`，预置提交后启动待开始剧本、清空 pending，并立即 `saveGame('auto', '自动存档')`。
- **人物页 UX 补强**：`story_char` 增加「返回剧情」按钮，并把空态的「管理小队」改为「管理/启用调查员」，避免用户在人物页无明显返回路径。

复审后 `tests/char_creator_flow_smoke.js` 覆盖：

- 投掷生成 → 雷达图创建；
- 技能分配 `+` → 长按自动重复；
- 快速开始待剧本 → 预置调查员登记 → 剧本续接 → 自动存档；
- 剧情人物页 → 返回剧情事件绑定。

## 复审补丁 2（2026-07-07 夜）

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| BUG-007 | P1 | `story_char` | 剧情「人物」页仍偏小队管理状态，活跃角色索引可能取错，未稳定显示完整人物卡 | **fixed** |
| BUG-008 | P1 | `char_creator` / `skills` | 选择「杂技演员」后本职剩余可能显示负数（例如 `-70`），职业公式和旧本职加点切换缺少保护 | **fixed** |

### 修复摘要

- **BUG-007**：`story_char` 改为剧情内人物卡：姓名、职业/经历、HP/MP/SAN、STR/CON/POW/DEX/APP/EDU/SIZ/INT/LUCK、技能摘要、装备与返回剧情；活跃角色按钮按 roster 原索引同步，预置快速开始角色会直接显示完整资料。
- **BUG-008**：职业点公式解析兼容 `+`/`＋`、`x`/`×` 与中英文属性名；职业切换会清理旧本职加点；点数面板显示值夹到非负，超支单独提示并继续阻止归档。

### 验证

```bash
npm run build:js
npm test
npm run ci:smoke
```

`tests/char_creator_flow_smoke.js` 新增覆盖：杂技演员本职剩余非负、超支单独追踪；剧情人物页能从 roster 渲染预置调查员属性与技能摘要。
