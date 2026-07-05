/**
 * Scenario catalog — lists deployable local scripts (loaded after individual scenario files).
 */
const BUILTIN_GLOBALS = [
    'CoCScenarioTutorial',
    'CoCScenarioDeepOneShadow',
    'CoCScenarioAbandonedAsylum',
    'CoCScenarioMidnightMuseum',
    'CoCScenarioCoastalFestival',
    'CoCScenarioUniversityOccult',
    'CoCScenarioLighthouseSignal',
    'CoCScenarioMissingChild',
    'CoCScenarioTrainToNowhere',
    'CoCScenarioCarnivalOfMasks'
];

export const CoCScenarioCatalog = {
    _scenarios: [],

    refresh() {
        const candidates = BUILTIN_GLOBALS
            .map((key) => (typeof window !== 'undefined' ? window[key] : null))
            .filter(Boolean);
        this._scenarios = candidates;
        return this._scenarios;
    },

    list() {
        if (!this._scenarios.length) this.refresh();
        return this._scenarios.map((s) => ({
            id: s.id,
            title: s.title,
            subtitle: s.subtitle || '',
            description: s.description || '',
            author: s.author || 'CoC Engine Team',
            license: s.license || 'Original - CoC Engine',
            tags: Array.isArray(s.tags) ? s.tags : [],
            era: s.era || '1920s',
            estimatedMinutes: s.estimatedMinutes || null,
            playTime: s.estimatedMinutes || null,
            nodeCount: s.nodes ? Object.keys(s.nodes).length : 0
        }));
    },

    get(id) {
        if (!this._scenarios.length) this.refresh();
        const builtin = this._scenarios.find((s) => s.id === id);
        if (builtin) return builtin;
        if (typeof window !== 'undefined' && window.CoCScenarioStore) {
            return window.CoCScenarioStore.getScenario(id);
        }
        return null;
    },

    validate(scenario) {
        const errors = [];
        if (!scenario || typeof scenario !== 'object') {
            errors.push('scenario missing');
            return { ok: false, errors };
        }
        if (!scenario.id) errors.push('missing id');
        if (!scenario.startNode) errors.push('missing startNode');
        if (!scenario.nodes || typeof scenario.nodes !== 'object') errors.push('missing nodes');
        else if (!scenario.nodes[scenario.startNode]) errors.push('startNode not in nodes');
        return { ok: errors.length === 0, errors };
    }
};

try { CoCScenarioCatalog.refresh(); } catch (e) { /* browser-only init */ }
