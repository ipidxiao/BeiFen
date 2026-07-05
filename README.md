# 🌑 CoC 7th Engine — V18.1

> 克苏鲁的呼唤第七版 TRPG 纯前端引擎  
> 版本: **18.1.0**（`package.json` 为准）· Service Worker 缓存名 `coc-engine-v18.5`  
> 门禁: **23/23** smoke ✅ · deep_verify 0/179 ✅

## 📦 包内容

| 类别 | 数量 | 说明 |
|------|------|------|
| JS引擎 | 60+ | `coc.js` 薄聚合层（~38 行）+ 分模块 engines/ + AI调度 + 9 Handler |
| ESM模块 | 51+ | `.mjs` 权威源码 → `npm run build:js` 生成 `.js` |
| 游戏数据 | 13 | 技能/物品/职业/经历/典籍/法术/理智/重伤/NPC/AI提示词等 |
| 剧本 | 15 | 10 内置 + 5 可下载（含 3 个 CC-BY 4.0 社区模组） |
| CSS | 832行 | 21变量 + 8面板唯一色 + 13 keyframes + 暗黑主题 |
| 测试 | 23 suites | VM smoke + ESM + deep_verify（`npm test`） |
| 资产 | 6 | favicon/SVG精灵/Web Audio SFX/Canvas骰子/PWA |

## 🚀 快速开始

```bash
npm run build:js      # .mjs → 浏览器 .js（改源码后必跑）
npm run build:js:check  # CI：校验生成物无 drift
npm test              # 23/23 全量 smoke
npm run build         # 打包 ZIP（内部自动 build:js）
npm run serve         # 本地开发服务器 :8080
```

## 📴 离线单机运行

引擎可在**无网络**环境下使用除 AI 守秘人以外的全部功能（骰子、战斗、角色卡、存档、手册等）。**本地剧本模式**可在完全离线时体验结构化剧情（见大厅「📜 本地剧本模式」）。

1. **首次使用**：在有网络时打开一次 `index.html`（或 `npm run serve`），让 Service Worker 缓存全部静态资源（含内置剧本与同域包体）。
2. **之后离线**：断网后刷新或从桌面安装的 PWA 启动，核心功能照常可用。
3. **AI 功能**：需要网络 + 用户自行配置的 API Key；离线时会提示「📴 离线模式」。
4. **本地剧本**：大厅 →「📜 本地剧本模式」或「📚 模组库」→ 选择/下载模组 → 创建调查员 → 开始。
5. **发布包**：`python build.py` 生成的 ZIP 已包含 `vendor/`、`sw.js`、`manifest.json` 及剧本文件。

> 注意：直接双击 `file://` 打开时浏览器可能不注册 Service Worker；推荐使用本地 HTTP 服务或安装为 PWA。

### 📚 模组库（Scenario Store）

- **内置模组（10）**：随引擎离线缓存，无需下载
- **可下载模组（5）**：`隔离研究所`、`闹鬼的遗产`（原创）及 `疗养院低语`、`灯塔日志`、`博物馆之夜`（CC-BY 4.0 社区改编）— 点击「下载到本地」写入 IndexedDB
- **下载源**：默认同域包体 `js/data/scenarios/packages/*.json`（**离线可用、权威**）；可选外部镜像在 `mirrorUrls` 配置（仓库发布后启用）
- **回退链**：同域主源 → 可选镜像 → 同域包（去重）；全部失败时显示中文错误提示
- **API**：`CoCScenarioStore.listCatalog()` / `listLocal()` / `getScenario(id)` / `downloadScenario(id)` / `removeDownload(id)` / `isAvailable(id)`
- **源码**：`js/scenario/store.mjs`、`js/data/scenarios/remote_catalog.mjs`、`js/data/scenarios/packages/*.json`

## 如何开发

- **只改 `.mjs`**：`.mjs` 为权威源码；对应 `.js` 由 `scripts/build_browser.mjs` 生成，勿手改
- **改完 `.mjs` 后执行** `npm run build:js`，再提交生成的 `.js`
- **提交前跑** `npm test`；`npm run build:js:check` 可单独校验 drift
- **浏览器专用、不参与生成的文件**：见 `scripts/BROWSER_ONLY.md`（`js/coc.js`、`js/ai/worker.js` 等）
- **发布打包**：`python build.py`（内部会自动执行 `build:js`）

## 🏗 架构

```
js/
├── data/       游戏数据 + scenarios/（内置剧本 + packages/ 可下载包）
├── engines/    规则引擎分模块（coc.js 聚合）
├── scenario/   模组库 store + runner
├── state/      状态管理
├── tools/      28工具定义 + 9 Handler模块
├── ai/         AI网络调度 + 逻辑引擎
├── components/ 13个Vue组件（含 char_creator）
└── views/      4个页面视图
```

## 🛡 安全

```
0 eval() · 0 v-html · 0 innerHTML · 0 document.write · 0 alert()
API Key: localStorage 用户配置 · 默认空字符串
```

## 📋 四角色协作

| 角色 | 文件 | 职责 |
|------|------|------|
| 🖥️ 程序 | `js/`(引擎/AI/状态/组件) | 核心逻辑 |
| 🎨 美术 | `css/` `*.svg` `js/audio/` | 视觉+音效 |
| 📋 策划 | `js/data/` | 游戏数据+规则 |
| 🧪 QA | `tests/` `测试/` | 测试+整合 |

## 📝 版本历史

V18.1: CoCStateAccessor解耦层 · AI提示词外置 · 模组库 · build:js 管线  
V17.1-Integrated: 四方整合·32岗审查·37项修复  
- 详见 `js/data/dev_logs.js`
