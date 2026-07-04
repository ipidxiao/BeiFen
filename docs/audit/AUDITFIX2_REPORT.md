# CoC Engine V16.4 AUDITFIX2 报告

基线：`CoC_Engine_V16_4_AUDITFIX1.zip`

本轮目标是把第一轮已经加入的安全框架接入真实调用链，并优先修复 AI-KP 与长期战役稳定性风险。

## 1. AI Tool Handler 调用图

```text
玩家输入 / 地图移动 / 战斗快捷动作
    ↓
handlePlayerAction()
    ↓
triggerAI(toolRound = 0)
    ├─ fetchWithTimeout(..., 30000ms)
    ├─ narrativeListener(aiMsg.content)
    └─ processTools(aiMsg, toolRound)
          ├─ request_skill_check
          │     └─ 等待玩家点击 executeSkillCheck()
          │             ↓
          │        triggerAI(msg._toolRound + 1)
          ├─ 普通 tool handler
          │     ├─ makeToolSnapshot()
          │     ├─ toolHandlers[name](args)
          │     ├─ 成功：写入 tool result
          │     └─ 失败：restoreToolSnapshot() + 写入错误 tool result
          └─ 无需玩家行动时
                ↓
             triggerAI(toolRound + 1)
```

### 已切断/缓解的高风险环

```text
processTools()
    ↓
toolHandlers[...]
    ↓
triggerAI()
    ↓
processTools()
```

现在所有工具续写都会递增 `toolRound`，超过 `MAX_TOOL_ROUNDS` 后会写入本地系统警告并停止自动续写。

```text
moveToLocation()
    ↓
handlePlayerAction()
    ↓
triggerAI()
```

现在地图移动增加 `gameState.isLoading` 与 `isSyntheticMoveInFlight` 双重保护，避免连续点击或合成移动重入。

## 2. 主要修复

### P1

- `js/ai_logic.js`
  - `MAX_TOOL_ROUNDS` 接入 `processTools → triggerAI` 与 `executeSkillCheck → triggerAI`。
  - 新增 `AI_REQUEST_TIMEOUT_MS = 30000` 与 `fetchWithTimeout()`。
  - AI 请求超时后使用 `AbortController` 中止，并向聊天区写入明确错误。
  - `tool.function.arguments` 改为统一 `safeJsonParse()`。
  - Tool handler 执行增加轻量事务保护：执行前快照，异常时回滚状态并返回错误 tool result。

- `js/state.js`
  - `SAVE_SCHEMA_VERSION` 提升到 3。
  - 新增 `migrateSaveData()`，兼容缺省字段与旧式扁平存档。
  - `saveGame()` 捕获 localStorage 容量/写入失败，并写入明确本地系统提示。
  - `loadGame()`、`getSaveSlots()`、`getAutoSave()`、`importGame()` 改为统一安全解析与迁移。

### P2

- `js/state.js`
  - 新增 `cleanupInitiativeOrder()`。
  - `updateEnemy()` 在敌人 HP <= 0 后主动清理先攻队列。
  - `advanceTurn()` 先清理无效战斗单位，再推进回合。
  - 载入存档后主动清理战斗队列。
  - `enterModule()` 现在重置 journal、NPC、骰子历史、战斗状态、气氛状态与 selectedCharIndex，降低跨模组状态污染。

- `js/components/story_char.js`
  - `selectedCharIndex` getter/setter 接入 `clampSelectedCharIndex()`。

- `js/components/story_inv.js`
  - 背包操作读取当前角色前先 clamp。

- `js/components/story_map.js`
  - 房间移动统一走 `CoCAI.moveToLocation()`，不再绕过移动保护。

### P3 / 发布清理

- AUDITFIX2 发布包移除了旧版本压缩包与 `v15_recovery/` 历史目录。
- 保留当前工程源码、文档、测试与本报告。

## 3. JSON.parse 审计结果

`js/ai_logic.js` 与 `js/state.js` 的外部 JSON 读取已集中到 `safeJsonParse()`。剩余 `JSON.parse(JSON.stringify(...))` 用法仅存在于角色创建/规则引擎的本地深拷贝路径，不属于外部输入解析。

## 4. 验证

已执行：

```text
node --check js/**/*.js tests/**/*.js
Node VM smoke test:
  - CoCState / CoCAI 可加载
  - defeated enemy 会从 initiativeOrder 清除
  - selectedCharIndex 越界会被 clamp
```

## 5. 仍建议下一轮继续审计

- Tool handler 的业务级事务边界：当前为异常回滚，不处理“逻辑成功但模型语义错误”的补偿。
- `chatHistory` 长期增长策略：建议增加摘要/裁剪 ContextManager。
- `alert/confirm` 统一替换为 Toast/Modal。
- 角色删除/停用链路的完整状态污染测试。
