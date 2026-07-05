// Scenario catalog + store smoke — ≥10 built-in, parse OK, store API surface
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

const BUILTIN_FILES = [
    ['js/data/scenarios/tutorial.js', 'CoCScenarioTutorial', 'tutorial'],
    ['js/data/scenarios/deep_one_shadow.js', 'CoCScenarioDeepOneShadow', 'deep_one_shadow'],
    ['js/data/scenarios/abandoned_asylum.js', 'CoCScenarioAbandonedAsylum', 'abandoned_asylum'],
    ['js/data/scenarios/midnight_museum.js', 'CoCScenarioMidnightMuseum', 'midnight_museum'],
    ['js/data/scenarios/coastal_festival.js', 'CoCScenarioCoastalFestival', 'coastal_festival'],
    ['js/data/scenarios/university_occult.js', 'CoCScenarioUniversityOccult', 'university_occult'],
    ['js/data/scenarios/lighthouse_signal.js', 'CoCScenarioLighthouseSignal', 'lighthouse_signal'],
    ['js/data/scenarios/missing_child.js', 'CoCScenarioMissingChild', 'missing_child'],
    ['js/data/scenarios/train_to_nowhere.js', 'CoCScenarioTrainToNowhere', 'train_to_nowhere'],
    ['js/data/scenarios/carnival_of_masks.js', 'CoCScenarioCarnivalOfMasks', 'carnival_of_masks']
];

function loadScenarioFile(relPath, exportName) {
    const filePath = path.join(root, relPath);
    assert(fs.existsSync(filePath), `scenario file exists: ${relPath}`);
    const src = fs.readFileSync(filePath, 'utf8');
    const ctx = { window: {}, module: {}, exports: {} };
    vm.runInNewContext(src, ctx, { filename: filePath });
    const obj = ctx.window[exportName];
    assert(obj && typeof obj === 'object', `${exportName} exported on window`);
    return obj;
}

const loaded = {};
for (const [file, exportName, id] of BUILTIN_FILES) {
    const sc = loadScenarioFile(file, exportName);
    assert.strictEqual(sc.id, id, `${id} id matches`);
    assert(sc.nodes[sc.startNode], `${id} startNode reachable`);
    assert(sc.author, `${id} has author metadata`);
    assert(sc.license, `${id} has license metadata`);
    assert(Array.isArray(sc.tags) && sc.tags.length, `${id} has tags`);
    loaded[exportName] = sc;
}

const catalogSrc = fs.readFileSync(path.join(root, 'js/data/scenarios/catalog.js'), 'utf8');
const catalogCtx = { window: { ...loaded } };
vm.runInNewContext(catalogSrc, catalogCtx, { filename: 'catalog.js' });
const catalog = catalogCtx.window.CoCScenarioCatalog;
assert(catalog && typeof catalog.list === 'function', 'CoCScenarioCatalog loaded');
assert(catalog.list().length >= 10, 'catalog lists at least 10 scenarios');

for (const sc of catalog.list()) {
    const full = catalog.get(sc.id);
    const v = catalog.validate(full);
    assert(v.ok, `validate ${sc.id}: ${(v.errors || []).join(', ')}`);
}

const remoteSrc = fs.readFileSync(path.join(root, 'js/data/scenarios/remote_catalog.js'), 'utf8');
const remoteCtx = { window: {} };
vm.runInNewContext(remoteSrc, remoteCtx, { filename: 'remote_catalog.js' });
const remote = remoteCtx.window.CoCScenarioRemoteCatalog;
assert(remote && remote.entries.length >= 5, 'remote catalog has downloadable entries');

const redistributable = remote.entries.filter((e) => !(e.category === 'officialChaosium' || e.importOnly === true));
const official = remote.entries.filter((e) => e.category === 'officialChaosium' || e.importOnly === true);
assert(redistributable.length >= 5, 'at least 5 redistributable remote entries');
assert(official.length >= 5, 'at least 5 official link-only entries');

for (const entry of redistributable) {
    const pkgRel = (entry.fallbackUrl || entry.packageUrl).replace('./', '');
    const pkgPath = path.join(root, pkgRel.replace(/\//g, path.sep));
    assert(fs.existsSync(pkgPath), `package exists: ${entry.fallbackUrl || entry.packageUrl}`);
    assert(entry.fallbackUrl || entry.packageUrl, `${entry.id} has fallbackUrl`);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const v = catalog.validate(pkg);
    assert(v.ok, `validate package ${entry.id}: ${(v.errors || []).join(', ')}`);
}

for (const entry of official) {
    assert(entry.officialUrl, `${entry.id} has officialUrl`);
    assert(entry.redistributable === false, `${entry.id} not redistributable`);
    if (entry.importType === 'official_pdf') {
        assert(entry.officialDownloadUrl, `${entry.id} has officialDownloadUrl`);
        assert(entry.officialUploadId, `${entry.id} has officialUploadId`);
    }
    assert(!fs.existsSync(path.join(root, 'js/data/scenarios/packages', `${entry.id}.json`)), `${entry.id} no local package`);
}

const storePath = path.join(root, 'js/scenario/store.js');
assert(fs.existsSync(storePath), 'store.js generated');
const storeSrc = fs.readFileSync(storePath, 'utf8');
assert(storeSrc.includes('listCatalog'), 'store exports listCatalog');
assert(storeSrc.includes('downloadScenario'), 'store exports downloadScenario');

const runnerPath = path.join(root, 'js/scenario/runner.js');
assert(fs.existsSync(runnerPath), 'runner.js generated');
assert(fs.readFileSync(runnerPath, 'utf8').includes('CoCScenarioRunner'), 'runner exports CoCScenarioRunner');

console.log(`Scenario smoke: ${catalog.list().length} built-in + ${redistributable.length} redistributable + ${official.length} official link-only; store API OK`);
