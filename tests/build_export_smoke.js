// Build export smoke — delegates to scripts/verify_browser_exports.mjs
const { execSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, '..', 'scripts', 'verify_browser_exports.mjs');
try {
    const out = execSync(`node "${script}"`, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    console.log(out.trim());
} catch (e) {
    console.error((e.stdout || '') + (e.stderr || ''));
    process.exit(e.status || 1);
}
