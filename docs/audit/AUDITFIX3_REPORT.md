# CoC Engine V16.4 AUDITFIX3 报告

基线：`CoC_Engine_V16_4_AUDITFIX2.zip`

本轮目标不是新增剧情功能，而是继续处理长期战役稳定性与 UI 阻塞风险：

1. AI 请求上下文无限增长
2. 存档体积随 chatHistory 膨胀
3. 浏览器原生 `alert/confirm` 阻塞主线程且风格不统一
4. 角色删除/停用后 selectedCharIndex 与 initiativeOrder 的边界链路

---

## 1. 新增 ContextManager

新增文件：

```text
js/context_manager.js
```

提供三个独立入口：

```javascript
window.CoCContextManager.trimRuntimeMessages(messages)
window.CoCContextManager.trimForSave(messages)
window.CoCContextManager.buildApiMessages(messages)
```

### 运行时裁剪

用于限制浏览器中长期保留的 reactive chatHistory 和 DOM 渲染压力。

默认上限：

```text
runtimeMaxMessages: 260
runtimeMaxChars:    180000
```

`state.compactChatHistory()` 会在以下时机触发：

```text
手动/自动存档前
AI 回复结束后
系统 notice 写入后
chatHistory.length > 280 的 Vue watch
载入存档后
```

### 存档裁剪

用于避免 localStorage 与导出 JSON 被历史聊天拖垮。

默认上限：

```text
saveMaxMessages: 180
saveMaxChars:    120000
```

`_buildSaveData()` 保存前会先调用：

```javascript
CoCContextManager.trimForSave(rawChatToSave)
```

并在存档中记录：

```javascript
contextMeta: {
  runtimeChatMessages,
  savedChatMessages
}
```

### AI 上下文裁剪

`ai_logic.js` 中原来的：

```javascript
gameState.chatHistory.filter(...).map(...)
```

已替换为：

```javascript
CoCContextManager.buildApiMessages(gameState.chatHistory)
```

默认上限：

```text
apiMaxMessages: 48
apiMaxChars:    60000
```

关键点：

- 保留 hidden system prompt
- 丢弃 local-only / local-error UI 消息
- 只保留最新一组有效 assistant.tool_calls + 对应 tool responses
- 旧工具调用簇会被折叠，避免发送 orphan tool message 给 API
- 最后一条 user 消息仍会被动态附加当前小队状态与系统铁律

---

## 2. UI Feedback 系统

新增文件：

```text
js/components/ui_feedback.js
```

新增组件：

```text
<coc-toast-layer>
<coc-confirm-dialog>
```

新增 State API：

```javascript
showToast(message, type, options)
confirmAction(message, options)
resolveConfirm(ok)
```

替换范围：

```text
js/char_creator.js
js/components/story_dice.js
js/components/story_growth.js
js/components/story_inv.js
js/components/story_journal.js
js/views/lobby_view.js
js/views/story_view.js
js/state.js
```

本轮后源码中不再存在直接的：

```javascript
alert(...)
confirm(...)
```

这样可以避免：

```text
原生弹窗阻塞 AI 流程
移动端弹窗体验不一致
浏览器安全策略/嵌入容器导致弹窗异常
```

---

## 3. 角色移除链路保护

新增 State API：

```javascript
removeCharacterAt(index)
```

行为：

```text
1. 从 roster 移除指定调查员
2. clampSelectedCharIndex(gameState)
3. cleanupInitiativeOrder()
4. 写入日志与系统 notice
```

大厅「调查员小队」界面新增：

```text
移除按钮
```

移除前通过统一 confirm dialog 确认。

---

## 4. 战斗队列联动增强

AUDITFIX2 已加入 `cleanupInitiativeOrder()`；本轮继续把它接到 roster 变化 watch：

```javascript
Vue.watch(
  () => gameState.roster.map(c => `${c && c.name}:${c && c.isActive}`).join('|') + `:${gameState.roster.length}`,
  () => { clampSelectedCharIndex(gameState); cleanupInitiativeOrder(); }
);
```

这意味着：

```text
调查员暂离
调查员移除
active 状态变化
roster 长度变化
```

都会同步修正：

```text
selectedCharIndex
combat.initiativeOrder
```

---

## 5. 存档 schema

```javascript
SAVE_SCHEMA_VERSION = 4
```

新增/变化：

```text
V3 -> V4
- chatHistory 保存前裁剪
- data.contextMeta 记录保存前后的上下文数量
- 载入后执行 compactChatHistory('load')
```

兼容：

```text
V1/V2/V3 存档仍通过 migrateSaveData() 迁移
旧扁平存档仍会被包装到 data 中
```

---

## 6. 审计验证

执行：

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
```

结果：

```text
AUDITFIX3 smoke tests passed
```

Smoke test 覆盖：

```text
CoCState 加载
CoCAI 加载
showToast / confirmAction / compactChatHistory 导出
runtime chatHistory 超限压缩
removeCharacterAt 后 selectedCharIndex clamp
defeated enemy 从 initiativeOrder 清理
AI context message 数量受限
最新 tool-call cluster 被保留
```

---

## 7. 当前剩余建议

### P1 / P2

1. 对 `toolHandlers` 做参数 schema 层校验，而不是只靠 `safeJsonParse`
2. 为 `fetchWithTimeout` 增加指数退避重试选项
3. 为 `localStorage` 引入存档空间预估与槽位清理提示
4. 针对 `request_skill_check` pending 状态做单独恢复测试

### P3

1. 将 UI feedback 做成更完整的事件总线
2. 给 ContextManager 增加可视化调试面板
3. 给存档管理界面显示压缩前/压缩后的聊天条数

---

## 判断

AUDITFIX3 后，V16.4 的长期战役稳定性明显提升：

```text
AI 上下文：从无界增长 -> 有界且保留最新工具调用簇
存档体积：从直接保存完整 chatHistory -> 保存前裁剪
UI 弹窗：从原生阻塞 -> 统一 Toast / Confirm
角色删除：从缺少状态层入口 -> State 层统一移除并修正索引/战斗队列
```

建议下一轮 AUDITFIX4 聚焦：

```text
Tool 参数 schema 校验
AI fetch retry/backoff
pending skill check 存档恢复专项测试
localStorage 空间预估 UI
```
