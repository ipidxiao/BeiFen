# AUDITFIX8 Secondary Skill Visibility Patch

## 目标

对带有二级分支的技能进行显示过滤：

- 如果二级技能名称为空、数字占位、`其他XXX` 占位，则隐藏。
- 如果二级技能已经明确命名，则继续显示并允许加点、保存、检定。

## 已实现规则

### 隐藏

以下属于未命名/占位二级技能，不在角色创建技能分配面板和角色卡掌握技能中显示：

```text
射击
驾驶
技艺
外语
母语
科学
学识
生存
射击：
驾驶：
格斗①
射击②
其他格斗
其他射击
```

### 保留

以下属于明确命名的二级技能或普通技能，继续显示：

```text
斗殴
手枪
汽车驾驶
射击：步枪
生存：森林
拳击
```

## 代码改动

### js/coc.js

新增技能可见性与职业继承工具函数：

```text
isPlaceholderSecondarySkillName(skillName)
isConcreteSecondarySkill(skillName)
isVisibleSkillName(skillName)
getVisibleSkillNames(extraSkills)
isChildOfParentSkill(skillName, parentName)
isClassSkillName(skillName, classSkillsString)
```

为需要明确二级名称的父级/占位技能加入：

```text
requiresSpecialization: true
```

涉及：

```text
技艺
外语
母语
科学
生存
驾驶
射击
学识
```

`斗殴` 因存在 `格斗：斗殴` 这个明确命名 alias，仍被视作可见技能。

### js/char_creator.js

- `dynamicSkillNames` 改为走 `Engine.getVisibleSkillNames()`。
- 角色创建面板不会再列出未命名二级技能占位项。
- 加点统计不再计算隐藏占位技能的旧分配。
- 职业技能判断统一走 `Engine.isClassSkillName()`。
- 支持父级职业技能继承到明确命名的二级技能：
  - `射击` → `手枪`
  - `驾驶` → `汽车驾驶`
  - `格斗` → `斗殴 / 拳击`
  - `生存` → `生存：森林`

### js/views/creator_view.js

- 技能面板本职标记与按钮启用条件改为使用 `isClassSkill(skill)`。

### js/components/story_char.js

- 角色卡“掌握技能”列表隐藏未命名/占位二级技能。

## 新增测试

```text
tests/auditfix8_secondary_skill_visibility_smoke.js
```

覆盖：

```text
占位二级技能隐藏
明确命名二级技能显示
职业父级技能继承到子技能
角色创建 dynamicSkillNames 过滤
隐藏旧分配不再占用可见点数
角色卡隐藏旧 generic parent 技能值
规则检定 alias 不被显示过滤破坏
```

## 验证命令

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
# 另在浏览器模拟环境执行 tests/engine_tests.js，结果 11 passed / 0 failed
```

结果：全部通过。

## 存档版本

本次只调整规则/UI 显示与创建器加点逻辑，不新增存档字段。

```text
SAVE_SCHEMA_VERSION = 7
```
