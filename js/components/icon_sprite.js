// GENERATED from js/components/icon_sprite.mjs — do not edit; run: npm run build:js
// ===============================================
// CoC icon sprite helper — uses inline #icon-* symbols from css/icons.svg
// ===============================================

/** Map journal log types to sprite symbol ids (without icon- prefix). */
const JOURNAL_ICON_IDS = {
    skill_check: 'dice',
    san_loss: 'tentacle',
    hp_loss: 'combat',
    item_found: 'inventory',
    item_lost: 'storage',
    combat: 'combat',
    note: 'journal',
    heal: 'growth',
    san_recover: 'growth',
};

/** Resolve journal entry type to sprite id. */
function journalIconId(type) {
    return JOURNAL_ICON_IDS[type] || 'journal';
}

/** Equipment slot id → sprite symbol id. */
const EQUIP_SLOT_ICON_IDS = {
    helmet: 'helmet',
    armor: 'shield',
    backpack: 'inventory',
    primary: 'rifle',
    secondary: 'pistol',
    melee: 'equip',
};

window.CocIcon = {
    props: {
        name: { type: String, required: true },
        size: { type: [Number, String], default: 18 },
        title: { type: String, default: '' },
    },
    template: `
        <svg class="coc-icon" :width="size" :height="size"
            :aria-label="title || undefined"
            :aria-hidden="title ? undefined : 'true'"
            role="img">
            <use :href="'./css/icons.svg#icon-' + name"></use>
        </svg>
    `,
};


window.CoCIconSprite = { JOURNAL_ICON_IDS, journalIconId, EQUIP_SLOT_ICON_IDS };
