// London KP engine — backward-compat alias (loads after kp_execution_engine in browser)

import {
    KpExecutionEngine,
    ensureKpEngine,
    loadLondonRulesPreset,
    setKpEngineEnabled
} from './kp_execution_engine.mjs';

/** @deprecated Use KpExecutionEngine — legacy alias kept for backward compatibility. */
export const CoCLondonKpEngine = KpExecutionEngine;
export { KpExecutionEngine, ensureKpEngine, loadLondonRulesPreset, setKpEngineEnabled };

if (typeof window !== 'undefined') {
    if (!window.__cocLondonKpAliasWarned) {
        window.__cocLondonKpAliasWarned = true;
        console.warn('[CoC DEPRECATED] CoCLondonKpEngine is an alias of KpExecutionEngine — prefer KpExecutionEngine.');
    }
    window.CoCLondonKpEngine = CoCLondonKpEngine;
}
