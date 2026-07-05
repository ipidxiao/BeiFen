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
