// Masks London campaign integration smoke tests
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const { COC_LONDON_KP_RULES } = await imp('js/data/campaigns/masks_london_kp_rules.mjs');
    const { ANTAGONIST_AI_RULES } = await imp('js/data/campaigns/masks_london_antagonist_rules.mjs');
    const { FORBIDDEN_PATTERNS, processText, detectViolations } = await imp('js/data/campaigns/language_self_correction.mjs');
    const { CAMPAIGN_MASTER_STATE } = await imp('js/data/campaigns/masks_london_master_state.mjs');
    const { MASKS_LONDON_CATALOG } = await imp('js/data/campaigns/masks_london_catalog.mjs');
    const { CoCLondonKpEngine } = await imp('js/campaign/london_kp_engine.mjs');
    const { loadMasksLondonCampaign, buildCampaignContextSummary } = await imp('js/campaign/campaign_loader.mjs');
    const { CoCLanguageFilter } = await imp('js/ai/language_filter.mjs');
    const { CoCAIPromptConfig } = await imp('js/data/ai_prompt_config.mjs');

    assert.strictEqual(COC_LONDON_KP_RULES.SYSTEM_NAME, 'COC_LONDON_KP_ENGINE_V2');
    assert(COC_LONDON_KP_RULES.OUTPUT_PROTOCOL.STEP_ORDER.length === 5);
    assert.strictEqual(ANTAGONIST_AI_RULES.SYSTEM_NAME, 'ANTAGONIST_AI_ENGINE');
    assert(FORBIDDEN_PATTERNS.length >= 8);

    const bad = '这不是普通的门而是通往深渊的入口';
    const cleaned = processText(bad);
    assert(!/不是.+而是/.test(cleaned), 'forbidden pattern should be rewritten');
    assert(detectViolations(cleaned).ok, 'cleaned text passes prohibition check');

    const filtered = CoCLanguageFilter.run(bad);
    assert(filtered.includes('与其说') || !filtered.includes('而是'), 'language filter applies rewrite');

    const roster = CAMPAIGN_MASTER_STATE.campaign_master_state.investigator_roster;
    assert(roster.V_Leader && roster.Xiu_Avenger && roster.Hugo_Scholar);
    assert.strictEqual(MASKS_LONDON_CATALOG.id, 'masks_london');

    const gameState = {
        roster: [],
        inventory: [],
        knownLocations: [],
        chatHistory: [{ role: 'system', isHidden: true, content: 'sys' }],
        aiSettings: { difficultyPreset: 'standard' },
        atmosphere: {},
        scenarioRunner: {}
    };
    const ok = loadMasksLondonCampaign(gameState);
    assert(ok);
    assert.strictEqual(gameState.activeCampaign, 'masks_london');
    assert(gameState.roster.length === 4);
    assert(gameState.campaignArchive);
    assert(gameState.londonKpState.ATTENTION_LEVEL >= 0);

    const summary = buildCampaignContextSummary(gameState);
    assert(summary.includes('面具·伦敦'));
    assert(summary.includes('V'));

    CoCLondonKpEngine.updateAttention(gameState, 1, 'test');
    const scaled = CoCLondonKpEngine.scaleEnemy(gameState, { name: 'Test', hp: 10, maxHp: 10 });
    assert(scaled.hp >= 10);

    const injection = CoCAIPromptConfig.buildSystemInjection('【V】', 'divine_war', gameState);
    assert(injection.includes('COC_LONDON_KP_ENGINE_V2'));
    assert(injection.includes('ANTAGONIST_AI_ENGINE'));

    console.log('masks_london_smoke: all assertions passed');
}

run().catch((e) => {
    console.error('masks_london_smoke FAILED:', e);
    process.exit(1);
});
