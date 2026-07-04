// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * Browser Mock Helper for ESM tests.
 *
 * Sets up globalThis with minimal browser API shims so state/ai modules
 * can be imported and tested in Node.js without jsdom.
 *
 * Usage: import './helpers/browser-mock.mjs' before any state/ai import.
 */

// ── Storage mock ──
const store = new Map();
const localStorageMock = {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
};

// ── DOM mocks ──
const documentMock = {
    getElementById: (id) => id === 'chatContainer' ? { scrollTop: 0, scrollHeight: 0 } : null,
    createElement: (tag) => ({
        tagName: tag,
        style: {},
        click() {},
        set href(v) {},
        set download(v) {},
        appendChild() {},
        removeChild() {},
    }),
    body: {
        appendChild() {},
        removeChild() {},
    },
    addEventListener() {},
};

// ── Vue mock (reactive passthrough) ──
const VueMock = {
    reactive: (x) => x,
    ref: (v) => ({ value: v }),
    computed: (fnOrObj) => ({
        get value() { return typeof fnOrObj === 'function' ? fnOrObj() : fnOrObj.get(); },
        set value(v) { if (fnOrObj.set) fnOrObj.set(v); }
    }),
    nextTick: (fn) => (fn ? fn() : Promise.resolve()),
    watch: () => {},
};

// ── URL / Blob mocks ──
class BlobMock {
    constructor(parts, opts) { this.parts = parts; this.opts = opts; this.size = (parts || []).reduce((n, p) => n + Buffer.byteLength(String(p)), 0); }
}
const URLMock = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };

// ── Assemble window ──
const win = {
    console,
    setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => {},
    Date,
    Math,
    JSON,
    Promise,
    Buffer,
    Vue: VueMock,
    DevLogs: [],
    document: documentMock,
    localStorage: localStorageMock,
    Blob: BlobMock,
    URL: URLMock,
    AbortController: globalThis.AbortController,
    fetch: globalThis.fetch,
    COC_AI_RETRY_BACKOFF_MS: [0, 0, 0],  // no delay in tests
    CoCBaseSkills: null,    // will be populated after coc.mjs import
    CoCJobs: [],
    CoCItemDB: {},
};

win.window = win;
globalThis.window = win;
globalThis.document = documentMock;
globalThis.localStorage = localStorageMock;

// ── Also expose commonly needed globals ──
globalThis.Blob = BlobMock;
globalThis.URL = URLMock;
globalThis.AbortController = globalThis.AbortController || class { abort() {} };

// ── Helper to reset store between tests ──
export function resetStore() { store.clear(); }

// ── Helper to access the mock localStorage ──
export { localStorageMock as mockLocalStorage, store as mockStore };
