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
