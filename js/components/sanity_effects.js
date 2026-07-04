// V18.1: 使用 CoCStateAccessor
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * SAN 视觉反馈组件 — 理智下降的沉浸式屏幕特效
 * 使用 Composition API (setup) 保持与其他组件一致
 */
window.SanityEffects = {
    template: '<div id="san-overlay" :class="overlayClass"></div>',

    setup() {
        const { ref, computed, watch, onMounted, onBeforeUnmount } = window.Vue;
        const gameState = CoCStateAccessor.getGameState();

        const lastSan = ref(null);
        const shockTimer = ref(null);
        const interval = ref(null);

        const activeChar = computed(() => {
            const roster = gameState ? gameState.roster : [];
            const active = roster.filter(r => r.isActive);
            return active[0] || null;
        });

        const currentSan = computed(() => {
            const ch = activeChar.value;
            if (!ch) return 0;
            return (ch.derived && typeof ch.derived.sanity === 'number')
                ? ch.derived.sanity : (ch.sanity || 0);
        });

        const maxSan = computed(() => {
            const ch = activeChar.value;
            if (!ch) return 99;
            return (ch.derived && ch.derived.maxSan) || (ch.attrs && ch.attrs.POW) || 99;
        });

        const sanRatio = computed(() => maxSan.value > 0 ? currentSan.value / maxSan.value : 1);

        const isInsane = computed(() => {
            const ch = activeChar.value;
            if (!ch || !ch.insanity) return false;
            return ch.insanity.tempInsane || ch.insanity.indefInsane;
        });

        const overlayClass = computed(() => {
            if (isInsane.value) return 'madness-border';
            if (sanRatio.value < 0.2) return 'critical-san';
            if (sanRatio.value < 0.4) return 'very-low-san';
            if (sanRatio.value < 0.6) return 'low-san';
            return '';
        });

        const triggerShock = () => {
            const app = document.getElementById('app');
            if (!app) return;
            app.classList.remove('san-shock', 'san-shake');
            void app.offsetWidth;
            app.classList.add('san-shock', 'san-shake');
            clearTimeout(shockTimer.value);
            shockTimer.value = setTimeout(() => {
                app.classList.remove('san-shock', 'san-shake');
            }, 700);
        };

        watch(currentSan, (newVal, oldVal) => {
            if (oldVal != null && newVal < oldVal && (oldVal - newVal) >= 3) {
                triggerShock();
            }
        });

        watch(isInsane, (val) => {
            if (val) {
                const app = document.getElementById('app');
                if (app && !app.classList.contains('san-pulse')) {
                    app.classList.add('san-pulse');
                }
            }
        });

        onMounted(() => {
            interval.value = setInterval(() => {
                const ch = activeChar.value;
                if (ch && lastSan.value == null) {
                    lastSan.value = (ch.derived && typeof ch.derived.sanity === 'number')
                        ? ch.derived.sanity : (ch.sanity || 0);
                }
            }, 1000);
        });

        onBeforeUnmount(() => {
            if (interval.value) clearInterval(interval.value);
            const app = document.getElementById('app');
            if (app) app.classList.remove('san-pulse', 'san-shock', 'san-shake');
        });

        return { overlayClass };
    }
};
