// GENERATED from js/state/selection.mjs — do not edit; run: npm run build:js
/** Clamp selectedCharIndex to active roster bounds. */
function clampSelectedCharIndex(gs) {
    if (!gs || !Array.isArray(gs.roster)) return 0;
    const activeCount = gs.roster.filter((c) => c && c.isActive).length;
    const max = Math.max(0, activeCount - 1);
    const current = Number.isFinite(gs.selectedCharIndex) ? gs.selectedCharIndex : 0;
    gs.selectedCharIndex = Math.max(0, Math.min(current, max));
    return gs.selectedCharIndex;
}
