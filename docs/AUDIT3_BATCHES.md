# CoC Engine — Audit Round 3 批次追踪

> 2026-07-05 三轮审计修复（AUDIT3-P1~P3）。  
> 二轮追踪见 [AUDIT2_BATCHES.md](AUDIT2_BATCHES.md) · 一轮见 [AUDIT_BATCHES.md](AUDIT_BATCHES.md)。

**状态图例：** `[ ]` pending · `[~]` in_progress · `[x]` done · `[-]` skipped/wontfix · `[~]` partial

**版本源：** `package.json` → `18.1.0` · 门禁 **31/31** smoke（`npm test`）

---

## Batch A — 诚实性硬伤

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT3-P1-01 | 接入 `evaluatePlayerPower()` — 战斗胜利 / update_enemy 击杀路径 | audit3_smoke P1-01 ✓ |
| [x] | AUDIT3-P1-02 | 去重 observe tick — `onPlayerAction` vs `triggerAI` | audit3_smoke P1-02 ✓ |

---

## Batch B — 数据一致性

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT3-P2-01 | `enemy_attack` 双重 HP 日志修复 | audit3_smoke P2-01 ✓ |
| [x] | AUDIT3-P2-03 | README 工具数 35（definitions.mjs） | count=35 ✓ |
| [x] | AUDIT3-P2-04 | `persistence.mjs` 显式 import `clampSelectedCharIndex` | selection.mjs + npm test ✓ |

---

## Batch C — 加载/引擎健壮性

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT3-P2-05 | `loadGame` IDB 竞态 — async 提示 / prime | toast on async IDB load ✓ |
| [x] | AUDIT3-P2-06 | `dice.mjs` 使用 `CoCKpConfig.getKpEngine()` | audit3_smoke P2-06 ✓ |
| [x] | AUDIT3-P2-02 | `DOOM_CLOCK` — ATTENTION 变化时最小 tick | audit3_smoke P2-02 ✓ |

---

## Batch D — 规则一致性

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT3-P3-01 | `spawn_npc` 加入 `initiativeOrder` | audit3_smoke P3-01 ✓ |
| [x] | AUDIT3-P3-02 | `validateNarrativeEra` 命中时剥离违禁词 | audit3_smoke P3-02 ✓ |
| [x] | AUDIT3-P3-03 | 火器 vs 护甲 — 文档与 `skipArmor` 对齐 | definitions + combat skipArmor ✓ |
| [x] | AUDIT3-P3-09 | `study_tome` 须持有典籍 | audit3_smoke P3-09 ✓ |

---

## Batch E — 性能/构建/维护

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT3-P3-04 | `scripts/ci_smoke.mjs` + npm `ci:smoke` | package.json ✓ |
| [x] | AUDIT3-P3-05 | `story_chat` 虚拟滚动 `_vHeights` | npm test ✓ |
| [x] | AUDIT3-P3-06 | `makeToolSnapshot` 裁剪域 | npm test ✓ |
| [x] | AUDIT3-P3-08 | `triggerAI` try/finally `_aiBusyCount` | npm test ✓ |
| [x] | AUDIT3-P3-07 | 敌对策略权重 advisory 文档 | masks_london_antagonist_rules.mjs ✓ |

---

## Enforcement 诚实性 — wontfix / 按设计

审计曾标注「规则写在 KP 里但未每回合强制」类 gap。下列项为 **intentional design**，非待修复 enforcement 漏洞（同类见一轮 [AUDIT-P1-06](AUDIT_BATCHES.md) KP bottom-layer）。

| 状态 | 主题 | 说明 |
|:----:|------|------|
| [-] | **战斗全菜单强制** (`COC_7E_COMBAT_ACTIONS`) | **wontfix / 按设计**：行动分类为可选菜单指引与 prompt/UI 参考；**离线**时 `story_combat` 快速指令为主互动，**联网**时自由描述为主、引擎经 tools/handlers 反馈结果。不每回合强制展示或校验全菜单。`recordCombatAction` 纯伤害免疫等与「强制全菜单」无关，仍保留。详见 [ARCHITECTURE.md — Combat interaction model](ARCHITECTURE.md#combat-interaction-model-offline-menu-vs-online-dialogue)。 |

---

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | — | 文档：战斗全菜单强制 → wontfix（离线菜单 / 联网自由描述设计澄清） |
| 2026-07-05 | Post | PARTIAL→DONE：DOOM_CLOCK 多事件 tick、叙事时代 KP-off 剥离、adaptStrategy 引擎接线；战斗菜单 wontfix 归档 |
| 2026-07-05 | A–E | 三轮审计全批完成；31/31 smoke；新增 audit3_smoke.js |

---

## Post-completion — enforcement gaps closed

| 状态 | ID / 主题 | 说明 | 验证 |
|:----:|-----------|------|------|
| [x] | AUDIT3-P2-02 **expanded** | `DOOM_CLOCK` — attention+, time passage, key clue, mythos, combat win, ambush; cap 24; sync global | audit3_smoke P2-02b–d ✓ |
| [x] | AUDIT3-P3-02 **expanded** | `validateNarrativeEra` runs KP-off (global output quality); degraded ellipsis → single reprompt hint | audit3_smoke P3-02b ✓ |
| [x] | AUDIT3-P3-07 **expanded** | `adaptStrategy` weights → misinfo/ambush/combat_counter/socialInfiltration engine wiring | audit3_smoke P3-07 ✓ |
| [-] | **战斗全菜单强制** | **wontfix** — 离线快速指令 / 联网自由描述；见 Batch E enforcement 表 | ARCHITECTURE.md ✓ |
