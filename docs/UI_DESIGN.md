# CoC Engine — UI Design Notes

Design improvements follow patterns from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) and the [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) format: semantic tokens, dark cinematic surfaces, readable typography, and CSS-only micro-interactions.

## Inspiration applied

| DESIGN.md section | CoC Engine application |
|-------------------|------------------------|
| Color palette & roles | `:root` tokens in `css/style.css` — `--bg-*`, `--text-*`, `--hp-red`, `--san-blue`, `--accent-gold` |
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
| `js/views/lobby_view.mjs` | Lobby cards, KP panel, settings difficulty selector |
| `js/components/story_chat.mjs` | Chat location header, pending-check, loading states |
| `js/components/story_combat.mjs` | Enemy cards use `.combat-enemy-card` |

## Conventions

- Edit `.mjs` sources; run `npm run build:js` to regenerate browser bundles.
- Artist workflow: optional merge via `roles/artist/` + `merge.py` (see header comment in `style.css`).
- Bootstrap 5 remains the layout grid; custom tokens extend — do not add CDN UI frameworks.

## Icon system (`css/icons.svg`)

Stroke-based SVG sprite with semantic symbol ids (`icon-dice`, `icon-character`, `icon-inventory`, …). Loaded via `<link rel="preload" href="./css/icons.svg">` and referenced by the global `<coc-icon>` Vue component (`js/components/icon_sprite.mjs`).

```html
<coc-icon name="dice" :size="18" title="掷骰"></coc-icon>
```

Renders `<use href="./css/icons.svg#icon-dice">`. Equipment slots map through `EQUIP_SLOT_ICON_IDS`; journal log types use `journalIconId(type)`. Chat system messages keep emoji where inline SVG is awkward.

Regenerate PWA raster icons: `node scripts/generate_pwa_icons.mjs` (requires `sharp` or ImageMagick).

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

