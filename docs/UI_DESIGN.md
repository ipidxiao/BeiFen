# CoC Engine — UI Design Notes

Design improvements follow patterns from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) and the [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) format: semantic tokens, dark cinematic surfaces, readable typography, and CSS-only micro-interactions.

## External reference: ui-ux-pro-max-skill

**Source:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — a Cursor/Claude Agent Skill with 67 UI styles, 161 product-type reasoning rules, 99 UX guidelines, and stack-specific recommendations (HTML+Tailwind, Vue, React, etc.).

CoC Engine **vendors the skill in-repo** at `.cursor/skills/ui-ux-pro-max/`. Use it alongside this document and `css/style.css` tokens — do not replace Bootstrap with Tailwind.

### Recommended style profile (Gaming / TRPG)

| ui-ux-pro-max concept | CoC Engine mapping |
|-----------------------|-------------------|
| **Product type** | Gaming, storytelling-driven UI |
| **Style** | Dark Mode (OLED) + HUD / Sci-Fi FUI accents — horror atmosphere, readable first |
| **Pattern** | Dashboard / data-dense panels (inventory, combat, dice) + chat-centric narrative |
| **Anti-patterns** | Bright neon overload, emoji-as-icons, harsh motion, AI purple/pink gradients |
| **Stack** | HTML + Bootstrap 5 grid + custom CSS tokens (not Tailwind) |

### Pre-delivery checklist → CoC components

| Skill guideline | CoC implementation | File / class |
|-----------------|-------------------|--------------|
| SVG icons, no emoji UI chrome | Inline sprite `<coc-icon>` | `css/icons.svg`, `icon_sprite.mjs` |
| `cursor-pointer` on clickables | Buttons, cards, tabs, slots | `css/style.css` — `.btn`, `.nav-link`, `.lobby-mod-card`, `.clue-card`, `[role="button"]` |
| Hover / press 150–300ms transitions | `--transition-fast` (150ms), `--transition-normal` (250ms) | `:root` tokens |
| Focus rings for keyboard nav | `:focus-visible` gold outline | `.btn`, `.nav-link`, `.apex-slot`, `.dice-quick-btn`, `.lobby-mod-card`, `[role="button"]` |
| Touch targets ≥ 44px | Mobile overrides | `.lobby-action-btn` 52px, `.combat-quick-btn` 44px, `.story-tab-btn` 44px |
| `prefers-reduced-motion` | Ambient breathe disabled | `body::after` media query |
| Semantic color tokens, no raw hex in new code | `:root` `--bg-*`, `--text-*`, `--accent-*` | `css/style.css` |
| Contrast on dark surfaces | `--text-primary` on `--bg-dark` | WCAG-oriented token choices |
| Empty / loading states | `.empty-state` pattern | lobby, chat, combat, panels |
| ARIA / keyboard for custom controls | `aria-live`, `role="button"`, `@keydown.enter` | `story_chat.mjs`, `story_map.mjs`, `story_clues.mjs` |

### Component map (skill categories → CoC)

| UI area | CoC surface | Skill focus (priority) |
|---------|-------------|------------------------|
| Lobby | `.lobby-hero`, `.lobby-mod-card`, `.lobby-kp-panel` | Touch & interaction, style consistency |
| Story chat | `.chat-box`, `.kp-msg`, `.sys-msg` | Typography, accessibility (`aria-live`) |
| Combat | `.combat-panel`, `.combat-enemy-card`, `.combat-quick-btn` | Touch targets, color-not-only (HP/SAN bars) |
| Dice | `.dice-panel`, `.dice-quick-btn`, `.dice-face-svg` | Press feedback, SVG icons |
| Sub-panels | `.coc-panel-card`, `.coc-section-title` | Layout tokens, card elevation |
| Settings / creator | `.nav-tabs`, `.form-control` | Form labels, focus states |

### Install ui-ux-pro-max-skill for Cursor

The skill is **already in this repo** at `.cursor/skills/ui-ux-pro-max/` (commit ba4b118). Cursor auto-activates it on UI/UX tasks when present.

**To update from upstream:**

```bash
uipro update
# or re-init:
npx ui-ux-pro-max-cli init --ai cursor
```

**Workflow guide:** see `docs/UI_SKILL_WORKFLOW.md`.

**Using with CoC Engine:** When prompting Cursor for UI work, mention `docs/UI_DESIGN.md` and `css/style.css` tokens so generated code extends existing conventions instead of replacing them with Tailwind defaults.

**Advanced — generate a design-system brief:**

```bash
python .cursor/skills/ui-ux-pro-max/scripts/search.py "horror TRPG dark dashboard gaming storytelling" --design-system -p "CoC Engine"
```

## Design system (ui-ux-pro-max generated)

Generated via `search.py --design-system` (query: `horror TRPG dark dashboard gaming storytelling`). **Adapted for CoC Engine** — we reject heavy 3D/WebGL and keep readable system fonts for PWA offline.

| Recommendation | Skill output | CoC mapping / decision |
|----------------|--------------|------------------------|
| **Pattern** | Horizontal Scroll Journey — immersive discovery, sticky CTA | Story toolbar horizontal scroll + chat-centric narrative; lobby hero as vertical intro |
| **Style** | 3D & Hyperrealism (gaming) | **Rejected** — use dark cinematic HUD via CSS tokens, not WebGL/parallax |
| **Background** | `#020617` | Maps to `--bg-dark` / `--bg-surface-canvas` family |
| **Foreground** | `#F8FAFC` | Maps to `--text-primary` |
| **Accent (positive)** | `#22C55E` green CTA | Maps to `--success-green`; primary CTA stays `--accent-gold` for horror brand |
| **Typography** | Orbitron + JetBrains Mono | **Skipped CDN** — `--font-display-fallback` / `--font-mono-fallback` in `:root`; body keeps system + Noto Sans SC |
| **Effects** | WebGL, parallax, 3D shadows | **Rejected** — `body::after` ambient breathe + `--shadow-panel` only |
| **Anti-patterns** | Minimalism, static assets | We are content-dense TRPG dashboard; SVG sprite icons are intentional |
| **Pre-delivery** | SVG icons, cursor-pointer, 150–300ms hover, focus rings, reduced-motion, 375–1440px | See checklist table above + `docs/UI_SKILL_WORKFLOW.md` |

Re-run after major UI pivots:

```powershell
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --design-system -p "CoC Engine" -f markdown
```

Optional UX validation pass:

```powershell
python .cursor/skills/ui-ux-pro-max/scripts/search.py "animation accessibility z-index loading" --domain ux
```

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

