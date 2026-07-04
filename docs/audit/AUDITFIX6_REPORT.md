# CoC Engine V16.4 AUDITFIX6 Report

## Scope

AUDITFIX6 continues from AUDITFIX5 and focuses on Tool Handler end-to-end stability rather than new gameplay features.

Primary goals:

1. Verify every AI Tool Handler mutates state through the real `triggerAI -> processTools -> handler` path.
2. Detect whether any handler reads `args.<field>` that is not declared in `js/tool_definitions.js`.
3. Prevent undeclared/hidden Tool parameters from silently reaching handlers.
4. Fix combat/firearm state bugs discovered while writing the end-to-end tests.

---

## Key Findings

### 1. Hidden Tool arguments were stripped but not rejected

AUDITFIX5 normalized arguments by copying declared schema fields. That prevented undeclared fields from reaching handlers, but the model could still send hidden parameters without receiving an explicit error.

AUDITFIX6 changes this behavior:

- Undeclared top-level Tool args now fail validation.
- Undeclared nested Tool args now fail validation.
- Validation errors include the offending field path, for example:

```text
update_inventory.hidden_state_write 未在工具 schema 中声明
create_map.rooms[0].secret 未在工具 schema 中声明
```

This makes schema drift and model-side hallucinated parameters visible instead of silently ignored.

---

### 2. API-facing Tool schemas did not explicitly forbid extra properties

`buildTools()` now applies strict object boundaries to API-facing schemas:

```javascript
additionalProperties: false
```

This is applied recursively to object schemas, including nested room/enemy definitions. Validator-only fields such as `singleAsArray` are still stripped before sending schema to the AI API.

---

### 3. `fire_weapon` had ambiguous targeting semantics

Before AUDITFIX6:

```javascript
fire_weapon({ target_name, damage })
```

The handler interpreted `target_name` as the firing investigator, not the enemy target. There was no declared way to target a specific enemy.

AUDITFIX6 adds explicit fields:

```javascript
shooter_name  // firing investigator
enemy_name    // target enemy
target_name   // legacy compatibility alias for shooter_name
```

The prompt injected into the latest player message now tells the model to prefer:

```text
shooter_name + enemy_name
```

---

### 4. Combat enemies were missing `isEnemy: true`

`startCombat()` created enemy objects without `isEnemy: true`, while `CombatEngine.autoResolveExchange()` checks `defender.isEnemy` before calling enemy HP update callbacks.

Result:

```text
fire_weapon could consume ammo but fail to apply damage to real combat enemies.
```

AUDITFIX6 fixes this at the state layer:

```javascript
isEnemy: true
```

is now added to newly created enemies, and save migration fills it for old combat enemy objects.

---

### 5. `fire_weapon` could double-apply armor

`CombatEngine.calculateDamage()` already subtracts target armor. The previous `fire_weapon` callback routed that already-armored damage through `toolHandlers.update_enemy()`, whose contract expects raw pre-armor damage and subtracts armor again.

AUDITFIX6 fixes the internal firearm path:

- External AI `update_enemy` still treats `hp_change` as raw pre-armor damage.
- Internal `fire_weapon` applies the already-armored combat result directly through `State.updateEnemy()`.
- The same enemy damage UI notice helper is reused so the player still sees the combat result.

---

## Files Changed

### `js/tool_definitions.js`

- Updated catalog header to AUDITFIX6.
- Expanded `fire_weapon` schema with:
  - `shooter_name`
  - `enemy_name`
  - legacy `target_name`
  - `damage`
- Added recursive API schema strictness via `addStrictObjectBoundaries()`.
- `buildTools()` now emits `additionalProperties: false` for object schemas.

### `js/ai_logic.js`

- Validator now rejects undeclared object properties.
- Updated AI instruction text for firearm calls.
- Added `pushEnemyDamageNotice()` helper.
- Updated `fire_weapon` to:
  - resolve shooter via `shooter_name || target_name`
  - resolve target enemy via `enemy_name`
  - return a clear error if named enemy is missing
  - consume ammo as before
  - apply already-armored combat damage directly, avoiding double armor
- Updated `update_enemy` to share the enemy damage notice helper.

### `js/state.js`

- `SAVE_SCHEMA_VERSION` raised from `5` to `6`.
- `startCombat()` now tags enemy objects with `isEnemy: true`.
- Save migration now fills missing `isEnemy: true` for older combat enemy objects.

### `tests/auditfix6_smoke.js`

New end-to-end test suite covering:

- Recursive `additionalProperties: false` in API schemas.
- Validator rejection of unknown top-level and nested args.
- Static hidden-argument scan: every top-level `args.<field>` read by handlers must be declared in catalog.
- Real `triggerAI -> processTools -> handler -> triggerAI` path for:
  - `update_character_status`
  - `update_inventory`
  - `consume_inventory_items`
  - `system_alert`
  - `roll_dice`
  - `group_roll`
  - `opposed_roll`
  - `add_clue`
  - `link_clues`
  - `mark_clue_status`
  - `create_map`
  - `update_room`
  - `set_position`
  - `start_combat`
  - `update_enemy`
  - `enemy_attack`
  - `fire_weapon`
  - `end_combat`
  - `register_npc`
  - `update_npc_status`
  - `record_engine_log`
  - `request_skill_check + executeSkillCheck`

---

## Validation

Executed from the release tree:

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
node tests/auditfix5_smoke.js
node tests/auditfix6_smoke.js
```

Result:

```text
AUDITFIX3 smoke tests passed
AUDITFIX4 smoke tests passed
AUDITFIX5 smoke tests passed
AUDITFIX6 smoke tests passed
```

Note: `tests/engine_tests.js` remains a browser-harness test file and is not directly runnable with plain `node tests/engine_tests.js` because it expects a browser `window` global.

---

## Remaining Recommendations for AUDITFIX7

1. Add a browser-level UI harness for save/load, modal confirm, combat panel, map panel, and clue board rendering.
2. Add deterministic combat exchange tests around critical/major wound paths.
3. Split AI tool handlers into a dedicated module so tests no longer need to drive private handlers through mocked AI responses.
4. Add import/export round-trip tests for schema v1-v6 saves.
5. Add a manual QA checklist for long campaign sessions exceeding 300 chat messages.
