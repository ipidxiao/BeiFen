#!/usr/bin/env node
/**
 * Minimal CI smoke: full test suite + browser build drift check.
 * Uses node/spawnSync directly (no nested npm) for reliable exit codes on Windows CI/agents.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const node = process.execPath;

function runNode(relArgs, label) {
    console.log(`\n▶ ${label}`);
    const args = relArgs.map((a) => (path.isAbsolute(a) ? a : path.join(root, a)));
    const result = spawnSync(node, args, { cwd: root, stdio: 'inherit' });
    const code = result.status;
    if (code !== 0) {
        const err = new Error(`${label} failed`);
        err.status = code ?? 1;
        throw err;
    }
}

function selfCheck() {
    const required = [
        'tests/run_all_smoke.js',
        'scripts/build_browser.mjs',
        'scripts/verify_browser_exports.mjs',
        'scripts/verify_sw_cache.mjs',
    ];
    for (const rel of required) {
        const full = path.join(root, rel);
        if (!fs.existsSync(full)) {
            console.error(`ci_smoke self-check: missing ${rel}`);
            process.exit(1);
        }
    }
    console.log('ci_smoke self-check: OK');
    process.exit(0);
}

if (process.argv.includes('--self-check')) {
    selfCheck();
}

try {
    runNode(['tests/run_all_smoke.js'], 'tests/run_all_smoke.js (smoke suites)');
    runNode(['scripts/build_browser.mjs', '--check'], 'build_browser --check');
    runNode(['scripts/verify_sw_cache.mjs'], 'verify_sw_cache (CACHE_NAME consistency)');
    runNode(['scripts/verify_browser_exports.mjs'], 'verify_browser_exports');
    console.log('\n✓ ci_smoke passed');
    process.exit(0);
} catch (err) {
    const code = typeof err.status === 'number' ? err.status : 1;
    console.error(`\n✗ ci_smoke failed (exit ${code})`);
    process.exit(code || 1);
}