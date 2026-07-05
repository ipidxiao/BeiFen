# CoC Engine — Audit Round 6 批次追踪

> 2026-07-05 六轮审计修复（AUDIT6-P1~P3）。  
> 四轮追踪见 [AUDIT4_BATCHES.md](AUDIT4_BATCHES.md) · 三轮见 [AUDIT3_BATCHES.md](AUDIT3_BATCHES.md)。

**状态图例：** `[ ]` pending · `[~]` in_progress · `[x]` done · `[-]` skipped/wontfix

**版本源：** `package.json` → `18.1.0` · 门禁 **35/35** smoke（`npm test`）

**轮次状态：** **CLOSED** — 7/7 done · 0 pending · 0 wontfix · 实现 `4cc76af` · 追踪 `02ea82f`

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
| [x] | AUDIT6-P2-02 | Commit untracked `.mjs` / `css` source for reproducible build | `icon_sprite.mjs` / `story_dice.mjs` synced in `4cc76af`; `css/icons.svg` + `css/style.css` tracked; temp `_inject_icons.mjs` removed post-inline (`27f3e5e`); `git status` clean ✓ |
| [x] | AUDIT6-P3-01 | iOS PWA meta tags in `index.html` | apple-mobile-web-app-* + mobile-web-app-capable ✓ |

---

## Batch R6-C — UX 与离线图标 (LOW)

| 状态 | ID | 标题 | 验证 |
|:----:|----|------|------|
| [x] | AUDIT6-P3-02 | Wire `pushReason` to journal on pushed roll | story_dice.mjs `addJournalEntry` ✓ |
| [x] | AUDIT6-P3-03 | Tighten fatal crash overlay — Vue mount only | index.html benign whitelist ✓ |
| [x] | AUDIT6-P3-04 | Inline `icons.svg` in `index.html` for `file://` | `#icon-*` same-document refs ✓ |

---

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | R6-A–C | 六轮审计 7/7 完成；35/35 smoke；`4cc76af` — modulepreload 404、SW scope paths、源文件入库、iOS PWA meta、pushReason journal、crash overlay、inline icons |
| 2026-07-05 | — | 追踪文档定稿 `02ea82f`；移除临时 `_inject_icons.mjs` `27f3e5e` |
| 2026-07-05 | — | 创建 AUDIT6 批次追踪 |
