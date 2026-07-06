/**
 * ESM tool_dispatch smoke — normalizeToolValue boundary coverage.
 */
import { strict as assert } from 'node:assert';
import { normalizeToolValue, parseToolArguments } from '../js/ai/tool_dispatch.mjs';

const errors = [];

assert.deepStrictEqual(parseToolArguments('{"a":1}'), { ok: true, value: { a: 1 } });
assert.deepStrictEqual(parseToolArguments(null), { ok: true, value: {} });
assert.strictEqual(parseToolArguments('bad').ok, false);

assert.strictEqual(
  normalizeToolValue(42, { type: 'string' }, 'msg', errors),
  '42'
);
assert.strictEqual(errors.length, 0);

errors.length = 0;
assert.strictEqual(
  normalizeToolValue('12', { type: 'number' }, 'n', errors),
  12
);

errors.length = 0;
const arr = normalizeToolValue('solo', { type: 'array', singleAsArray: true, items: { type: 'string' } }, 'items', errors);
assert.deepStrictEqual(arr, ['solo']);

errors.length = 0;
normalizeToolValue({ bad: true }, { type: 'string' }, 's', errors);
assert(errors.some((e) => e.includes('字符串')), 'non-string rejected for string schema');

errors.length = 0;
const nested = normalizeToolValue(
  { name: ' key ' },
  { type: 'object', properties: { name: { type: 'string' } } },
  'obj',
  errors
);
assert.strictEqual(nested.name, 'key');

console.log('esm_tool_dispatch: normalizeToolValue boundaries OK');
