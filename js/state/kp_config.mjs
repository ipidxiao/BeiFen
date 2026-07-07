/**
 * Single source of truth for KP engine defaults and per-module lobby preference.
 */

/** Default KP enabled for fresh game sessions (global bottom-layer design). */
export const KP_ENGINE_DEFAULT_ENABLED = true;

const KP_PREF_STORAGE_PREFIX = 'coc_kp_pref_';

export function kpPrefStorageKey(moduleId) {
    return KP_PREF_STORAGE_PREFIX + (moduleId || 'default');
}

/** @returns {boolean|null} null when no stored preference */
export function loadKpPreference(moduleId) {
    try {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem(kpPrefStorageKey(moduleId));
        if (raw === null || raw === undefined) return null;
        return raw === 'true' || raw === '1';
    } catch (e) {
        return null;
    }
}

export function saveKpPreference(moduleId, enabled) {
    try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.setItem(kpPrefStorageKey(moduleId), String(!!enabled));
        return true;
    } catch (e) {
        return false;
    }
}

export function applyKpPreferenceToGameState(gameState) {
    if (!gameState || !gameState.kpEngine) return;
    const pref = loadKpPreference(gameState.activeModuleId);
    if (pref !== null) gameState.kpEngine.enabled = pref;
}

/** Shared accessor for KP runtime (browser handlers + legacy shims). */
export function getKpEngine() {
    if (typeof window !== 'undefined') {
        if (window.KpExecutionEngine) return window.KpExecutionEngine;
        if (window.CoCLondonKpEngine) {
            if (!window.__cocLondonKpFallbackWarned) {
                window.__cocLondonKpFallbackWarned = true;
                console.warn('[CoC DEPRECATED] getKpEngine() fell back to CoCLondonKpEngine — use KpExecutionEngine.');
            }
            return window.CoCLondonKpEngine;
        }
    }
    return null;
}

if (typeof window !== 'undefined') {
    window.CoCKpConfig = {
        KP_ENGINE_DEFAULT_ENABLED,
        kpPrefStorageKey,
        loadKpPreference,
        saveKpPreference,
        applyKpPreferenceToGameState,
        getKpEngine
    };
}
