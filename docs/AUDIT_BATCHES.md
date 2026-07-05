# CoC Engine — 审计批次执行追踪

> 基于 2026-07-05 全量代码审计（42 项 AUDIT-P0~P3）。  
> 审计上下文见对话报告「CoC Engine V17.2 CCGS —— 全量代码审计报告」（只读审计，未改代码）。  
> 相关历史文档：[AUDIT_REPORT_V16_4_FINAL.md](AUDIT_REPORT_V16_4_FINAL.md)、[AUDIT_V16_5.md](AUDIT_V16_5.md)

**状态图例：** `pending` · `in_progress` · `done` · `wontfix`

**版本源：** `package.json` → `18.1.0` · SW 缓存名 `coc-engine-v{package.json version}`（build 时注入）

---

## 批次 1 — 文档止血（半天）

| 状态 | ID | 标题 |
|:----:|----|------|
| done | AUDIT-P0-01 | README 缓存名 v18.6 ≠ 代码 v18.7 |
| done | AUDIT-P0-02 | README smoke 23/23 ≠ 实际 27 |
| done | AUDIT-P0-03 | README「KP 默认关闭」≠ 代码默认 true |
| done | AUDIT-P0-04 | README「0 document.write」≠ index.html 3 处 |
| done | AUDIT-P0-05 | 版本号混乱（V17.2 / V18.1 / 18.1.0） |
| done | AUDIT-P3-35 | README「28 工具/60+ JS/51+ ESM」等数字需核验 |

---

## 批次 2 — KP 语义收敛（1–2 天）

| 状态 | ID | 标题 |
|:----:|----|------|
| done | AUDIT-P1-08 | KP 引擎启停语义不统一 — `kp_config.mjs` 单一默认源；大厅开关 localStorage 持久化；`unloadCampaign` 尊重用户 KP 开关 |
| done | AUDIT-P0-03 | README「KP 默认关闭」≠ 代码默认 true — 文档已在批次 1 对齐；迁移不再对旧存档强制启用 |
| done | AUDIT-P2-19 | 迁移强制启用 KP 影响历史存档 — `migrateKpEngineField` 区分缺失/显式关闭/显式开启 |
| done | AUDIT-P1-09 | divine_war 预设仅 prompt — 神战选项保留 prompt tier；KP 关闭时设置页警告 + 切换 toast |
| wontfix | AUDIT-P1-06 | KP 默认开启 → 伦敦规则泄漏到所有剧本（**按设计**：KP 底层协议 + 伦敦规则集为全局 bottom-layer，非泄漏） |

---

## 批次 3 — 规则强制正确性（1–2 天）

| 状态 | ID | 标题 | 备注 |
|:----:|----|------|------|
| done | AUDIT-P1-10 | 弹药消耗字符串重建可能产生畸形标签 | `consumeBackpackAmmo` 结构化解析/写回；`formatAmmoLabel`；smoke 跨条目部分消耗 |
| done | AUDIT-P1-11 | 英文武器名绕过弹药强制 | `combat.mjs` 用 `inferAmmoType()` 判定枪械；英 pistol/rifle 触发弹药校验 |
| done | AUDIT-P2-23 | 战役库存对象 vs 字符串混用 | `inventoryLabel` + 对象 `qty/count` 支持；战役/战斗/消耗路径统一 |
| done | AUDIT-P1-12 | 五段协议 autoRestructure 打乱已带标签文本 | 已有 `【骰子】` 等标签时走 fill-missing 分支；smoke 覆盖 |
| done | AUDIT-P1-13 | 语言禁用正则过宽导致误改写 | 收紧为显式对比连接词；`SHOULD_NOT_REWRITE_SAMPLES` + smoke |
| done | AUDIT-P2-25 | 场景路径「真线索≥3」可能卡死流程 | `evaluateKeyClueRequest` 三次受阻后降级放行 + AI 提示 |
| done | AUDIT-P1-07 | 语言「直接禁令」实为软执行 | `rejected` 时 `safeFallback` 掩码，不展示原文；代码注释说明策略 |
| done | AUDIT-P1-15 | 空 API Key 未前置拦截 | `triggerAI` fetch 前检查 key，提示「请配置 API Key」 |

---

## 批次 4 — 健壮性与构建（2–3 天）

| 状态 | ID | 标题 |
|:----:|----|------|
| done | AUDIT-P2-16 | 构建器为正则机械转换，脆弱 |
| done | AUDIT-P2-17 | GENERATE_PAIRS/SW/index 三处清单需手工同步 |
| done | AUDIT-P2-18 | SW 采用 cache-first 无版本内刷新 |
| done | AUDIT-P2-20 | enterModule 不重置 KP/scenarioRunner 全量 |
| done | AUDIT-P2-21 | KpGameLoop 定时器为模块级单例 |
| done | AUDIT-P2-22 | 定时注入事件不可复现/无节流上限 |
| done | AUDIT-P2-26 | scaleEnemy 幂等性风险 |

---

## 批次 5 — 清理（穿插）

| 状态 | ID | 标题 |
|:----:|----|------|
| done | AUDIT-P3-30 | 仓库同时存在源 .mjs 与生成 .js（均未提交） |
| done | AUDIT-P3-31 | 中文注释混入英文 note |
| done | AUDIT-P3-32 | 大量 window.X = X 全局挂载 |
| done | AUDIT-P3-33 | 重复的 getKpEng/_kp() 取引擎样板 |
| done | AUDIT-P3-34 | 遗留 scratch/probe 脚本 |
| done | AUDIT-P3-35 | README 统计数字需核验（批次 1 已手工对齐；长期可脚本化） |
| done | AUDIT-P3-36 | evaluate() 等已弃用 API 仍导出 |
| done | AUDIT-P3-37 | 硬编码时间/环境常量分散 |
| done | AUDIT-P2-24 | masks_london_kp 预设 id 冗余映射到 divine_war |
| done | AUDIT-P2-27 | PDF 一键导入依赖 itch.io 跨域（多半失败） |
| done | AUDIT-P2-28 | PDF.js CDN 兜底域未在 SW SKIP_HOSTS |
| done | AUDIT-P2-29 | localStorage 回退阈值仅 warn 不阻断 |

---

## 进度汇总

| 批次 | 任务数 | done | wontfix | pending |
|------|--------|------|---------|---------|
| 1 | 6 | 6 | 0 | 0 |
| 2 | 5 | 4 | 1 | 0 |
| 3 | 8 | 8 | 0 | 0 |
| 4 | 7 | 7 | 0 | 0 |
| 5 | 12 | 12 | 0 | 0 |
| **合计** | **38** | **37** | **1** | **0** |

> 注：42 项审计清单中 P1-14 未纳入用户指定的五批划分；已在 Post-audit 完成。

---

## Post-audit 跟进

| 状态 | ID | 标题 |
|:----:|----|------|
| done | AUDIT-P1-14 | 叙事监听器自动建线索/移动易误触 — auto clue 经 `canAddClue`；弱感官匹配不触发移动；`CoCLog.debug` 静默跳过 |

---

## 全量审计完成摘要（2026-07-05）

五批 38 项任务已全部处理：**37 done**、**1 wontfix**（P1-06 KP 伦敦规则全局底层为 intentional design）。

| 领域 | 主要成果 |
|------|----------|
| 文档 | README/追踪文件与代码对齐；新增 `ARCHITECTURE.md`（构建策略、window 全局、PDF CORS） |
| KP 语义 | `kp_config.mjs` 单一默认源；迁移尊重用户开关；`getKpEngine()` 共享访问器 |
| 规则正确性 | 弹药/库存/五段协议/语言过滤/线索降级/API Key 前置拦截 |
| 健壮性 | 构建清单自动化、SW stale-while-revalidate、`enterModule` 重置、KpGameLoop 单例节流 |
| 清理 | `.gitignore` 生成物策略、战役时间常量归位、`divine_war` 规范 id、localStorage 4MB 阻断、dev 脚本归档 |

**未纳入五批：** AUDIT-P1-14 已在 Post-audit 完成（见上表）。

---

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | 1 | 创建本追踪文件；完成 P0-01~P0-05、P3-35（README/index.html 对齐）；P1-06 标记 wontfix |
| 2026-07-05 | 2 | 完成 P1-08、P0-03（迁移语义）、P2-19、P1-09；新增 `kp_config.mjs`、`kp_semantics_smoke.js`；P1-06 维持 wontfix |
| 2026-07-05 | 3 | 完成 P1-10~P1-13、P1-07、P1-15、P2-23、P2-25；扩展 `kp_execution_smoke.js`；`build_browser.mjs` 重生成 .js |
| 2026-07-05 | 5 | 完成 P3-30~P3-37、P2-24~P2-29；`getKpEngine()`、`ARCHITECTURE.md`、localStorage 4MB 阻断、dev 脚本归档；**全量五批审计收尾** |
| 2026-07-05 | Post-audit | 完成 P1-14：`narrativeListener` KP 路径校验 + 移动保守化；`kp_execution_smoke.js` 扩展 |
