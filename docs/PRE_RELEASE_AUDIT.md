# CoC Engine 发布前审计摘要

> 审计日期：2026-07-06 · 版本 **18.1.0** · 性质：只读顾问审计（condensed from pre-release audit session）  
> 关联文档：[ROADMAP.md](./ROADMAP.md) · [AUDIT6_BATCHES.md](./AUDIT6_BATCHES.md) · [OPTIONAL_ENHANCEMENTS.md](./OPTIONAL_ENHANCEMENTS.md)

---

## 执行摘要

CoC Engine 是一个**成熟度很高的纯前端 TRPG 引擎**，历经 AUDIT2–AUDIT6 六轮审计 + 可选增强批次，绝大多数 P0/P1 问题已闭环。

| 指标 | 结论 |
|------|------|
| **发布就绪度** | **8.5 / 10** |
| **阻塞项** | **0** |
| **建议** | 技术上**可以发布**；P1 文档与门禁项已在本批次落地 |

**代码卫生亮点：**
- 生产 `js/` 零 `eval` / `innerHTML` / `v-html` / `document.write`
- 全库仅 1 处 `@deprecated`，零 `TODO/FIXME/HACK`
- SW 缓存清单与 `index.html` 加载顺序一致（`build:js` 生成）
- 存档迁移 v1–v7 健壮；API Key 默认仅 `sessionStorage`

---

## 就绪度评分

| 维度 | 评分 | 说明 |
|------|:----:|------|
| 功能完整性 | 9 | 大厅/建卡/叙事/战斗/KP/存档/模组库全链路闭环 |
| 稳定性与健壮性 | 9 | 迁移兜底、崩溃拦截、存储配额、重试退避俱全 |
| 安全与隐私 | 9 | 零 XSS 面、Key 会话级默认、崩溃页转义 |
| 测试与 CI | 8 | 39 套件齐全；jsdom 层偏浅，无真浏览器 E2E |
| 文档一致性 | 7→8 | `ROADMAP.md` 已对齐 V18.1（本批次修复） |
| 可维护性 | 8 | `.mjs`↔`.js` 双轨仍在，`window.*` 命名待统一 |

---

## 功能审计摘要

| 领域 | 风险 | 优先级 | 要点 |
|------|------|:------:|------|
| 大厅 & 建卡 | 低 | P3 | Chart 离线降级已做；年龄边界单测未全覆盖 |
| 叙事 & 骰子 & 日志 | 低 | P3 | `pushReason` 已接入日志；`formatText` 死导出可删 |
| 战斗系统 | 低 | P2 | 动作菜单为**引导**非强制（wontfix，需在发布说明明示） |
| KP 引擎 | 低 | P2 | 默认开启 + 伦敦规则全局底层（wontfix，UI tooltip 可补） |
| 存档 & 迁移 | 低 | P3 | v1–v7 fixture + `save_migration_smoke.js` 覆盖 |
| PWA & 离线 | 低 | P2 | 发布须走 `python build.py` 注入 SW 哈希 |
| AI / 工具调用 | 低 | P3 | 35 工具 + 9 handler；超时/重试/参数上限齐全 |
| 场景 & 战役 | 低 | P3 | 10 内置 + 8 可下载；Chaosium 仅链接不分发 JSON |
| 无障碍 & UI | 低 | P2 | `a11y_smoke.js` 源码回归；建议人工键盘/窄屏走查 |
| 测试 & CI | 中 | P1 | 39/39 + `ci:smoke`（本批次已复跑验证） |
| 安全 & 隐私 | 低 | P2 | Key 明文存客户端固有；可补设置页隐私提示 |
| 构建 & 发布 | 低 | P1 | `ROADMAP.md` 漂移已修复（本批次） |

---

## 优化优先级

### P0 — 阻塞发布
- **无**

### P1 — 强烈建议发布前处理
1. ~~人工复跑 `npm test` + `npm run ci:smoke`~~ → 本批次已执行
2. ~~修正 `docs/ROADMAP.md` V17 漂移~~ → 本批次已对齐 V18.1

### P2 — 发布后尽快 / 沟通向
3. 发布说明明示两处 wontfix：战斗菜单引导性、KP 默认开启
4. 设置页补隐私提示 + KP 开关 tooltip
5. 人工无障碍走查（键盘 Tab + 窄屏）与 vendor 版本核对

### P3 — 长期 backlog
6. 补边界单测（年龄修正、极端检定、HealingEngine 等）
7. 删除 `ui.mjs` 未消费的 `formatText`
8. 引入 Playwright 真浏览器 E2E
9. 推进 `window.*` 统一与 `.mjs/.js` 双轨收敛（见 ROADMAP_V18）

---

## 发布前检查清单

```
[x] node tests/run_all_smoke.js → 39/39 PASS（本批次）
[x] node scripts/ci_smoke.mjs → build:js 无 drift + exports 通过（本批次）
[x] 更新 docs/ROADMAP.md（本批次）
[ ] python build.py 出包（自动 build:js + 注入 SW 内容哈希）
[ ] 确认 vendor/ 与 8 个 packages/*.json 已入包
[ ] npx serve . → 断网刷新验证离线核心功能
[ ] 键盘 Tab 走查大厅→建卡→叙事→战斗→存/读档
[ ] 移动端窄屏目测 + PWA「添加到主屏幕」
[ ] 撰写 CHANGELOG（以 js/data/dev_logs 为准）
[ ] 首启无 API Key 时确认离线模式提示可用
[ ] 载入旧版本存档 fixture 验证迁移无损
```

---

## 建议 v18.1.0 CHANGELOG 要点

- **feat(cdn)**：Vue/Bootstrap/Chart.js/PDF.js 本地化 + CDN 兜底，完整离线可用
- **feat(store)**：模组库 8 个可下载模组（含 6 个 CC 社区改编），支持公开资源基址扩展
- **feat(pwa)**：iOS PWA meta、内联图标 sprite（`file://` 可用）、SW scope 相对路径（子目录部署）
- **feat(esm)**：`?esm=1` 可选 ESM 引导 + 覆盖缺口套件（39 smoke 门禁）
- **fix(audit6)**：modulepreload 404、pushReason 日志、崩溃页 Vue-only 白名单
- **security**：生产 `js/` 零 XSS 面；API Key 默认会话级存储；崩溃页输出转义
- **known limitations**：战斗动作菜单为引导非每回合强制；KP 协议引擎默认开启且伦敦规则为全局底层协议（intentional design）

---

**一句话结论**：就绪度 8.5/10，零阻塞项，P1 文档与门禁已落地，可放心出包。
