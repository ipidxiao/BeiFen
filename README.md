# 🌑 CoC 7th Engine — V18.1

> 克苏鲁的呼唤第七版 TRPG 纯前端引擎  
> 版本: **18.1.0**（以 `package.json` 为准）· Service Worker 缓存名 `coc-engine-v18.7`（以 `sw.js` 为准）  
> 门禁: **27/27** smoke ✅ · deep_verify 0/179 ✅

> 工作区目录名 `CoC_Engine_V17.2_CCGS` 为历史遗留；当前发布版本以 `package.json` / README 标题为准。

## 📦 包内容

> 下列统计为 2026-07-05 审计核验值；长期维护可运行脚本重新生成（见 AUDIT-P3-35）。

| 类别 | 数量 | 说明 |
|------|------|------|
| JS 引擎 | 97 | `js/` 下 `.js` 浏览器脚本（含 `build:js` 生成物） |
| ESM 模块 | 94 | `js/` 下 `.mjs` 权威源码 → `npm run build:js` 生成 `.js` |
| 游戏数据 | 13 | 技能/物品/职业/经历/典籍/法术/理智/重伤/NPC/AI提示词等（`js/data/` 根级） |
| 剧本 | 18 | 10 内置 + 8 可下载（含 6 个 CC 社区改编模组） |
| CSS | ~798 行 | 21 变量 + 8 面板唯一色 + 13 keyframes + 暗黑主题 |
| 测试 | 27 suites | VM smoke + ESM + deep_verify（`npm test`） |
| AI 工具 | 31 | `js/tools/definitions.mjs` 工具目录 + 9 Handler 模块 |
| 资产 | 6 | favicon/SVG 精灵/Web Audio SFX/Canvas 骰子/PWA |

## 🚀 快速开始

```bash
npm run build:js      # .mjs → 浏览器 .js（改源码后必跑）
npm run build:js:check  # CI：校验生成物无 drift
npm test              # 27/27 全量 smoke
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
- **可下载模组（8）**：`隔离研究所`、`闹鬼的遗产`（原创）及 `疗养院低语`、`灯塔日志`、`博物馆之夜`、`绿衣教士`、`白寡妇号`、`梅维尔庄园暴雪`（CC 社区改编）— 点击「下载到本地」写入 IndexedDB
- **下载源**：默认同域包体 `js/data/scenarios/packages/*.json`（**离线可用**）；**不依赖 GitHub**
- **公开网站扩展**：将引擎 ZIP 解压部署到任意公开静态网站（Netlify、Cloudflare Pages、自有 VPS 等），在大厅「📚 模组库」填写 **公开资源基址**（如 `https://example.com/coc-engine/`），即可从该站点拉取 `js/data/scenarios/packages/{id}.json`
- **回退链**：用户公开基址（若已设置）→ 可选 `mirrorUrls`（非 GitHub 公共镜像）→ 同域包；全部失败时显示中文错误提示
- **API**：`CoCScenarioStore.listCatalog()` / `listLocal()` / `getScenario(id)` / `downloadScenario(id)` / `removeDownload(id)` / `isAvailable(id)` / `getPublicCatalogBase()` / `setPublicCatalogBase(url)`
- **源码**：`js/scenario/store.mjs`、`js/data/scenarios/remote_catalog.mjs`、`js/data/scenarios/packages/*.json`

### PDF 导入（itch.io 跨域说明）

大厅「PDF 一键导入」尝试从 itch.io 拉取官方 PDF 并转换。**多数情况下会失败**：浏览器 CORS 策略阻止跨域下载 itch 签名 URL。

**推荐流程：**

1. 在 itch.io 官方页面**手动下载** PDF
2. 使用大厅 **「选择 PDF 转换」**（本地文件选择器）
3. 转换结果写入 IndexedDB，不会进入仓库包体

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#pdf-import--cors)。

### 📜 模组来源（Sources）

| 模组 ID | 许可 | 来源 URL | 说明 |
|---------|------|----------|------|
| `cc_asylum_whispers` | CC-BY 4.0 | — | 公共领域精神病院恐怖传统改编 |
| `cc_lighthouse_log` | CC-BY 4.0 | — | 公共海事恐怖传统改编 |
| `cc_museum_night` | CC-BY 4.0 | — | 公共都市怪谈传统改编 |
| `cc_green_vicar` | CC-BY 4.0 | [Faces of the Green Man](https://alextok.itch.io/faces-of-the-green-man) | Krycek RPGs CC-BY 4.0 民俗恐怖种子改编 |
| `cc_white_widow_reef` | CC-BY 4.0 | [Twilight for the White Widow](https://the-cargo-bay.itch.io/whitewidow) | The Cargo Bay CC-BY 4.0 鬼船种子改编 |
| `cc_mayvale_blizzard` | CC-BY-SA 4.0 | [Mystery of Mayvale Manor](https://gegi-bisi.itch.io/mystery-of-mayvale-manor) | Gegi Bisi CC-BY-SA 4.0 庄园悬疑种子改编 |
| `isolated_lab` / `haunted_inheritance` | Original | — | CoC Engine Team 原创 |

### Chaosium 官方模组（仅链接，无 JSON 再分发）

模组库中 `category: officialChaosium` 条目指向 [chaosium.itch.io](https://chaosium.itch.io/) 官方免费下载页。**引擎不托管**专有剧情 JSON。用户若已取得 Chaosium 书面授权，可自行制作 JSON 并通过「导入本地」加载。

| 模组 ID | 官方 URL |
|---------|----------|
| `chaosium_the_derelict` | https://chaosium.itch.io/the-derelict |
| `chaosium_scritch_scratch` | https://chaosium.itch.io/scritch-scratch |
| `chaosium_the_lightless_beacon` | https://chaosium.itch.io/the-lightless-beacon |
| `chaosium_dead_light` | https://chaosium.itch.io/dead-light-and-other-dark-turns |
| `chaosium_quickstart_haunting` | https://chaosium.itch.io/call-of-cthulhu-quickstart-rules |

许可说明与授权申请模板见 [docs/CHAOSIUM_LICENSING.md](docs/CHAOSIUM_LICENSING.md) 与 [docs/CHAOSIUM_PERMISSION_REQUEST.md](docs/CHAOSIUM_PERMISSION_REQUEST.md)。

> **法律摘要**：Chaosium [Fan Material Policy](https://www.chaosium.com/fan-material-policy/) 明确将 **VTT / 可下载软件** 排除在外；再分发官方冒险 JSON 需 **Commercial License** 或书面许可。Fan Policy 不允许 verbatim 复述官方故事。

> **未收录 JSON**：Chaosium 官方免费模组（itch.io）及 Miskatonic Repository 条目为专有或逐作者授权，不可在无许可情况下转换再分发。

### KP 协议引擎（COC_LONDON_KP_ENGINE_V2）

KP 引擎是**核心执行层**（全局底层协议），不是可选战役 overlay：

- **默认启用**：`gameState.kpEngine.enabled === true`（`js/state/core.mjs`）；伦敦规则集作为 bottom-layer 协议对所有剧本生效——这是** intentional design**，非战役泄漏
- **大厅开关**：「启用 KP 协议引擎（伦敦规则集）」— 用户可手动关闭；关闭时不执行行动校验、敌人缩放、反一击必杀、输出五段协议、语言自检、敌对组织 tick 等
- **源码**：`js/campaign/kp_execution_engine.mjs`（权威运行时）、`js/ai/output_protocol.mjs`、`js/campaign/kp_game_loop.mjs`

## 如何开发

- **只改 `.mjs`**：`.mjs` 为权威源码；对应 `.js` 由 `scripts/build_browser.mjs` 生成，勿手改
- **改完 `.mjs` 后执行** `npm run build:js`，再提交生成的 `.js`
- **提交前跑** `npm test`；`npm run build:js:check` 可单独校验 drift
- **浏览器专用、不参与生成的文件**：见 `scripts/BROWSER_ONLY.md`（`js/coc.js`、`js/ai/worker.js` 等）
- **发布打包**：`python build.py`（内部会自动执行 `build:js`）
- **审计批次追踪**：[docs/AUDIT_BATCHES.md](docs/AUDIT_BATCHES.md)
- **架构与全局命名**：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)


## Git 认证（Windows）

- **推荐**：`git credential-manager github login --browser`（浏览器跳转授权，**无需**记 6 位码）
- **避免**：在 Cursor 后台终端里跑 `gh auth login` 设备码流程——验证码**只在那个终端显示**，不会发到手机/邮件
- **若必须用设备码**：在本机 PowerShell 运行 `gh auth login --web`，在**同一窗口**查看 8 位码，并打开 [github.com/login/device](https://github.com/login/device) 粘贴
- 详细说明见 [docs/GIT_AUTH.md](docs/GIT_AUTH.md)
## 🏗 架构

```
js/
├── data/       游戏数据 + scenarios/（内置剧本 + packages/ 可下载包）
├── engines/    规则引擎分模块（coc.js 聚合）
├── scenario/   模组库 store + runner
├── state/      状态管理
├── tools/      31 工具定义 + 9 Handler 模块
├── ai/         AI网络调度 + 逻辑引擎
├── components/ 16 个 Vue 组件（含 char_creator）
└── views/      4 个页面视图
```

## 🛡 安全

```
0 eval() · 0 v-html · 0 innerHTML（生产 js/） · 0 document.write（生产 js/） · 0 alert()
index.html：vendor 缺失时用 createElement 动态注入 CDN 兜底（非 document.write）
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
