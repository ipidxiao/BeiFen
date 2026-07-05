import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const icons = fs.readFileSync(path.join(root, 'css/icons.svg'), 'utf8')
    .replace(
        '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
        '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" id="coc-icon-sprite" style="position:absolute;width:0;height:0;overflow:hidden">'
    );
const appBlock = `    <div id="app" class="container-fluid p-3">
        <view-lobby v-if="['lobby', 'settings', 'character', 'saves', 'modules', 'scenarios', 'scenario_store'].includes(gameState?.currentScreen)"></view-lobby>
        <view-creator v-if="gameState?.currentScreen === 'creator'"></view-creator>
        <view-story v-if="gameState?.currentScreen === 'story' || gameState?.activeModal"></view-story>
        <view-dev-log v-if="gameState?.currentScreen === 'devlog'"></view-dev-log>
        <coc-toast-layer :toasts="gameState?.ui?.toasts"></coc-toast-layer>
        <coc-confirm-dialog :dialog="gameState?.ui?.confirmDialog"></coc-confirm-dialog>
    </div>`;
const broken = /    <!-- Inline icon sprite[\s\S]*?    <\/div>\r?\n\r?\n    <!-- @generated/;
if (!broken.test(html)) {
    console.error('pattern not found');
    process.exit(1);
}
html = html.replace(
    broken,
    `    <!-- Inline icon sprite — same-document #icon-* refs work on file:// and offline -->\n${icons}\n\n${appBlock}\n\n    <!-- @generated`
);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html inline sprite injected');
