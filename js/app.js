// GENERATED from js/app.mjs — do not edit; run: npm run build:js
// Browser bootstrap — globals are set by prior <script> tags in index.html
const { createApp } = window.Vue;

const app = createApp({
    setup() {
        const state = window.CoCState || { gameState: { currentScreen: 'lobby' } };
        const ai = window.CoCAI || {};
        return { ...state, ...ai };
    }
});

if (window.ViewLobby) app.component('view-lobby', window.ViewLobby);
else throw new Error("找不到大厅视图！");
if (window.ViewCreator) app.component('view-creator', window.ViewCreator);
else throw new Error("找不到车卡视图！");
if (window.ViewStory) app.component('view-story', window.ViewStory);
else throw new Error("找不到剧情视图！");
if (window.ViewDevLog) app.component('view-dev-log', window.ViewDevLog);
else throw new Error("找不到开发日志视图！");
if (window.CocToastLayer) app.component('coc-toast-layer', window.CocToastLayer);
else throw new Error("找不到 Toast 组件！");
if (window.CocConfirmDialog) app.component('coc-confirm-dialog', window.CocConfirmDialog);
else throw new Error("找不到确认对话框组件！");
if (window.CocSaveLoadingOverlay) app.component('coc-save-loading-overlay', window.CocSaveLoadingOverlay);
if (window.CocIcon) app.component('coc-icon', window.CocIcon);
else throw new Error("找不到图标组件！");

if (!window.__COC_ESM_BOOT__) app.mount('#app');
