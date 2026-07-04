# AUDITFIX8 SKILLVIS REVIEWFIX 文件复核报告

## 复核对象

- 基线包：`CoC_Engine_V16_4_AUDITFIX8_VERIFIED_SKILLVIS_REVIEWFIX.zip`
- 复核目标：文件结构、脚本加载链、发布包清洁度、危险 API、现有自动化回归、技能可见性与核心规则链路。

## 结论

原 REVIEWFIX 版的核心功能与架构测试通过，但文件复核发现 2 个发布清洁度/安全性问题：

1. `index.html` 仍自动加载 `tests/engine_tests.js`。
   - 影响：用户打开正式页面时会自动运行开发测试，产生控制台噪声，并让发布 UI 依赖测试目录。
   - 处理：移除正式页面中的测试自动加载。测试文件仍保留在 `tests/`，用于手动/CI 验证。

2. 全局 fatal error 面板使用 `innerHTML` 注入未经转义的 `msg/file/stack`。
   - 影响：错误信息若包含 HTML 片段，理论上可污染错误页 DOM。
   - 处理：新增 `escapeHtml()`，动态错误文本进入 `innerHTML` 前统一转义。

## 文件结构复核

通过：

```text
js/core/context_manager.js
js/tools/definitions.js
js/tools/handlers/
  character.js
  inventory.js
  dice.js
  clues.js
  map.js
  combat.js
  npc.js
  system.js
  index.js
docs/audit/
tests/
```

未发现：

```text
js/tool_handlers.js
js/tool_definitions.js
js/context_manager.js
嵌套历史版本 zip
```

## 脚本加载复核

通过：

- `index.html` 引用的本地 `js/*.js` 文件全部存在。
- `js/` 下所有运行时代码文件均被 `index.html` 引用。
- Tool domain handlers 均早于 `js/tools/handlers/index.js` 加载。
- `js/tools/handlers/index.js` 早于 `js/ai_logic.js` 加载。
- `tests/engine_tests.js` 不再由正式页面自动加载。

## 危险 API 扫描

通过：

- 无直接 `alert(...) / confirm(...)`
- 无 `eval(...)`
- 无 `new Function(...)`
- 无 `document.write(...)`

说明：`index.html` 仍使用 `innerHTML` 构造 fatal error 面板，但动态文本已转义。

## 新增测试

新增：

```text
tests/auditfix8_file_integrity_smoke.js
```

覆盖：

- release UI 不自动加载 tests
- fatal error 面板包含 HTML 转义防护
- 所有 `js/` 文件均被加载
- `index.html` 不指向不存在的本地脚本
- 旧单体/根目录模块不存在
- 无直接 dialog/eval/document.write
- 发布包内无嵌套 zip

## 自动化验证

已从最终修复目录执行：

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
node tests/auditfix5_smoke.js
node tests/auditfix6_smoke.js
node tests/auditfix7_migration_smoke.js
node tests/auditfix7_handler_smoke.js
node tests/auditfix7_browser_smoke.js
node tests/auditfix8_malformed_tool_calls_smoke.js
node tests/auditfix8_verification_smoke.js
node tests/auditfix8_secondary_skill_visibility_smoke.js
node tests/auditfix8_review_functional_smoke.js
node tests/auditfix8_file_integrity_smoke.js
```

结果：全部通过。

额外执行 `tests/engine_tests.js` 的模拟浏览器核心引擎测试：

```text
11 passed, 0 failed
```

## 存档版本

本轮未改变存档结构：

```text
SAVE_SCHEMA_VERSION = 7
```

## 建议

下一步可以继续做：

1. 把 `docs/internal/signature_diff_norm.txt` 从公开发布包转移到审计包或开发包。
2. 增加一个真正的 CI 入口脚本，例如 `tests/run_all_smoke.js`，统一运行当前所有 smoke。
3. 若目标是完全离线单文件发布，应评估 Vue/Chart CDN 依赖的本地化打包。
