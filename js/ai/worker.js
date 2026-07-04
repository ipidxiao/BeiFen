// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * AI Worker — handles HTTP fetch and retry logic off the main thread.
 * 
 * Receives { type:'fetch', url, options, timeout, maxAttempts }
 * Returns { type:'response', data, attempts } or { type:'error', message, attempts }
 */
const AI_REQUEST_TIMEOUT_MS = 45000;
const AI_REQUEST_MAX_ATTEMPTS = 3;

// Exponential backoff
const getBackoffMs = (attempt) => Math.min(1000 * Math.pow(2, attempt - 1), 8000);

async function fetchWithRetry(url, options, timeoutMs, maxAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const signal = controller ? controller.signal : null;
        
        const timer = controller 
            ? setTimeout(() => controller.abort(), timeoutMs)
            : null;
        
        try {
            const mergedOptions = { ...options };
            if (signal) mergedOptions.signal = signal;
            
            const response = await fetch(url, mergedOptions);
            if (timer) clearTimeout(timer);
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
            }
            
            const data = await response.json();
            return { success: true, data, attempts: attempt };
            
        } catch (err) {
            if (timer) clearTimeout(timer);
            lastError = err;
            
            // Don't retry on 4xx errors (except 429)
            if (err.message && /HTTP (4\d\d)/.test(err.message) && !err.message.includes('429')) {
                break;
            }
            
            if (attempt < maxAttempts) {
                const delay = getBackoffMs(attempt);
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                // Notify main thread of retry
                self.postMessage({ 
                    type: 'retry', 
                    attempt, 
                    maxAttempts,
                    delayMs: delay,
                    error: err.message || String(err)
                });
            }
        }
    }
    
    return { 
        success: false, 
        error: lastError?.message || '未知网络错误',
        attempts: maxAttempts
    };
}

self.onmessage = async (event) => {
    const { type, id, url, options, timeoutMs, maxAttempts } = event.data;
    
    if (type !== 'fetch') {
        self.postMessage({ type: 'error', id, message: 'Unknown message type: ' + type });
        return;
    }
    
    const result = await fetchWithRetry(
        url, 
        options, 
        timeoutMs || AI_REQUEST_TIMEOUT_MS,
        maxAttempts || AI_REQUEST_MAX_ATTEMPTS
    );
    
    self.postMessage({ ...result, id });
};
