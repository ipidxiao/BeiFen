// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

import { journalIconId } from './icon_sprite.mjs';

export const StoryJournal = {
      data() { return { noteInput: '', showNoteInput: false }; },
      template: `
          <div class="d-flex flex-column h-100" style="overflow:hidden;">
              <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary" style="background:#111; flex-shrink:0;">
                  <span class="text-warning fw-bold small">📖 调查员记录本</span>
                  <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:0.75rem;" @click="showNoteInput = !showNoteInput">✏️ 记笔记</button>
                      <button class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size:0.75rem;" @click="clearLog">🗑️ 清空</button>
                  </div>
              </div>

              <!-- 添加笔记 -->
              <div v-if="showNoteInput" class="px-3 py-2 border-bottom border-secondary" style="background:#0a0a0a; flex-shrink:0;">
                  <div class="d-flex gap-2">
                      <input class="form-control form-control-sm bg-dark text-light border-secondary flex-grow-1" v-model="noteInput" placeholder="记录线索、想法、备忘…" @keyup.enter="addNote">
                      <button class="btn btn-sm btn-warning" @click="addNote" :disabled="!noteInput.trim()">记录</button>
                  </div>
              </div>

              <!-- 日志内容 -->
              <div class="flex-grow-1 overflow-auto px-2 py-2">
                  <div v-if="groupedEntries.length === 0" class="empty-state">
                      <coc-icon name="journal" :size="40" class="empty-state-icon"></coc-icon>
                      <div class="empty-state-title">尚无记录</div>
                      <div class="empty-state-hint">技能检定、伤亡、物品等事件将自动记录于此</div>
                  </div>

                  <div v-for="[date, entries] in groupedEntries" :key="date" class="mb-3">
                      <div class="text-muted fw-bold mb-2 px-1 coc-section-title" style="font-size:0.72rem; letter-spacing:0.08em; border-bottom:1px solid var(--border-dim); padding-bottom:4px;">
                          {{ date }}
                      </div>
                      <div v-for="entry in entries" :key="entry.id" class="mb-1 d-flex align-items-start gap-2 px-1 py-1 rounded" :style="getRowStyle(entry.type)">
                          <coc-icon :name="journalIconId(entry.type)" :size="16" class="flex-shrink-0 journal-type-icon" :style="'color:' + getColor(entry.type)"></coc-icon>
                          <div class="flex-grow-1" style="min-width:0;">
                              <div class="d-flex justify-content-between align-items-start gap-1" style="flex-wrap:wrap;">
                                  <span :style="'font-size:0.8rem; color:' + getColor(entry.type)">{{ entry.summary }}</span>
                                  <span v-if="entry.isSuccess === true" class="badge" style="background:#1a4a1a;color:#4caf50;font-size:0.65rem;flex-shrink:0;">成功</span>
                                  <span v-if="entry.isSuccess === false" class="badge" style="background:#4a1a1a;color:#f44336;font-size:0.65rem;flex-shrink:0;">失败</span>
                              </div>
                              <div class="d-flex gap-2 mt-1" style="font-size:0.68rem; color:#555;">
                                  <span v-if="entry.charName">{{ entry.charName }}</span>
                                  <span>{{ entry.location }}</span>
                                  <span>{{ formatTime(entry.timestamp) }}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `,
      computed: {
          groupedEntries() {
              const groups = {};
              [...this.gameState.journalLog].reverse().forEach(entry => {
                  const date = new Date(entry.timestamp).toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'short' });
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(entry);
              });
              return Object.entries(groups);
          }
      },
      methods: {
          journalIconId,
          getColor(type) {
              return { skill_check:'#c9a227', san_loss:'#9c6bb5', hp_loss:'#e53935', item_found:'#43a047', item_lost:'#888', combat:'#ef6c00', note:'#5b9bd5', heal:'#43a047', san_recover:'#43a047' }[type] || '#aaa';
          },
          getRowStyle(type) {
              const bg = { skill_check:'#1a1500', san_loss:'#140a1a', hp_loss:'#1a0a0a', item_found:'#0a1a0a', item_lost:'#111', combat:'#1a0f00', note:'#0a0f1a', heal:'#0a1a0a', san_recover:'#0a1a0a' }[type] || '#111';
              return `background:${bg};`;
          },
          formatTime(ts) {
              try { return new Date(ts).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }); } catch(e) { return ''; }
          },
          addNote() {
              if (!this.noteInput.trim()) return;
              window.CoCState.addJournalEntry({ type: 'note', summary: this.noteInput.trim() });
              this.noteInput = ''; this.showNoteInput = false;
          },
          async clearLog() {
              const ok = await window.CoCState.confirmAction('清空全部日志记录？', { title: '清空日志', danger: true });
              if (!ok) return;
              this.gameState.journalLog.splice(0);
          }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };
  
window.StoryJournal = StoryJournal;
