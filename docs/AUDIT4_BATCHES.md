# CoC Engine — Audit Round 4 批次追踪

> 2026-07-05 四轮审计修复（AUDIT4-P2~P3）。  
> 三轮追踪见 [AUDIT3_BATCHES.md](AUDIT3_BATCHES.md) · 二轮见 [AUDIT2_BATCHES.md](AUDIT2_BATCHES.md)。

**状态图例：** `[ ]` pending · `[~]` in_progress · `[x]` done · `[-]` skipped/wontfix

**版本源：** `package.json` → `18.1.0` · 门禁 **35/35** smoke（`npm test`）

---

## Batch R4-A — 存档健壮性 (HIGH)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT4-P2-01 | Normalize `kpEngine.scenePaths` in migrateSaveData; heal invalid shapes | save_migration_smoke + array scenePaths ✓ |
| [x] | AUDIT4-P2-02 | Fix v3/v7 fixtures to object schema; migration assertions | save_migration_smoke ✓ |
| [x] | AUDIT4-P3-10 | Strip `_` prefixed transient fields from combat/enemies before save | persistence `_stripTransientFields` ✓ |

---

## Batch R4-B — PWA 缓存 (HIGH)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT4-P2-03 | Extend `getManifestContentHash` — BROWSER_ONLY, css, index, vendor | sw_cache_smoke + build:js:check ✓ |

---

## Batch R4-C — 统计/发布脚本

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT4-P3-05 | `countDataRootFiles` dedupe `.mjs` only | stats:readme ✓ |
| [x] | AUDIT4-P3-06 | Split components vs ui_helpers counts | stats:readme ✓ |
| [x] | AUDIT4-P3-11 | Dynamic assets/CSS counts not hardcoded | stats:readme ✓ |
| [x] | AUDIT4-P3-12 | Fix `prepare_release_notes.mjs` `--limit 0` and `--since` errors | manual smoke ✓ |

---

## Batch R4-D — KP 语义

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT4-P3-04 | Document/dedupe DOOM_CLOCK double tick on combat_win/mythos | audit3_smoke P2-02d ✓ |
| [x] | AUDIT4-P3-07 | `_getKpEngine` prefers `CoCKpConfig.getKpEngine` in ai_logic | audit3 + kp_semantics ✓ |
| [x] | AUDIT4-P3-09 | Fix `migrateKpEngineField` hadKey using original input snapshot | kp_semantics_smoke ✓ |

---

## Batch R4-E — 测试债

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT4-P3-08 | Minimal jsdom DOM parse test to justify dependency | dom_parse_smoke.mjs ✓ |

---

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | R4-A–E | 四轮审计 12/12 完成；35/35 smoke；`normalizeScenePaths`、SW hash、stats 脚本、DOOM dedupe |
| 2026-07-05 | — | 创建 AUDIT4 批次追踪 |
