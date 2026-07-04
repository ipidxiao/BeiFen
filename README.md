# 🌑 CoC 7th Engine — V18.1

> 克苏鲁的呼唤第七版 TRPG 纯前端引擎  
> 交付日期: 2026-07-03  
> 门禁: 18/18 ✅ · deep_verify 0/179 ✅ · bug_hunt 0/129 ✅

## 📦 包内容

| 类别 | 数量 | 说明 |
|------|------|------|
| JS引擎 | 60 | 6引擎(coc.js 1657行) + AI调度 + 9 Handler模块 |
| ESM模块 | 51 | .mjs双轨同步 |
| 游戏数据 | 13 | 技能(60)/物品(110武器)/职业(132)/经历(22)/AI提示词等 |
| CSS | 832行 | 21变量 + 8面板唯一色 + 13 keyframes + 暗黑主题 |
| 测试 | 18 suites | VM smoke + ESM + deep_verify + bug_hunt |
| 资产 | 6 | favicon/12 SVG精灵/Web Audio SFX/Canvas骰子/PWA |

## 🚀 快速开始

```bash
npm test          # 18/18 全量测试
npm run build     # 打包 ZIP
npm run serve     # 本地开发服务器
```

## 🏗 架构

```
js/
├── data/     游戏数据 (技能/物品/职业/经历/典籍/法术/理智/重伤/NPC/AI提示词)
├── coc.js    6引擎 (战斗/治疗/理智/重伤/神话 + 运气/推动/连射)
├── state/    状态管理 (核心/UI/玩法/持久化/聚合/访问器)
├── tools/    28工具定义 + 9 Handler模块
├── ai/       AI网络调度 + 逻辑引擎
├── components/  13个Vue组件
└── views/    4个页面视图
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

V18.1: CoCStateAccessor解耦层 · AI提示词外置 · 文档同步
V17.1-Integrated: 四方整合·32岗审查·37项修复·10/10门禁
- 详见 `js/data/dev_logs.js`
