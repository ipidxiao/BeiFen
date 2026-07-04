// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const ViewDevLog = {
    template: `
        <div class="card card-custom p-3 shadow-sm h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-secondary btn-sm" @click="switchScreen('lobby')">⬅ 返回</button>
                    <h4 class="text-warning m-0">🛠️ 开发者日志</h4>
                </div>
                <span class="badge bg-dark border border-secondary text-muted">Version 1.6 Max</span>
            </div>

            <div class="flex-grow-1 overflow-auto pe-2" style="scrollbar-width: thin;">
                <div v-for="(log, idx) in logs" :key="idx" class="mb-4 border-start border-warning ps-3 position-relative">
                    <div class="position-absolute bg-warning" style="width: 10px; height: 10px; border-radius: 50%; left: -6px; top: 8px;"></div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="text-warning fw-bold m-0">{{ log.version }} - {{ log.title }}</h6>
                        <small class="text-muted">{{ log.date }}</small>
                    </div>
                    <ul class="list-unstyled mb-0">
                        <li v-for="(change, cIdx) in log.changes" :key="cIdx" class="small mb-1 d-flex">
                            <span class="text-warning me-2">▹</span>
                            <span class="text-light">{{ change }}</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="mt-3 p-2 bg-dark rounded border border-secondary">
                <p class="small text-muted m-0 italic">
                    * 本日志记录了 AI 在系统开发过程中的核心改进、Bug 修复及功能迭代。
                </p>
            </div>
        </div>
    `,
    setup() {
        const switchScreen = (screen) => CoCStateAccessor.switchScreen(screen);
        const logs = window.DevLogs;
        return { logs, switchScreen };
    }
};

window.ViewDevLog = ViewDevLog;
