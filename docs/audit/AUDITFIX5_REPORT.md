# CoC Engine V16.4 AUDITFIX5 Report

## 本轮目标

AUDITFIX5 继续基于 AUDITFIX4 做源码级稳定性修复。本轮不新增玩法功能，重点处理上一轮遗留的维护性风险：

> `tools` 定义与 `TOOL_ARGUMENT_SCHEMAS` 分离维护，未来新增/修改 Tool 时容易出现 API 工具声明与本地参数校验不一致。

## 已处理

### 1. Tool 定义改为单一来源

新增：

```text
js/tool_definitions.js
```

该文件提供统一的 Tool Catalog：

```javascript
window.CoCToolDefinitions = {
  catalog,
  argumentSchemas,
  getDefinition(name),
  getSchema(name),
  getNames(),
  buildTools(),
  stripInternalSchemaKeys(schema),
  auditAgainstHandlers(handlerNames, specialNames)
}
```

同一份 catalog 同时负责：

1. 生成传给 AI API 的 `tools` 数组
2. 提供本地 Tool 参数校验 schema
3. 执行 Tool catalog 与 handler registry 的一致性审计

### 2. 移除 `ai_logic.js` 内双份维护点

AUDITFIX4 中：

```javascript
const TOOL_ARGUMENT_SCHEMAS = {...}
const tools = [...]
```

AUDITFIX5 中改为：

```javascript
const schema = getToolArgumentSchema(toolName);
const tools = buildAiToolDefinitions();
```

其中 `buildAiToolDefinitions()` 实际调用：

```javascript
window.CoCToolDefinitions.buildTools()
```

### 3. API schema 与本地 schema 分离输出

本地校验仍需要扩展字段：

```javascript
singleAsArray: true
```

用于将：

```json
{"items":"钥匙"}
```

规范化为：

```json
{"items":["钥匙"]}
```

但该字段不应发送给 AI API。

因此新增：

```javascript
stripInternalSchemaKeys()
```

`buildTools()` 会自动剥离 validator-only 字段，保证 API-facing schema 更干净。

### 4. 新增 Tool Catalog 一致性测试

新增：

```text
tests/auditfix5_smoke.js
```

覆盖：

- `CoCToolDefinitions` 可加载
- API tools 从 catalog 自动生成
- `CoCAI` 使用 catalog 顺序生成工具列表
- API-facing tools 不包含 `singleAsArray`
- 本地 validator schema 保留 `singleAsArray`
- `update_inventory` 单字符串自动转数组
- `end_combat` enum 越界会被拒绝
- `create_map` 嵌套数字字符串会转 number
- `create_map.rooms[].connections` 嵌套单字符串会转数组
- catalog 与 toolHandlers 一致：除 `request_skill_check` 这种特殊工具外，不允许缺 handler 或 handler 缺 catalog

### 5. 更新测试加载顺序

更新：

```text
tests/auditfix3_smoke.js
tests/auditfix4_smoke.js
```

在 `ai_logic.js` 前加载：

```javascript
run('js/tool_definitions.js');
```

### 6. 更新浏览器加载顺序

更新：

```html
<script src="./js/context_manager.js"></script>
<script src="./js/tool_definitions.js"></script>
<script src="./js/state.js"></script>
<script src="./js/ai_logic.js"></script>
```

## 存档 schema

本轮没有改变存档数据结构，因此：

```javascript
SAVE_SCHEMA_VERSION = 5
```

保持不变。

## 已验证

执行：

```bash
find js tests -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/auditfix3_smoke.js
node tests/auditfix4_smoke.js
node tests/auditfix5_smoke.js
```

结果：

```text
AUDITFIX3 smoke tests passed
AUDITFIX4 smoke tests passed
AUDITFIX5 smoke tests passed
```

## 本轮降低的风险

### 修复前

新增 Tool 时需要同步修改：

1. `triggerAI()` 内 `tools` 数组
2. `TOOL_ARGUMENT_SCHEMAS`
3. `toolHandlers`
4. 测试

任何一处遗漏都会造成：

- AI 能调用但本地不校验
- 本地能校验但 AI 不知道该工具
- schema required/enum 不一致
- validator-only 字段误传 API

### 修复后

Tool 的描述、参数、required、enum、本地规范化规则集中到：

```text
js/tool_definitions.js
```

`ai_logic.js` 不再持有独立 schema 副本。

## 当前剩余建议

AUDITFIX6 建议继续做：

1. Tool handler 参数与 catalog 的更深层静态审计，例如检查 handler 是否读取了 schema 未声明字段
2. Tool handler 端到端测试：逐个构造 tool_call 并检查状态变化
3. AI 请求失败后的用户可恢复流程，例如“重试上一轮输入”按钮
4. ContextManager 从“裁剪”升级为“摘要 + 裁剪”
5. 长期战役存档迁移到 IndexedDB，localStorage 只保留轻量索引
