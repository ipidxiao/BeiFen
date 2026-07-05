# Save Schema Fixtures (v1–v7)

Static JSON samples for persistence migration smoke tests. Each file represents a **legacy or current** save shape; `tests/save_migration_smoke.js` loads them through `CoCState.__testing.migrateSaveData` and `loadGame`.

| File | Schema | Purpose |
|------|--------|---------|
| `v1_flat_minimal.json` | v1 (flat) | Pre-nested saves without `kpEngine` |
| `v2_with_kp_engine.json` | v2 | Nested save with `kpEngine.enabled: true` |
| `v3_with_scene_map.json` | v3 | `sceneMap` rooms + `kpEngine.scenePaths` |
| `v4_with_clue_board.json` | v4 | `clueBoard` clues + stringly-typed room coords |
| `v5_with_atmosphere.json` | v5 | `diceHistory` + `atmosphere` |
| `v6_with_context_meta.json` | v6 | `contextMeta` + string `selectedCharIndex` |
| `v7_current_schema.json` | v7 | Current schema with active combat + full kpEngine |

After migration, all fixtures should reach `SAVE_SCHEMA_VERSION` (7) with normalized arrays, enemy IDs, and clamped `selectedCharIndex`.

Run: `node tests/save_migration_smoke.js` or `npm test`.
