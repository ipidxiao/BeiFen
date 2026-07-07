# ui-ux-pro-max 技能工作流（CoC Engine）

本仓库已在 `.cursor/skills/ui-ux-pro-max/` 内置 [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 技能。与 `docs/UI_DESIGN.md`、`css/style.css` 的 `:root` 令牌配合使用，**不要**引入 Tailwind 或整页重写。

## 何时调用技能

| 场景 | 示例 | 做法 |
|------|------|------|
| 新页面 / 大改版 | 「优化大厅视觉」「重做战斗面板」 | 先跑 `--design-system`，再对照 `UI_DESIGN.md` 实现 |
| 新组件 | 「加模组卡片」「存档弹窗」 | `--domain style` 或 `--domain ux` 补充细节 |
| 配色 / 字体 | 「更克苏鲁一点」 | `--design-system` 或 `--domain color` |
| 审查现有 UI | 「检查无障碍」「移动端触摸区」 | 技能内 Pre-Delivery Checklist + `UI_DESIGN.md` 对照表 |
| 修 UI 小问题 | 「按钮 hover 断了」「焦点环看不见」 | 直接改 `style.css` 令牌，必要时 `--domain ux` |

在 Cursor 中提示 UI 任务时，写明：**遵循 `docs/UI_DESIGN.md` 与 `css/style.css` 令牌，Bootstrap 5 网格不变。**

## 设计系统搜索命令

需 **Python 3.x**（Windows 用 `python`）：

```powershell
cd "c:\Users\x1767\OneDrive\Desktop\CoC_Engine_V17.2_CCGS"
python .cursor/skills/ui-ux-pro-max/scripts/search.py "horror TRPG dark dashboard gaming storytelling" --design-system -p "CoC Engine" -f markdown
```

常用参数：

- `-f markdown` — 输出适合写入文档的 Markdown
- `--domain ux "loading accessibility"` — UX 专项检查
- `--persist` — 生成 `design-system/MASTER.md`（可选，大项目用）

将摘要写入或更新 `docs/UI_DESIGN.md` 的 **Design system (ui-ux-pro-max generated)** 一节，并注明哪些建议**采纳**、哪些**拒绝**（如 WebGL、Google Fonts CDN）。

## 与 UI_DESIGN.md + CSS 令牌的关系

```
用户需求 → search.py --design-system
         → 对照 UI_DESIGN.md（组件映射、反模式）
         → 映射到 css/style.css :root（--bg-*、--text-*、--space-*、--transition-*）
         → 改 .mjs 视图 + style.css（不新增 UI 框架）
         → npm run build:js（若改了 .mjs）
         → SW 缓存随 build 自动刷新（style.css 参与 content hash）
```

**映射原则：**

- 技能推荐色 → 优先扩展现有语义令牌，避免组件内裸 `#hex`
- 技能推荐字体 → PWA 离线优先：系统字体 + Noto Sans SC；可选 `--font-*-fallback` 注释映射
- 技能推荐 3D/重动效 → CoC 一律拒绝，保留 `prefers-reduced-motion` 与纯 CSS 微交互
- 空状态 / 加载 → 统一 `.empty-state` 系列（见 `UI_DESIGN.md` § Empty states）

## 交付前自检（精简）

- [ ] 可点击元素有 `cursor: pointer` 与 150–300ms 过渡
- [ ] `:focus-visible` 金环（`--focus-ring-*`）
- [ ] 触摸目标 ≥ 44px（`.story-tab-btn`、`.lobby-action-btn` 等）
- [ ] 表单：`label` + `for` + 可选 `aria-describedby` + `.form-field-hint`
- [ ] 导航/标签用 SVG `<coc-icon>`，不用 emoji 当结构图标
- [ ] `npm test` + `npm run ci:smoke` 通过

## 技能完整文档

详见仓库内：[`.cursor/skills/ui-ux-pro-max/SKILL.md`](../.cursor/skills/ui-ux-pro-max/SKILL.md)

上游仓库：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
