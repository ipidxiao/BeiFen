# Browser-only files (excluded from `npm run build:js`)

| File | Reason |
|------|--------|
| `js/ai/worker.js` | Web Worker — separate thread, cannot be ESM-bundled into main bundle |
| `js/ai/worker_client.js` | Web Worker client bridge |
| `js/audio/sfx.js` | AudioContext API — browser-only; `sfx.mjs` is reverse shim |
| `js/components/dice_canvas.js` | Canvas/WebGL animation — browser-only; `dice_canvas.mjs` is reverse shim |
| `js/components/sanity_effects.js` | Vue SFC-style runtime component, browser-only |
| `js/state/accessor.js` | Browser `window.CoCState` accessor helper for legacy views |

Also excluded from generation (engine split pending Phase 2):

| File | Reason |
|------|--------|
| `js/coc.js` + `js/engines/*.js` | Browser uses split engines; `coc.mjs` monolith is Node test entry — merge in Phase 2 |
| `js/data/{injury_tables,insanity_tables,mythos_tomes,npc_templates,spells}.js` | Data tables — `.mjs` sources pending Phase 2 |
