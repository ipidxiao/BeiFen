# CoC Engine V16.4 AUDITFIX7 Report

本轮基于 `CoC_Engine_V16_4_AUDITFIX6.zip` 继续进行真实源码修复，重点不是新增玩法，而是把长期维护风险继续压低：Tool Handler 模块化、旧存档迁移往返、浏览器级 UI smoke 回归。

## 1. Tool Handler 模块化

### 新增文件

```text
js/tool_handlers.js
```

### 调整内容

- 将 `ai_logic.js` 内原本巨大的 `toolHandlers` 对象拆出到 `CoCToolHandlers.create(State, Engine)`。
- `ai_logic.js` 现在只负责：
  - AI 请求；
  - Tool Round 防循环；
  - Tool 参数校验；
  - Tool 调用调度；
  - pending skill check 续写。
- `tool_handlers.js` 负责所有会改变状态的 Tool Handler。
- 新增 `CoCAI.dispatchToolHandler()` 与 `CoCAI.getToolHandlers()`，测试可直接调用 handler，不再必须 mock AI tool-call response。
- `index.html` 已加入：

```html
<script src="./js/tool_handlers.js"></script>
```

并保证加载顺序为：

```text
tool_definitions.js → state.js → tool_handlers.js → ai_logic.js
```

## 2. 存档迁移修复

### Schema

```text
SAVE_SCHEMA_VERSION = 7
```

### 修复点

AUDITFIX6 已为旧存档中的 `combat.enemies` 补齐 `isEnemy: true`，但旧存档里的 `initiativeOrder` 敌人条目如果缺少 `isEnemy`，载入后仍可能被 `cleanupInitiativeOrder()` 当作调查员条目清理掉。

AUDITFIX7 已补齐迁移逻辑：

- 旧敌人没有 `id` 时自动生成稳定迁移 id；
- 旧敌人 `hp / maxHp / armor / isDefeated` 会统一规范化；
- `initiativeOrder` 中按 `id/name` 匹配到敌人的条目会补齐：

```text
isEnemy: true
```

- `initiativeOrder.initiative` 会统一转换为数字；
- `selectedCharIndex` 支持字符串数字并统一 clamp。

## 3. 导入/导出与 v1-v6 迁移往返测试

新增：

```text
tests/auditfix7_migration_smoke.js
```

覆盖：

- v1 flat save；
- v2-v6 structured save；
- 所有版本迁移到 schema 7；
- 旧 `combat.enemies` 补齐 enemy id / isEnemy；
- 旧 `initiativeOrder` 敌人条目保留为敌方回合；
- pending `request_skill_check` 在 load/save 往返后仍保留未解决状态；
- local-only UI 消息不会写入正式存档；
- 通过 `_buildSaveData → _restoreFromData` 验证导出 payload 可恢复。

## 4. Handler 直接调用测试

新增：

```text
tests/auditfix7_handler_smoke.js
```

覆盖：

- `CoCToolHandlers` 模块加载；
- handler registry 与 Tool Catalog 一致；
- `ai_logic.js` 不再持有 handler object literal；
- `update_inventory / consume_inventory_items` 直接状态变更；
- `create_map / set_position` 直接状态变更；
- `start_combat / fire_weapon / enemy_attack` 直接状态变更；
- `dispatchToolHandler()` 可直接触发 handler。

## 5. 浏览器级 UI Smoke 回归

新增：

```text
tests/auditfix7_browser_smoke.js
```

覆盖：

- 按 `index.html` 的真实 script 顺序加载本地脚本；
- root app 可挂载到 `#app`；
- 关键组件注册：
  - `view-lobby`
  - `view-creator`
  - `view-story`
  - `view-dev-log`
  - `coc-toast-layer`
  - `coc-confirm-dialog`
- root setup 暴露 `handlePlayerAction / saveGame`；
- 源码中无直接 `alert(...) / confirm(...)`；
- Toast 状态可写入；
- Confirm 组件可 resolve；
- Story save modal 可从 setup API 打开。

## 6. 回归验证命令

已从最终工作目录执行：

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
node tests/auditfix5_smoke.js
node tests/auditfix6_smoke.js
node tests/auditfix7_migration_smoke.js
node tests/auditfix7_handler_smoke.js
node tests/auditfix7_browser_smoke.js
```

结果：

```text
AUDITFIX3 smoke tests passed
AUDITFIX4 smoke tests passed
AUDITFIX5 smoke tests passed
AUDITFIX6 smoke tests passed
AUDITFIX7 migration smoke tests passed
AUDITFIX7 handler smoke tests passed
AUDITFIX7 browser smoke tests passed
```

## 7. 下一轮建议：AUDITFIX8

建议继续做：

1. 将 `tool_handlers.js` 再拆成领域模块：
   - `tool_handlers_inventory.js`
   - `tool_handlers_combat.js`
   - `tool_handlers_clues.js`
   - `tool_handlers_npc.js`
2. 增加浏览器真实 DOM/e2e 测试；
3. 增加 AI 响应 malformed `tool_calls` 专项回归；
4. 增加存档 schema fixture 文件夹，长期保留 v1-v7 历史样本。
