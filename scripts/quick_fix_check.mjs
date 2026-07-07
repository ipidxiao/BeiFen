#!/usr/bin/env node
/**
 * Hotfix fast path (<30s): char_creator smoke + build drift check.
 * Use during Tier-2 API-limit fallback; still run full ci:smoke before push.
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

const required = ['tests/char_creator_flow_smoke.js', 'scripts/build_browser.mjs'];
for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) {
        console.error(`quick_fix_check: missing ${rel}`);
        process.exit(1);
    }
}

try {
    runNode(['tests/char_creator_flow_smoke.js'], 'char_creator_flow_smoke');
    runNode(['scripts/build_browser.mjs', '--check'], 'build_browser --check');
    console.log('\n✓ quick_fix_check passed');
    process.exit(0);
} catch (err) {
    const code = typeof err.status === 'number' ? err.status : 1;
    console.error(`\n✗ quick_fix_check failed (exit ${code})`);
    process.exit(code || 1);
}
