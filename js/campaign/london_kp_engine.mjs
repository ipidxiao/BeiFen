// London KP engine — backward-compat alias (loads after kp_execution_engine in browser)

import {
    KpExecutionEngine,
    ensureKpEngine,
    loadLondonRulesPreset,
    setKpEngineEnabled
} from './kp_execution_engine.mjs';

export const CoCLondonKpEngine = KpExecutionEngine;
export { KpExecutionEngine, ensureKpEngine, loadLondonRulesPreset, setKpEngineEnabled };

if (typeof window !== 'undefined') {
    window.CoCLondonKpEngine = CoCLondonKpEngine;
}
