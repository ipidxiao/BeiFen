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

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | A–E | 三轮审计全批完成；31/31 smoke；新增 audit3_smoke.js |
