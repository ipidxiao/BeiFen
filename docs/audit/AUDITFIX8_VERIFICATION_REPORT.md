# AUDITFIX8 Verification Report

## Scope

Verified `CoC_Engine_V16_4_AUDITFIX8.zip` as a candidate stable package:

- Architecture and file organization
- `index.html` script loading order
- Tool catalog and domain handler registry
- Malformed `tool_calls` handling
- Core CoC rule engine regression
- Representative state mutations for inventory, NPC, clues, map, combat, save migration, UI feedback

## Architecture Findings

PASS:

- `js/tool_handlers.js` monolith has been removed.
- Tool handlers are organized by domain under `js/tools/handlers/`.
- `js/tools/handlers/index.js` remains the only aggregation boundary consumed by `ai_logic.js`.
- Tool definitions live under `js/tools/definitions.js`.
- Context logic lives under `js/core/context_manager.js`.
- Audit reports live under `docs/audit/`.
- `index.html` loads `context_manager -> definitions -> state -> handler modules -> handler index -> ai_logic` in the correct order.

## Logic / Bug Findings

### Fixed during verification: skill alias lookup

The browser-only core regression suite exposed a real rules bug:

```text
Engine.getSkillValue(char, "格斗：斗殴") returned 25 instead of the character's allocated 斗殴 value.
```

Root cause:

- `getSkillValue()` checked exact `skillAllocations[skillName]` before alias resolution.
- Alias fallback returned the base skill value directly.
- Therefore aliases such as `格斗：斗殴` did not resolve back to canonical `斗殴` before checking allocations.

Fix:

- `getSkillValue()` now builds canonical skill candidates.
- It checks allocations and character skill overrides across alias/parent-child candidates before falling back to base values.
- Confirmed cases:
  - `格斗：斗殴 -> 斗殴 allocation`
  - `射击：手枪 -> 手枪 allocation`
  - bare `手枪 -> 射击 base 20` when unallocated
  - `驾驶：汽车 -> 驾驶：汽车 allocation` when present

No save schema change was required. `SAVE_SCHEMA_VERSION` remains `7`.

## Test Results

Executed from the final verification package:

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
node tests/auditfix8_verification_smoke.js
```

Additional browser-style `engine_tests.js` execution after the fix:

```text
11 passed, 0 failed
```

## Current Assessment

AUDITFIX8 architecture is confirmed clean and modular. After the alias lookup fix, the verified package passes the existing smoke suite plus the added verification smoke test.

Remaining non-blocking release hygiene:

- `index.html` still loads `tests/engine_tests.js` automatically as a development-only browser test. It now passes, but for a polished release build it should be gated behind a debug flag or removed from production HTML.
