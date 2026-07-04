# AUDITFIX8 VERIFIED SKILLVIS Review & Automated Validation

Date: 2026-06-14
Target input: `CoC_Engine_V16_4_AUDITFIX8_VERIFIED_SKILLVIS.zip`
Output: `CoC_Engine_V16_4_AUDITFIX8_VERIFIED_SKILLVIS_REVIEWFIX.zip`

## Scope

This review treated SKILLVIS as a candidate stable build and checked:

1. Directory architecture and script load order.
2. Secondary-skill visibility behavior.
3. Existing AUDITFIX3-8 smoke suites.
4. Browser-ish core engine regression suite.
5. Tool catalog/handler consistency and malformed `tool_calls` protections.
6. Representative runtime functions: creator skill totals, saved character skills, group/opposed rolls, and growth.

## Architecture result

Passed.

Current layout remains clean and type-grouped:

```text
js/core/context_manager.js
js/tools/definitions.js
js/tools/handlers/
  character.js
  inventory.js
  dice.js
  clues.js
  map.js
  combat.js
  npc.js
  system.js
  index.js
docs/audit/
```

`index.html` loads the core/tool modules in the expected dependency order:

```text
coc.js
core/context_manager.js
tools/definitions.js
state.js
tools/handlers/*.js
tools/handlers/index.js
char_creator.js
ai_logic.js
components/views
ui_feedback.js
app.js
```

No legacy `js/tool_handlers.js` file is present.

## Confirmed issue found during review

### BUG-REVIEW-001: Creator allocation object could corrupt visible skill totals

`draftChar.skillAllocations` stores creator-time allocation deltas as objects:

```js
{ occ: 10, per: 5 }
```

But `Engine.getSkillValue()` treated `char.skillAllocations[name]` as a final numeric skill value. In the creator, `getSkillTotal()` calls:

```js
base = Engine.getSkillValue(draftChar, skillName)
return base + occ + per
```

Before this fix, once a skill had allocation data, `base` could become the object itself, producing corrupted totals such as:

```text
[object Object]100
```

This could also pollute saved character skill values.

### Fix

`Engine.getSkillValue()` now normalizes assigned skill values:

- numeric `skills[name]` remains supported;
- legacy numeric `skillAllocations[name]` remains supported;
- creator-style `{ occ, per }` objects are ignored by base skill lookup;
- object values with explicit numeric `value/total/final/currentValue` are supported for compatibility;
- if both `skills` and numeric `skillAllocations` exist, the higher numeric value is used to avoid legacy delta values overriding final skills.

## Additional runtime fixes made

### Runtime dice/growth skill reads

Two runtime consumers were still reading `skillAllocations` directly instead of final `skills`:

- `State.groupRoll()`
- `opposed_roll` handler

They now use `CoCEngine.getSkillValue()`.

### Growth writeback

`rollImprovement()` now:

- starts from the current final skill value;
- writes the improved value back to `char.skills[skillName]`;
- keeps legacy numeric `skillAllocations[skillName]` aligned;
- caps improved value at 99.

## Added regression test

Added:

```text
tests/auditfix8_review_functional_smoke.js
```

Coverage:

- creator allocation objects do not corrupt `Engine.getSkillValue()`;
- `Creator.getSkillTotal('手枪')` returns numeric `35`, not `[object Object]...`;
- saved character skill values remain numeric;
- hidden stale parent skill `射击` is not saved as a visible skill;
- `groupRoll()` uses final `skills` values;
- `opposed_roll` uses final `skills` values;
- `rollImprovement()` starts from final value and writes back to final skills.

## Automated validation commands

Executed from final unpacked zip:

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
node tests/auditfix8_secondary_skill_visibility_smoke.js
node tests/auditfix8_review_functional_smoke.js
```

All tests passed.

The browser-ish `engine_tests.js` core regression also passed:

```text
11 passed, 0 failed
```

## Manual/static checks

Passed:

- no direct `alert(...)` / `confirm(...)` calls in source;
- no `eval(...)` or `new Function(...)`;
- no old `js/tool_handlers.js` monolith;
- `SAVE_SCHEMA_VERSION` remains `7` because no persisted save data shape changed.

## Status

Recommended build: `CoC_Engine_V16_4_AUDITFIX8_VERIFIED_SKILLVIS_REVIEWFIX.zip`

Reason: SKILLVIS architecture and secondary-skill visibility logic are valid, but the reviewed input contained a real creator skill-total corruption bug. REVIEWFIX includes the fix and the new automated regression.
