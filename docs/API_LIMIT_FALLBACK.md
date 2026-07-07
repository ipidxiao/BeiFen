# API 限额时的第二套执行方案（Tier 2）

Task 子代理因 Cursor API 用量触顶失败时，父 Agent **不再重试大子代理**，改走本快读方案。

典型报错：`API usage limit reached` / `Switched to composer-2.5 after reaching API limit.`

---

## 触发条件

| 信号 | 动作 |
|------|------|
| Task 子代理返回 API limit / usage limit | 立即切换 Tier 2 |
| 同一 prompt 已失败 ≥1 次 | **禁止**再 spawn 同配置子代理 |
| 用户催 hotfix、时间紧 | 优先 Tier 2，不必等额度恢复 |

---

## 第二套方案原则

- **小步**：一次只解决一个明确 bug / 一个 UI 点
- **父代理直改**：当前对话内 grep → 读文件 → 改 → 测，不嵌套 `generalPurpose` 大子代理
- **先定位再改**：用 `rg` 找符号/字符串，确认根因后再动刀
- **单文件优先**：能 1 个 `.mjs` 搞定就不扩散到 3 个
- **build 必跑**：凡改 `.mjs` 权威源，必须 `npm run build:js`

---

## 执行顺序（Checklist）

1. **缩小范围** — 锁定 1–3 个相关文件（从报错栈、用户描述、最近 diff 推断）
2. **`rg` 定位根因** — 搜函数名、DOM id、状态字段、测试断言字符串
3. **只改 `.mjs` + 强制 build** — `npm run build:js`（或 `npm run build:js:check` 若需导出校验）
4. **跑相关 smoke，不全量**（时间紧时）— 例如 Creator 相关改完跑 `node tests/char_creator_flow_smoke.js`；可用 `npm run quick:fix`（<30s）。**提交 / CI 前仍须** `npm run ci:smoke` 全量
5. **单 commit + push** — 一条清晰 commit message，避免半成品多 commit

---

## 模型降级表

| 原计划 | Tier 2 替代 |
|--------|-------------|
| `gpt-5.5-medium` 子代理修引擎 | 父 Agent 用 **composer-2.5-fast** 直改 1–2 个文件；复杂逻辑拆成 ≤3 个微步骤在同对话完成 |
| `composer-2.5-fast` 子代理改 UI | 父 Agent 直改，不 spawn |
| `claude-fable-5-thinking-high` 写大纲 | 父 Agent 写最小可用文案落盘，或暂跳过创意扩写 |

**大任务拆分示例**（各步在同对话顺序做，不开子代理）：

1. grep + 读状态/视图入口  
2. 改组件逻辑  
3. build + 单测 smoke  

---

## 禁止

- 再开 **`generalPurpose` 大 scope** 子代理
- **重复失败同 prompt**（换模型重 spawn 同一任务）
- 未 build 就提交 `.mjs` 改动
- 以「等额度恢复」拖延已可小步修复的 hotfix

---

## 与用户沟通

一句话即可：

> 子代理 API 限额已触顶，改由父代理按 Tier 2 小步直修，先改 [文件/范围]，build 后跑 [相关 smoke]。

---

## 相关

| 文档 / 脚本 | 用途 |
|-------------|------|
| [`docs/AI_MODEL_WORKFLOW.md`](AI_MODEL_WORKFLOW.md) | 正常多模型路由 |
| `.cursor/rules/api-limit-fallback.mdc` | Agent 自动遵循的 Tier 2 规则 |
| `npm run quick:fix` | hotfix 快检：`char_creator_flow_smoke` + `build:js --check` |
