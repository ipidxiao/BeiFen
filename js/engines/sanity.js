// GENERATED from js/engines/sanity.mjs — do not edit; run: npm run build:js
window.CoCEngine = window.CoCEngine || {};
window.CoCEngine.SanityEngine = {
    _tables: function() { return CoCInsanityTables || {}; },

    applySanLoss: function(ch, loss, cause) {
        if (!ch || !ch.derived) return { newSan: 0, loss: 0 };
        var a = Math.max(0, Number(loss) || 0);
        if (!a) return { newSan: ch.derived.sanity, loss: 0 };
        ch.derived.sanity = Math.max(0, ch.derived.sanity - a);
        if (!ch.insanity) ch.insanity = { tempInsane: false, indefInsane: false,
            phobias: [], manias: [], dailyLoss: 0, history: [] };
        ch.insanity.dailyLoss = (ch.insanity.dailyLoss || 0) + a;
        ch.insanity.history = ch.insanity.history || [];
        ch.insanity.history.push({ date: new Date().toISOString(), loss: a,
            cause: cause || '???', remainingSan: ch.derived.sanity });
        var r = { newSan: ch.derived.sanity, loss: a, cause: cause || '???',
            tempInsanity: false, indefInsanity: false, bout: null, description: '' };
        if (a >= 5 && !ch.insanity.tempInsane) {
            var ir = Math.floor(Math.random() * 100) + 1;
            var ia = (ch.attrs && ch.attrs.INT) || 50;
            if (ir > ia) { r.tempInsanity = true; ch.insanity.tempInsane = true;
                r.bout = this.rollBoutOfMadness(ch);
                r.description = '【临时疯狂】' + ch.name + ' 理智崩溃！INT检定失败(' + ir + '/' + ia + ') -> ' + r.bout.name + ': ' + r.bout.summary; }
            else { r.description = '【理智冲击】' + ch.name + ' 压制了恐惧(INT检定' + ir + '/' + ia + '成功)。'; }
        }
        var mx = (ch.attrs && ch.attrs.POW) || (ch.derived && ch.derived.maxSan) || (ch.derived.sanity + a);
        if (ch.insanity.dailyLoss >= mx / 5 && !ch.insanity.indefInsane) {
            r.indefInsanity = true; ch.insanity.indefInsane = true;
            var af = this._rollRandomAffliction();
            if (af.type === 'phobia') ch.insanity.phobias.push(af.item);
            else ch.insanity.manias.push(af.item);
            r.description += '\n【不定疯狂】' + ch.name + ' 获得了新' + (af.type=='phobia'?'恐惧症':'狂躁症') + ': ' + af.item.name + '。';
        }
        return r;
    },

    rollBoutOfMadness: function() {
        var bt = (this._tables().BOUT_REAL_TIME || {});
        var roll = Math.floor(Math.random() * 10) + 1;
        var b = bt[roll] || { name: '???', summary: '陷入了不可名状的疯狂。' };
        b.roll = roll; return b;
    },

    _rollRandomAffliction: function() {
        var tb = this._tables();
        var t = Math.random() < 0.5 ? 'phobia' : 'mania';
        var lst = t === 'phobia' ? (tb.PHOBIAS || []) : (tb.MANIAS || []);
        return { type: t, item: lst[Math.floor(Math.random() * lst.length)] || { name: '???' } };
    },

    realityCheck: function(ch, mythosName) {
        var mt = (this._tables().MYTHOS_SAN_LOSS || {});
        var e = mt[mythosName] || mt['不可名状之物'] || { sanLoss: '1/1D10' };
        var p = e.sanLoss.split('/');
        var sL = window.CoCEngine.parseDice(p[0] || '0');
        var fL = window.CoCEngine.parseDice(p[1] || '1D6');
        var roll = Math.floor(Math.random() * 100) + 1;
        var pass = roll <= ch.derived.sanity;
        var loss = pass ? sL : fL;
        return { passed: pass, roll: roll, sanLoss: loss, entity: mythosName,
            desc: pass ? ch.name + ' 维持了理智(SAN检定' + roll + '/' + ch.derived.sanity + ')，损失' + loss + ' SAN。'
                : ch.name + ' 无法理解眼前的恐怖(SAN检定' + roll + '/' + ch.derived.sanity + '失败)！损失' + loss + ' SAN！' };
    },

    applySanityReward: function(ch, rewardDice, reason) {
        if (!ch || !ch.derived) return { recovered: 0 };
        var rec = window.CoCEngine.parseDice(rewardDice || '1D6');
        var mx = ch.derived.maxSan || 99; var old = ch.derived.sanity;
        ch.derived.sanity = Math.min(mx, old + rec);
        if (ch.insanity && ch.insanity.tempInsane) ch.insanity.tempInsane = false;
        return { recovered: rec, oldSan: old, newSan: ch.derived.sanity,
            desc: ch.name + ' 恢复了 ' + rec + ' 点SAN(' + old + '->' + ch.derived.sanity + ')。' };
    },

    applyTherapy: function(ch, therapist) {
        if (!ch || !ch.derived) return { recovered: 0 };
        var sk = window.CoCEngine.checkSkill('精神分析', therapist, 'normal');
        var rec = 0;
        if (sk.level === '大成功' || sk.level === '极难成功') rec = window.CoCEngine.roll(1,6) + window.CoCEngine.roll(1,3);
        else if (sk.success) rec = window.CoCEngine.roll(1,3);
        else return { recovered: 0, newSan: ch.derived.sanity, skillCheck: sk,
            desc: therapist.name + ' 未能帮助 ' + ch.name + '。' };
        var mx = ch.derived.maxSan || 99; var old = ch.derived.sanity;
        ch.derived.sanity = Math.min(mx, old + rec); var cured = null;
        if (sk.level === '大成功' && ch.insanity) {
            var all = (ch.insanity.phobias || []).concat(ch.insanity.manias || []);
            if (all.length) { cured = all[Math.floor(Math.random()*all.length)];
                ch.insanity.phobias = ch.insanity.phobias.filter(function(p){return p!==cured;});
                ch.insanity.manias = ch.insanity.manias.filter(function(m){return m!==cured;});
                if (!ch.insanity.phobias.length && !ch.insanity.manias.length) ch.insanity.indefInsane = false; }
        }
        return { recovered: rec, oldSan: old, newSan: ch.derived.sanity, skillCheck: sk, cured: cured,
            desc: therapist.name + ' 对 ' + ch.name + ' 进行了心理治疗。' + (rec>0?'恢复了'+rec+'点SAN。':'') + (cured?'治愈了'+cured.name+'！':'') };
    },

    resetDailyLoss: function(ch) { if (ch && ch.insanity) ch.insanity.dailyLoss = 0; },

    getSanitySummary: function(ch) {
        if (!ch) return '???';
        var s = (ch.derived && typeof ch.derived.sanity === 'number') ? ch.derived.sanity
            : (typeof ch.sanity === 'number' ? ch.sanity : 0);
        var m = (ch.derived && ch.derived.maxSan) || (ch.attrs && ch.attrs.POW) || 99;
        var r = m > 0 ? s / m : 1;
        if (ch.insanity && ch.insanity.indefInsane) return '不定疯狂 SAN' + s + '/' + m;
        if (ch.insanity && ch.insanity.tempInsane) return '临时疯狂 SAN' + s + '/' + m;
        if (r < 0.2) return '濒临崩溃 SAN' + s + '/' + m;
        if (r < 0.4) return '严重动摇 SAN' + s + '/' + m;
        if (r < 0.6) return '心神不宁 SAN' + s + '/' + m;
        if (r < 0.8) return '略有不安 SAN' + s + '/' + m;
        return '心智健全 SAN' + s + '/' + m;
    },

    /** UI narrative hints for SAN loss intensity (ESM track; optional for browser) */
    getSanNarrative: function(sanLoss) {
        var loss = Math.max(0, Number(sanLoss) || 0);
        if (loss <= 0) return { intensity: 'none', shake: false, shock: false };
        if (loss >= 5) return { intensity: 'horrifying', shake: true, shock: true };
        if (loss >= 3) return { intensity: 'severe', shake: true, shock: false };
        return { intensity: 'mild', shake: false, shock: false };
    }
  };
