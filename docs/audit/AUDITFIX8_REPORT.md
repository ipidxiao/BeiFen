# CoC Engine V16.4 AUDITFIX8 Report

## Scope

AUDITFIX8 continues from AUDITFIX7 and focuses on two requested items:

1. Split `tool_handlers.js` by domain.
2. Add malformed `tool_calls` regression coverage.

This round is primarily architecture and robustness work. It does **not** introduce a new save data shape, so `SAVE_SCHEMA_VERSION` remains `7`.

---

## 1. File organization cleanup

The source tree now separates core utilities and AI tool infrastructure more clearly:

```text
js/
  core/
    context_manager.js

  tools/
    definitions.js
    handlers/
      character.js
      inventory.js
      dice.js
      clues.js
      map.js
      combat.js
      npc.js
      system.js
      index.js
```

Removed root-level files:

```text
js/context_manager.js
js/tool_definitions.js
js/tool_handlers.js
```

Updated `index.html` load order:

```text
coc.js
core/context_manager.js
tools/definitions.js
state.js
tools/handlers/*.js
tools/handlers/index.js
char_creator.js
ai_logic.js
```

The aggregation contract remains stable:

```javascript
window.CoCToolHandlers.create(State, Engine)
```

`ai_logic.js` still only depends on that single entry point, so it does not need to know individual domain module paths.

---

## 2. Tool Handler domain split

The former monolithic handler registry has been split as follows:

### `js/tools/handlers/character.js`

```text
update_character_status
```

### `js/tools/handlers/inventory.js`

```text
update_inventory
consume_inventory_items
```

### `js/tools/handlers/dice.js`

```text
roll_dice
group_roll
opposed_roll
```

### `js/tools/handlers/clues.js`

```text
add_clue
link_clues
mark_clue_status
```

### `js/tools/handlers/map.js`

```text
create_map
update_room
set_position
```

### `js/tools/handlers/combat.js`

```text
start_combat
end_combat
update_enemy
enemy_attack
fire_weapon
```

### `js/tools/handlers/npc.js`

```text
register_npc
update_npc_status
```

### `js/tools/handlers/system.js`

```text
system_alert
record_engine_log
```

### `js/tools/handlers/index.js`

Owns module aggregation, duplicate handler detection, and the public registry:

```javascript
window.CoCToolHandlers = {
  create,
  getHandlerNames,
  getModuleOrder,
  getLoadedModuleNames
}
```

---

## 3. malformed `tool_calls` hardening

AUDITFIX8 adds defensive handling for model responses with malformed tool call structures.

### New behavior

#### Non-array `tool_calls`

```javascript
tool_calls: { id: 'not-array' }
```

Result:

```text
Rejected locally.
No tool message is generated.
No follow-up AI request is made.
```

#### Missing `function`

```javascript
tool_calls: [{ id: 'x', type: 'function' }]
```

Result:

```text
Rejected locally.
No orphan tool response is generated.
```

#### Missing `function.name`

```javascript
tool_calls: [{ id: 'x', type: 'function', function: { arguments: '{}' } }]
```

Result:

```text
Rejected locally.
No orphan tool response is generated.
```

#### Missing `tool_call_id`

```javascript
tool_calls: [{ type: 'function', function: { name: 'system_alert', arguments: '{}' } }]
```

Result:

```text
Rejected before handler dispatch.
No side effects are executed.
```

#### Bad JSON with valid id and valid function name

```javascript
tool_calls: [{ id: 'x', function: { name: 'system_alert', arguments: '{bad json' } }]
```

Result:

```text
A matching role=tool error is returned.
AI narration may continue safely.
```

#### Unknown tool with valid id and valid function name

```javascript
tool_calls: [{ id: 'x', function: { name: 'not_a_real_tool', arguments: '{}' } }]
```

Result:

```text
A matching role=tool error is returned.
AI narration may continue safely.
```

---

## 4. API context sanitization

`ai_logic.js` now sanitizes historical assistant `tool_calls` before sending them back to the AI API.

Invalid historical tool calls are filtered out so the next request does not contain:

```text
undefined id
undefined function.name
malformed function payload
```

This prevents malformed model output from contaminating long-running chat context.

---

## 5. Test coverage added/updated

### New test

```text
tests/auditfix8_malformed_tool_calls_smoke.js
```

Covers:

```text
non-array tool_calls
missing function
missing tool_call_id
bad JSON arguments
unknown tool name
follow-up payload does not leak undefined malformed fields
side-effectful handlers are not executed when id is missing
```

### Updated existing tests

All previous smoke tests now load the new folder structure:

```text
js/core/context_manager.js
js/tools/definitions.js
js/tools/handlers/*.js
js/tools/handlers/index.js
```

`auditfix6_smoke.js` now scans all domain handler files for `args.<field>` usage instead of scanning the removed monolithic file.

`auditfix7_browser_smoke.js` now verifies the new script order and the presence of all domain handler modules.

---

## 6. Verification

Executed from the final working tree:

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
node tests/auditfix5_smoke.js
node tests/auditfix6_smoke.js
node tests/auditfix7_migration_smoke.js
node tests/auditfix7_handler_smoke.js
node tests/auditfix7_browser_smoke.js
node tests/auditfix8_malformed_tool_calls_smoke.js
```

Result:

```text
AUDITFIX3 smoke tests passed
AUDITFIX4 smoke tests passed
AUDITFIX5 smoke tests passed
AUDITFIX6 smoke tests passed
AUDITFIX8 migration smoke tests passed
AUDITFIX8 handler smoke tests passed
AUDITFIX8 browser smoke tests passed
AUDITFIX8 malformed tool_calls smoke tests passed
```

---

## 7. Notes for AUDITFIX9

Recommended next steps:

1. Rename legacy test filenames from `auditfix7_*` to architecture-neutral names.
2. Add fixture-based browser regression for actual UI button flows.
3. Add per-domain Tool Handler tests with direct handler module loading.
4. Consider moving `ai_logic.js` into `js/ai/` once tests and docs are fully path-agnostic.
