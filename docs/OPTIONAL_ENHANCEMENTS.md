# 可选增强跟踪表

> 启动日期：2026-07-06 | 基线提交：`197c9a9`

| # | 增强项 | 文档 | 状态 | 提交 | 验证 |
|---|--------|------|------|------|------|
| 1 | CDN 本地化（方案 C） | [cdn-evaluation.md](./cdn-evaluation.md) | ✅ 完成 | `99b7d8f` | `sw_cache_smoke.js`、vendor 文件、`fetch_vendor.mjs` |
| 2 | 无障碍 P1/P2 | [a11y-audit.md](./a11y-audit.md) | ✅ 完成 | `7b0a51a` | `a11y_smoke.js` |
| 3 | jsdom / E2E 覆盖 | [TEST_COVERAGE_GAP.md](./TEST_COVERAGE_GAP.md) | ✅ 完成（VM/jsdom） | `30fdd42` | `dom_parse_smoke.mjs`、`esm_state.mjs`、`esm_ai.mjs`、`esm_utils_smoke.mjs`、`esm_tool_dispatch.mjs`、`flow_lobby_combat_smoke.js` |
| 4 | ESM Phase 2 首片 | [ROADMAP.md](./ROADMAP.md) | 🔄 进行中 | `30fdd42` | 数据层 `.mjs` 为权威源；`?esm=1` 引导；`esm_phase2_boot_smoke.mjs` |

## 运行验证

```bash
npm test          # 39/39 suites
npm run ci:smoke
```
