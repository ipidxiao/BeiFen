# CoC Engine — UI Design Notes

Design improvements follow patterns from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) and the [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) format: semantic tokens, dark cinematic surfaces, readable typography, and CSS-only micro-interactions.

## Inspiration applied

| DESIGN.md section | CoC Engine application |
|-------------------|------------------------|
| Color palette & roles | `:root` tokens in `css/style.css` — `--bg-*`, panel variants (`--bg-panel-combat`, `--bg-panel-dice`, …), `--text-*`, `--hp-red`, `--san-blue`, `--accent-gold` |
| Typography hierarchy | `.coc-section-title`, chat message roles (`.kp-msg`, `.sys-msg`, `.madness-msg`, `.alert-msg`) |
| Component states | Button `:hover`/`:active`, `.lobby-mod-card.active`, `.lobby-kp-panel.active` |
| Layout & spacing | `--space-xs` … `--space-xl` scale; mobile touch targets ≥44px |
| Depth & elevation | `--shadow-panel`, card borders, subtle inset glow on active lobby/KP panels |
| Do's / Don'ts | Horror atmosphere via muted borders — no heavy animation libs; PWA-safe pure CSS |

Aesthetic reference: **ElevenLabs** (dark cinematic) + **VoltAgent** (void-black canvas, single accent) adapted for CoC 7e horror TRPG — readable first, atmospheric second.

## Key files

| File | Role |
|------|------|
| `css/style.css` | Design tokens, chat/combat/lobby/settings styles |
| `js/views/lobby_view.mjs` | Lobby hero (Elder Sign), cards, KP panel, settings difficulty selector |
| `js/components/story_chat.mjs` | Chat location header, pending-check, loading states |
| `js/components/story_combat.mjs` | Enemy cards use `.combat-enemy-card` |

## Conventions

- Edit `.mjs` sources; run `npm run build:js` to regenerate browser bundles.
- Artist workflow: optional merge via `roles/artist/` + `merge.py` (see header comment in `style.css`).
- Bootstrap 5 remains the layout grid; custom tokens extend — do not add CDN UI frameworks.

## Icon system (`css/icons.svg`)

Stroke-based SVG sprite with semantic symbol ids (`icon-dice`, `icon-character`, `icon-inventory`, …). **Inline copy** is injected at the top of `index.html` `<body>` (hidden) so `<use href="#icon-*">` works offline — including `file://` opens where external sprite fetches are blocked. The standalone `css/icons.svg` file remains for SW cache / preload over HTTP.

```html
<coc-icon name="dice" :size="18" title="掷骰"></coc-icon>
```

Renders `<use href="#icon-dice">` (same-document fragment). Additional symbols: `elder`, `d6`, `d20`, `tier-s` … `tier-mythic`. Equipment slots map through `EQUIP_SLOT_ICON_IDS`; journal log types use `journalIconId(type)`. Chat system messages keep emoji where inline SVG is awkward.

**`file://` note:** Service workers and some fetches do not run on `file://`; icons still render via the inline sprite. For full PWA/offline, serve over HTTP (`npx serve .` or any static host).

Regenerate PWA raster icons: `npm run icons:pwa` (requires `sharp` or ImageMagick). Outputs `icon-180.png` (iOS `apple-touch-icon` in `index.html`), `icon-192.png`, `icon-512.png`, and maskable 512.

## Empty states (`.empty-state`)

Shared pattern for zero-data and loading UI:

| Surface | Trigger | Copy |
|---------|---------|------|
| Lobby modules | `modulesLoading` / empty list | 正在加载模组… / 尚无模组 |
| Chat | `chatHistory.length === 0` | 故事尚未开始 + optional API key hint |
| Combat enemies | `combat.enemies.length === 0` | 暂无敌方单位 |
| Settings | missing `apiKey` | 未配置 API 密钥 |
| Inventory / clues / journal / map | panel-specific empty arrays | Chinese hints per panel |

CSS: `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-hint`; compact variant `.empty-state-compact`.

## Sub-panel cards (`.coc-panel-card`)

Unified card surface for `story_inv`, `story_equip`, `story_clues`, `story_map` — uses `--bg-card` and `--border-default` tokens with `.coc-section-title` headers.

## Lobby hero (`.lobby-hero`)

Centered Elder Sign via `<coc-icon name="elder" :size="72">` (sprite derived from `favicon.svg`). Subtitle uses `.lobby-hero-tagline` with `--text-muted` and letter-spacing. Minimal — no extra imagery or animation.

## Dice silhouettes (`icon-d6`, `icon-d20`)

`story_dice.mjs` renders roll results as `.dice-face-svg`: SVG silhouette from the inline `#icon-d6` / `#icon-d20` symbols with numeric overlay. d6 uses `icon-d6`; all other polyhedral types fall back to `icon-d20`. Dropped dice use `.dice-dropped-face` (dimmed + strikethrough).

## Item tier badges (`.tier-badge`)

S / A / B / C / MYTHIC map to sprite ids `icon-tier-s` … `icon-tier-mythic`. Inventory and equip panels use `<coc-icon>` inside a colored ring (`.tier-badge-S`, etc.). MYTHIC keeps `mythicGlow` animation. Emoji tier icons in `CoCItemDB.TIERS` remain for data; UI uses SVG only.

## Panel background tokens

Per-panel surfaces tokenized in `:root` and utility classes (`.bg-panel-header`, `.bg-panel-deep`, `.bg-surface-canvas`, …). `style.css` panel sections (`.dice-panel`, `.clue-panel`, `.npc-panel`, …) and `story_*.mjs` inline hex replaced where feasible. Add new panel variants to `:root` before hardcoding hex.

## Ambient layer (`body::after`)

Radial gradient overlays breathe slowly (`ambient-breathe`, 18s). Disabled when `prefers-reduced-motion: reduce`.

