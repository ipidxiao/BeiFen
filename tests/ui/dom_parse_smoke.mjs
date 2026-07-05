// Minimal jsdom smoke — justifies devDependency; one real DOM parse assertion
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><div id="app" class="story-panel">CoC</div>', {
    url: 'http://localhost:8080/',
});
const el = dom.window.document.getElementById('app');
assert(el, 'jsdom parses element by id');
assert.strictEqual(el.textContent, 'CoC', 'jsdom textContent');
assert(el.classList.contains('story-panel'), 'jsdom classList');

console.log('dom_parse_smoke: jsdom DOM parse OK');
