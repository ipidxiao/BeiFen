// ESM utils + logger smoke — fills coverage gap for data/utils.mjs and data/logger.mjs
import { strict as assert } from 'node:assert';
import { safeJsonParse, safeJsonClone } from '../js/data/utils.mjs';
import { CoCLog } from '../js/data/logger.mjs';

assert.deepStrictEqual(safeJsonParse('{"a":1}'), { a: 1 });
assert.deepStrictEqual(safeJsonParse(''), {});
assert.deepStrictEqual(safeJsonParse(null, { x: 1 }), { x: 1 });
assert.deepStrictEqual(safeJsonParse('not-json', { ok: false }), { ok: false });
assert.deepStrictEqual(safeJsonParse({ b: 2 }), { b: 2 });

const cloned = safeJsonClone({ n: [1, 2] });
assert.deepStrictEqual(cloned, { n: [1, 2] });
assert.notStrictEqual(cloned, { n: [1, 2] });
assert.strictEqual(safeJsonClone(undefined, null), null);

assert.strictEqual(typeof CoCLog.warn, 'function');
assert.strictEqual(typeof CoCLog.error, 'function');
assert.strictEqual(typeof CoCLog.debug, 'function');

console.log('esm_utils_smoke: utils + logger OK');
