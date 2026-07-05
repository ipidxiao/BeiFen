#!/usr/bin/env node
/**
 * Minimal CI smoke: full test suite + browser build drift check.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(cmd, label) {
    console.log(`\n▶ ${label}`);
    execSync(cmd, { cwd: root, stdio: 'inherit' });
}

run('npm test', 'npm test (smoke suites)');
run('npm run build:js:check', 'build:js:check');
console.log('\n✓ ci_smoke passed');
