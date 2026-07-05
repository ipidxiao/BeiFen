// GENERATED from js/components/chat_format_helpers.mjs — do not edit; run: npm run build:js
// Pure chat / toast formatting helpers — shared by UI components and tests.

function toastTitle(type) {
    return ({ success: '成功', warning: '注意', danger: '错误', info: '提示' }[type]) || '提示';
}

function formatChatContent(msg) {
    if (!msg) return '';
    if (msg.statusAlert && msg.statusAlert.kind === 'hp_damage') {
        const sa = msg.statusAlert;
        const lines = [`🩸 ${sa.name} 失去 ${sa.dmg} 点生命（${sa.hp}/${sa.maxHp}）`];
        if (Array.isArray(sa.lines)) lines.push(...sa.lines);
        if (sa.majorWound && sa.majorWound.droppedWeapon) lines.push(`🔻 武器掉落：${sa.majorWound.droppedWeapon}`);
        if (sa.majorWound && sa.majorWound.bleeding) lines.push('🩸 内出血！需立即急救。');
        return lines.filter(Boolean).join('\n');
    }
    return msg.content || '';
}

if (typeof window !== 'undefined') {
    window.ChatFormatHelpers = { toastTitle, formatChatContent };
}
