/**
 * Central registry of browser global export names (OPT-036).
 * Shim only — does not rename or remove existing window.* symbols.
 */

/** @type {Record<string, { global: string, source: string, status?: string }>} */
export const GLOBALS_REGISTRY = {
    CoCState: { global: 'CoCState', source: 'js/state.js', status: 'stable' },
    CoCStateAccessor: { global: 'CoCStateAccessor', source: 'js/state/accessor.js', status: 'stable' },
    CoCEngine: { global: 'CoCEngine', source: 'js/coc.js + js/engines/*.js', status: 'stable' },
    CoCItemDB: { global: 'CoCItemDB', source: 'js/data/items.js', status: 'stable' },
    CoCAI: { global: 'CoCAI', source: 'js/ai_logic.js', status: 'stable' },
    KpExecutionEngine: { global: 'KpExecutionEngine', source: 'js/campaign/kp_execution_engine.js', status: 'stable' },
    CoCLondonKpEngine: { global: 'CoCLondonKpEngine', source: 'js/campaign/london_kp_engine.js', status: 'deprecated-alias' },
    CoCKpConfig: { global: 'CoCKpConfig', source: 'js/state/kp_config.js', status: 'stable' },
    CoCToolHandlers: { global: 'CoCToolHandlers', source: 'js/tools/handlers/index.js', status: 'stable' },
    CoCGlobalsRegistry: { global: 'CoCGlobalsRegistry', source: 'js/core/globals_registry.js', status: 'meta' },
};

export function listDeprecatedGlobals() {
    return Object.entries(GLOBALS_REGISTRY)
        .filter(([, meta]) => meta.status === 'deprecated-alias')
        .map(([key]) => key);
}

if (typeof window !== 'undefined') {
    window.CoCGlobalsRegistry = GLOBALS_REGISTRY;
}
