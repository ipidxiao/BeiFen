// GENERATED from js/components/story_clues.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

window.StoryClues = {
      data() {
          return {
              viewMode: 'cards',
              filterType: 'all',
              filterStatus: 'all',
              selectedClue: null,
              newLinkTarget: null,
              newLinkNote: '',
              addingNote: false,
              noteText: ''
          };
      },
      template: `
          <div class="d-flex flex-column h-100 clue-panel">

              <!-- Toolbar -->
              <div class="d-flex align-items-center gap-1 px-2 py-1 border-bottom border-secondary flex-shrink-0 clue-toolbar">
                  <!-- View toggle -->
                  <div class="d-flex gap-1">
                      <button class="btn btn-sm py-0 px-2 clue-btn-sm"
                          :style="viewMode==='cards' ? 'background:#1a1a3a;color:#aaaaff;border:1px solid #5a5aaa;' : 'background:#111;color:#555;border:1px solid #222;'"
                          @click="viewMode='cards'">☰ 卡片</button>
                      <button class="btn btn-sm py-0 px-2 clue-btn-sm"
                          :style="viewMode==='web' ? 'background:#1a1a3a;color:#aaaaff;border:1px solid #5a5aaa;' : 'background:#111;color:#555;border:1px solid #222;'"
                          @click="viewMode='web'">✦ 关联</button>
                  </div>
                  <span class="text-muted" style="font-size:0.65rem;">|</span>
                  <!-- Type filter -->
                  <select class="form-select form-select-sm py-0 clue-filter-select" v-model="filterType">
                      <option value="all">全部类型</option>
                      <option value="physical">物证</option>
                      <option value="testimony">证词</option>
                      <option value="document">文件</option>
                      <option value="location">地点</option>
                      <option value="event">事件</option>
                      <option value="person">人物</option>
                      <option value="supernatural">异常</option>
                  </select>
                  <!-- Status filter -->
                  <select class="form-select form-select-sm py-0 clue-filter-select" v-model="filterStatus">
                      <option value="all">全部状态</option>
                      <option value="new">新发现</option>
                      <option value="investigating">调查中</option>
                      <option value="key">关键线索</option>
                      <option value="solved">已解释</option>
                  </select>
                  <span class="badge ms-auto clue-count-badge">{{ gameState.clueBoard.clues.length }} 条线索</span>
                  <span v-if="gameState.kpEngine?.enabled" class="badge ms-1" style="background:#2a1a0a;color:#ffc107;font-size:0.65rem;">调查路径 真 {{ scenePathTrue }}/3 假 {{ scenePathFalse }}</span>
              </div>

              <!-- CARD VIEW -->
              <div v-if="viewMode==='cards'" class="flex-grow-1 overflow-auto p-2 clue-card-area">

                  <!-- Empty state -->
                  <div v-if="gameState.clueBoard.clues.length===0" class="empty-state">
                      <coc-icon name="clues" :size="40" class="empty-state-icon"></coc-icon>
                      <div class="empty-state-title">尚未发现任何线索</div>
                      <div class="empty-state-hint">调查员发现证据时，AI 会自动记录到此处</div>
                  </div>

                  <!-- Clue cards -->
                  <div v-for="clue in filteredClues" :key="clue.id" class="mb-2 p-2 rounded clue-card coc-panel-card"
                      :style="cardStyle(clue)"
                      @click="selectedClue = (selectedClue && selectedClue.id===clue.id) ? null : clue">

                      <div class="d-flex justify-content-between align-items-start mb-1">
                          <div class="d-flex align-items-center gap-1 flex-grow-1" style="min-width:0;">
                              <span class="clue-type-icon">{{ typeIcon(clue.type) }}</span>
                              <span class="fw-bold text-truncate clue-card-title" :style="'color:' + typeColor(clue.type)">{{ clue.title }}</span>
                          </div>
                          <div class="d-flex gap-1 flex-shrink-0 ms-1">
                              <span class="badge clue-status-badge" :style="statusBadgeStyle(clue.status)">{{ statusLabel(clue.status) }}</span>
                              <span class="badge clue-type-badge">{{ typeLabel(clue.type) }}</span>
                          </div>
                      </div>

                      <!-- Content excerpt when collapsed -->
                      <div v-if="selectedClue?.id !== clue.id" class="text-muted clue-excerpt">{{ clue.content }}</div>

                      <!-- Expanded detail -->
                      <div v-if="selectedClue?.id === clue.id">
                          <div class="text-light mb-2 clue-detail-content">{{ clue.content }}</div>
                          <div class="text-muted mb-1 clue-detail-meta">📍 {{ clue.location || '未知地点' }}</div>

                          <!-- Related clues -->
                          <div v-if="getRelated(clue).length > 0" class="mb-2">
                              <div class="text-muted mb-1 clue-detail-meta">关联线索：</div>
                              <div class="d-flex flex-wrap gap-1">
                                  <span v-for="rel in getRelated(clue)" :key="rel.id"
                                      class="badge clue-link-badge"
                                      @click.stop="selectedClue=rel">
                                      {{ typeIcon(rel.type) }} {{ rel.title }}
                                  </span>
                              </div>
                          </div>

                          <!-- Player note -->
                          <div v-if="clue.note" class="mb-2 p-1 rounded clue-note-box">
                              📝 {{ clue.note }}
                          </div>

                          <!-- Actions -->
                          <div class="d-flex flex-wrap gap-1 mt-2">
                              <button class="btn btn-sm py-0 px-2 clue-action-key" @click.stop="setStatus(clue,'key')">⭐ 关键</button>
                              <button class="btn btn-sm py-0 px-2 clue-action-investigate" @click.stop="setStatus(clue,'investigating')">🔎 调查中</button>
                              <button class="btn btn-sm py-0 px-2 clue-action-solved" @click.stop="setStatus(clue,'solved')">✓ 已解释</button>
                              <button class="btn btn-sm py-0 px-2 clue-action-note" @click.stop="startNote(clue)">📝 笔记</button>
                          </div>
                          <div v-if="addingNote && selectedClue?.id===clue.id" class="mt-2 d-flex gap-1">
                              <input v-model="noteText" class="form-control form-control-sm clue-note-input" placeholder="添加玩家笔记..." @keyup.enter="saveNote(clue)" />
                              <button class="btn btn-sm btn-outline-secondary py-0 px-2 clue-note-ok" @click="saveNote(clue)">✓</button>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- WEB VIEW -->
              <div v-if="viewMode==='web'" class="flex-grow-1 overflow-auto" style="position:relative;">
                  <div v-if="gameState.clueBoard.clues.length===0" class="text-center py-5 text-muted" style="font-size:0.82rem;">
                      <div style="font-size:2rem;opacity:0.25;">✦</div>
                      <div style="margin-top:8px;">尚无线索可显示</div>
                  </div>
                  <svg v-if="gameState.clueBoard.clues.length > 0" :width="webW" :height="webH" :viewBox="'0 0 '+webW+' '+webH" style="width:100%;height:auto;display:block;background:#07070e;">
                      <g v-for="(link, i) in gameState.clueBoard.links" :key="'lk'+i">
                          <line v-if="nodePos(link.from) && nodePos(link.to)"
                              :x1="nodePos(link.from).x" :y1="nodePos(link.from).y"
                              :x2="nodePos(link.to).x"   :y2="nodePos(link.to).y"
                              stroke="#2a2a5a" stroke-width="1.5" />
                          <text v-if="link.note && nodePos(link.from) && nodePos(link.to)"
                              :x="(nodePos(link.from).x+nodePos(link.to).x)/2"
                              :y="(nodePos(link.from).y+nodePos(link.to).y)/2"
                              text-anchor="middle" font-size="8" fill="#4a4a7a">{{ link.note }}</text>
                      </g>
                      <g v-for="(clue, i) in gameState.clueBoard.clues" :key="clue.id"
                          tabindex="0" role="button" :aria-label="clue.title" style="cursor:pointer;" @keydown.enter="toggleClueDetail(clue)" @keydown.space.prevent="toggleClueDetail(clue)" @click="selectedClue=(selectedClue?.id===clue.id)?null:clue">
                          <circle :cx="nodePos(clue.id).x" :cy="nodePos(clue.id).y" :r="clue.status==='key'?26:20"
                              :fill="nodeColor(clue)"
                              :stroke="selectedClue?.id===clue.id ? '#aaaaff' : (clue.status==='key' ? '#ccaa00' : '#3a3a6a')"
                              :stroke-width="clue.status==='key' ? 2.5 : 1.5" />
                          <text :x="nodePos(clue.id).x" :y="nodePos(clue.id).y-5" text-anchor="middle" font-size="11" fill="#fff">{{ typeIcon(clue.type) }}</text>
                          <text :x="nodePos(clue.id).x" :y="nodePos(clue.id).y+9" text-anchor="middle" font-size="7.5" :fill="typeColor(clue.type)"
                              style="font-family:sans-serif;">{{ clue.title.length>6 ? clue.title.slice(0,5)+'…' : clue.title }}</text>
                      </g>
                  </svg>
                  <!-- Selected clue detail overlay in web mode -->
                  <div v-if="selectedClue && viewMode==='web'" class="p-2 m-2 rounded clue-web-overlay">
                      <div class="d-flex justify-content-between mb-1">
                          <span class="fw-bold" :style="'color:'+typeColor(selectedClue.type)">{{ typeIcon(selectedClue.type) }} {{ selectedClue.title }}</span>
                          <span class="badge clue-web-title" :style="statusBadgeStyle(selectedClue.status)">{{ statusLabel(selectedClue.status) }}</span>
                      </div>
                      <div class="text-muted clue-web-content">{{ selectedClue.content }}</div>
                      <div v-if="selectedClue.note" class="mt-1 text-secondary clue-web-note">📝 {{ selectedClue.note }}</div>
                  </div>
              </div>
          </div>
      `,
      computed: {
          filteredClues() {
              return this.gameState.clueBoard.clues.filter(c =>
                  (this.filterType==='all' || c.type===this.filterType) &&
                  (this.filterStatus==='all' || c.status===this.filterStatus)
              );
          },
          webW() { return Math.max(300, Math.ceil(Math.sqrt(this.gameState.clueBoard.clues.length)) * 110 + 60); },
          webH() { return Math.max(200, Math.ceil(this.gameState.clueBoard.clues.length / Math.ceil(Math.sqrt(this.gameState.clueBoard.clues.length))) * 100 + 60); },
          scenePathTrue() { return this.gameState.kpEngine?.scenePaths?.truePathCount ?? 0; },
          scenePathFalse() { return this.gameState.kpEngine?.scenePaths?.falsePathCount ?? 0; }
      },
      methods: {
          typeIcon(t) { return {physical:'🔑',testimony:'💬',document:'📄',location:'📍',event:'⚡',person:'👤',supernatural:'🌀'}[t]||'🔍'; },
          typeLabel(t) { return {physical:'物证',testimony:'证词',document:'文件',location:'地点',event:'事件',person:'人物',supernatural:'异常'}[t]||t; },
          typeColor(t) { return {physical:'#ffcc88',testimony:'#88ffcc',document:'#88ccff',location:'#ccff88',event:'#ff88cc',person:'#ffaaff',supernatural:'#cc88ff'}[t]||'#ccc'; },
          statusLabel(s) { return {new:'新发现',investigating:'调查中',solved:'已解释',key:'关键线索'}[s]||s; },
          statusBadgeStyle(s) {
              const c = {new:'background:#0a2a0a;color:#66cc66;border:1px solid #2a6a2a;',investigating:'background:#2a2a0a;color:#cccc66;border:1px solid #6a6a2a;',key:'background:#2a1a00;color:#ffcc00;border:1px solid #8a6a00;',solved:'background:#1a1a1a;color:#666666;border:1px solid #3a3a3a;'};
              return c[s]||'background:#111;color:#888;';
          },
          cardStyle(clue) {
              const glow = clue.status==='key' ? 'box-shadow:0 0 8px #8a6a00;' : '';
              const bg = {new:'background:#0d0d18;border:1px solid #2a2a4a;',investigating:'background:#0d0d10;border:1px solid #3a3a2a;',key:'background:#100d00;border:1px solid #5a4a00;',solved:'background:#0a0a0a;border:1px solid #222;'}[clue.status]||'background:#0d0d18;border:1px solid #2a2a4a;';
              return bg + glow;
          },
          nodeColor(c) { return {new:'#141428',investigating:'#141408',key:'#1a1400',solved:'#0d0d0d'}[c.status]||'#141428'; },
          nodePos(id) {
              const clues = this.gameState.clueBoard.clues;
              const idx = clues.findIndex(c => c.id === id);
              if (idx < 0) return null;
              const cols = Math.max(1, Math.ceil(Math.sqrt(clues.length)));
              const col = idx % cols, row = Math.floor(idx / cols);
              return { x: col * 110 + 60, y: row * 100 + 60 };
          },
          getRelated(clue) {
              const linked = this.gameState.clueBoard.links
                  .filter(l => l.from===clue.id || l.to===clue.id)
                  .map(l => l.from===clue.id ? l.to : l.from);
              return this.gameState.clueBoard.clues.filter(c => linked.includes(c.id));
          },
          setStatus(clue, status) { window.CoCState.markClueStatus(clue.id, status); },
          startNote(clue) { this.addingNote=true; this.noteText=clue.note||''; },
          saveNote(clue) { window.CoCState.markClueStatus(clue.id, null, this.noteText); this.addingNote=false; }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };
