# CoC Engine — Audit Round 2 批次追踪

> 2026-07-05 二轮审计修复（AUDIT2-P0~P3）。  
> 一轮追踪见 [AUDIT_BATCHES.md](AUDIT_BATCHES.md)。

**状态图例：** `[ ]` pending · `[~]` in_progress · `[x]` done · `[-]` skipped/wontfix

**版本源：** `package.json` → `18.1.0` · SW 缓存名 `coc-engine-v18.1.0-<hash>`（`getCacheName()` = 版本 + 内容哈希）

---

## Batch A — 文档止血（P0）

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P0-01 | README 缓存名与 sw.js / getCacheName 对齐 |
| [x] | AUDIT2-P0-02 | README smoke 计数与 run_all_smoke.js SUITES 对齐（30） |

---

## Batch B — 战斗 enforcement 闭环

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P1-02 | `recordCombatAction` in update_enemy / burst_fire；近战 KP 免疫与护甲路径 |
| [x] | AUDIT2-P2-02 | 接入 checkImpale / checkMalfunction（combat.mjs autoResolveExchange） |
| [x] | AUDIT2-P2-08 | dodge / fight_back / disarm / grapple 战斗 handler + 工具定义 |
| [x] | AUDIT2-P3-02 | fire_weapon 战术标签 `:tactical` 避免纯伤害免疫误报 |
| [x] | AUDIT2-P3-07 | fire_weapon / burst_fire 先判定再扣弹 |
| [x] | AUDIT2-P1-01 | push_skill_check 接入 request_skill_check 待掷骰流程（ai_logic.mjs） |

---

## Batch C — 状态一致性

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P1-04 | scenePaths / keyClueBlockedAttempts 存档持久化 |
| [x] | AUDIT2-P2-01 | enterModule 重置 kpEngine.enabled 默认再应用模组偏好 |
| [x] | AUDIT2-P2-07 | 读档应用大厅 KP 偏好，不覆盖 localStorage 偏好 |

---

## Batch D — 渲染与记录正确性

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P1-03 | update_character_status 结构化 statusAlert（story_chat 纯文本渲染） |
| [x] | AUDIT2-P2-03 | addJournalEntry 对象签名（system.mjs / apply_poison） |
| [x] | AUDIT2-P2-04 | apply_environmental_damage 委托 update_character_status |
| [x] | AUDIT2-P3-01 | bonus_penalty_roll targetValue ?? skillValue |

---

## Batch E — KP 全局化与测试

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P2-05 | 语言过滤 + 五段协议 KP 关闭时仍执行 |
| [x] | AUDIT2-P2-06 | KP 开启时物品须显式 source，禁止默认 narrative_grant |
| [x] | AUDIT2-P3-03 | narrativeListener isLoading / combat.active 守卫 |
| [x] | AUDIT2-TEST | tests/audit2_smoke.js + run_all_smoke.js 登记 |

---

## 低优先级（时间不足可跳过）

| 状态 | ID | 标题 |
|:----:|----|------|
| [x] | AUDIT2-P3-04 | 时代限制知识门控：词边界匹配 + 叙事时代校验 |
| [x] | AUDIT2-P3-05 | SW 缓存名追加 manifest 内容哈希 |
| [x] | AUDIT2-P3-06 | opposed_roll / group_roll 触发 KP antagonist tick |

---

## 变更日志

| 日期 | 批次 | 说明 |
|------|------|------|
| 2026-07-05 | A–E | 二轮审计全批完成；30/30 smoke；新增 audit2_smoke.js |
| 2026-07-05 | P3-04~06 | 时代词边界门控、SW 内容哈希缓存、骰子 KP tick |
