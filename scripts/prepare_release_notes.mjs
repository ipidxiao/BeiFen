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
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 30 : 30;

let cmd = `git log --oneline --no-decorate -n ${limit}`;
if (since) cmd += ` ${since}..HEAD`;

let log;
try {
    log = execSync(cmd, { encoding: 'utf8' }).trim();
} catch (err) {
    console.error('git log failed — ensure you are inside a git repository.');
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
console.log('\n### Test plan\n');
console.log('- [ ] `npm run build:js`');
console.log('- [ ] `npm test`');
console.log('- [ ] Manual smoke: lobby → combat → save/load');
