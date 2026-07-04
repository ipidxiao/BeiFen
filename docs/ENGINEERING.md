## CoC 7th 引擎工程实践指南

本文档为 CoC 7th 引擎项目提供工程实践准则，参考 [Google Engineering Practices][1] 并适配本项目纯前端 SPA 特性。

### 1. 代码变更准则

#### 1.1 聚焦变更
每个变更应仅解决一个问题或实现一个自包含的子功能。当前模块行数分布：

| 模块 | 行数 | 状态 |
|------|------|------|
| `js/ai_logic.js` | 403 | ✅ 已拆分 (原 577) |
| `js/ai/network.js` | 84 | ✅ 新建 |
| `js/ai/tool_dispatch.js` | 101 | ✅ 新建 |
| `js/state.js` | 920 | ⚠️ 待拆分（状态管理+存档+Toast+容量估算） |
| `js/coc.js` | 490 | ⚠️ 可接受（纯规则引擎，职责单一） |

原则：新模块控制在 **100-400 行**；超过 500 行的模块应评估拆分。

#### 1.2 变更描述
每个 CL 标题简明扼要（如 `feat: add combat auto-resolve`），正文解释**为什么**更改而非仅罗列做了什么。

### 2. 代码质量标准

#### 2.1 设计原则
- **单一职责**: 每个模块负责一个明确领域（如 `js/ai/network.js` 只管网络传输）。
- **全局耦合控制**: 当前使用 `window.*` 命名空间；V17 目标迁移到 ES Module。
- **状态管理**: 通过 `CoCState`（Vue reactive）传递数据，避免直接操作其他组件私有变量。

#### 2.2 命名规范
- JavaScript 统一使用 `camelCase`。
- 全局模块命名: `window.CoCXxx`（如 `CoCEngine`, `CoCState`, `CoCAI`）。
- 变量/函数名应具有描述性（如 `calculateCombatSuccess` 而非 `check`）。

#### 2.3 注释规范
- **核心规则函数**（如 `checkSkill`, `calculateDerived`, `CombatEngine` 中各方法）必须包含 JSDoc。
- **工具 Handler** 函数应注明副作用。
- **AI 提示词注入逻辑**（如 triggerAI 中的 prompt 拼接）应添加注释解释设计意图。
- 注释核心目的是解释**为什么**这样实现，而非复述代码做什么。

### 3. 自动化测试

- 所有核心规则计算必须有测试覆盖（见 `tests/engine_tests.js`）。
- 每次架构变更后运行 `node tests/run_all_smoke.js` 验证全链路。
- 修复 Bug 后立即补充测试用例，防止回归。
- 测试分为 4 阶段：文件完整性 → 核心引擎 → 重构验证 → 专项（AUDITFIX）。

### 4. 文档规范

| 文档 | 用途 | 更新时机 |
|------|------|----------|
| `ground_truth_canvas.md` | 架构全景图 | 每次模块拆分/合并 |
| `docs/audit/README.md` | 审计报告索引 | 新增审计报告时 |
| `docs/audit/AUDITFIX*_REPORT.md` | 单次审计报告 | 每次 AUDITFIX |
| `docs/humanpending.md` | 人工决策记录 | 重大架构取舍 |
| `docs/ENGINEERING.md` | 本文件 | 规范变更时 |
| `js/data/dev_logs.js` | 开发者日志 | 重大功能/Bug 修复 |

### 5. 发布清单

发布前检查：
- [x] `node tests/run_all_smoke.js` 全部通过
- [x] 无 `docs/internal/` 内部文件
- [x] 无嵌套 zip
- [x] `ground_truth_canvas.md` 版本号与实际一致
- [x] 无 `/home/ubuntu` 等环境特定路径
- [ ] CDN 依赖可用性确认（Vue/Bootstrap/Chart.js）
- [ ] 内联样式迁移进度（目标: 减少 50% 以上）

---

*遵循这些规范，旨在构建一个更易于理解、维护和扩展的 CoC 7th 引擎。*

### References

[1] Google Engineering Practices. "Google's Engineering Practices documentation." GitHub. [https://github.com/google/eng-practices](https://github.com/google/eng-practices)
