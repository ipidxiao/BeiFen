// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const StoryGrowth = {
      data() {
          return {
              rollResults: {},   // { charName_skillName: {roll, gained, oldVal, newVal, success} }
              eduResults: {},    // { charName: {...} }
              agingResults: {}   // { charName: {...} }
          };
      },
      template: `
          <div class="d-flex flex-column h-100 overflow-auto growth-panel" style="padding:10px; gap:10px;">

              <!-- Header -->
              <div class="p-2 rounded text-center" style="background:#0d1a0d; border:1px solid #2a4a2a;">
                  <div class="text-success fw-bold">📈 角色成长</div>
                  <div class="text-muted" style="font-size:0.72rem;">本章节中成功使用的技能可进行提升检定（D100 > 当前技能值即可提升）</div>
              </div>

              <!-- No characters -->
              <div v-if="activeChars.length === 0" class="text-center text-muted py-4" style="font-size:0.85rem;">无在场调查员</div>

              <!-- Each character -->
              <div v-for="char in activeChars" :key="char.name" class="rounded p-2 bg-surface-detail" style="border:1px solid var(--purple-border);">

                  <!-- Char header -->
                  <div class="d-flex justify-content-between align-items-center mb-2">
                      <div>
                          <span class="text-info fw-bold" style="font-size:0.9rem;">{{ char.name }}</span>
                          <span class="badge bg-secondary ms-1" style="font-size:0.65rem;">{{ char.age || 25 }}岁</span>
                          <span class="badge ms-1" style="font-size:0.65rem; background:#1a2a1a; color:#88bb88;">{{ (char.skillsUsedThisSession || []).length }} 项可提升</span>
                      </div>
                      <button v-if="(char.skillsUsedThisSession || []).length > 0" class="btn btn-sm py-0 px-2" style="font-size:0.72rem; background:#1a3a1a; border:1px solid #2a5a2a; color:#aaffaa;" @click="rollAll(char)">一键全检定</button>
                  </div>

                  <!-- Eligible skills -->
                  <div v-if="(char.skillsUsedThisSession || []).length > 0" class="mb-2">
                      <div class="text-muted mb-1" style="font-size:0.7rem; letter-spacing:.04em;">可提升技能</div>
                      <div class="d-flex flex-wrap gap-1">
                          <div v-for="entry in char.skillsUsedThisSession" :key="entry.name"
                               class="p-1 px-2 rounded d-flex align-items-center gap-1"
                               style="background:#141428; border:1px solid #3a3a6a; font-size:0.75rem;">
                              <span class="text-light">{{ entry.name }}</span>
                              <span class="badge" style="background:#2a2a4a; color:#aaaaff; font-size:0.6rem;">{{ entry.currentValue }}</span>
                              <button class="btn btn-sm py-0 px-1" style="font-size:0.65rem; background:#2a2a6a; border:1px solid #5a5aaa; color:#ccccff; line-height:1.4;"
                                  @click="doRoll(char, entry)">骰</button>
                              <!-- Roll result inline -->
                              <span v-if="rollResults[char.name + '_' + entry.name]" :class="rollResults[char.name+'_'+entry.name].success ? 'text-success' : 'text-muted'" style="font-size:0.65rem;">
                                  {{ rollResults[char.name+'_'+entry.name].success
                                      ? '↑' + rollResults[char.name+'_'+entry.name].gained + ' (' + rollResults[char.name+'_'+entry.name].roll + ')'
                                      : '✗ (' + rollResults[char.name+'_'+entry.name].roll + ')' }}
                              </span>
                          </div>
                      </div>
                  </div>
                  <div v-else class="text-muted mb-2" style="font-size:0.75rem;">本章节无技能成功记录 — 通过技能检定成功可积累成长机会</div>

                  <!-- Completed rolls this session (ghost chips) -->
                  <div v-if="getCompletedRolls(char).length > 0" class="mb-2">
                      <div class="text-muted mb-1" style="font-size:0.7rem;">已检定</div>
                      <div class="d-flex flex-wrap gap-1">
                          <div v-for="r in getCompletedRolls(char)" :key="r.skill"
                               class="px-2 rounded" style="font-size:0.68rem; background:#0a0a0a; border:1px solid #222; color:#555;">
                              {{ r.skill }}
                              <span :class="r.gained > 0 ? 'text-success' : 'text-muted'" style="font-size:0.65rem;">
                                  {{ r.gained > 0 ? '+' + r.gained : '—' }}
                              </span>
                          </div>
                      </div>
                  </div>

                  <!-- EDU + Aging section -->
                  <div class="d-flex gap-2 pt-2 border-top border-secondary">
                      <!-- EDU improvement -->
                      <div class="flex-grow-1 p-2 rounded text-center" style="background:#110d0d; border:1px solid #3a2a2a;">
                          <div class="text-warning fw-bold" style="font-size:0.75rem;">EDU 成长检定</div>
                          <div class="text-muted" style="font-size:0.65rem;">需骰出 > {{ (char.attrs?.EDU || 0) * 5 }}</div>
                          <button v-if="!eduResults[char.name]" class="btn btn-sm mt-1 py-0 px-2" style="font-size:0.72rem; background:#2a1a00; border:1px solid #6a4a00; color:#ffcc66;" @click="doEdu(char)">检定</button>
                          <div v-else class="mt-1" :class="eduResults[char.name].success ? 'text-success' : 'text-muted'" style="font-size:0.72rem;">
                              骰出{{ eduResults[char.name].roll }}
                              {{ eduResults[char.name].success ? '→ EDU +' + eduResults[char.name].gained : '→ 无变化' }}
                          </div>
                      </div>
                      <!-- Aging -->
                      <div class="flex-grow-1 p-2 rounded text-center" style="background:#110a0a; border:1px solid #3a1a1a;">
                          <div class="text-danger fw-bold" style="font-size:0.75rem;">年龄增长</div>
                          <div class="text-muted" style="font-size:0.65rem;">当前 {{ char.age || 25 }} 岁</div>
                          <button v-if="!agingResults[char.name]" class="btn btn-sm mt-1 py-0 px-2" style="font-size:0.72rem; background:#1a0000; border:1px solid #4a0000; color:#ff8888;" @click="doAging(char)">+1年</button>
                          <div v-else class="mt-1 text-danger" style="font-size:0.68rem;">
                              {{ char.age }}岁
                              <span v-if="agingResults[char.name].effects && agingResults[char.name].effects.length > 0"><br>{{ agingResults[char.name].effects.join(' ') }}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Bottom: clear session -->
              <div class="text-center pt-1 pb-3">
                  <button class="btn btn-sm btn-outline-secondary" style="font-size:0.72rem;" @click="clearAll()">清除本章节成长记录（开始新章节）</button>
              </div>
          </div>
      `,
      computed: {
          activeChars() { return this.gameState.roster.filter(c => c.isActive); }
      },
      methods: {
          doRoll(char, entry) {
              const key = char.name + '_' + entry.name;
              const result = window.CoCState.rollImprovement(char.name, entry.name);
              if (result) this.rollResults[key] = result;
          },
          doEdu(char) {
              const result = window.CoCState.rollEduImprovement(char.name);
              if (result) this.eduResults[char.name] = result;
          },
          doAging(char) {
              const result = window.CoCState.applyAging(char.name);
              if (result) this.agingResults[char.name] = result;
          },
          rollAll(char) {
              const skills = [...(char.skillsUsedThisSession || [])];
              skills.forEach(entry => this.doRoll(char, entry));
          },
          getCompletedRolls(char) {
              return Object.entries(this.rollResults)
                  .filter(([k]) => k.startsWith(char.name + '_'))
                  .map(([k, v]) => ({ skill: k.slice(char.name.length + 1), gained: v.gained }));
          },
          async clearAll() {
              const ok = await window.CoCState.confirmAction('确认清除本章节成长记录？这将重置所有调查员的技能成长积累。', { title: '清除成长记录', danger: true });
              if (!ok) return;
              window.CoCState.clearSessionSkills();
              this.rollResults = {};
              this.eduResults = {};
              this.agingResults = {};
          }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };
  
window.StoryGrowth = StoryGrowth;
