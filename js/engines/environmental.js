// GENERATED from js/engines/environmental.mjs — do not edit; run: npm run build:js
window.CoCEngine = window.CoCEngine || {};
window.CoCEngine.EnvironmentalEngine = {
    fallDamage: function(feet) {
        var dice = Math.floor(feet / 10);
        if (dice <= 0) return { damage: 0, desc: '安全落地。' };
        var dmg = dice === 1 ? Math.floor(Math.random()*6)+1 : window.CoCEngine.parseDice(dice + 'D6');
        var jumpCheck = Math.floor(Math.random()*100)+1;
        var reduced = jumpCheck <= 50 ? Math.floor(dmg/2) : dmg;
        return { damage: reduced, rawDamage: dmg, reduced: reduced<dmg, desc: '从' + feet + '英尺坠落！造成' + reduced + '点伤害。' };
    },
    fireDamage: function(intensity) {
        intensity = intensity || 'moderate';
        var tiers = { minor:'1D3', moderate:'1D6', severe:'2D6', inferno:'3D6' };
        return { damage: window.CoCEngine.parseDice(tiers[intensity]||'1D6'), intensity: intensity };
    },
    drowning: function(victim, round) {
        var conRounds = Math.floor(victim.attrs.CON / 2);
        if (round <= conRounds) return { damage: 0 };
        return { damage: Math.floor(Math.random()*4)+1 };
    },
    electricDamage: function(voltage) {
        voltage = voltage || 'household';
        var tiers = { household:'1D3', industrial:'2D6', powerline:'4D6', lightning:'6D6' };
        var dmg = window.CoCEngine.parseDice(tiers[voltage]||'1D6');
        return { damage: dmg, voltage: voltage, stun: dmg>=6 };
    },
    explosionDamage: function(dice, distanceFeet) {
        var base = window.CoCEngine.parseDice(dice);
        var falloff = Math.max(1, Math.floor(distanceFeet / 5));
        return { damage: Math.max(1, Math.floor(base/falloff)), baseDamage: base, distance: distanceFeet };
    }
};
