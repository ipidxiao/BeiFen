/**
 * @deprecated items_db.js was merged into items.mjs (OPT-027).
 * Import CoCItemDB / parseItemData from './items.mjs' instead.
 */
let _warned = false;
function warnOnce() {
    if (_warned) return;
    _warned = true;
    console.warn('[CoC DEPRECATED] items_db.mjs — use items.mjs as the single item DB source.');
}

warnOnce();
export { CoCItemDB, parseItemData } from './items.mjs';
