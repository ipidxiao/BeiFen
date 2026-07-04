// GENERATED from js/engines/poison.mjs — do not edit; run: npm run build:js
window.CoCEngine = window.CoCEngine || {};
window.CoCEngine.PoisonEngine = {
    applyPoison: function(victim, potency, delayRounds) {
        potency = potency || 'moderate';
        delayRounds = delayRounds || 0;
        var potencies = { mild:{conPenalty:0,damage:'1D3'}, moderate:{conPenalty:-1,damage:'1D6'}, lethal:{conPenalty:-2,damage:'2D6'} };
        var p = potencies[potency] || potencies.moderate;
        if (!victim.poison) victim.poison = [];
        victim.poison.push({ potency:potency, damage:p.damage, conPenalty:p.conPenalty, delayRounds:delayRounds, active:true });
        return { applied:true, potency:potency, desc:victim.name + '中毒！' };
    },
    processPoisonTick: function(victim, currentRound) {
        if (!victim.poison) return { damage:0 };
        var total = 0;
        for (var i = 0; i < victim.poison.length; i++) {
            var p = victim.poison[i];
            if (!p.active || currentRound < p.delayRounds) continue;
            total += window.CoCEngine.parseDice(p.damage);
        }
        if (total > 0) victim.hp = Math.max(0, victim.hp - total);
        return { damage:total, hpRemaining:victim.hp };
    },
    resistCheck: function(victim, potency) {
        potency = potency || 'moderate';
        var pen = { mild:0, moderate:-1, lethal:-2 }[potency] || 0;
        var target = (victim.attrs.CON + pen) * 5;
        var roll = Math.floor(Math.random() * 100) + 1;
        return { success:roll<=target, rolled:roll, target:target };
    }
};
