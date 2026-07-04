# 🔗 整合清单 — QA 审查修复 (v16.4 -> v16.5-QA)
> 生成时间: 2026-07-01 01:05  
> 目标读者: 程序员 (合并回主干)  
> 协同角色: 策划 (规则变更确认) / 美术 (无视觉变更)

---

## 修改文件总览

### P0 阻塞性 Bug — 必须合并

| 文件 | 修改 | 合并方式 |
|------|------|---------|
| `js/data/items.js:1-3` | Object.assign 合并模式 | 结构变更 |
| `js/data/items.js:155` | parseItemData 类型守卫 | 直接替换 |
| `js/char_creator.js:299-308` | 状态标记 flat 化 | 直接替换 |
| `js/coc.js:256-262` | HealingEngine 读 flat | 直接替换 |
| `js/tools/handlers/combat.js:36-47` | enemy_attack 委派 | 直接替换 |
| `js/char_creator.js:183,283` | calculateDerived 传 age | 直接替换 |
| `js/coc.js:98-99` | 15-19岁移除 SIZ-5 | 直接替换 |

### P1 安全/规则 — 强烈建议

| 文件 | 修改 |
|------|------|
| `js/components/story_chat.js` | v-html 替换为文本插值 (XSS) |
| `js/components/story_npc.js` | 同上 + 双class修复 |
| `js/components/story_inv.js` | innerHTML -> textContent + Vue reactive |
| `js/state/ui.js:98` | formatText 纯文本化 |
| `js/data/skills.js` | +6 技能 |
| `js/coc.js:146-147` | DB/Build 公式修正 |
| `js/coc.js:77` | 大失败阈值 |
| `css/style.css` | +32 APEX类 + 过渡 + white-space |

### M/L — 建议合并

| 文件 | 修改 |
|------|------|
| `js/data/items.js` | 武器技能名标准化(31处) + 键名修复 |
| `js/data/experiences.js` | 解锁技能名修正 |
| `js/data/jobs.js` | 去重 + 缩进 |
| `js/data/dev_logs.js` | 日期修正 |
| `js/char_creator.js` | startAutoAdd 解锁 |
| `js/coc.js:40` | parseDice 多段支持 |
| `js/components/story_equip.js` | TIERS 空值保护 |
| `js/views/story_view.mjs:160` | 语法错误修复 |

---

## 接口说明

### items.js <-> items_db.js
- 加载顺序: items_db.js -> items.js
- items.js 改用 Object.assign() 合并而非覆盖
- 新增武器请添加到 items_db.js (主数据源)

### 状态标记接口
- 旧: character.status.hasMajorWound (嵌套)
- 新: character.hasMajorWound (flat)
- 涉及: saveDraftCharacter + HealingEngine + update_character_status

### CSS 新增类
- APEX装备面板: .apex-equip-panel .apex-slots .apex-slot 等25类
- 库存tooltip: .inv-item .item-tooltip 等7类  
- 过渡动画: .slide-up-enter-active 等
- 文本渲染: .chat-content .npc-desc { white-space: pre-wrap; }

---

## 策划确认清单

| 变更 | CoC 7e 依据 | 影响 |
|------|-----------|------|
| 15-19岁移除 SIZ-5 | p.33 | 青少年体型不扣减 |
| DB/Build >=365 公式 | 扩展表 | 超强角色修正 |
| 大失败 >=50%仅100 | RAW | 高技能更难大失败 |
| +4技能(妙手乔装追踪导航) | 官方技能表 | 职业可用 |
| 步枪/霰弹枪 base 25 | 官方值 | 之前错为20 |
| 取悦 base 15 | 官方值 | 之前合于话术5 |

## 美术确认
**无视觉资源变更。** CSS 新增类均为暗黑主题，与现有风格一致。

## 合并步骤
1. git diff 对比
2. 先合P0(7文件)
3. 运行测试确认17/17
4. 合P1
5. 再测
6. 合M/L
7. 终测
