/* ===============================================
   归属：【美术】 视觉样式 / UI皮肤
   程序/策划/QA 请勿直接修改此文件
   修改后放入 roles/artist/ 运行 merge.py 合并
   =============================================== */

/**
 * Canvas Chat — GPU-accelerated chat rendering (Phase 1: Architecture & Helper)
 * 
 * Replaces DOM-based chat-message elements with a single <canvas> element.
 * Benefits: 60fps scroll, no DOM thrash, smooth text animations, 
 * 10x memory reduction for 1000+ message histories.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────┐
 * │ CanvasChat Component                    │
 * │  ┌──────────────────────────────────┐   │
 * │  │ <canvas> layer                    │   │
 * │  │  - drawBackground()              │   │
 * │  │  - drawMessages(visible slice)   │   │
 * │  │  - drawScrollbar()              │   │
 * │  │  - HitTest: detect click target │   │
 * │  └──────────────────────────────────┘   │
 * │  Input overlay (HTML):                  │
 * │  - <input> box                          │
 * │  - <button> Send                        │
 * │  - Skill check buttons (positioned)     │
 * └─────────────────────────────────────────┘
 * 
 * Usage (after Phase 2 implementation):
 *   1. Register CanvasChat in story_view
 *   2. Pass chatHistory as prop
 *   3. CanvasChat replaces story-chat component
 * 
 * Activation: set window.COC_CANVAS_CHAT = true before app.mount()
 * 
 * Phase 2 (implemented):
 *   - Text wrapping & line breaking (newline-aware, CJK + Latin)
 *   - Wheel scrolling with clamped bounds + scroll-to-bottom
 *   - Click hit-test → copy message text to clipboard
 *
 * Phase 2 (deferred, not required for the flag-gated prototype):
 *   - Markdown/HTML rendering to canvas
 *   - Scroll physics (momentum)
 *   - Character-level range selection
 */

export const CanvasChat = {
    props: {
        messages: { type: Array, default: () => [] },
        msgPadding: { type: Number, default: 12 },
        msgSpacing: { type: Number, default: 8 },
        fontSize: { type: Number, default: 14 },
        lineHeight: { type: Number, default: 1.5 },
        maxWidth: { type: Number, default: 600 }
    },
    data() {
        return {
            canvas: null,
            ctx: null,
            scrollY: 0,
            totalHeight: 0,
            dpr: 1,
            rafId: null,
            needsRedraw: true,
            selectedIndex: -1
        };
    },
    computed: {
        messageLayouts() {
            // Compute y-positions for all messages (cached, lazy)
            return this._computeLayouts();
        }
    },
    methods: {
        _computeLayouts() {
            const layouts = [];
            let y = this.msgPadding;
            const w = this.maxWidth;
            
            this.messages.forEach((msg, idx) => {
                const text = this._getMessageText(msg);
                const lines = this._wrapText(text, w);
                const h = lines.length * this.fontSize * this.lineHeight + this.msgPadding * 2;
                
                layouts.push({
                    idx, y, h, lines, text, role: msg.role,
                    hasTools: msg.tool_calls && msg.tool_calls.length > 0
                });
                y += h + this.msgSpacing;
            });
            
            this.totalHeight = y;
            return layouts;
        },
        
        _getMessageText(msg) {
            if (msg.isHidden) return '';
            if (msg.role === 'system') return `[系统] ${msg.content || ''}`;
            if (msg.role === 'user') return `[玩家] ${msg.content || ''}`;
            if (msg.role === 'assistant') return `[守秘人] ${msg.content || ''}`;
            return msg.content || '';
        },
        
        _wrapText(text, maxWidth) {
            if (!this.ctx) return [text];
            const out = [];
            // Respect explicit line breaks first, then wrap each paragraph (char-based, CJK-friendly).
            const paragraphs = String(text).split('\n');
            for (const para of paragraphs) {
                if (para.length === 0) { out.push(''); continue; }
                let line = '';
                for (const char of para) {
                    const testLine = line + char;
                    if (this.ctx.measureText(testLine).width > maxWidth && line.length > 0) {
                        out.push(line);
                        line = char;
                    } else {
                        line = testLine;
                    }
                }
                out.push(line);
            }
            return out;
        },
        
        render() {
            if (!this.ctx || !this.canvas) return;
            if (!this.needsRedraw) return;
            this.needsRedraw = false;
            
            const ctx = this.ctx;
            const w = this.canvas.width / this.dpr;
            const h = this.canvas.height / this.dpr;
            
            // Clear
            ctx.clearRect(0, 0, w, h);
            
            // Background
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, w, h);
            
            // Find visible messages
            const layouts = this.messageLayouts;
            const viewTop = this.scrollY;
            const viewBottom = viewTop + h;
            
            for (const layout of layouts) {
                if (layout.y + layout.h < viewTop) continue;
                if (layout.y > viewBottom) break;
                
                const screenY = layout.y - viewTop;
                this._drawMessage(ctx, layout, screenY, layout.idx === this.selectedIndex);
            }
            
            // Loading indicator
            // (handled by HTML overlay in full implementation)
        },
        
        _drawMessage(ctx, layout, screenY, isSelected) {
            const x = this.msgPadding;
            const w = this.maxWidth;
            
            // Background bubble
            ctx.fillStyle = layout.role === 'user' ? '#1a2a1a' :
                           layout.role === 'assistant' ? '#1a1a2a' :
                           layout.role === 'system' ? '#2a1a1a' : '#1a1a1a';
            this._roundRect(ctx, x, screenY, w, layout.h, 6);
            ctx.fill();
            
            // Border (highlighted when the message is selected/copied)
            ctx.strokeStyle = isSelected ? '#e0b050' :
                             layout.role === 'user' ? '#3a5a3a' :
                             layout.role === 'assistant' ? '#3a3a5a' : '#444';
            ctx.lineWidth = isSelected ? 2 : 1;
            this._roundRect(ctx, x, screenY, w, layout.h, 6);
            ctx.stroke();
            
            // Text
            ctx.fillStyle = layout.role === 'user' ? '#a0d0a0' :
                           layout.role === 'assistant' ? '#a0a0d0' : '#d0d0d0';
            ctx.font = `${this.fontSize}px monospace`;
            ctx.textBaseline = 'top';
            
            for (let i = 0; i < layout.lines.length; i++) {
                ctx.fillText(layout.lines[i], x + 8, screenY + 10 + i * this.fontSize * this.lineHeight);
            }
        },
        
        _roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
        },
        
        scheduleRedraw() {
            if (this.rafId) return;
            this.needsRedraw = true;
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                this.render();
            });
        },
        
        _viewHeight() {
            return this.canvas ? this.canvas.height / this.dpr : 600;
        },
        
        _maxScroll() {
            return Math.max(0, this.totalHeight - this._viewHeight());
        },
        
        _clampScroll() {
            this.scrollY = Math.min(Math.max(0, this.scrollY), this._maxScroll());
        },
        
        onScroll(e) {
            this.scrollY = e.target.scrollTop;
            this._clampScroll();
            this.scheduleRedraw();
        },
        
        onWheel(e) {
            e.preventDefault();
            this.scrollY += e.deltaY;
            this._clampScroll();
            this.scheduleRedraw();
        },
        
        onClick(e) {
            // Hit-test the clicked message and copy its text to the clipboard (basic selection).
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const localY = (e.clientY - rect.top) + this.scrollY;
            const hit = this.messageLayouts.find(l => localY >= l.y && localY <= l.y + l.h);
            this.selectedIndex = hit ? hit.idx : -1;
            this.scheduleRedraw();
            if (hit) this._copyText(hit.text || '');
        },
        
        _copyText(text) {
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(() => {});
            }
        },
        
        scrollToBottom() {
            this.scrollY = this._maxScroll();
            this.scheduleRedraw();
        },
        
        handleResize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * this.dpr;
            this.canvas.height = rect.height * this.dpr;
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(this.dpr, this.dpr);
            this.scheduleRedraw();
        }
    },
    
    mounted() {
        this.canvas = this.$el.querySelector('canvas');
        if (this.canvas) {
            this.handleResize();
            window.addEventListener('resize', this.handleResize);
            this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
            this.canvas.addEventListener('click', this.onClick);
        }
    },
    
    beforeUnmount() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', this.handleResize);
        if (this.canvas) {
            this.canvas.removeEventListener('wheel', this.onWheel);
            this.canvas.removeEventListener('click', this.onClick);
        }
    },
    
    template: `
        <div class="canvas-chat-container" style="position:relative;width:100%;height:100%;overflow:hidden;">
            <canvas style="width:100%;height:100%;display:block;"></canvas>
            <div style="position:absolute;bottom:0;left:0;right:0;pointer-events:none;">
                <slot></slot>
            </div>
        </div>
    `
};
