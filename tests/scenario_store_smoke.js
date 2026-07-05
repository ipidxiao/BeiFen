// Scenario store roundtrip smoke — mock fetch for download fallback chain
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

const BUILTIN_FILES = [
    'js/data/scenarios/tutorial.js',
    'js/data/scenarios/deep_one_shadow.js',
    'js/data/scenarios/abandoned_asylum.js',
    'js/data/scenarios/midnight_museum.js',
    'js/data/scenarios/coastal_festival.js',
    'js/data/scenarios/university_occult.js',
    'js/data/scenarios/lighthouse_signal.js',
    'js/data/scenarios/missing_child.js',
    'js/data/scenarios/train_to_nowhere.js',
    'js/data/scenarios/carnival_of_masks.js'
];

function loadJsIntoWindow(relPath, window) {
    const src = fs.readFileSync(path.join(root, relPath), 'utf8');
    vm.runInNewContext(src, { window, module: {}, exports: {} }, { filename: relPath });
}

const window = {};
for (const f of BUILTIN_FILES) loadJsIntoWindow(f, window);
loadJsIntoWindow('js/data/scenarios/catalog.js', window);
loadJsIntoWindow('js/data/scenarios/remote_catalog.js', window);

const remote = window.CoCScenarioRemoteCatalog;
assert(remote && remote.entries.length >= 2, 'remote catalog loaded');
for (const entry of remote.entries) {
    assert(entry.fallbackUrl || entry.packageUrl, `${entry.id} has fallbackUrl`);
    assert(entry.url && entry.url.includes('/scenarios/packages/'), `${entry.id} primary url is same-origin package`);
}

const storeCtx = {
    window,
    indexedDB: undefined,
    localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; } }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scenario/store.js'), 'utf8'), storeCtx);
const store = storeCtx.window.CoCScenarioStore;

assert(store, 'CoCScenarioStore loaded');
assert(typeof store.listCatalog === 'function', 'listCatalog');
assert(typeof store.listLocal === 'function', 'listLocal');
assert(typeof store.isAvailable === 'function', 'isAvailable');

const storeSrc = fs.readFileSync(path.join(root, 'js/scenario/store.js'), 'utf8');
assert(storeSrc.includes('mirrorUrls'), 'store handles mirrorUrls');
assert(storeSrc.includes('fallbackUrl'), 'store handles fallbackUrl');

store.init().then(async () => {
    const catalog = store.listCatalog();
    assert(catalog.length >= 15, 'catalog merges built-in + remote');
    assert(store.listLocal().length >= 10, 'listLocal has built-in ids');
    assert(store.isAvailable('tutorial'), 'tutorial available');
    assert(!store.isAvailable('isolated_lab'), 'remote not available before download');

    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'js/data/scenarios/packages/isolated_lab.json'), 'utf8'));
    const entry = remote.get('isolated_lab');
    const fallbackUrl = entry.fallbackUrl || entry.packageUrl;

    // Same-origin primary succeeds immediately
    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u.includes('isolated_lab.json') || u === fallbackUrl || u === entry.url) {
            return { ok: true, json: async () => pkg };
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const downloaded = await store.downloadScenario('isolated_lab');
    assert.strictEqual(downloaded.id, 'isolated_lab');
    assert.strictEqual(downloaded._downloadSource, 'fallback', 'same-origin primary labeled fallback');
    assert(store.isAvailable('isolated_lab'), 'available after download');

    const listed = store.listCatalog().find((i) => i.id === 'isolated_lab');
    assert.strictEqual(listed.downloadSource, 'fallback', 'listCatalog exposes downloadSource');

    await store.removeDownload('isolated_lab');
    assert(!store.isAvailable('isolated_lab'), 'removed from local');

    // Primary fail → mirror success
    const hauntedPkg = JSON.parse(fs.readFileSync(path.join(root, 'js/data/scenarios/packages/haunted_inheritance.json'), 'utf8'));
    const hauntedEntry = remote.get('haunted_inheritance');
    const mirrorUrl = 'https://mirror.example.test/haunted_inheritance.json';
    hauntedEntry.mirrorUrls = [mirrorUrl];

    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u === hauntedEntry.url || u === hauntedEntry.fallbackUrl) {
            return { ok: false, status: 503, json: async () => { throw new Error('unavailable'); } };
        }
        if (u === mirrorUrl) {
            return { ok: true, json: async () => hauntedPkg };
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const mirrorDl = await store.downloadScenario('haunted_inheritance');
    assert.strictEqual(mirrorDl.id, 'haunted_inheritance');
    assert.strictEqual(mirrorDl._downloadSource, 'mirror', 'mirror used when primary fails');
    await store.removeDownload('haunted_inheritance');

    // External primary fail → mirror fail → same-origin fallback succeeds
    const externalPrimary = 'https://example.test/haunted_inheritance.json';
    hauntedEntry.url = externalPrimary;
    hauntedEntry.mirrorUrls = [mirrorUrl];

    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u === externalPrimary || u === mirrorUrl) {
            return { ok: false, status: 503, json: async () => { throw new Error('unavailable'); } };
        }
        if (u === hauntedEntry.fallbackUrl) {
            return { ok: true, json: async () => hauntedPkg };
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const fallbackDl = await store.downloadScenario('haunted_inheritance');
    assert.strictEqual(fallbackDl._downloadSource, 'fallback', 'fallback after primary/mirror fail');
    await store.removeDownload('haunted_inheritance');

    console.log('Scenario store smoke: same-origin / mirror / fallback chain OK');
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
