// PDF import smoke — rule-based convert, catalog URLs, mock pipeline
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

function loadJs(relPath, window) {
    vm.runInNewContext(fs.readFileSync(path.join(root, relPath), 'utf8'), { window, module: {}, exports: {} }, { filename: relPath });
}

const window = {};
loadJs('js/data/scenarios/remote_catalog.js', window);
loadJs('js/data/scenarios/catalog.js', window);
loadJs('js/scenario/pdf_import.js', window);

const pdfImport = window.CoCScenarioPdfImport;
assert(pdfImport, 'CoCScenarioPdfImport loaded');
assert(typeof pdfImport.convertPdfToScenario === 'function', 'convertPdfToScenario');
assert(typeof pdfImport.extractTextFromPdf === 'function', 'extractTextFromPdf');

const fixtureText = [
    'Introduction',
    'The investigators arrive at the dock in thick fog.',
    '',
    'Scene 1 — The Pier',
    'A Spot Hidden roll may reveal fresh blood on the mooring rope.',
    '',
    'Chapter 2 — The Warehouse',
    'Listen for movement behind the crates. DEX roll to dodge falling debris.',
    '',
    'Part 3 — Confrontation',
    'Psychology may calm the witness before the creature strikes.'
].join('\n');

const converted = pdfImport.convertPdfToScenario({
    text: fixtureText,
    title: 'Mock Official',
    id: 'mock_official_pdf',
    sourceUrl: 'https://example.test/mock'
});

assert.strictEqual(converted.id, 'mock_official_pdf');
assert(converted.startNode, 'has startNode');
assert(converted.nodes[converted.startNode], 'startNode exists in nodes');
assert(Object.keys(converted.nodes).length >= 3, 'rule-based produces >= 3 nodes');
assert.strictEqual(converted._personalUseOnly, true);
assert.strictEqual(converted._downloadSource, 'official_pdf_converted');

const v = window.CoCScenarioCatalog.validate(converted);
assert(v.ok, `converted scenario valid: ${(v.errors || []).join(', ')}`);

const remote = window.CoCScenarioRemoteCatalog;
const official = remote.entries.filter((e) => e.category === 'officialChaosium');
assert(official.length >= 5, 'at least 5 official entries');

for (const entry of official) {
    assert(entry.officialDownloadUrl && entry.officialDownloadUrl.includes('/download_url'), `${entry.id} officialDownloadUrl`);
    assert(Number(entry.officialUploadId) > 0, `${entry.id} officialUploadId`);
    assert.strictEqual(entry.importType, 'official_pdf', `${entry.id} importType`);
    assert.strictEqual(entry.convertToScenario, true, `${entry.id} convertToScenario`);
}

// Mock extractTextFromPdf via pdfjsLib stub
window.pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument: () => ({
        promise: Promise.resolve({
            numPages: 1,
            getPage: async () => ({
                getTextContent: async () => ({ items: [{ str: 'Scene 1\nTest narrative body.' }] })
            })
        })
    })
};

pdfImport.extractTextFromPdf(new ArrayBuffer(8)).then((text) => {
    assert(/Scene 1/.test(text), 'extractTextFromPdf returns text');
    assert(/Page 1/.test(text), 'extractTextFromPdf paginated');
    console.log('PDF import smoke: convert + catalog URLs + extract mock OK');
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
