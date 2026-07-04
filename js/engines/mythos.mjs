// ESM engine module — source for browser build
// Split from js/engines/mythos.js
import { CoCMythosTomes, CoCStudyState } from '../data/mythos_tomes.mjs';
import { CoCSpells } from '../data/spells.mjs';

export function attachMythosEngine(CoCEngine) {
  CoCEngine.MythosEngine = {
    _tomes: function() { return CoCMythosTomes || {}; },
    _spells: function() { return CoCSpells || {}; },

    /**
     * 初次浏览典籍 — 快速翻阅，损失SAN但获得少量神话知识
     */
    initialBrowse: function(ch, tomeKey) {
        var tome = this._tomes()[tomeKey];
        if (!tome) return { success: false, description: '未找到该典籍。' };
        if (!ch.mythosStudy) { CoCStudyState.initForChar(ch); }
        var progress = CoCStudyState.getProgress(ch, tomeKey);
        if (progress.phase !== '未阅读') return { success: false, description: '你已经读过这本典籍了。' };
        var parts = tome.sanLossInitial.split('/');
        var sanPass = CoCEngine.parseDice(parts[0] || '1D6');
        var sanFail = CoCEngine.parseDice(parts[1] || '1D10');
        var sanRoll = Math.floor(Math.random() * 100) + 1;
        var passed = sanRoll <= (ch.derived ? ch.derived.sanity : (ch.sanity || 50));
        var sanLoss = passed ? sanPass : sanFail;
        var mythosGain = CoCEngine.parseDice(tome.mythosGainInitial);
        // Apply SAN loss
        if (ch.derived) ch.derived.sanity = Math.max(0, (ch.derived.sanity || 0) - sanLoss);
        else ch.sanity = Math.max(0, (ch.sanity || 0) - sanLoss);
        // Grant Mythos skill
        if (!ch.skills) ch.skills = {};
        ch.skills['克苏鲁神话'] = (ch.skills['克苏鲁神话'] || 0) + mythosGain;
        ch.mythos = Math.max(ch.mythos || 0, ch.skills['克苏鲁神话']);
        // Parse reading time
        var totalWeeks = parseInt(tome.readingTime) || 4;
        CoCStudyState.updateProgress(ch, tomeKey, '已浏览', 0, totalWeeks);
        return { success: true, sanLoss: sanLoss, mythosGain: mythosGain, passed: passed,
            description: ch.name + ' 翻阅了' + tome.name + '。' + (passed ? '勉强维持了理智。' : '被其中的内容深深震撼。') + ' 损失 ' + sanLoss + ' SAN，获得 ' + mythosGain + ' 点克苏鲁神话技能。' };
    },

    /**
     * 完整阅读典籍 — 消耗数周，深入掌握，可学习法术
     */
    fullStudy: function(ch, tomeKey, weeksSpent) {
        var tome = this._tomes()[tomeKey];
        if (!tome) return { success: false, description: '未找到该典籍。' };
        if (!ch.mythosStudy) { CoCStudyState.initForChar(ch); }
        var progress = CoCStudyState.getProgress(ch, tomeKey);
        var totalWeeks = parseInt(tome.readingTime) || 4;
        var actualWeeks = Math.min(Number(weeksSpent) || 1, totalWeeks - (progress.weeks || 0));
        var newWeeks = (progress.weeks || 0) + actualWeeks;
        var completed = newWeeks >= totalWeeks;
        if (completed) {
            var parts = tome.sanLossFull.split('/');
            var sanPass = CoCEngine.parseDice(parts[0] || '1D10');
            var sanFail = CoCEngine.parseDice(parts[1] || '2D10');
            var sanRoll = Math.floor(Math.random() * 100) + 1;
            var passed = sanRoll <= (ch.derived ? ch.derived.sanity : (ch.sanity || 50));
            var sanLoss = passed ? sanPass : sanFail;
            var mythosGain = CoCEngine.parseDice(tome.mythosGainFull);
            if (ch.derived) ch.derived.sanity = Math.max(0, (ch.derived.sanity || 0) - sanLoss);
            else ch.sanity = Math.max(0, (ch.sanity || 0) - sanLoss);
            if (!ch.skills) ch.skills = {};
            ch.skills['克苏鲁神话'] = (ch.skills['克苏鲁神话'] || 0) + mythosGain;
            ch.mythos = Math.max(ch.mythos || 0, ch.skills['克苏鲁神话']);
            CoCStudyState.updateProgress(ch, tomeKey, '已完成', totalWeeks, totalWeeks);
            // Auto-learn spells
            var spellsLearned = [];
            for (var i = 0; i < (tome.spells || []).length; i++) {
                CoCStudyState.learnSpell(ch, tome.spells[i]);
                spellsLearned.push(tome.spells[i]);
            }
            return { success: true, completed: true, sanLoss: sanLoss, mythosGain: mythosGain,
                spellsLearned: spellsLearned, passed: passed,
                description: ch.name + ' 完成了' + tome.name + '的研读！损失 ' + sanLoss + ' SAN，获得 ' + mythosGain + ' 点克苏鲁神话技能。学会了 ' + spellsLearned.length + ' 个法术：' + spellsLearned.join('、') + '。' };
        } else {
            CoCStudyState.updateProgress(ch, tomeKey, '研读中', newWeeks, totalWeeks);
            return { success: true, completed: false, weeks: newWeeks, totalWeeks: totalWeeks,
                description: ch.name + ' 继续研读' + tome.name + '（' + newWeeks + '/' + totalWeeks + '周）。还需要 ' + (totalWeeks - newWeeks) + ' 周。' };
        }
    },

    /**
     * 施放法术 — 消耗 POW/SAN/MP，进行 POW 对抗
     */
    castSpell: function(ch, spellName, target) {
        var spell = this._spells()[spellName];
        if (!spell) return { success: false, description: '未知法术：' + spellName };
        if (!CoCStudyState.knowsSpell(ch, spellName)) {
            return { success: false, description: ch.name + ' 尚未学会此法术。' };
        }
        // Check mythos requirement
        var mythos = ch.skills ? (ch.skills['克苏鲁神话'] || 0) : (ch.mythos || 0);
        if (spell.mythosRequired > mythos) {
            return { success: false, description: '克苏鲁神话技能不足（需要' + spell.mythosRequired + '，当前' + mythos + '）。' };
        }
        // Consume POW
        var powAttr = (ch.attrs && ch.attrs.POW) || 50;
        if (spell.powCost > powAttr) {
            return { success: false, description: 'POW不足（需要' + spell.powCost + '，当前' + powAttr + '）。' };
        }
        // Deduct POW permanently (or temporarily — here permanent for simplicity)
        if (ch.attrs && ch.attrs.POW) ch.attrs.POW = Math.max(1, ch.attrs.POW - spell.powCost);
        // Deduct SAN
        var sanCost = CoCEngine.parseDice(spell.sanCost);
        if (ch.derived) ch.derived.sanity = Math.max(0, (ch.derived.sanity || 0) - sanCost);
        else ch.sanity = Math.max(0, (ch.sanity || 0) - sanCost);
        // Deduct MP
        if (ch.derived) ch.derived.mp = Math.max(0, (ch.derived.mp || 0) - spell.mpCost);
        // POW对抗 (vs target if applicable)
        var powOpposed = null;
        if (target && target.attrs && target.attrs.POW && (spell.type === 'curse' || spell.type === 'summon')) {
            var casterRoll = Math.floor(Math.random() * 100) + 1;
            var targetRoll = Math.floor(Math.random() * 100) + 1;
            var casterPass = casterRoll <= (ch.attrs ? ch.attrs.POW : 50);
            var targetPass = targetRoll <= target.attrs.POW;
            if (casterPass && !targetPass) powOpposed = 'caster';
            else if (!casterPass && targetPass) powOpposed = 'target';
            else if (casterRoll <= targetRoll) powOpposed = 'caster';
            else powOpposed = 'target';
        }
        return {
            success: true, spellName: spellName, spellType: spell.type,
            powCost: spell.powCost, sanCost: sanCost, mpCost: spell.mpCost,
            powOpposed: powOpposed,
            description: ch.name + ' 施放了 ' + spellName + '！消耗 ' + spell.powCost + ' POW、' + sanCost + ' SAN、' + spell.mpCost + ' MP。' + spell.description + (powOpposed ? ' POW对抗结果：' + (powOpposed === 'caster' ? '施法者胜' : '目标胜') + '。' : '')
        };
    },

    /**
     * 检查角色的法术列表
     */
    getKnownSpells: function(ch) {
        if (!ch || !ch.mythosStudy) return [];
        return ch.mythosStudy.knownSpells || [];
    },

    /**
     * 获取可读典籍列表
     */
    getAvailableTomes: function(ch) {
        var tomes = this._tomes();
        var result = [];
        for (var key in tomes) {
            result.push({
                key: key,
                name: tomes[key].name,
                author: tomes[key].author,
                rarity: tomes[key].rarity,
                readingTime: tomes[key].readingTime,
                progress: CoCStudyState.getProgress(ch, key)
            });
        }
        return result;
    }
};
}
