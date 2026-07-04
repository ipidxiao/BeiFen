# CoC Engine V16.4 AUDITFIX4 Report

基线：`CoC_Engine_V16_4_AUDITFIX3.zip`  
目标：继续处理长期战役稳定性，重点补齐 AI Tool 输入边界、AI 请求瞬时失败恢复、pending skill check 存档恢复测试与 localStorage 容量预警。

---

## 1. 本轮修复摘要

### P1 / P2：AI Tool 参数 schema 校验

修改文件：

- `js/ai_logic.js`

新增：

- `TOOL_ARGUMENT_SCHEMAS`
- `parseToolArguments()`
- `normalizeToolValue()`
- `validateToolArguments()`

覆盖当前 AI Tool：

- `request_skill_check`
- `update_character_status`
- `update_inventory`
- `consume_inventory_items`
- `system_alert`
- `fire_weapon`
- `register_npc`
- `update_npc_status`
- `start_combat`
- `end_combat`
- `update_enemy`
- `enemy_attack`
- `create_map`
- `update_room`
- `set_position`
- `add_clue`
- `link_clues`
- `mark_clue_status`
- `roll_dice`
- `group_roll`
- `opposed_roll`
- `record_engine_log`

行为变化：

- malformed JSON 不再静默降级为 `{}`。
- 缺少 required 参数时不再进入 handler。
- enum 参数越界时直接返回 tool error。
- number 参数支持安全数字字符串转换，例如 `"3" → 3`。
- 物品列表、角色列表、changes 等字符串标量可安全规范化为单元素数组。
- 过长字符串参数限制为 2000 字符。
- 过长数组限制为 40 项，并给出校验错误。

修复价值：

- 阻断模型误调用导致的状态污染。
- 避免 `undefined` 参数进入战斗/地图/线索 handler。
- 让模型看到明确 tool error 后有机会自我修正。

---

### P1：AI fetch retry/backoff

修改文件：

- `js/ai_logic.js`

新增：

- `AI_REQUEST_MAX_ATTEMPTS = 3`
- `DEFAULT_AI_RETRY_BACKOFF_MS = [0, 800, 1600]`
- `isRetryableAiError()`
- `formatAiError()`
- `fetchAiCompletionWithRetry()`

重试条件：

- `AbortError`
- `TypeError` 网络/CORS 级失败
- HTTP `408 / 409 / 425 / 429`
- HTTP `5xx`

不重试：

- HTTP `400`
- HTTP `401 / 403`
- 非临时格式错误
- 已达到最大尝试次数

UI 行为：

- 每次重试写入本地 system notice：`🔁 [AI重试] ...`
- 成功恢复后写入：`✅ [AI连接] 第 N 次尝试成功...`
- 最终失败时显示尝试次数与失败类型。

---

### P2：localStorage 空间预估 UI

修改文件：

- `js/state.js`
- `js/views/story_view.js`
- `js/views/lobby_view.js`

新增状态：

```javascript
storageStatus: {
  usedBytes,
  quotaBytes,
  usedRatio,
  currentSaveBytes,
  projectedBytes,
  projectedRatio,
  warning,
  lastCheckedAt
}
```

新增导出：

- `getStorageStatus(slotKey, slotName, payloadOverride)`
- `formatStorageBytes(bytes)`

UI 改动：

- 剧情内存档 Modal 显示：
  - 当前 localStorage 估算用量
  - 本次存档预估大小
  - 写入后预计占比
  - 接近上限时的 warning
- 大厅存档管理页显示同样的容量信息。

预警阈值：

- `>= 80%`：关注自动存档
- `>= 90%`：建议导出备份
- `>= 98%`：建议导出备份并清理旧存档

说明：

浏览器没有统一可靠的同步 localStorage quota API，本实现采用 5MB 实用基线估算，主要用于提前预警，不替代真实写入异常捕获。真实写入失败仍由 AUDITFIX2 的 `_safeLocalStorageSetItem()` 兜底。

---

### P2：pending skill check 存档恢复专项测试

新增文件：

- `tests/auditfix4_smoke.js`

覆盖：

- `request_skill_check` 未完成状态保存。
- 载入后 pending assistant tool_call 仍保留。
- 存档 schema 已升级到 `5`。
- 不产生 orphan tool response。

---

## 2. SAVE_SCHEMA_VERSION

本轮将：

```javascript
SAVE_SCHEMA_VERSION = 5
```

原因：

- 新增 storage 估算状态与存档容量诊断信息。
- 强化存档恢复链测试。
- 明确 AUDITFIX4 与 AUDITFIX3 的存档产物边界。

迁移器仍兼容旧结构：

- v1/v2 风格的扁平存档会包装进 `data`。
- v3/v4 存档会保留已有字段并升级版本号。
- chatHistory 仍通过 `ContextManager.trimForSave()` 裁剪。

---

## 3. 验证记录

执行：

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
```

结果：

```text
AUDITFIX3 smoke tests passed
AUDITFIX4 smoke tests passed
```

AUDITFIX4 smoke 覆盖：

- Tool 参数 schema 校验。
- malformed JSON 拦截。
- transient HTTP 500 后自动 retry 并恢复。
- retry notice 写入 chatHistory。
- pending `request_skill_check` 存档与恢复。
- schema version 5 写入。
- localStorage 空间预估与 near-quota warning。

---

## 4. JSON.parse / alert / confirm 审计

源码中直接浏览器弹窗调用：

```text
alert(...): 0
confirm(...): 0
```

`JSON.parse` 当前分布：

- `safeJsonParse()` 内部统一入口。
- `parseToolArguments()` 内部 Tool 参数解析入口。
- `JSON.parse(JSON.stringify(...))` 深拷贝路径。

外部输入解析已避免散落到业务 handler 中。

---

## 5. 已知剩余风险 / 下一轮建议

### AUDITFIX5 建议

1. 将 `tools` 定义与 `TOOL_ARGUMENT_SCHEMAS` 合并为单一源，避免未来新增 Tool 时漏同步。
2. 为 Tool handler 增加 dry-run / rollback 更细粒度审计日志。
3. 对 `create_map` 的房间连接图做拓扑校验：孤立房间、重复 ID、非法坐标。
4. 对 `roll_dice` 增加 notation schema 校验，防止无效骰子表达式进入 handler。
5. 增加浏览器端 Playwright/Cypress 级 UI 回归：保存 Modal、Confirm Dialog、Toast Layer、战斗面板。

---

## 6. 结论

AUDITFIX4 的主要价值不是增加功能，而是加强“边界输入”和“网络瞬断”的抗压能力：

- AI 工具参数不再靠 handler 被动容错。
- AI 请求不再因一次瞬时失败直接中断。
- 存档前能看到空间压力。
- pending skill check 的存档恢复链已有专项回归测试。

建议仍将本包视为审计修复版；若要进入 Final，需要再做一轮 UI 自动化与 Tool 单一源重构。
