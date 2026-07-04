// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC 7th Edition Rules Engine — 装配/编排层 (thin assembly layer)
 *
 * 本文件曾是 1665 行的上帝模块 (god module)。P0-2 重构后，规则实现已按职责
 * 拆分到 js/engines/ 下的独立模块，本文件仅负责初始化 window.CoCEngine 命名空间，
 * 供后续 engines/*.js 依次挂载各自的实现，保持 window.CoCEngine 公共 API 向后兼容。
 *
 * 加载顺序 (见 index.html): coc.js → engines/{dice,attributes,skills,combat,
 * healing,sanity,wound,mythos,environmental,poison}.js。各引擎模块通过
 * Object.assign / 属性挂载合并到同一个 window.CoCEngine 对象，模块间的相互引用
 * 均在调用时经由 window.CoCEngine 解析，因此彼此之间无加载期硬依赖。
 *
 * 模块职责映射:
 *   engines/dice.js        骰子掷骰 / 技能检定 / 奖励惩罚骰 / 运气消费
 *   engines/attributes.js  属性衍生 (HP/MP/SAN/DB/MOV) / 年龄修正 / 属性评语
 *   engines/skills.js      技能字典 / 职业 / 技能可见性 / getSkillValue
 *   engines/combat.js      战斗结算 (攻击/闪避/反击/连射/贯穿/故障)
 *   engines/healing.js     治疗物品结算
 *   engines/sanity.js      理智/疯狂机制
 *   engines/wound.js       重伤/濒死判定
 *   engines/mythos.js      神话典籍/法术
 *   engines/environmental.js 环境伤害
 *   engines/poison.js      毒素
 */

/**
 * @role    程序员 (Programmer)
 * @owner   引擎核心 / AI调度 / 状态管理
 * @caution 策划/美术请勿直接修改此文件
 */
window.CoCEngine = window.CoCEngine || {};
