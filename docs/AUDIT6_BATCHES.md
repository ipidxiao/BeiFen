# CoC Engine — Audit Round 6 批次追踪

> 2026-07-05 六轮审计修复（AUDIT6-P1~P3）。  
> 五轮追踪见 [AUDIT5_BATCHES.md](AUDIT5_BATCHES.md) · 四轮见 [AUDIT4_BATCHES.md](AUDIT4_BATCHES.md)。

**状态图例：** `[ ]` pending · `[~]` in_progress · `[x]` done · `[-]` skipped/wontfix

**版本源：** `package.json` → `18.1.0` · 门禁 **35/35** smoke（`npm test`）

---

## Batch R6-A — 加载与部署 (HIGH)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT6-P1-01 | Remove dead `modulepreload` for `./js/state/state.js`; eliminate 404 | index.html no modulepreload 404 ✓ |
| [x] | AUDIT6-P2-01 | SW `ASSETS` scope-relative paths; subdirectory deploy | asset_manifest + sw.js + sw_cache_smoke ✓ |

---

## Batch R6-B — 源码与 PWA (MEDIUM)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT6-P2-02 | Commit untracked `.mjs` / `css` source for reproducible build | git status clean ✓ |
| [x] | AUDIT6-P3-01 | iOS PWA meta tags in `index.html` | apple-mobile-web-app-* + mobile-web-app-capable ✓ |

---

## Batch R6-C — UX 与离线图标 (LOW)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT6-P3-02 | Wire `pushReason` to journal on pushed roll | story_dice.mjs `addJournalEntry` ✓ |
| [x] | AUDIT6-P3-03 | Tighten fatal crash overlay — Vue mount only | index.html benign whitelist ✓ |
| [x] | AUDIT6-P3-04 | Inline `icons.svg` in `index.html` for `file://` | `#icon-*` same-document refs ✓ |

---

*Last updated: 2026-07-05 — AUDIT6 全部 7 项完成。*
