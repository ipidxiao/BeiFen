// Campaign catalog entry — Masks of Nyarlathotep London chapter

export const MASKS_LONDON_CATALOG = {
    id: 'masks_london',
    title: '面具·伦敦战役',
    subtitle: '亚拉托提普的面具 — 伦敦章',
    system: 'COC_LONDON_KP_ENGINE_V2',
    antagonistSystem: 'ANTAGONIST_AI_ENGINE',
    era: '1920s',
    description: '苏活区地下祭坛危机存档。含 V/修/雨果/尼尔 小队状态、全量物品登记与 KP 引擎规则。',
    tags: ['伦敦', '面具', '战役存档', 'KP引擎'],
    difficultyPreset: 'divine_war'
};

export function listCampaigns() {
    return [MASKS_LONDON_CATALOG];
}

export function getCampaign(id) {
    return id === MASKS_LONDON_CATALOG.id ? MASKS_LONDON_CATALOG : null;
}

if (typeof window !== 'undefined') {
    window.CoCCampaignCatalog = { list: listCampaigns, get: getCampaign, MASKS_LONDON: MASKS_LONDON_CATALOG };
}
