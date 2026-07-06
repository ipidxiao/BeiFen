# v18.1.0 发布说明草稿

> 供 GitHub Release / itch.io 页面粘贴。生成 commit 列表：`node scripts/prepare_release_notes.mjs`  
> 版本以 `package.json` 为准 · 审计摘要见 [PRE_RELEASE_AUDIT.md](./PRE_RELEASE_AUDIT.md)

---

## 亮点

- **feat(cdn)**：Vue / Bootstrap / Chart.js / PDF.js 本地化 + CDN 兜底，完整离线可用
- **feat(store)**：模组库 8 个可下载模组（含 6 个 CC 社区改编），支持公开资源基址扩展
- **feat(pwa)**：iOS PWA meta、内联图标 sprite（`file://` 可用）、SW scope 相对路径（子目录部署）
- **feat(esm)**：`?esm=1` 可选 ESM 引导 + 覆盖缺口套件（39 smoke 门禁）
- **fix(audit6)**：modulepreload 404、pushReason 日志、崩溃页 Vue-only 白名单
- **security**：生产 `js/` 零 XSS 面；API Key 默认会话级存储；崩溃页输出转义

---

## 已知设计取舍（intentional design — 非缺陷）

以下两项为**有意为之**的产品决策，已在 [ROADMAP.md](./ROADMAP.md) 与 [ARCHITECTURE.md](./ARCHITECTURE.md) 记录；请勿当作待修 bug 提 issue。

### 1. 战斗动作菜单为引导性，非每回合强制校验

- **表现**：战斗面板展示动作分类菜单（格斗 / 射击 / 战术等），供玩家与 AI 参考；**不会**每回合强制玩家从完整菜单中选择一项才允许结算。
- **离线**：`story_combat` 快速指令是主要互动方式。
- **联网**：自由自然语言描述为主，引擎经 tools/handlers 反馈检定与伤害结果。
- **仍强制执行的规则**：例如「纯伤害免疫」等引擎硬规则，与菜单是否展示无关。
- **依据**：`docs/ARCHITECTURE.md` — Combat interaction model；`docs/AUDIT3_BATCHES.md` enforcement 表。

### 2. KP 协议引擎默认开启，伦敦规则为全局底层协议

- **表现**：`gameState.kpEngine.enabled` 默认为 `true`（`js/state/core.mjs`）；伦敦规则集作为 **bottom-layer 协议** 对所有剧本生效，而非某个战役的可选 overlay。
- **用户控制**：大厅「启用 KP 协议引擎（伦敦规则集）」开关可手动关闭；关闭后跳过行动校验、敌人缩放、反一击必杀、五段输出协议、语言自检、敌对组织 tick 等。
- **依据**：`docs/ROADMAP.md` 已知设计取舍；`_kpDefaultEnabled = true` 为 intentional design。

---

## 其他已知限制

| 项 | 说明 |
|----|------|
| itch.io PDF 一键导入 | 浏览器 CORS 常失败；推荐本地下载 PDF 后用「选择 PDF 转换」 |
| API Key 存客户端 | 纯前端固有约束；默认 `sessionStorage`，用户自行承担 Key 安全 |
| 无真浏览器 E2E | 39/39 Node smoke 门禁；Playwright E2E 在 backlog（OPT-034） |

---

## 发布前测试清单（摘要）

- [ ] `python build.py` 出包（**勿**手改 `.js` / `sw.js`）
- [ ] `npm test` + `npm run ci:smoke`
- [ ] 人工：键盘 Tab · 窄屏 · 断网刷新 · PWA 主屏（见 [PRE_RELEASE_AUDIT.md](./PRE_RELEASE_AUDIT.md)）
