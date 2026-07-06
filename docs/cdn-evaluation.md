# CDN 依赖离线化评估

## 当前 CDN 依赖

| 依赖 | URL | 用途 | 预估大小 (gzip) |
|------|-----|------|-----------------|
| Vue 3 | `unpkg.com/vue@3/dist/vue.global.js` | 全应用响应式框架 | ~130 KB |
| Bootstrap 5 CSS | `cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css` | UI 组件样式 | ~25 KB |
| Chart.js | `cdn.jsdelivr.net/npm/chart.js` | 角色雷达图（仅 creator_view） | ~70 KB |

**总 CDN 体积**: ~225 KB gzip

## 离线化方案

### 方案 A: 完整本地化（推荐）

将三个依赖下载到 `vendor/` 目录，`index.html` 改为本地引用。

```
vendor/
├── vue.global.prod.js      (~130 KB)
├── bootstrap.min.css        (~25 KB)
└── chart.min.js             (~70 KB)
```

**优点**:
- 完全离线可用，无需网络
- 版本锁定，不受 CDN 可用性影响
- 加载速度更快（无 DNS/SSL 握手）

**缺点**:
- 发布包增大 ~225 KB（从 190 KB → ~415 KB）
- 需手动更新依赖版本

**工时**: 30 min

### 方案 B: 按需精简（激进）

| 依赖 | 替换方案 | 节省 |
|------|---------|------|
| Bootstrap CSS | 仅保留使用的组件样式（~5 KB 手写） | -20 KB |
| Chart.js | 纯 SVG 雷达图（~3 KB） | -67 KB |
| Vue 3 | **不可替换**（核心框架） | 0 |

**优点**: 极致轻量，无外部依赖
**缺点**: 需重写 creator_view 雷达图（3-4h），丢失 Bootstrap 工具类

**工时**: 4-5h

### 方案 C: 混合策略

- Vue 3: 本地化（核心依赖，必须可靠）
- Bootstrap CSS: 本地化（体积小，收益大）
- Chart.js: 保持 CDN（仅一个页面使用，非关键路径），添加 `onerror` 回退

**工时**: 1h

## 建议

**推荐方案 C**（混合策略）— **已于 2026-07-06 实施**：Vue/Bootstrap/Chart/PDF 均本地化至 `vendor/`，CDN 仅作 `cocLoadCdnFallback` 兜底。

## 执行步骤

1. 下载 `vue.global.prod.js` 到 `vendor/`
2. 下载 `bootstrap.min.css` 到 `vendor/`
3. 更新 `index.html` 引用路径
4. 为 Chart.js 添加 `onerror` 回退脚本
5. 运行 `node tests/run_all_smoke.js` 验证
