// Scenario store roundtrip smoke — mock fetch for public base + bundled fallback chain
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

const remoteCatalogSrc = fs.readFileSync(path.join(root, 'js/data/scenarios/remote_catalog.js'), 'utf8');
assert(!/github\.com|raw\.githubusercontent|cdn\.jsdelivr\.net\/gh\//i.test(remoteCatalogSrc), 'remote catalog has no GitHub URLs');

const remote = window.CoCScenarioRemoteCatalog;
assert(remote && remote.entries.length >= 2, 'remote catalog loaded');

const pkgDir = path.join(root, 'js/data/scenarios/packages');
const pkgFiles = fs.readdirSync(pkgDir).filter((f) => f.endsWith('.json'));

for (const entry of remote.entries) {
    const isOfficial = entry.category === 'officialChaosium' || entry.importOnly === true;
    if (isOfficial) {
        assert(entry.officialUrl && /^https:\/\//.test(entry.officialUrl), `${entry.id} has officialUrl`);
        assert(entry.redistributable === false, `${entry.id} redistributable:false`);
        assert(!entry.url && !entry.fallbackUrl && !entry.packageUrl, `${entry.id} has no package urls`);
        assert(!pkgFiles.includes(`${entry.id}.json`), `${entry.id} has no packages/*.json file`);
        assert(!/github\.com/i.test(entry.officialUrl), `${entry.id} officialUrl not GitHub`);
    } else {
        assert(entry.fallbackUrl || entry.packageUrl, `${entry.id} has fallbackUrl`);
        assert(entry.url && entry.url.includes('/scenarios/packages/'), `${entry.id} primary url is same-origin package`);
    }
}

const officialEntries = remote.entries.filter((e) => e.category === 'officialChaosium');
assert(officialEntries.length >= 5, 'at least 5 official Chaosium link-only entries');

const storeCtx = {
    window,
    indexedDB: undefined,
    localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scenario/store.js'), 'utf8'), storeCtx);
const store = storeCtx.window.CoCScenarioStore;

assert(store, 'CoCScenarioStore loaded');
assert(typeof store.listCatalog === 'function', 'listCatalog');
assert(typeof store.listLocal === 'function', 'listLocal');
assert(typeof store.isAvailable === 'function', 'isAvailable');
assert(typeof store.getPublicCatalogBase === 'function', 'getPublicCatalogBase');
assert(typeof store.setPublicCatalogBase === 'function', 'setPublicCatalogBase');
assert(typeof store.importScenarioFromFile === 'function', 'importScenarioFromFile');
assert(typeof store.importOfficialPack === 'function', 'importOfficialPack');
assert(typeof store.importOfficialOneClick === 'function', 'importOfficialOneClick');
assert(typeof store.isOfficialImported === 'function', 'isOfficialImported');
assert(typeof store.isOfficialPdfEntry === 'function', 'isOfficialPdfEntry');
assert(typeof store.isImportOnlyEntry === 'function', 'isImportOnlyEntry');

const storeSrc = fs.readFileSync(path.join(root, 'js/scenario/store.js'), 'utf8');
assert(storeSrc.includes('mirrorUrls'), 'store handles mirrorUrls');
assert(storeSrc.includes('fallbackUrl'), 'store handles fallbackUrl');
assert(storeSrc.includes('coc_public_catalog_base'), 'store reads public catalog base');
assert(!/github\.com|raw\.githubusercontent|cdn\.jsdelivr\.net\/gh\//i.test(storeSrc), 'store has no GitHub URLs');

store.init().then(async () => {
    const catalog = store.listCatalog();
    assert(catalog.length >= 15, 'catalog merges built-in + remote');
    assert(store.listLocal().length >= 10, 'listLocal has built-in ids');
    assert(store.isAvailable('tutorial'), 'tutorial available');
    assert(!store.isAvailable('isolated_lab'), 'remote not available before download');

    const officialItem = catalog.find((i) => i.id === 'chaosium_the_derelict');
    assert(officialItem, 'official catalog entry present');
    assert.strictEqual(officialItem.status, 'official', 'official status before import');
    assert.strictEqual(officialItem.downloadable, false, 'official not downloadable');
    assert(officialItem.officialUrl.includes('chaosium.itch.io'), 'official itch.io url');

    try {
        await store.downloadScenario('chaosium_the_derelict');
        assert.fail('downloadScenario should reject official entry');
    } catch (e) {
        assert(/官方|Chaosium|导入/i.test(String(e.message)), 'official download rejected');
    }

    const importPkg = { id: 'chaosium_the_derelict', title: 'Test', startNode: 'n1', nodes: { n1: { text: 'hi', choices: [] } } };
    await store.importScenarioFromFile(JSON.stringify(importPkg));
    assert(store.isAvailable('chaosium_the_derelict'), 'official available after import');
    const afterImport = store.listCatalog().find((i) => i.id === 'chaosium_the_derelict');
    assert.strictEqual(afterImport.status, 'downloaded', 'official becomes downloaded after import');
    assert.strictEqual(afterImport.downloadSource, 'import', 'import source labeled');
    await store.removeDownload('chaosium_the_derelict');

    const mockScenario = {
        id: 'chaosium_scritch_scratch',
        title: 'Mock Converted',
        startNode: 'n1',
        nodes: {
            n1: { narrative: 'test', choices: [{ id: 'c', label: '继续', next: 'n1' }] }
        },
        _downloadSource: 'official_pdf_converted',
        _personalUseOnly: true
    };
    window.CoCScenarioPdfImport = {
        importOfficialPdfOneClick: async (_entry, onProgress) => {
            if (onProgress) {
                onProgress('download');
                onProgress('parse');
                onProgress('convert');
                onProgress('done', { nodeCount: 1 });
            }
            return { ...mockScenario };
        }
    };
    await store.importOfficialOneClick('chaosium_scritch_scratch');
    assert(store.isAvailable('chaosium_scritch_scratch'), 'pdf converted scenario available');
    assert(store.isOfficialImported('chaosium_scritch_scratch'), 'isOfficialImported true');
    const convertedItem = store.listCatalog().find((i) => i.id === 'chaosium_scritch_scratch');
    assert.strictEqual(convertedItem.downloadSource, 'official_pdf_converted');
    assert.strictEqual(convertedItem.convertedFromPdf, true);
    assert.strictEqual(store.getScenario('chaosium_scritch_scratch').startNode, 'n1');
    await store.removeDownload('chaosium_scritch_scratch');
    assert(!store.isOfficialImported('chaosium_scritch_scratch'), 'removed converted scenario');

    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'js/data/scenarios/packages/isolated_lab.json'), 'utf8'));
    const entry = remote.get('isolated_lab');
    const fallbackUrl = entry.fallbackUrl || entry.packageUrl;

    // Same-origin bundled fallback succeeds when no public base set
    store.setPublicCatalogBase('');
    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u.includes('isolated_lab.json') || u === fallbackUrl) {
            return { ok: true, json: async () => pkg };
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const downloaded = await store.downloadScenario('isolated_lab');
    assert.strictEqual(downloaded.id, 'isolated_lab');
    assert.strictEqual(downloaded._downloadSource, 'bundled', 'same-origin bundled labeled bundled');
    assert(store.isAvailable('isolated_lab'), 'available after download');

    const listed = store.listCatalog().find((i) => i.id === 'isolated_lab');
    assert.strictEqual(listed.downloadSource, 'bundled', 'listCatalog exposes downloadSource');

    await store.removeDownload('isolated_lab');
    assert(!store.isAvailable('isolated_lab'), 'removed from local');

    // Public base succeeds first
    const hauntedPkg = JSON.parse(fs.readFileSync(path.join(root, 'js/data/scenarios/packages/haunted_inheritance.json'), 'utf8'));
    const hauntedEntry = remote.get('haunted_inheritance');
    const publicBase = 'https://static.example.test/coc-engine/';
    const publicUrl = publicBase + 'js/data/scenarios/packages/haunted_inheritance.json';
    store.setPublicCatalogBase(publicBase);

    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u === publicUrl) {
            return { ok: true, json: async () => hauntedPkg };
        }
        if (u === hauntedEntry.fallbackUrl) {
            throw new Error('should not reach fallback when public succeeds');
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const publicDl = await store.downloadScenario('haunted_inheritance');
    assert.strictEqual(publicDl.id, 'haunted_inheritance');
    assert.strictEqual(publicDl._downloadSource, 'public', 'public base used when configured');
    await store.removeDownload('haunted_inheritance');

    // Public base fail → same-origin bundled fallback succeeds
    storeCtx.fetch = async (url) => {
        const u = String(url);
        if (u === publicUrl) {
            return { ok: false, status: 503, json: async () => { throw new Error('unavailable'); } };
        }
        if (u === hauntedEntry.fallbackUrl) {
            return { ok: true, json: async () => hauntedPkg };
        }
        throw new Error('unexpected fetch: ' + url);
    };

    const fallbackDl = await store.downloadScenario('haunted_inheritance');
    assert.strictEqual(fallbackDl._downloadSource, 'bundled', 'bundled after public fail');
    await store.removeDownload('haunted_inheritance');
    store.setPublicCatalogBase('');

    console.log('Scenario store smoke: public base / bundled fallback chain OK');
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
