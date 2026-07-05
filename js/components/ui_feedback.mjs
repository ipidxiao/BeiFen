// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

import { toastTitle as toastTitleHelper } from './chat_format_helpers.mjs';

export const CocToastLayer = {
    props: ['toasts'],
    template: `
        <div class="coc-toast-layer" aria-live="polite" aria-atomic="true">
            <div v-for="toast in (toasts || [])" :key="toast.id" class="coc-toast" :class="'coc-toast-' + (toast.type || 'info')">
                <div class="coc-toast-title">{{ toast.title || toastTitle(toast.type) }}</div>
                <div class="coc-toast-body">{{ toast.message }}</div>
            </div>
        </div>
    `,
    methods: {
        toastTitle(type) {
            return toastTitleHelper(type);
        }
    }
};

window.CocConfirmDialog = {
    props: ['dialog'],
    template: `
        <div v-if="dialog" class="modal-overlay coc-confirm-overlay">
            <div class="modal-content-custom coc-confirm-box">
                <h5 class="text-warning mb-2">{{ dialog.title || '确认操作' }}</h5>
                <div class="text-light mb-3" style="white-space:pre-wrap;">{{ dialog.message }}</div>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-outline-secondary" @click="resolve(false)">{{ dialog.cancelText || '取消' }}</button>
                    <button class="btn btn-warning fw-bold" @click="resolve(true)">{{ dialog.okText || '确认' }}</button>
                </div>
            </div>
        </div>
    `,
    methods: {
        resolve(ok) {
            const state = CoCStateAccessor.getState();
            if (state && state.resolveConfirm) state.resolveConfirm(ok);
        }
    }
};

window.CocToastLayer = CocToastLayer;
