# 需要优化的项目清单

> 综合来源：`MODULE_REVIEW.md` · `PRE_RELEASE_AUDIT.md` · `OPTIONAL_ENHANCEMENTS.md` · `TEST_COVERAGE_GAP.md` · `ROADMAP.md` · `ROADMAP_V18.md` · `BUG_FIX_BATCH.md`
> 现状基线：V18.1.0 · 42/42 smoke PASS · **零阻塞项**（P0 无）；以下均为增强/质量/架构项。
>
> 模块完善度与分模块详述见 [MODULE_REVIEW.md](./MODULE_REVIEW.md)。

## P1 发布前 / 高优先

| ID | 模块 | 描述 | 来源文档 | 工作量 |
|----|------|------|----------|:---:|
| ~~OPT-001~~ | — | *已完成 → 见下方「已完成 P1」* | — | — |
| ~~OPT-002~~ | — | *已完成 → 见下方「已完成 P1」* | — | — |
| ~~OPT-003~~ | — | *已完成 → 见下方「已完成 P1」* | — | — |
| ~~OPT-004~~ | — | *已完成 → 见下方「已完成 P1」* | — | — |

> 说明：PRE_RELEASE 原 P1（复跑 `npm test`/`ci:smoke`、修正 ROADMAP 漂移）本批次已完成；BUG-001/002/003（a11y 键盘 + 死代码 `formatText`）已修复，不再列入。

## 已完成 P1（OPT-001–004）

| ID | 模块 | 描述 | commit |
|----|------|------|--------|
| [x] OPT-001 | PWA/构建 | README + PRE_RELEASE 顶部醒目标注「必须 `python build.py`」 | `4f03246` |
| [x] OPT-002 | CI/构建 | `scripts/verify_sw_cache.mjs` + 接入 `ci:smoke` | `4f03246` |
| [x] OPT-003 | QA/无障碍 | PRE_RELEASE 清单扩充 Tab/窄屏/离线/PWA/vendor 人工步骤（未声称已测） | `4f03246` |
| [x] OPT-004 | 发布说明 | `docs/RELEASE_NOTES_DRAFT.md` + `prepare_release_notes.mjs` wontfix 模板 | `4f03246` |

## P2 发布后尽快

| ID | 模块 | 描述 | 来源文档 | 工作量 |
|----|------|------|----------|:---:|
| ~~OPT-005~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-006~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-007~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-008~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-009~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-010~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |
| ~~OPT-011~~ | — | *已完成 → 见下方「已完成 P2」* | — | — |

## 已完成 P2（OPT-005–011）

| ID | 模块 | 描述 | commit |
|----|------|------|--------|
| [x] OPT-005 | 大厅/安全 | 设置页补一行"API Key 仅存于本机浏览器"隐私提示 | `53ec8f6` |
| [x] OPT-006 | 大厅/KP | KP 开关加 hover tooltip 说明"默认开启+伦敦规则为底层协议" | `53ec8f6` |
| [x] OPT-007 | 大厅 | 模组卡片显示 KP 开启状态徽标 | `53ec8f6` |
| [x] OPT-008 | 叙事 Story | 长对话经 `trimForSave` 裁剪后 UI toast「历史已压缩」 | `53ec8f6` |
| [x] OPT-009 | 存档 | `loadGame` IDB 异步恢复补 loading 态 + Promise 化 | `53ec8f6` |
| [x] OPT-010 | 场景/战役 Store | 下载失败 toast 含「改用本地 PDF 转换」引导 | `53ec8f6` |
| [x] OPT-011 | 场景/战役 Store | `LS_FALLBACK_MAX_BYTES` 超限更清晰清理指引 | `53ec8f6` |

## P3 中期质量（测试深度 + 局部体验）

| ID | 模块 | 描述 | 来源文档 | 工作量 |
|----|------|------|----------|:---:|
| ~~OPT-012~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-013~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-014~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-015~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-016~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-017~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-018~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-019~~ | — | *已完成（最小切片）→ 见下方「已完成 P3」* | — | — |
| ~~OPT-020~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-021~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-022~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-023~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-024~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-025~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |
| ~~OPT-026~~ | — | *已完成 → 见下方「已完成 P3」* | — | — |

## 已完成 P3（OPT-012–026）

| ID | 模块 | 描述 | commit |
|----|------|------|--------|
| [x] OPT-012 | 建卡/引擎 | `applyAgeModifiers` 边界单测（14/15/19/40/70+） | `125dcfa` |
| [x] OPT-013 | 引擎 | `checkSkill` extreme 难度单测 | `125dcfa` |
| [x] OPT-014 | 战斗 | `resolveCombatExchange`/`resolveBurstFire` 边界单测 | `125dcfa` |
| [x] OPT-015 | 引擎 | `HealingEngine.applyHealing` 各分支单测 | `125dcfa` |
| [x] OPT-016 | 引擎 | `getSkillValue` enemy 路径单测 | `125dcfa` |
| [x] OPT-017 | 存档 | `saveGame` quota-exceeded / IDB 不可用模拟单测 | `125dcfa` |
| [x] OPT-018 | 数据/工具层 | `handlers/*.mjs` ESM 导入测试 | `125dcfa` |
| [x] OPT-019 | 状态/AI 层 | `esm_ai` 纳入 `processTools` 调度最小切片 | `125dcfa` |
| [x] OPT-020 | 战斗 | `checkMalfunction` 可注入骰序（`_setTestRolls`） | `125dcfa` |
| [x] OPT-021 | KP 引擎 | `runAntagonistTick`/`applySocialInfiltration` 走可注入队列 | `125dcfa` |
| [x] OPT-022 | 地图/线索 | 线索网络图力导布局 + 分页 | `125dcfa` |
| [x] OPT-023 | 地图/线索 | `story_clues` click/keyboard 统一 `toggleClueDetail` | `125dcfa` |
| [x] OPT-024 | AI 层 | 工具描述分级（【必须调用】/【建议调用】） | `125dcfa` |
| [x] OPT-025 | 叙事/引擎 | 推动检定失败引擎侧硬提示 | `125dcfa` |
| [x] OPT-026 | 建卡 | 技能点剩余=0 强校验 + Chart 文本回退确认 | `125dcfa` |

> OPT-019 全量 jsdom+Vue 深化仍属 P4 候选；本批次仅落地 `processTools` 单测切片。

## P4 长期架构（ROADMAP_V18）

| ID | 模块 | 描述 | 来源文档 | 工作量 |
|----|------|------|----------|:---:|
| ~~OPT-027~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-028~~ | — | *已完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-029~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-030~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-031~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-032~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-033~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-034~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-035~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |
| ~~OPT-036~~ | — | *部分完成 → 见下方「P4 切片」* | — | — |

## P4 架构切片（OPT-027–036）

| ID | 模块 | 切片状态 | 说明 |
|----|------|----------|------|
| [~] OPT-027 | 数据层 | **部分完成** | `items.mjs` 已为单一权威源；新增 `items_db.mjs` ESM 弃用 shim（不接入 index 加载链） |
| [x] OPT-028 | 分层 | **完成** | `char_creator` 已在 `js/components/` |
| [~] OPT-029 | 状态层 | **部分完成** | 新增 `js/state/state_contract.mjs` JSDoc 契约，无破坏性重构 |
| [~] OPT-030 | 组件层 | **部分完成** | `StoryStore` 试点 `stateApi`/`CoCStateAccessor` 注入，其余组件待迁移 |
| [~] OPT-031 | 引擎 | **部分完成** | `coc.js` 已为薄装配层；Sanity/MajorWound 等已在 `js/engines/` |
| [~] OPT-032 | 代码质量 | **部分完成** | `handlers/mythos.mjs` `var→const/let` 试点 |
| [~] OPT-033 | 架构 | **部分完成** | `tests/ESM_PHASE2_NEXT.md` 记录下一步；`esm_phase2_boot_smoke` 扩展引擎/注册表断言 |
| [~] OPT-034 | 测试/CI | **部分完成** | `playwright.config.mjs` + `tests/playwright/` 脚手架；默认 CI 仍用 Node smoke |
| [~] OPT-035 | KP 引擎 | **部分完成** | `isActive`/`CoCLondonKpEngine` 首次调用 `console.warn`；别名保留 |
| [~] OPT-036 | 全局 | **部分完成** | `js/core/globals_registry.mjs` 集中登记 `window.*` 名称（shim，未批量重命名） |

## 已明确 wontfix（非优化项）

| 项 | 定性 | 依据 |
|----|------|------|
| 战斗动作菜单为引导、非每回合强制校验 | 设计取舍 | ARCHITECTURE / ROADMAP / BUG_FIX_BATCH |
| KP 协议引擎默认开启、伦敦规则为全局底层协议 | 设计取舍 | ROADMAP（`_kpDefaultEnabled=true`） |
| itch.io 一键 PDF 导入常失败 | 外部 CORS 约束（非 bug），推荐本地文件选择器 | ARCHITECTURE |
| API Key 明文存客户端 | 纯前端固有约束（默认 `sessionStorage`） | MODULE_REVIEW §四 |
| state / ai / 组件层无 Node 单测 | 环境结构性限制（需 Vue/DOM），属测试深度而非缺口 | MODULE_REVIEW §四 |
