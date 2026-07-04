// GENERATED from js/components/story_npc.mjs — do not edit; run: npm run build:js
window.StoryNpc = {
      data() { return { viewMode: 'cards', filterStatus: 'all', selectedNpc: null, noteInput: '', addingNote: false }; },
      template: `
          <div class="d-flex flex-column h-100" style="overflow:hidden;">
              <!-- Toolbar -->
              <div class="d-flex align-items-center gap-2 px-2 py-2 border-bottom border-secondary" style="background:#111; flex-shrink:0; flex-wrap:wrap;">
                  <span class="text-warning fw-bold small flex-shrink-0">🕵️ NPC 关系网络</span>
                  <div class="d-flex gap-1 ms-auto">
                      <button class="btn btn-sm py-0 px-2" :class="viewMode==='cards'?'btn-secondary':'btn-outline-secondary'" style="font-size:0.75rem;" @click="viewMode='cards'">☰ 卡片</button>
                      <button class="btn btn-sm py-0 px-2" :class="viewMode==='map'?'btn-secondary':'btn-outline-secondary'" style="font-size:0.75rem;" @click="viewMode='map'">✦ 星图</button>
                  </div>
                  <select class="form-select form-select-sm bg-dark text-light border-secondary" style="width:auto;font-size:0.75rem;" v-model="filterStatus">
                      <option value="all">全部</option>
                      <option value="alive">存活</option>
                      <option value="dead">死亡</option>
                      <option value="missing">失踪</option>
                      <option value="insane">疯狂</option>
                  </select>
              </div>

              <!-- Empty state -->
              <div v-if="gameState.npcRegistry.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-secondary py-5">
                  <div style="font-size:2.5rem;">🌑</div>
                  <div class="mt-2 npc-name">尚未记录任何 NPC</div>
                  <div class="mt-1 text-center px-4 npc-desc">AI 守秘人会在 NPC 出场时自动调用工具，在此记录。</div>
              </div>

              <!-- Card view -->
              <div v-else-if="viewMode === 'cards'" class="flex-grow-1 overflow-auto p-2">
                  <div class="row g-2">
                      <div v-for="npc in filteredNpcs" :key="npc.id" class="col-6">
                          <div class="p-2 rounded h-100" :style="'background:#111; border:1px solid ' + relationColor(npc.relation) + '44; cursor:pointer;'" @click="selectNpc(npc)">
                              <div class="d-flex justify-content-between align-items-start mb-1">
                                  <span class="fw-bold text-light" style="font-size:0.82rem; line-height:1.2;">{{ npc.name }}</span>
                                  <span class="badge ms-1 flex-shrink-0" :style="'background:' + statusBg(npc.status) + '; color:' + statusColor(npc.status) + '; font-size:0.6rem;'">{{ statusLabel(npc.status) }}</span>
                              </div>
                              <div class="badge mb-1" :style="'background:' + relationColor(npc.relation) + '22; color:' + relationColor(npc.relation) + '; font-size:0.62rem; border:1px solid ' + relationColor(npc.relation) + '55;'">{{ npc.relation }}</div>
                              <div class="text-muted npc-desc" style="font-size:0.72rem; line-height:1.3;">{{ npc.description || "暂无描述" }}></div>
                              <div v-if="npc.notes.length" class="mt-1 text-muted npc-meta">📝 {{ npc.notes.length }} 条笔记</div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Constellation / Map view -->
              <div v-else-if="viewMode === 'map'" class="flex-grow-1 overflow-auto d-flex align-items-center justify-content-center" style="background:#0a0a12;">
                  <svg :width="mapW" :height="mapH" :viewBox="'0 0 ' + mapW + ' ' + mapH" style="max-width:100%; max-height:100%;">
                      <!-- Rings -->
                      <circle v-for="r in [85,130,170]" :key="r" :cx="cx" :cy="cy" :r="r" fill="none" stroke="#222" stroke-width="1" stroke-dasharray="4,6"/>
                      <!-- Connecting lines -->
                      <line v-for="npc in npcPositions" :key="'line-'+npc.id"
                          :x1="cx" :y1="cy" :x2="npc.x" :y2="npc.y"
                          :stroke="relationColor(npc.relation)" stroke-width="1" :stroke-opacity="npc.status==='dead'?0.15:0.35" stroke-dasharray="3,5"/>
                      <!-- Center node: investigator team -->
                      <circle :cx="cx" :cy="cy" r="28" :fill="'#1a1400'" stroke="#ffc107" stroke-width="2"/>
                      <text :x="cx" :y="cy-6" text-anchor="middle" fill="#ffc107" font-size="14">👥</text>
                      <text :x="cx" :y="cy+10" text-anchor="middle" fill="#ffc107" font-size="8">调查员</text>
                      <!-- NPC nodes -->
                      <g v-for="npc in npcPositions" :key="'node-'+npc.id" @click="selectNpc(npc)" style="cursor:pointer;">
                          <circle :cx="npc.x" :cy="npc.y" r="22" :fill="statusBg(npc.status)" :stroke="relationColor(npc.relation)" stroke-width="1.5" :opacity="npc.status==='dead'?0.45:1"/>
                          <text :x="npc.x" :y="npc.y-4" text-anchor="middle" :fill="statusColor(npc.status)" font-size="8" font-weight="bold">{{ npc.name.substring(0,5) }}</text>
                          <text :x="npc.x" :y="npc.y+8" text-anchor="middle" :fill="statusColor(npc.status)" font-size="7" opacity="0.8">{{ statusLabel(npc.status) }}</text>
                      </g>
                      <!-- Legend -->
                      <g transform="translate(4, 4)">
                          <text y="10" fill="#555" font-size="7">——盟友 ——线索 ——可疑 ——敌对</text>
                      </g>
                  </svg>
              </div>

              <!-- NPC Detail Panel -->
              <transition name="slide-up">
              <div v-if="selectedNpc" class="border-top border-secondary p-3" style="background:#0d0d0d; max-height:55%; overflow-y:auto; flex-shrink:0;">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                          <span class="fw-bold text-warning" style="font-size:0.95rem;">{{ selectedNpc.name }}</span>
                          <span class="badge ms-2" :style="'background:' + statusBg(selectedNpc.status) + '; color:' + statusColor(selectedNpc.status)">{{ statusLabel(selectedNpc.status) }}</span>
                      </div>
                      <button class="btn btn-sm btn-outline-secondary py-0 px-1" @click="selectedNpc=null">✕</button>
                  </div>
                  <div class="badge mb-2" :style="'background:' + relationColor(selectedNpc.relation) + '22; color:' + relationColor(selectedNpc.relation) + '; border:1px solid ' + relationColor(selectedNpc.relation) + '55;'">{{ selectedNpc.relation }}</div>
                  <div v-if="selectedNpc.description" class="text-light mb-2 npc-desc" style="font-size:0.8rem;">{{ selectedNpc.description }}></div>
                  <div class="text-muted mb-2 npc-desc">初遇地点：{{ selectedNpc.firstSeen }}</div>
                  <!-- Status change buttons -->
                  <div class="d-flex gap-1 mb-2 flex-wrap">
                      <button v-for="s in ['alive','dead','missing','insane']" :key="s" class="btn btn-sm py-0 px-2" :class="selectedNpc.status===s?'btn-secondary':'btn-outline-secondary'" @click="changeStatus(selectedNpc,s)">{{ statusLabel(s) }}</button>
                  </div>
                  <!-- Notes -->
                  <div v-if="selectedNpc.notes.length" class="mb-2">
                      <div v-for="(note,i) in selectedNpc.notes" :key="i" class="text-muted mb-1" style="font-size:0.75rem; border-left:2px solid #444; padding-left:6px;">{{ note.text }}</div>
                  </div>
                  <!-- Add note -->
                  <div class="d-flex gap-2 mt-2">
                      <input class="form-control form-control-sm bg-dark text-light border-secondary flex-grow-1" v-model="noteInput" placeholder="添加笔记…" @keyup.enter="addNote" style="font-size:0.8rem;">
                      <button class="btn btn-sm btn-warning py-0 px-2" @click="addNote" :disabled="!noteInput.trim()">记录</button>
                  </div>
              </div>
              </transition>
          </div>
      `,
      computed: {
          filteredNpcs() {
              const npcs = this.gameState.npcRegistry;
              if (this.filterStatus === 'all') return npcs;
              return npcs.filter(n => n.status === this.filterStatus);
          },
          cx() { return 200; },
          cy() { return 200; },
          mapW() { return 400; },
          mapH() { return 400; },
          npcPositions() {
              const cx = this.cx, cy = this.cy;
              const RADII = { '盟友': 85, '线索来源': 105, '中立': 130, '可疑': 150, '敌对': 168, '未知': 115 };
              const byRelation = {};
              this.gameState.npcRegistry.forEach(npc => {
                  const k = npc.relation;
                  if (!byRelation[k]) byRelation[k] = [];
                  byRelation[k].push(npc);
              });
              const result = [];
              Object.entries(byRelation).forEach(([rel, npcs]) => {
                  const r = RADII[rel] || 130;
                  npcs.forEach((npc, i) => {
                      const angle = (i / npcs.length) * 2 * Math.PI - Math.PI / 2 + (Object.keys(byRelation).indexOf(rel) * 0.4);
                      result.push({ ...npc, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
                  });
              });
              return result;
          }
      },
      methods: {
          selectNpc(npc) { this.selectedNpc = this.gameState.npcRegistry.find(n => n.id === npc.id) || npc; this.noteInput = ''; },
          statusLabel(s) { return { alive:'存活', dead:'死亡', missing:'失踪', insane:'疯狂', unknown:'未知' }[s] || s; },
          statusBg(s)    { return { alive:'#0a1a0a', dead:'#2a0a0a', missing:'#1a1000', insane:'#1a0a2a', unknown:'#111' }[s] || '#111'; },
          statusColor(s) { return { alive:'#4caf50', dead:'#f44336', missing:'#ff9800', insane:'#9c27b0', unknown:'#607d8b' }[s] || '#aaa'; },
          relationColor(r) { return { '盟友':'#4caf50','线索来源':'#2196f3','中立':'#9e9e9e','可疑':'#ff9800','敌对':'#f44336','未知':'#607d8b' }[r] || '#555'; },
          changeStatus(npc, newStatus) {
              window.CoCState.updateNpcStatus(npc.name, newStatus, null);
          },
          addNote() {
              if (!this.noteInput.trim() || !this.selectedNpc) return;
              window.CoCState.addNpcNote(this.selectedNpc.id, this.noteInput.trim());
              this.noteInput = '';
          }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };
