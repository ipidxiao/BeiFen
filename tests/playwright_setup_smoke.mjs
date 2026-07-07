/**
 * Playwright setup smoke — validates OPT-034 config without requiring @playwright/test installed.
 */
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assert(fs.existsSync(path.join(root, 'playwright.config.mjs')), 'playwright.config.mjs exists');
assert(fs.existsSync(path.join(root, 'tests/playwright/lobby_load.spec.js')), 'lobby_load spec exists');
assert(fs.existsSync(path.join(root, 'tests/playwright/README.md')), 'playwright README exists');

const cfg = fs.readFileSync(path.join(root, 'playwright.config.mjs'), 'utf8');
assert(cfg.includes('webServer'), 'playwright config defines webServer');

console.log('playwright_setup_smoke: Playwright scaffold OK (run npx playwright test when deps installed)');
