// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * AI Worker Client — bridges main thread to the AI Worker.
 * 
 * Falls back to synchronous fetch if Worker is unavailable.
 */
window.CoCAIWorker = (function() {
    let worker = null;
    let pendingId = 0;
    const pending = new Map();

    const init = () => {
        if (worker) return;
        try {
            worker = new Worker('./js/ai/worker.js');
            worker.onmessage = (event) => {
                const { id, ...result } = event.data;
                const resolver = pending.get(id);
                if (resolver) {
                    pending.delete(id);
                    resolver(result);
                }
            };
            worker.onerror = (err) => {
                CoCLog.warn('AI Worker error, falling back to sync:', err.message);
                worker = null;
                // Resolve all pending with fallback signal
                for (const [id, resolver] of pending) {
                    pending.delete(id);
                    resolver({ _fallback: true });
                }
            };
            CoCLog.info('AI Worker initialized');
        } catch (e) {
            CoCLog.warn('Web Workers not available, using sync fetch');
            worker = null;
        }
    };

    /**
     * Fetch AI completion via Worker (or fallback sync).
     * Returns a Promise that resolves to { response, attempts } or throws.
     */
    const fetchAi = (url, options, timeoutMs, maxAttempts, onRetry) => {
        if (!worker) {
            // Fallback: use the sync network module
            return window.fetchAiCompletionWithRetry(url, options, timeoutMs, maxAttempts, onRetry);
        }

        return new Promise((resolve, reject) => {
            const id = ++pendingId;
            pending.set(id, (result) => {
                if (result._fallback) {
                    // Worker died, fallback
                    window.fetchAiCompletionWithRetry(url, options, timeoutMs, maxAttempts, onRetry)
                        .then(resolve).catch(reject);
                    return;
                }
                if (result.success) {
                    // Reconstruct response-like object
                    const mockResponse = {
                        json: async () => result.data,
                        status: 200,
                        ok: true
                    };
                    resolve({ response: mockResponse, attempts: result.attempts });
                } else {
                    const err = new Error(result.error || 'AI request failed');
                    err.attempts = result.attempts;
                    reject(err);
                }
            });

            worker.postMessage({ type: 'fetch', id, url, options, timeoutMs, maxAttempts });

            // Handle retry notifications
            const retryHandler = (event) => {
                if (event.data.type === 'retry' && event.data.id === id && onRetry) {
                    onRetry(
                        new Error(event.data.error),
                        event.data.attempt + 1,
                        maxAttempts,
                        event.data.delayMs
                    );
                }
            };
            worker.addEventListener('message', retryHandler, { once: false });
        });
    };

    return { init, fetchAi };
})();
