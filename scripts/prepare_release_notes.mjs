#!/usr/bin/env node
/**
 * prepare_release_notes.mjs — Summarize git log for manual release notes / PR body.
 * No gh CLI required; paste output into GitHub web UI when remote is configured.
 *
 * Usage:
 *   node scripts/prepare_release_notes.mjs
 *   node scripts/prepare_release_notes.mjs --since v18.0.0
 *   node scripts/prepare_release_notes.mjs --limit 20
 */
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const limitIdx = args.indexOf('--limit');
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
const limitRaw = limitIdx >= 0 ? args[limitIdx + 1] : null;
const limit = limitRaw !== null && limitRaw !== undefined ? Number(limitRaw) : 30;

let cmd = 'git log --oneline --no-decorate';
if (Number.isFinite(limit) && limit > 0) cmd += ` -n ${limit}`;
if (since) {
    try {
        execSync(`git rev-parse --verify ${since}^{commit}`, { encoding: 'utf8', stdio: 'pipe' });
        cmd += ` ${since}..HEAD`;
    } catch (_) {
        cmd += ` --since=${since}`;
    }
}

let log;
try {
    log = execSync(cmd, { encoding: 'utf8' }).trim();
} catch (err) {
    console.error('git log failed — ensure you are inside a git repository.');
    if (since) console.error(`Hint: --since "${since}" must be a valid ref or ISO date.`);
    process.exit(1);
}

const lines = log ? log.split('\n') : [];
console.log('## Release notes (draft)\n');
console.log('### Commits\n');
if (lines.length === 0) {
    console.log('_No commits in range._');
} else {
    for (const line of lines) console.log(`- ${line}`);
}
console.log('\n### Known limitations (intentional design)\n');
console.log('- **Combat action menu** is guidance only — not enforced each round (offline quick commands / online free-form dialogue).');
console.log('- **KP protocol engine** defaults on; London rules are a global bottom-layer protocol (user can disable in lobby).');
console.log('- Full draft: docs/RELEASE_NOTES_DRAFT.md\n');
console.log('### Test plan\n');
console.log('- [ ] `python build.py` (not manual .js edits — SW CACHE_NAME must update)');
console.log('- [ ] `npm run build:js`');
console.log('- [ ] `npm test` + `npm run ci:smoke`');
console.log('- [ ] Manual: keyboard Tab · narrow viewport · offline refresh · PWA add-to-home');
