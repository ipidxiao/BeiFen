# ESM Phase 2 — slice CLOSED (OPT-033)

**完成标准：** `?esm=1` 启动门控 + `app.mjs` 条件挂载 + `esm_phase2_boot_smoke` / `p4_architecture_smoke` 通过；下一步切片已文档化。

## Current state (`?esm=1`)

- `index.html` sets `window.__COC_ESM_BOOT__` when `esm=1` query param is present.
- `app.mjs` skips IIFE mount when boot flag is set; imports `globals_registry` at ESM boot.
- Data + engine layers have `.mjs` authority sources; `npm run build:js` generates browser IIFE.

## Verification (this slice)

- `tests/esm_phase2_boot_smoke.mjs` — gate + `coc.mjs` import chain + engine/registry asserts
- `tests/p4_architecture_smoke.mjs` — registry + contract imports

## Next incremental slices (V19+ backlog)

1. **Boot module** — extract `js/core/esm_boot.mjs` for query-param gate (shared by index inline + tests).
2. **State ESM entry** — `import { CoCState } from './state/state.mjs'` in `app.mjs` without duplicate window mount.
3. **Component ESM barrel** — lazy `import()` story tabs under `?esm=1` only.
4. **Deprecate dual track** — after steps 1–3 pass smoke, stop generating selected `.js` pairs (long-term).

Do **not** remove IIFE script tags until all views register under ESM bootstrap.
