/**
 * Dice Canvas — 骰子物理动画 (V16.5 P2-2)
 * Canvas-based dice tumbling animation with 3D-like cube rendering.
 */
window.DiceAnim = (function() {
    const COLORS = {
        bg: '#0d0d22', face: '#1a1a3a', faceActive: '#2a2a5a',
        pip: '#ccccff', pipHighlight: '#ffcc44', border: '#5a5aaa', glow: 'rgba(90,90,170,0.3)'
    };
    class DiceAnimator {
        constructor(canvas) {
            this.canvas = canvas; this.ctx = canvas.getContext('2d');
            this.dice = []; this.phase = 'idle'; this.startTime = 0;
            this.duration = 800; this.tumbleDuration = 500; this.rafId = null;
            this.onDone = null; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        }
        roll(count, sides, finalValues, callback) {
            this.dice = []; this.phase = 'tumbling'; this.startTime = performance.now();
            this.onDone = callback; this.finalValues = finalValues || [];
            for (let i = 0; i < count; i++) {
                this.dice.push({
                    x: 0, y: 0, vx: (Math.random() - 0.5) * 8, vy: -8 - Math.random() * 12,
                    rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.3,
                    scale: 0.3 + Math.random() * 0.5,
                    finalValue: this.finalValues[i] || Math.floor(Math.random() * sides) + 1,
                    currentValue: Math.floor(Math.random() * sides) + 1, sides: sides, opacity: 1
                });
            }
            this._layout(); this._animate();
        }
        _layout() {
            const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
            const count = this.dice.length;
            const dieSize = Math.min(40, (w - 40) / Math.max(count, 1));
            this.dice.forEach((d, i) => {
                d.baseX = w / 2 - ((count - 1) * (dieSize + 12)) / 2 + i * (dieSize + 12);
                d.baseY = h / 2; d.dieSize = dieSize; d.x = d.baseX; d.y = d.baseY;
            });
        }
        _animate() {
            if (this.phase === 'done') return;
            const now = performance.now(), elapsed = now - this.startTime;
            if (!this._lastTime) this._lastTime = elapsed;
            const dt = Math.min((elapsed - this._lastTime) / 1000, 0.05);
            this._lastTime = elapsed;
            if (elapsed > this.tumbleDuration && this.phase === 'tumbling') {
                this.phase = 'landing';
                this.dice.forEach(d => { d.vx *= 0.3; d.vy = 2; d.rotSpeed *= 0.5; });
            }
            if (elapsed > this.duration) { this.phase = 'done'; this._drawFinal(); if (this.onDone) this.onDone(); this._spawnParticles(20); return; }
            if (this.phase === 'tumbling') {
                const p = elapsed / this.tumbleDuration;
                this.dice.forEach(d => {
                    d.vy += 0.5; d.y += d.vy; d.x += d.vx; d.rotation += d.rotSpeed;
                    d.scale = 0.3 + Math.sin(p * Math.PI) * 0.7;
                    if (d.y > d.baseY + 30) { d.y = d.baseY + 30; d.vy *= -0.5; }
                    if (d.y < d.baseY - 40) { d.y = d.baseY - 40; d.vy *= -0.3; }
                    if (Math.random() < 0.3) d.currentValue = Math.floor(Math.random() * d.sides) + 1;
                });
            } else if (this.phase === 'landing') {
                const lp = (elapsed - this.tumbleDuration) / (this.duration - this.tumbleDuration);
                this.dice.forEach(d => {
                    d.vy += 0.3; d.y += d.vy; d.x += d.vx; d.rotation += d.rotSpeed * (1 - lp);
                    d.y += (d.baseY - d.y) * 0.2; d.x += (d.baseX - d.x) * 0.2;
                    d.vy *= 0.8; d.vx *= 0.8; d.scale = 1;
                    if (lp > 0.6 && Math.random() < 0.5) d.currentValue = d.finalValue;
                    if (lp > 0.9) d.currentValue = d.finalValue;
                });
            }
            this._draw();
            this.rafId = requestAnimationFrame(() => this._animate());
        }
        _draw() {
            const ctx = this.ctx, w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
            ctx.save(); ctx.scale(this.dpr, this.dpr);
            ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
            this.dice.forEach(d => this._drawDie(ctx, d));
            ctx.restore();
        }
        _drawDie(ctx, d) {
            const s = d.dieSize * d.scale;
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rotation);
            ctx.shadowColor = COLORS.glow; ctx.shadowBlur = 8;
            const r = s * 0.12;
            ctx.beginPath();
            ctx.moveTo(-s/2+r,-s/2); ctx.lineTo(s/2-r,-s/2); ctx.arcTo(s/2,-s/2,s/2,-s/2+r,r);
            ctx.lineTo(s/2,s/2-r); ctx.arcTo(s/2,s/2,s/2-r,s/2,r);
            ctx.lineTo(-s/2+r,s/2); ctx.arcTo(-s/2,s/2,-s/2,s/2-r,r);
            ctx.lineTo(-s/2,-s/2+r); ctx.arcTo(-s/2,-s/2,-s/2+r,-s/2,r);
            ctx.closePath();
            const grad = ctx.createLinearGradient(-s/2,-s/2,s/2,s/2);
            grad.addColorStop(0, COLORS.faceActive); grad.addColorStop(1, COLORS.face);
            ctx.fillStyle = grad; ctx.fill();
            ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.pipHighlight;
            ctx.font = 'bold ' + (s * 0.5) + 'px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(d.currentValue, 0, 1);
            ctx.restore();
        }
        _spawnParticles(count) {
            if (!this.particles) this.particles = [];
            const w = this.canvas.width / this.dpr;
            const h = this.canvas.height / this.dpr;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                this.particles.push({
                    x: w / 2, y: h / 2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 1,
                    decay: 0.015 + Math.random() * 0.03,
                    size: 2 + Math.random() * 3,
                    color: Math.random() < 0.5 ? '#ffcc44' : '#c864ff'
                });
            }
            if (!this._particleRunning) {
                this._particleRunning = true;
                this._animateParticles();
            }
        }
        _animateParticles() {
            if (!this.particles || this.particles.length === 0) {
                this._particleRunning = false;
                return;
            }
            const ctx = this.ctx;
            const w = this.canvas.width / this.dpr;
            const h = this.canvas.height / this.dpr;
            // Don't clear — particles overlay existing content
            ctx.save();
            ctx.scale(this.dpr, this.dpr);
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= p.decay;
                if (p.life <= 0) return false;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                return true;
            });
            ctx.restore();
            if (this.particles.length > 0) {
                requestAnimationFrame(() => this._animateParticles());
            } else {
                this._particleRunning = false;
            }
        }
        _drawFinal() {
            const ctx = this.ctx, w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
            ctx.save(); ctx.scale(this.dpr, this.dpr);
            ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
            this.dice.forEach(d => { d.scale = 1; d.rotation = 0; d.x = d.baseX; d.y = d.baseY; this._drawDie(ctx, d); });
            ctx.fillStyle = 'rgba(255,204,68,0.15)'; ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
        resize() {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * this.dpr; this.canvas.height = rect.height * this.dpr;
            if (this.dice.length > 0) this._layout();
            if (this.phase !== 'idle') this._draw();
        }
        destroy() { if (this.rafId) cancelAnimationFrame(this.rafId); this.phase = 'done'; }
    }
    return { DiceAnimator };
})();
