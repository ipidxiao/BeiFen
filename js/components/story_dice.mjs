// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const StoryDice = {
      data() {
          return {
              customNotation: '',
              customLabel: '',
              diceCount: 1,
              lastRollEntry: null,
              animating: false,
              pushSkill: '',
              pushReason: '',
              pushResult: null
          };
      },
      template: `
          <div class="dice-panel">

              <!-- Header -->
              <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom dice-header">
                  <span class="text-info fw-bold">🎲 骰子台</span>
                  <button class="btn btn-sm py-0 px-2 dice-close-btn" @click="closeModal()">✕</button>
              </div>

              <!-- Quick Dice Buttons -->
              <div class="px-3 pt-2 pb-1">
                  <div class="text-muted mb-1 dice-label-sm">快速骰子</div>
                  <div class="d-flex align-items-center gap-1 mb-2">
                      <button class="btn btn-sm py-0 px-1 flex-shrink-0 dice-count-btn" @click="diceCount=Math.max(1,diceCount-1)">−</button>
                      <span class="text-center text-warning fw-bold dice-count-num">{{ diceCount }}</span>
                      <button class="btn btn-sm py-0 px-1 flex-shrink-0 dice-count-btn" @click="diceCount=Math.min(10,diceCount+1)">+</button>
                      <span class="text-muted dice-count-sep">×</span>
                      <div class="d-flex flex-wrap gap-1 flex-grow-1">
                          <button v-for="sides in [4,6,8,10,12,20,100]" :key="sides"
                              class="btn btn-sm py-0 px-2 fw-bold dice-quick-btn"
                              :aria-label="'掷 d' + sides" @click="quickRoll(sides)">d{{ sides }}</button>
                      </div>
                  </div>
              </div>

              <!-- Last Roll Result -->
              <div v-if="lastRollEntry" class="mx-3 mb-2 p-2 rounded dice-result-panel" :class="animating?'dice-pulse':''">
                  <div class="text-muted mb-1 dice-result-label">{{ lastRollEntry.label }}</div>
                  <!-- Dice faces for d6 -->
                  <div v-if="lastRollEntry.sides===6" class="d-flex justify-content-center gap-1 mb-1">
                      <span v-for="(v,i) in lastRollEntry.kept" :key="i"
                          style="font-size:2rem;line-height:1;">{{ ['⚀','⚁','⚂','⚃','⚄','⚅'][v-1] }}</span>
                  </div>
                  <!-- Other dice: show boxes -->
                  <div v-else class="d-flex justify-content-center flex-wrap gap-1 mb-1">
                      <div v-for="(v,i) in lastRollEntry.kept" :key="i"
                          class="d-flex align-items-center justify-content-center fw-bold dice-face-box">{{ v }}</div>
                  </div>
                  <!-- Dropped dice (grayed) -->
                  <div v-if="lastRollEntry.rolls.length > lastRollEntry.kept.length" class="d-flex justify-content-center gap-1 mb-1">
                      <div v-for="(v,i) in droppedDice" :key="'d'+i"
                          class="d-flex align-items-center justify-content-center dice-dropped-box">{{ v }}</div>
                  </div>
                  <!-- Total -->
                  <div class="dice-total">
                      {{ lastRollEntry.total }}
                      <span v-if="lastRollEntry.mod" class="dice-mod">
                          ({{ lastRollEntry.kept.reduce((s,r)=>s+r,0) }} {{ lastRollEntry.mod>0?'+':'' }}{{ lastRollEntry.mod }})
                      </span>
                  </div>
                  <div class="text-muted mt-1 dice-notation">{{ lastRollEntry.notation }}</div>
              </div>

              <!-- Group roll result -->
              <div v-if="lastRollEntry && lastRollEntry.isGroup" class="mx-3 mb-2 p-2 rounded dice-result-panel">
                  <div class="text-muted mb-1 dice-result-label">群体·{{ lastRollEntry.label }}</div>
                  <div v-for="r in lastRollEntry.groupResults" :key="r.name" class="d-flex justify-content-between py-0" style="font-size:0.75rem;">
                      <span class="text-light">{{ r.name }}</span>
                      <span :class="r.level.includes('成功')?'text-success':r.level.includes('失败')?'text-danger':'text-warning'">
                          {{ r.roll }}/{{ r.skillVal }} → {{ r.level }}
                      </span>
                  </div>
              </div>

              <!-- Custom Notation -->
              <div class="px-3 pb-2 border-top border-secondary pt-2">
                  <div class="text-muted mb-1 dice-label-sm">自定义表示法（如 2d6+3、3d10k2）</div>
                  <div class="d-flex gap-1">
                      <input v-model="customNotation" class="form-control form-control-sm dice-input" placeholder="2d6+3"
                          @keyup.enter="customRoll()" />
                      <input v-model="customLabel" class="form-control form-control-sm dice-input dice-input-label" placeholder="名称"
                          @keyup.enter="customRoll()" />
                      <button class="btn btn-sm px-2 dice-roll-btn" @click="customRoll()">掷</button>
                  </div>
                  <div class="text-muted mt-1" style="font-size:0.62rem;">kN=取最高N个　lN=取最低N个</div>
              </div>

              <!-- Push Roll Section -->
              <div class="border-top border-secondary pt-2 px-3 pb-2">
                  <div class="text-muted mb-1 dice-label-sm">推动检定（失败后可用）</div>
                  <div class="d-flex gap-1">
                      <input v-model="pushSkill" class="form-control form-control-sm dice-input" placeholder="技能名" />
                      <input v-model="pushReason" class="form-control form-control-sm dice-input dice-input-label" placeholder="推动理由" />
                      <button class="btn btn-sm px-2" style="background:#2a0000;border:1px solid #6a0000;color:#ff8888;" @click="doPush()">⚡推动</button>
                  </div>
                  <div v-if="pushResult" class="mt-1" :class="pushResult.success ? 'text-success' : 'text-danger'" style="font-size:0.72rem;">
                      {{ pushResult.msg }}
                  </div>
              </div>

              <!-- Dice History -->
              <div class="border-top border-secondary dice-history-area">
                  <div class="px-3 py-1 text-muted dice-history-header">掷骰记录</div>
                  <div v-if="gameState.diceHistory.length===0" class="px-3 pb-2 text-muted" style="font-size:0.75rem;">暂无记录</div>
                  <div v-for="entry in gameState.diceHistory.slice(0,15)" :key="entry.id"
                      class="px-3 py-1 d-flex justify-content-between align-items-center dice-history-item"
                      @click="lastRollEntry=entry">
                      <span class="text-muted text-truncate dice-history-name">{{ entry.label }}</span>
                      <span class="d-flex align-items-center gap-2">
                          <span class="dice-history-notation">{{ entry.notation }}</span>
                          <span class="fw-bold" :style="entry.total>=entry.sides?'color:#ffcc44;':entry.total<=entry.count?'color:#ff6666;':'color:#aaaaff;'">
                              {{ entry.isGroup ? '群' : entry.total }}
                          </span>
                      </span>
                  </div>
              </div>
          </div>
      `,
      computed: {
          droppedDice() {
              if (!this.lastRollEntry) return [];
              const kept = [...this.lastRollEntry.kept];
              const all = [...this.lastRollEntry.rolls];
              kept.forEach(v => { const i = all.indexOf(v); if(i>=0) all.splice(i,1,null); });
              return all.filter(v => v !== null);
          }
      },
      methods: {
          doPush() {
              if (!this.pushSkill.trim()) return;
              const active = this.gameState.roster.filter(r => r.isActive);
              if (!active.length) { this.pushResult = { success: false, msg: '没有活跃调查员' }; return; }
              const ch = active[0];
              const result = window.CoCEngine.executePushedRoll(this.pushSkill.trim(), ch);
              if (result.success) {
                  this.pushResult = { success: true, msg: '推动成功！' + result.rolledValue + '/' + result.targetValue + ' → ' + result.level };
                  if (ch.skills) ch.skills[this.pushSkill.trim()] = result.skillValue;
              } else {
                  this.pushResult = { success: false, msg: result.level === '大失败' ? '推动大失败！后果严重！' : '推动失败 (' + result.rolledValue + '/' + result.targetValue + ')' };
              }
              setTimeout(() => { this.pushResult = null; }, 5000);
          },
          quickRoll(sides) {
              const notation = `${this.diceCount}d${sides}`;
              const entry = window.CoCState.rollCustomDice(notation, `${this.diceCount}d${sides}`, '玩家');
              if (entry) { this.lastRollEntry = entry; this.flash(); }
          },
          customRoll() {
              if (!this.customNotation.trim()) return;
              const entry = window.CoCState.rollCustomDice(this.customNotation.trim(), this.customLabel||this.customNotation.trim(), '玩家');
              if (!entry) { CoCStateAccessor.showToast('无效的骰子表示法，请使用如 2d6+3 的格式', 'warning'); return; }
              this.lastRollEntry = entry; this.flash();
          },
          flash() { this.animating=true; setTimeout(()=>this.animating=false, 400); }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };

window.StoryDice = StoryDice;
