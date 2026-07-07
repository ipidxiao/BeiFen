// GENERATED from js/components/story_store.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/** OPT-030 pilot: prefer injected stateApi / CoCStateAccessor over window.CoCState. */
function resolveStateApi(props) {
    if (props && props.stateApi) return props.stateApi;
    if (typeof window !== 'undefined' && window.CoCStateAccessor) return window.CoCStateAccessor;
    if (typeof window !== 'undefined' && window.CoCState) return window.CoCState;
    return null;
}

window.StoryStore = {
    props: {
        stateApi: { type: Object, default: null },
    },
    template: `
        <div class="flex-grow-1 overflow-auto p-3 bg-dark">
            <h5 class="text-center mb-3" style="color:#c0a060;">📦 安全屋仓库</h5>
            <ul class="list-group">
                <li v-if="gameState.storage.length === 0" class="list-group-item bg-dark text-muted text-center border-secondary">仓库里没存东西</li>
                <li v-for="(item, idx) in gameState.storage" :key="idx" class="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center">
                    <span style="color:#cccccc;">{{ item }}</span>
                    <button class="btn btn-sm btn-outline-success" @click="moveToInventory(item, idx)">取出</button>
                </li>
            </ul>
        </div>
    `,
    setup(props) {
        const api = resolveStateApi(props);
        const gameState = api && typeof api.getGameState === 'function' ? api.getGameState() : api.gameState;
        const moveToInventory = (item, idx) => { gameState.inventory.push(item); gameState.storage.splice(idx, 1); };
        return { moveToInventory, gameState };
    }
};
