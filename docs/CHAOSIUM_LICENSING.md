# Chaosium 官方模组许可说明

> 最后核实：2026-07-05 · 政策原文：[Fan Material Policy](https://www.chaosium.com/fan-material-policy/)（2023-10-13 修订）

## 结论（诚实说明）

| 做法 | 是否合法（无需额外书面许可） |
|------|------------------------------|
| 在模组库中**仅列出**官方标题、描述、itch.io 链接 | ✅ 是（元数据 + 外链） |
| 用户自行从 itch.io 下载 PDF，**个人使用** | ✅ 是 |
| 引擎**客户端**将官方 PDF 转为本地剧本 JSON，仅存 IndexedDB（个人/table） | ⚠️ 类比 VTT 个人导入；Fan Policy 未明确授权 verbatim 改编，**请勿再分发** |
| 用户**自行制作** JSON 并在本机导入（不公开分发） | ⚠️ 灰色地带；Fan Policy 未明确授权引擎内改编，建议仅个人/table 使用 |
| **本引擎仓库/hosting 再分发** Chaosium 剧情 JSON | ❌ **否**，需 Chaosium **书面 Commercial License** |
| 将官方 PDF 全文/大段文字 verbatim 转为 JSON 并公开托管 | ❌ **否** |
| 依据 Fan Policy 做「受官方模组启发的原创短篇」teaser | ⚠️ 有限允许（须原创、非复述官方故事、含政策声明）；**不能**替代完整官方模组 |

**无法通过代码「自动获取」许可。** 只有权利方（Chaosium）可通过邮件/商业授权流程批准再分发。请使用 [`CHAOSIUM_PERMISSION_REQUEST.md`](./CHAOSIUM_PERMISSION_REQUEST.md) 中的英文模板自行联系。

---

## Fan Material Policy 要点（英文原文摘要）

以下引自 [chaosium.com/fan-material-policy](https://www.chaosium.com/fan-material-policy/)：

### 允许（非商业 fan 用途）

- 引用 Chaosium 产品中的名称、机构、地点、人物、概念（须标明归属）
- 在战役日志、论坛、博客中**引用**剧情与事件
- **偶尔**引用少量原文（一两句以内）
- Fan fiction / fan art — **但不得用自己的话复述官方完整故事**（「make up your own!」）
- 自制角色卡（含网页版自动计算表）

### 明确禁止 / 限制

- **Non-Commercial**：不得出售或对访问 Fan Policy 内容收费
- **Non-Retail**：不得通过 DriveThruRPG、App Store 等零售渠道分发（即使免费）
- **No apps or downloadable software or virtual tabletops (VTTs)**：
  > *"Software, apps, and virtual tabletops (VTTs) including any item a user would download, install, and/or run, are **not included** in the Fan Material policy. If you wish to create such a resource, you will need to apply for **Commercial License**."*
- 不得声称「官方」或暗示 Chaosium 背书
- 不得使用 Chaosium logo

### 必需声明（使用任何 Fan Policy 材料时）

> *"This [website, zine, or whatever it is] uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc's Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This [website, character sheet, or whatever it is] is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc's products, please visit www.chaosium.com."*

---

## itch.io 官方免费模组

The Derelict、Scritch Scratch 等在 [chaosium.itch.io](https://chaosium.itch.io/) 上可免费下载，但页面版权声明显示：

> *Call of Cthulhu © … Chaosium Inc. All rights reserved.*

「免费下载」≠「可再分发」或「可改编后嵌入第三方引擎」。

---

## 本引擎已实现的合法路径

### A + D — 链接目录（无 JSON 再分发）

`remote_catalog.mjs` 中 `category: 'officialChaosium'` 条目：

- `redistributable: false`
- `importOnly: true`
- `officialUrl` → itch.io 官方页面
- **不含** `packages/*.json`

大厅模组库显示徽章 **「官方 · 需自行下载」**，按钮 **「前往官方下载」**。

### B — 客户端 PDF → 本地剧本（个人使用）

模组库中 `importType: 'official_pdf'` 条目支持 **「一键导入并转换」**：

1. 浏览器从 itch.io 官方 `download_url` API 获取 PDF（或用户选择已下载 PDF）
2. 使用 PDF.js 提取文本，规则引擎或 AI（需 API Key）转为 `coc-engine-v1` 节点 JSON
3. 结果**仅写入**用户 IndexedDB / localStorage，**不进入** `packages/` 或 git 仓库
4. UI 声明：「个人使用 · 版权归 Chaosium · 请勿再分发」

此路径与 VTT 个人导入类似，**不是**引擎再分发官方内容。规则转换质量有限（线性节点、简单检定识别），完整体验仍需守秘人主持或人工校对 JSON。

### C — 授权申请模板

英文邮件模板：[`CHAOSIUM_PERMISSION_REQUEST.md`](./CHAOSIUM_PERMISSION_REQUEST.md)

联系人：

- 许可：**daria@chaosium.com**
- 商务：**mob@chaosium.com**

### 用户本地导入

若您：

1. 已从官方渠道取得 PDF；且
2. 已获得 Chaosium **书面授权**；或
3. 自行创作符合 Fan Policy 的**原创** JSON（非官方 verbatim 转换）；

可在模组库选中官方条目 → **「我已下载，导入本地」**，选择 JSON 文件。导入内容仅存于浏览器 IndexedDB，不由引擎托管。

---

## 官方链接模组列表

| ID | 标题 | 官方 URL | itch download_url API | Upload ID |
|----|------|----------|----------------------|-----------|
| `chaosium_the_derelict` | The Derelict | https://chaosium.itch.io/the-derelict | `…/the-derelict/download_url` | 2139931 |
| `chaosium_scritch_scratch` | Scritch Scratch | https://chaosium.itch.io/scritch-scratch | `…/scritch-scratch/download_url` | 2139683 |
| `chaosium_the_lightless_beacon` | The Lightless Beacon | https://chaosium.itch.io/the-lightless-beacon | `…/the-lightless-beacon/download_url` | 2163887 |
| `chaosium_dead_light` | Dead Light and Other Dark Turns | https://chaosium.itch.io/dead-light-and-other-dark-turns | `…/dead-light-and-other-dark-turns/download_url` | 2991402 |
| `chaosium_quickstart_haunting` | Quickstart — The Haunting | https://chaosium.itch.io/call-of-cthulhu-quickstart-rules | `…/call-of-cthulhu-quickstart-rules/download_url` | 2180679 |

---

## Miskatonic Repository（DriveThruRPG）

[Miskatonic Repository](https://www.chaosium.com/miskatonic-repository/) 条目由**各创作者**单独授权，无 blanket CC。收录前须核实每位作者的许可。

---

*本文档为项目合规说明，不构成法律意见。有疑问请咨询 Chaosium 或您的法律顾问。*
