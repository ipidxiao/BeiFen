# 审计报告索引

本目录包含 CoC 7th 引擎 V16.4 开发过程中历次审计修复的完整报告链。
按时间顺序阅读可追溯全部架构决策与 Bug 修复历程。

## 阅读顺序

| 序号 | 报告 | 主题 | 关键变更 |
|------|------|------|----------|
| 1 | [AUDITFIX2_REPORT](./AUDITFIX2_REPORT.md) | 基础规则 | 基础规则修正 |
| 2 | [AUDITFIX3_REPORT](./AUDITFIX3_REPORT.md) | 上下文管理 | Context Manager 三元裁剪策略、消息截断 |
| 3 | [AUDITFIX4_REPORT](./AUDITFIX4_REPORT.md) | 角色系统 | 角色/背包数据流修正 |
| 4 | [AUDITFIX5_REPORT](./AUDITFIX5_REPORT.md) | 短战役优化 | 存档容量预警、长消息处理 |
| 5 | [AUDITFIX6_REPORT](./AUDITFIX6_REPORT.md) | 战斗/地图 | 多轮战斗自动化、地图绘制与房间状态 |
| 6 | [AUDITFIX7_REPORT](./AUDITFIX7_REPORT.md) | Tool 系统模块化 | 8 领域 Handler 拆分、注册中心、存档 Schema v7 迁移 |
| 7 | [AUDITFIX8_REPORT](./AUDITFIX8_REPORT.md) | Tool Call 异常处理 | 畸形 tool_call、孤儿 tool response、参数校验 |
| 8 | [AUDITFIX8_VERIFICATION_REPORT](./AUDITFIX8_VERIFICATION_REPORT.md) | 架构验证 | 别名链路、Handler 注册、Schema 一致性 |
| 9 | [AUDITFIX8_SECONDARY_SKILL_VISIBILITY_REPORT](./AUDITFIX8_SECONDARY_SKILL_VISIBILITY_REPORT.md) | 技能可见性 | 二级技能分支显示规则修正 |
| 10 | [AUDITFIX8_SKILLVIS_REVIEW_REPORT](./AUDITFIX8_SKILLVIS_REVIEW_REPORT.md) | 技能可见性复核 | 验证 + 自动化回归 |
| 11 | [AUDITFIX8_FILE_RECHECK_REPORT](./AUDITFIX8_FILE_RECHECK_REPORT.md) | 文件复核 | 发布清洁度、XSS 防护、加载链完整性 |

## 快速导航

- **想了解架构现状** → 先读 [AUDITFIX8_FILE_RECHECK_REPORT](./AUDITFIX8_FILE_RECHECK_REPORT.md)（最新）
- **想了解 Tool 系统** → [AUDITFIX7_REPORT](./AUDITFIX7_REPORT.md) → [AUDITFIX8_REPORT](./AUDITFIX8_REPORT.md)
- **想了解规则引擎** → [AUDITFIX2_REPORT](./AUDITFIX2_REPORT.md) → [AUDITFIX8_VERIFICATION_REPORT](./AUDITFIX8_VERIFICATION_REPORT.md)

## 对应测试

所有审计修复均有对应的 smoke 测试，统一入口：

```bash
node tests/run_all_smoke.js
```
