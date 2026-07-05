# CoC Engine — Architecture Notes

## Source vs browser bundles

| Layer | Location | Rule |
|-------|----------|------|
| Authoritative source | `js/**/*.mjs` | Edit only `.mjs` |
| Browser bundle | `js/**/*.js` (generated) | Run `npm run build:js`; **commit** generated `.js` |
| Browser-only | See `scripts/BROWSER_ONLY.md` | Never generated from `.mjs` |

`.gitignore` does **not** ignore generated `.js` — they ship with the static site and SW cache manifest.

## `window.*` global namespace

The engine is a **no-bundler** static site: `index.html` loads many `<script>` tags. Modules expose APIs on `window` for cross-script access.

**Pattern:**

```js
// module.mjs
export const MyApi = { ... };
if (typeof window !== 'undefined') {
    window.CoCMyApi = MyApi;
}
```

**Conventions:**

- Prefix: `CoC*` for engine data/helpers (`CoCScenarioStore`, `CoCKpConfig`, …)
- KP runtime: `window.KpExecutionEngine` (canonical); `window.CoCLondonKpEngine` is a legacy alias
- Prefer `window.CoCKpConfig.getKpEngine()` in browser handlers (no ESM `import` — `build_browser.mjs` strips imports); `kp_config.mjs` also exports `getKpEngine` for Node/ESM smoke tests
- Full refactor to a single namespace (e.g. `window.CoC.*`) is deferred — scope too large for incremental audit

**Key globals (non-exhaustive):**

| Global | Module |
|--------|--------|
| `KpExecutionEngine` | `js/campaign/kp_execution_engine.mjs` |
| `CoCKpConfig` | `js/state/kp_config.mjs` |
| `CoCScenarioStore` | `js/scenario/store.mjs` |
| `CoCAIPromptConfig` | `js/data/ai_prompt_config.mjs` |
| `CoCLanguageFilter` | `js/ai/language_filter.mjs` |

## PDF import & CORS

One-click itch.io PDF import often **fails in the browser** because itch signed download URLs are cross-origin and blocked by CORS.

**Recommended workflow:**

1. Download the PDF manually from the official itch.io page
2. Use lobby **「选择 PDF 转换」** (local file picker)
3. Converted scenario stays in IndexedDB — never shipped in repo

Local `vendor/pdf.min.js` is preferred; CDN fallback (`cdnjs.cloudflare.com`) is network-only and listed in SW `SKIP_HOSTS`.

## Difficulty presets

Canonical id for the KP / 神战 tier: **`divine_war`**. Legacy id `masks_london_kp` resolves via `DIFFICULTY_PRESET_ALIASES` in `ai_prompt_config.mjs`.

## Combat interaction model: offline menu vs online dialogue

CoC 7e combat action taxonomy (`COC_7E_COMBAT_ACTIONS` in `masks_london_kp_rules.mjs`) defines the **official action palette** — categories, tags, and UI quick-action labels. It is **guidance**, not a per-round engine gate.

| Mode | Primary interaction | Role of action menu |
|------|---------------------|---------------------|
| **Offline / no network** | Quick actions in `story_combat` UI (`StoryCombat.quickAction`) | **Primary** — player picks from the CoC 7e menu; text is sent as player input |
| **Online / with AI** | Free-form dialogue and player-described actions in `story_chat` | **Optional reference** — taxonomy helps AI/KP prompts and quick buttons; engine resolves outcomes via tools/handlers |

**What the engine does enforce (separate concern):**

- `recordCombatAction` + pure-damage tracking → `IF_damage_only_strategy` enemy immunity when KP is enabled (`kp_execution_engine.mjs`, `combat.mjs` handlers). This anti–pure-damage rule is **not** the same as forcing the full menu each round.
- Combat handlers (`fire_weapon`, `dodge`, `grapple`, etc.) return structured results regardless of whether the player used a quick button or free text.

**What the engine does *not* enforce:**

- Presenting or acknowledging the full action menu every round (`COMBAT_SYSTEM.REQUIRE.narrative_acknowledge_options`, `tactical_diversity` in KP rules) — advisory for prompts/UI, not a hard validator.
- Blocking free-text actions that do not map to a menu category id.

See [AUDIT3_BATCHES.md — Enforcement 诚实性](AUDIT3_BATCHES.md#enforcement-诚实性--wontfix--按设计) for audit disposition.

## Testing & E2E flow smoke

| Entry | Purpose |
|-------|---------|
| `npm test` | `tests/run_all_smoke.js` — all VM/ESM smoke suites |
| `npm run test:e2e` | `tests/flow_lobby_combat_smoke.js` — lobby → enterModule → start_combat → save → load (Node VM, no Playwright) |
| `tests/save_migration_smoke.js` | v1–v7 JSON fixtures under `tests/fixtures/saves/` |
| `tests/ui/component_helpers_smoke.mjs` | Pure UI helpers (combat quick actions, toast/chat formatters) |
| `npm run stats:readme` | Regenerate README package stats |

See [TEST_COVERAGE_GAP.md](TEST_COVERAGE_GAP.md) and [GIT_WORKFLOW.md](GIT_WORKFLOW.md).

## KP enforcement inventory (engine-enforced)

| Rule | Module | KP required? | Notes |
|------|--------|:------------:|-------|
| Language filter (`CoCLanguageFilter`) | `ai_logic.mjs` | No | Global output quality |
| Narrative era strip (`validateNarrativeEra`) | `kp_execution_engine.mjs` + `ai_logic.mjs` | No | Same pattern as language filter |
| Output protocol restructure | `output_protocol.mjs` + `ai_logic.mjs` | No | Five-phase tags |
| `DOOM_CLOCK` ticks | `kp_execution_engine.mjs` | Yes | Attention+, time, key clue, mythos, combat win, ambush; cap 24 |
| `ATTENTION` / `PLAYER_POWER` / phase | `kp_execution_engine.mjs` | Yes | Combat, clues, mythos |
| Pure-damage combat immunity | `recordCombatAction` | Yes | Not full-menu enforcement |
| Reality distortion (ATTENTION≥9) | `handleFirearmAttempt` | Yes | bullet_fail / spatial_error |
| Antagonist misinfo / ambush / social infiltration | `runAntagonistTick`, `applySocialInfiltration` | Yes | `adaptStrategy` weights drive rolls |
| Clue path gate (3 paths) | `canAddClue`, `evaluateKeyClueRequest` | Yes | |
| Firearm ammo gate | `validateFirearmAmmo` | Yes | |
| **Combat full menu each round** | — | — | **wontfix** — see [Combat interaction model](#combat-interaction-model-offline-menu-vs-online-dialogue) |
