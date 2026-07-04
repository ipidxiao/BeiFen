// ESM engine module — source for browser build
// Split from js/engines/attributes.js

export function attachAttributesEngine(CoCEngine) {
  Object.assign(CoCEngine, {
    /**
     * 应用年龄修正
     * @param {Object} attrs - 原始属性
     * @param {number} age - 年龄
     * @returns {Object} 修正后的属性
     */
    applyAgeModifiers: function(attrs, age) {
        let newAttrs = JSON.parse(JSON.stringify(attrs));
        if (!age || age < 15) return newAttrs;
        // CoC 7e official age modifier table
        if (age >= 15 && age <= 19) {
            newAttrs.STR -= 5; newAttrs.EDU -= 5;
            // LUCK is rolled independently in CoC 7e (3D6×5), not age-modified
        } else if (age >= 20 && age <= 39) {
            // No modifiers — EDU improvement only via skill points
        } else if (age >= 40 && age <= 49) {
            newAttrs.STR -= 5; newAttrs.CON -= 5; newAttrs.DEX -= 5;
            newAttrs.APP -= 5; newAttrs.EDU = Math.min(99, newAttrs.EDU + 5);
        } else if (age >= 50 && age <= 59) {
            newAttrs.STR -= 10; newAttrs.CON -= 10; newAttrs.DEX -= 10;
            newAttrs.APP -= 10; newAttrs.EDU = Math.min(99, newAttrs.EDU + 10);
        } else if (age >= 60 && age <= 69) {
            newAttrs.STR -= 20; newAttrs.CON -= 20; newAttrs.DEX -= 20;
            newAttrs.APP -= 15; newAttrs.EDU = Math.min(99, newAttrs.EDU + 15);
        } else if (age >= 70 && age <= 79) {
            newAttrs.STR -= 40; newAttrs.CON -= 40; newAttrs.DEX -= 40;
            newAttrs.APP -= 20; newAttrs.EDU = Math.min(99, newAttrs.EDU + 20);
        } else if (age >= 80) {
            newAttrs.STR -= 80; newAttrs.CON -= 80; newAttrs.DEX -= 80;
            newAttrs.APP -= 25; newAttrs.EDU = Math.min(99, newAttrs.EDU + 25);
        }
        // Clamp to minimum 15 (except LUCK)
        for (let key in newAttrs) {
            if (newAttrs[key] < 15 && key !== 'LUCK' && newAttrs[key] !== 0) newAttrs[key] = 15;
        }
        return newAttrs;
    },

    /**
     * 计算衍生属性 (HP, MP, SAN, DB, Build, MOV)
     * @param {Object} attrs - 基础属性
     * @returns {Object} 衍生属性
     */
    calculateDerived: function(attrs, age) {
        let hp = Math.floor((attrs.CON + attrs.SIZ) / 10);
        let mp = Math.floor(attrs.POW / 5);
        let san = attrs.POW;
        let strSiz = attrs.STR + attrs.SIZ;
        let db = "0"; let build = 0;
        if (strSiz <= 64) { db = "-2"; build = -2; }
        else if (strSiz >= 65 && strSiz <= 84) { db = "-1"; build = -1; }
        else if (strSiz >= 85 && strSiz <= 124) { db = "0"; build = 0; }
        else if (strSiz >= 125 && strSiz <= 164) { db = "1D4"; build = 1; }
        else if (strSiz >= 165 && strSiz <= 204) { db = "1D6"; build = 2; }
        else if (strSiz >= 205 && strSiz <= 284) { db = "2D6"; build = 3; }
        else if (strSiz >= 285 && strSiz <= 364) { db = "3D6"; build = 4; }
        else if (strSiz >= 365) { build = Math.floor((strSiz - 365) / 80) + 5; db = `${build - 1}D6`; }
        let mov = 8;
        if (attrs.DEX < attrs.SIZ && attrs.STR < attrs.SIZ) mov = 7;
        else if (attrs.DEX > attrs.SIZ && attrs.STR > attrs.SIZ) mov = 9;
        // Age-based MOV penalty (CoC 7e)
        if (age >= 40 && age <= 49) mov = Math.max(1, mov - 1);
        else if (age >= 50 && age <= 59) mov = Math.max(1, mov - 2);
        else if (age >= 60 && age <= 69) mov = Math.max(1, mov - 3);
        else if (age >= 70 && age <= 79) mov = Math.max(1, mov - 4);
        else if (age >= 80) mov = Math.max(1, mov - 5);
        return { hp, mp, san, db, build, mov };
    },

    /**
     * 属性评语生成器 (Vue 渲染依赖)
     */
    getAttrEvaluation: function(val) {
        if (val === 0) return "未知";
        if (val <= 15) return "孱弱";
        if (val <= 39) return "较差";
        if (val <= 59) return "普通";
        if (val <= 79) return "良好";
        if (val <= 89) return "极佳";
        return "人类顶尖";
    }
});
}
