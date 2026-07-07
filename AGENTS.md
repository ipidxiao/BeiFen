# Agent 指南（CoC Engine）

本仓库在 Cursor 中开发时，请遵循 **多模型分工**：

| 任务 | 首选模型 slug |
|------|----------------|
| 叙事 / 场景 / 美术方向 | `claude-fable-5-thinking-high` |
| UI / 组件 / 批量文案 | `composer-2.5-fast` |
| 引擎 / 存档 / KP 逻辑 | `gpt-5.5-medium` |

- **完整说明**：[`docs/AI_MODEL_WORKFLOW.md`](docs/AI_MODEL_WORKFLOW.md)（中文）
- **自动规则**：`.cursor/rules/ai-model-routing.mdc`
- **运行时游戏 AI**（DeepSeek）与上述无关，见 `js/ai/network.mjs`
