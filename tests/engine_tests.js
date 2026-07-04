// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * CoC 7th Engine - Full Regression Suite
 * 
 * 本脚本用于验证核心引擎逻辑及 UI 渲染所需的接口。
 * 贯彻"以跳过验证为耻，以主动测试为荣"的准则。
 */
const runEngineTests = () => {
    console.log("🧪 开始执行核心引擎回归测试...");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`✅ 通过: ${message}`);
            passed++;
        } else {
            console.error(`❌ 失败: ${message}`);
            failed++;
        }
    };

    const Engine = window.CoCEngine;

    // ═══ 1. UI 接口 ═══
    assert(typeof Engine.getAttrEvaluation === 'function', "UI 接口: getAttrEvaluation 必须存在且为函数");
    assert(Engine.getAttrEvaluation(80) === "极佳", "业务逻辑: getAttrEvaluation(80) 应返回 '极佳'");
    assert(Engine.getAttrEvaluation(0) === "未知", "业务逻辑: getAttrEvaluation(0) 应返回 '未知'");
    assert(Engine.getAttrEvaluation(15) === "孱弱", "业务逻辑: getAttrEvaluation(15) 应返回 '孱弱'");

    // ═══ 2. 属性衍生 ═══
    const testAttrs = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50 };
    const derived = Engine.calculateDerived(testAttrs);
    assert(derived.hp === 10, "衍生计算: HP (50+50)/10 = 10");
    assert(derived.mp === 10, "衍生计算: MP 50/5 = 10");
    assert(derived.db === "0", "衍生计算: DB (STR+SIZ=100) = 0");

    // Edge cases
    const weak = Engine.calculateDerived({ STR: 20, CON: 20, SIZ: 20, DEX: 20, APP: 20, INT: 20, POW: 20, EDU: 20 });
    assert(weak.db === "-2", "衍生计算: DB (STR+SIZ=40) = -2");
    const strong = Engine.calculateDerived({ STR: 90, CON: 90, SIZ: 90, DEX: 90, APP: 90, INT: 90, POW: 90, EDU: 90 });
    assert(strong.db === "1D4", "衍生计算: DB (STR+SIZ=180) = 1D4");

    // ═══ 3. 技能别名 ═══
    const testChar = { 
        attrs: { DEX: 50, EDU: 60 }, 
        skillAllocations: { "斗殴": 60, "手枪": 55, "驾驶：汽车": 40 },
        skills: { "侦查": 70 }
    };
    assert(Engine.getSkillValue(testChar, "斗殴") === 60, "技能获取: 基础技能点匹配");
    assert(Engine.getSkillValue(testChar, "侦查") === 70, "技能获取: 临时技能覆盖匹配");
    assert(Engine.getSkillValue(testChar, "格斗：斗殴") === 60, "技能获取: 别名 (格斗：斗殴 -> 斗殴)");
    assert(Engine.getSkillValue(testChar, "射击：手枪") === 55, "技能获取: 父子别名 (射击：手枪 -> 手枪)");
    assert(Engine.getSkillValue(testChar, "闪避") === 25, "技能获取: 动态属性 (DEX 50/2 = 25)");
    assert(Engine.getSkillValue(testChar, "图书馆使用") === 20, "技能获取: 未分配使用 base 值");
    assert(Engine.getSkillValue(testChar, "汽车驾驶") === 40, "技能获取: 驾驶:汽车 allocation 同时命中汽车驾驶");

    // ═══ 4. 技能检定 ═══
    const originalRandom = Math.random;
    Math.random = () => 0.04; // 模拟掷出 5
    const checkRes = Engine.checkSkill("斗殴", testChar);
    assert(checkRes.success && checkRes.level === '大成功', "检定: 掷出 5 vs 60 应为大成功");
    Math.random = () => 0.5; // 模拟掷出 51
    const checkFail = Engine.checkSkill("斗殴", testChar);
    assert(!checkFail.success && checkFail.level === '失败', "检定: 掷出 51 vs 60 应为失败");
    Math.random = () => 0.97; // 模拟掷出 98
    const checkFumble = Engine.checkSkill("斗殴", testChar);
    assert(checkFumble.level === '大失败', "检定: 掷出 98 应为大失败");
    Math.random = originalRandom;

    // ═══ 5. 年龄修正 ═══
    const youngAttrs = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 };
    const young = Engine.applyAgeModifiers(youngAttrs, 17);
    assert(young.STR === 45 && young.EDU === 45, "年龄修正: 15-19 岁 STR/SIZ/EDU-5");
    const middle = Engine.applyAgeModifiers({...youngAttrs}, 45);
    assert(middle.EDU === 55 && middle.APP === 45, "年龄修正: 40-49 岁 EDU+5 APP/DEX-5");
    const senior = Engine.applyAgeModifiers({...youngAttrs}, 70);
    assert(senior.EDU === 70 && senior.APP === 30, "年龄修正: 70+ 岁 EDU+20 APP-20 STR-15 CON-10");

    // ═══ 6. 战斗引擎 ═══
    const atk = { name: "调查员A", attrs: { DEX: 60, STR: 50, SIZ: 50 }, derived: { db: "0" }, skillAllocations: { "斗殴": 70 } };
    const def = { name: "食尸鬼", attrs: { DEX: 40, STR: 60, SIZ: 60 }, derived: { db: "1D4" }, armor: 2, skillAllocations: { "闪避": 30 } };
    
    assert(typeof Engine.CombatEngine.compareSuccess('大成功', '成功') === 'number', "战斗: compareSuccess 存在");
    assert(Engine.CombatEngine.compareSuccess('大成功', '困难成功') > 0, "战斗: 大成功 > 困难成功");
    assert(Engine.CombatEngine.compareSuccess('失败', '大失败') > 0, "战斗: 失败 > 大失败");

    const dmg = Engine.CombatEngine.calculateDamage("1D6", "1D4", 2);
    assert(typeof dmg === 'number' && dmg >= 0, "战斗: calculateDamage 返回非负数");

    // ═══ 7. 骰子表达式解析 ═══
    assert(Engine.parseDice("1D6") >= 1 && Engine.parseDice("1D6") <= 6, "骰子: parseDice('1D6') 范围 [1,6]");
    assert(Engine.parseDice("0") === 0, "骰子: parseDice('0') = 0");
    assert(Engine.parseDice("") === 0, "骰子: parseDice('') = 0");

    // ═══ 8. 技能可见性 ═══
    assert(Engine.isVisibleSkillName("斗殴"), "可见性: '斗殴' 可见");
    assert(Engine.isVisibleSkillName("侦查"), "可见性: '侦查' 可见");
    assert(!Engine.isVisibleSkillName(""), "可见性: 空字符串不可见");
    assert(Engine.isPlaceholderSecondarySkillName("射击："), "占位符: '射击：' 是占位符");
    assert(Engine.isPlaceholderSecondarySkillName("其他格斗"), "占位符: '其他格斗' 是占位符");

    console.log(`\n📊 测试总结: ${passed} 项通过, ${failed} 项失败。`);
    return failed === 0;
};

window.runEngineTests = runEngineTests;

setTimeout(() => {
    if (!runEngineTests()) {
        console.error("🚨 核心引擎测试未通过！请立即检查代码逻辑。");
    }
}, 500);
