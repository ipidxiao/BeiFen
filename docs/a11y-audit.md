# 无障碍 (a11y) 审计报告

> V16.4 AUDITFIX8 — 快速审查。目标: WCAG 2.1 Level AA。

## 通过项 ✅

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 语言声明 | ✅ | `<html lang="zh-CN">` 正确设置 |
| 视口缩放 | ✅ | `user-scalable=no` 已被移除（仅保留 `maximum-scale=1.0`），允许用户缩放 |
| 触摸优化 | ✅ | `touch-action: manipulation` 应用于所有按钮，防止双击缩放干扰 |
| 颜色对比度 | ⚠️ | 暗色主题基础对比度可接受，但部分样式使用 `!important` 覆盖可能降低可读性 |
| 键盘导航 | ⚠️ | Bootstrap 按钮原生支持键盘，但自定义组件（地图 SVG、线索板）缺少 tabindex |

## 问题清单 🟡

### 1. 地图 SVG 缺少键盘焦点
- **文件**: `js/components/story_map.js`
- **问题**: SVG 房间节点使用 `@click` 但无 `tabindex` 或 `role="button"`
- **修复**: 添加 `tabindex="0" role="button" @keydown.enter="..." @keydown.space.prevent="..."`

### 2. 线索板 Web 视图节点同样问题
- **文件**: `js/components/story_clues.js`
- **问题**: SVG 线索节点无键盘可访问性
- **修复**: 同上

### 3. 动态内容缺少 aria-live 区域
- **文件**: `js/components/story_chat.js`
- **问题**: AI 生成的消息直接插入 DOM，屏幕阅读器不会自动朗读
- **修复**: 聊天容器添加 `aria-live="polite" aria-atomic="false"`

### 4. 战斗面板先攻顺序不可键盘操作
- **文件**: `js/components/story_combat.js`
- **问题**: `@click` 展开/折叠无键盘支持
- **修复**: 添加 `tabindex="0" role="button"` + 键盘事件

### 5. 骰子台按钮缺少 aria-label
- **文件**: `js/components/story_dice.js`
- **问题**: `d4`/`d6` 等按钮无描述性标签
- **修复**: 添加 `:aria-label="'掷 ' + diceCount + 'd' + sides"`

## 优先级

| 优先级 | 问题 | 工时 |
|--------|------|------|
| P1 | 聊天容器 aria-live（影响最大） | 5 min |
| P2 | 骰子按钮 aria-label | 10 min |
| P2 | 组件键盘焦点（SVG 地图/线索/战斗） | 30 min |
| P3 | 颜色对比度全面审计 | 1h |

## 建议

在 ES Module 迁移 (V17) 后集中处理 a11y 问题，避免在即将重构的代码上做修补。
