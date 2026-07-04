# V16.4 Final — 代码审计报告

> 审计日期: 2026-06-27 | 范围: 全部 153 文件 (61 .js + 65 .mjs)

---

## 一、安全审计

### 🔴 HIGH: API Key 明文存储在 localStorage

| 位置 | 风险 |
|------|------|
| `js/state/core.js:27` | 默认 API Key 占位符 `***`（安全） |
| `js/state/ui.js:82` | `localStorage.setItem('vue_coc_api_cloud', JSON.stringify(aiSettings))` — **API Key 明文存储** |
| `js/ai_logic.js:188` | `Authorization: Bearer ${apiKey}` 在 HTTP 头中传输（正常用法） |

**风险**: 任何能访问浏览器 DevTools 的人可读取 API Key。XSS 漏洞可窃取 Key。

**建议**: 
- 使用 `sessionStorage` 替代 `localStorage`（会话结束后清除）
- 或提供"不记住 Key"选项
- 在 UI 中提示用户风险

### 🟢 LOW: `***` 占位符暴露默认值

`js/state/core.js:27` 中 `apiKey: ***` 是字面量。如果用户未配置 Key，请求会带上 `Bearer ***` 发送到 DeepSeek API，触发认证错误。**实际风险低**，因为 API 会拒绝无效 Key。

### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| XSS (innerHTML) | ✅ `escapeHtml()` 已覆盖所有动态错误文本 |
| eval / new Function | ✅ 0 处 |
| document.write | ✅ 0 处 |
| alert / confirm | ✅ 已替换为 Toast/Confirm |
| 硬编码密钥 | ✅ 仅有占位符 `***` |

---

## 二、代码质量

### 🟡 MEDIUM: 重复模式 — 13 次 `gameState.chatHistory.push`

`js/ai_logic.js` 中有 **13 处** `gameState.chatHistory.push(...)` 调用，散布在 `triggerAI`、`processTools`、`executeSkillCheck`、`handlePlayerAction` 等函数中。

**建议**: 提取为 `pushSystemMessage(type, content)` 工厂函数（部分已有 `_pushSystemNotice`，但未统一使用）。

### 🟡 MEDIUM: `handlePlayerAction` 缺少错误恢复

```js
const handlePlayerAction = async () => {
    try { ... await triggerAI(); }
    catch (err) { console.error("Player Action Error:", err); }
    // isLoading 在 triggerAI 的 finally 中重置，但 catch 路径不会
};
```

**风险**: 如果 `triggerAI` 在设置 `isLoading = true` 之前抛出异常，UI 会永久卡在加载状态。

### 🟡 MEDIUM: `moveToLocation` 中的竞态条件

```js
isSyntheticMoveInFlight = true;
try { closeModal(); playerInput.value = `...`; await handlePlayerAction(); }
finally { isSyntheticMoveInFlight = false; }
```

如果在 `await handlePlayerAction()` 期间用户再次点击移动按钮，`isSyntheticMoveInFlight` 仍为 `true`，第二个请求会被拒绝。**设计正确**，但用户体验差（无反馈）。

### 🟢 LOW: 4 个最大文件

| 文件 | 行数 | 评估 |
|------|------|------|
| `js/state/persistence.js` | 418 | 可接受（存档逻辑密集） |
| `js/ai_logic.js` | 426 | ⚠️ 之前 577，已拆分但仍有优化空间 |
| `js/coc.js` | 443 | 可接受（规则引擎，职责单一） |
| `js/state/gameplay.js` | 340 | 可接受（6 个子系统） |

### 🟢 LOW: `char_creator.js` 使用率低

`window.CoCCreator` 仅在 `char_creator.js` 中定义，在 `creator_view.js` 中通过 `window.CoCState` 间接使用，无直接引用。不是死代码，但耦合度低。

---

## 三、运行时风险

### 🟡 MEDIUM: 存档迁移缺少版本校验

`migrateSaveData()` 处理 `version` 字段进行迁移，但**未校验 `SAVE_SCHEMA_VERSION` 是否兼容**。如果未来版本号跳跃（如 v7→v10），中间版本的迁移逻辑会缺失。

**建议**: 添加版本范围检查：
```js
if (sourceVersion > SAVE_SCHEMA_VERSION) {
    showToast('存档版本过新，请升级引擎', 'warning');
    return null;
}
```

### 🟡 MEDIUM: `AbortController` 兼容性

`fetchWithTimeout` 使用 `typeof AbortController !== 'undefined'` 做能力检测，但 **IE11 不支持**。当前浏览器覆盖 OK（Chrome/Firefox/Safari/Edge 均支持），但移动端旧浏览器可能受影响。

### 🟢 LOW: `localStorage` 容量假设硬编码

`LOCAL_STORAGE_QUOTA_ESTIMATE_BYTES = 5 * 1024 * 1024` (5MB)。大多数浏览器 localStorage 限制为 5-10MB，但并非标准。使用 `navigator.storage.estimate()` API 可获得更准确的值。

### 🟢 LOW: `console.error` 在生产代码中

`js/ai_logic.js` 中有多处 `console.error("Player Action Error:", err)` 等调用。正常运行时不应产生输出，但异常时会向用户暴露调用栈。

---

## 四、数据完整性

### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| 存档格式版本化 | ✅ `SAVE_SCHEMA_VERSION = 7` |
| 迁移路径 | ✅ `migrateSaveData()` 处理 v1→v7 |
| 存档前后压缩 | ✅ `CoCContextManager.trimForSave()` |
| 容量预警 | ✅ `getStorageStatus()` 在 80%/90%/98% 三级预警 |
| QuotaExceeded 处理 | ✅ `_isQuotaExceeded()` + `_safeLocalStorageSetItem()` |

### 🟡 MEDIUM: 自动存档静默失败

```js
_autoSaveTimer = setTimeout(() => saveGame('auto', '自动存档'), 8000);
```

如果 `saveGame('auto')` 失败（如 quota exceeded），唯一的反馈是 Toast。用户可能在不知情的情况下丢失进度。

**建议**: 自动存档失败时使用更显著的提示（如红色 Toast + 确认框）。

---

## 五、审计总结

| 严重度 | 数量 | 关键项 |
|--------|------|--------|
| 🔴 HIGH | 1 | API Key 明文 localStorage |
| 🟡 MEDIUM | 5 | 错误恢复不完整、竞态反馈缺失、版本校验、重复 push 模式、自动存档静默失败 |
| 🟢 LOW | 5 | 硬编码常量、console.error 残留、AbortController 兼容、容量 API、char_creator 耦合 |
| ✅ PASS | 9 | XSS 防护、eval 禁用、数据版本化、容量预警、Quota 处理、innerHTML 转义 |

### 修复优先级

| 优先级 | 事项 | 工时 |
|--------|------|------|
| 🔴 | API Key → sessionStorage + 风险提示 | 30 min |
| 🟡 | `_pushSystemNotice` 统一 chatHistory.push | 1h |
| 🟡 | `handlePlayerAction` 异常恢复 | 15 min |
| 🟡 | 存档版本前向兼容检查 | 15 min |
| 🟡 | 自动存档失败醒目提示 | 10 min |
| 🟢 | `navigator.storage.estimate()` 替代硬编码 | 30 min |

---

*审计标准: OWASP Top 10 (2021) + Google JavaScript Style Guide*


---

## 六、补充审计 (2026-06-27)

### 已修复项

| 问题 | 修复 |
|------|------|
| API Key 安全提示 | `lobby_view.js` 设置页面添加 ⚠️ 明文存储警告 |
| `handlePlayerAction` 异常恢复 | `isLoading` 守卫移到 try 之前 |
| 存档版本前向兼容 | `migrateSaveData()` 添加版本警告 |
| 自动存档失败提示 | 失败时显示红色 Toast 持续 10s |
| 死代码 `handlers_index_bundle.mjs` | 已删除（0 引用） |

### 空安全扫描

| 检查项 | 结果 |
|--------|------|
| `.find()` 无 null 守卫 | ✅ 0 处 — 全部有 `if (!x)` 或 `?.` 保护 |
| 数组越界 | ✅ `[0]` 访问均有前置检查 |
| 除零错误 | ✅ `derived?.hp\|\|1` 安全模式 |
| `Math.random` 误用 | ✅ 8 处均为合法随机（非安全场景） |

### 死代码扫描

| 函数 | 调用次数 | 状态 |
|------|---------|------|
| `getSafeSkillName` | 4 | ✅ 活跃 |
| `_isActiveCombatant` | 1 | ✅ 活跃 |
| `_parseDice` | 1 | ✅ 活跃 |
| `_rollD10` | 2 | ✅ 活跃 |
| 其他内部函数 | ≥1 | ✅ 全部活跃 |

### 未修复项（重构建议）

| 问题 | 原因 |
|------|------|
| `chatHistory.push` 47 处分散 | 需修改 16 文件，风险高于收益 |
| API Key sessionStorage | 用户可能希望持久化，需 UI 选项 |
| `_pushSystemNotice` 未全局可用 | 需添加到 CoCState 公共 API |
