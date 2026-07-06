// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const StoryMap = {
      data() { return { selectedRoom: null, mapTab: 'scene' }; },
      template: `
          <div class="coc-panel-card story-map-panel">

              <!-- Header -->
              <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary">
                  <div>
                      <span class="text-info fw-bold">🗺️ {{ gameState.sceneMap.title || '已知地点' }}</span>
                      <span v-if="gameState.sceneMap.rooms.length" class="badge bg-secondary ms-1" style="font-size:0.65rem;">{{ gameState.sceneMap.rooms.length }} 个区域</span>
                  </div>
                  <div class="d-flex gap-1">
                      <button class="btn btn-sm py-0 px-2" v-if="gameState.sceneMap.rooms.length"
                          :style="mapTab==='scene' ? 'background:#1a2a4a;color:#88aaff;border:1px solid #4a6aaa;' : 'background:#111;color:#666;border:1px solid #333;'"
                          style="font-size:0.7rem;" @click="mapTab='scene'">场景图</button>
                      <button class="btn btn-sm py-0 px-2"
                          :style="mapTab==='locations' ? 'background:#1a2a4a;color:#88aaff;border:1px solid #4a6aaa;' : 'background:#111;color:#666;border:1px solid #333;'"
                          style="font-size:0.7rem;" @click="mapTab='locations'">地点列表</button>
                      <button class="btn btn-sm py-0 px-2" style="background:#1a0a0a;color:#aa4444;border:1px solid #4a2a2a;font-size:0.7rem;" @click="closeModal()">✕</button>
                  </div>
              </div>

              <!-- Scene SVG Map tab -->
              <div v-if="mapTab === 'scene' && gameState.sceneMap.rooms.length > 0" class="p-2">
                  <svg :width="svgW" :height="svgH" :viewBox="'0 0 ' + svgW + ' ' + svgH" class="bg-surface-map" style="width:100%; height:auto; display:block; border-radius:6px; border:1px solid var(--purple-border);">
                      <!-- Connection lines -->
                      <line v-for="(line, i) in connectionLines" :key="'l'+i"
                          :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
                          stroke="#2a2a4a" stroke-width="2" />
                      <!-- Room rects -->
                      <g v-for="room in gameState.sceneMap.rooms" :key="room.id"
                          tabindex="0" role="button" :aria-label="room.name" style="cursor:pointer;" @keydown.enter="toggleRoomDetail(room)" @keydown.space.prevent="toggleRoomDetail(room)" @click="toggleRoomDetail(room)">
                          <rect :x="roomX(room)" :y="roomY(room)" :width="RW" :height="RH" rx="4"
                              :fill="roomFill(room)" :stroke="room===selectedRoom ? '#88aaff' : roomStroke(room)" stroke-width="1.5"/>
                          <!-- Status icon -->
                          <text :x="roomX(room)+9" :y="roomY(room)+13" font-size="10" fill="#aaa">{{ roomIcon(room) }}</text>
                          <!-- Room name (clip to width) -->
                          <text :x="roomX(room)+RW/2" :y="roomY(room)+RH/2+2"
                              text-anchor="middle" dominant-baseline="middle"
                              font-size="10" :fill="roomTextColor(room)"
                              style="pointer-events:none; font-family:sans-serif;">
                              {{ room.name.length > 8 ? room.name.slice(0,7)+'…' : room.name }}
                          </text>
                          <!-- Current position dot -->
                          <circle v-if="room.status==='current'" :cx="roomX(room)+RW-8" :cy="roomY(room)+8" r="4" fill="#ffcc44" />
                      </g>
                  </svg>

                  <!-- Legend -->
                  <div class="d-flex flex-wrap gap-2 mt-2 px-1" style="font-size:0.65rem; color:#777;">
                      <span>⬤ <span style="color:#ffcc44;">当前位置</span></span>
                      <span style="color:#4a8a4a;">■ 已探索</span>
                      <span style="color:#8a4a4a;">■ 危险</span>
                      <span style="color:#4a4a6a;">■ 上锁</span>
                      <span style="color:#333;">■ 未探索</span>
                  </div>

                  <!-- Selected room detail -->
                  <div v-if="selectedRoom" class="mt-2 p-2 rounded bg-surface-detail" style="border:1px solid var(--purple-border-light); font-size:0.8rem;">
                      <div class="d-flex justify-content-between align-items-start">
                          <span class="text-info fw-bold">{{ roomIcon(selectedRoom) }} {{ selectedRoom.name }}</span>
                          <span class="badge" :style="'background:' + roomFill(selectedRoom) + ';border:1px solid ' + roomStroke(selectedRoom)" style="font-size:0.62rem; color:#eee;">{{ statusLabel(selectedRoom.status) }}</span>
                      </div>
                      <div v-if="selectedRoom.note" class="text-muted mt-1" style="font-size:0.75rem;">{{ selectedRoom.note }}</div>
                      <div v-if="selectedRoom.connections && selectedRoom.connections.length" class="mt-1 text-muted" style="font-size:0.7rem;">
                          通往：{{ selectedRoom.connections.map(id => roomName(id)).join('、') }}
                      </div>
                      <button v-if="selectedRoom.status !== 'current'" class="btn btn-sm mt-2 py-0 px-2" style="font-size:0.72rem; background:#1a1a3a; border:1px solid #4a4a8a; color:#aaaaff;" @click="goToRoom(selectedRoom)">🚶 前往此处</button>
                  </div>
              </div>

              <!-- Empty state: no map yet -->
              <div v-if="mapTab === 'scene' && gameState.sceneMap.rooms.length === 0" class="empty-state p-4">
                  <coc-icon name="eye" :size="40" class="empty-state-icon"></coc-icon>
                  <div class="empty-state-title">地图尚未绘制</div>
                  <div class="empty-state-hint">探索新区域后，守秘人将逐步更新场景图</div>
              </div>

              <!-- Locations list tab -->
              <div v-if="mapTab === 'locations'" class="p-3">
                  <div class="text-muted mb-2" style="font-size:0.75rem;">快速前往已知地点</div>
                  <div v-if="gameState.knownLocations.length === 0" class="text-muted" style="font-size:0.8rem;">暂无已知地点</div>
                  <div class="d-grid gap-2">
                      <button v-for="loc in gameState.knownLocations" :key="loc"
                          class="btn btn-outline-info text-start" style="font-size:0.82rem;"
                          @click="moveToLocation(loc)">🚶 前往：{{ loc }}</button>
                  </div>
              </div>
          </div>
      `,
      computed: {
          RW() { return 72; },
          RH() { return 38; },
          svgW() { 
              if (!this.gameState.sceneMap.rooms.length) return 300;
              return Math.max(...this.gameState.sceneMap.rooms.map(r => r.x)) * 90 + this.RW + 20;
          },
          svgH() {
              if (!this.gameState.sceneMap.rooms.length) return 200;
              return Math.max(...this.gameState.sceneMap.rooms.map(r => r.y)) * 60 + this.RH + 20;
          },
          connectionLines() {
              const lines = [];
              const rooms = this.gameState.sceneMap.rooms;
              rooms.forEach(r => {
                  (r.connections || []).forEach(targetId => {
                      const target = rooms.find(t => t.id === targetId);
                      if (target && r.id < targetId) {
                          lines.push({
                              x1: this.roomX(r) + this.RW/2, y1: this.roomY(r) + this.RH/2,
                              x2: this.roomX(target) + this.RW/2, y2: this.roomY(target) + this.RH/2
                          });
                      }
                  });
              });
              return lines;
          }
      },
      methods: {
          roomX(r) { return r.x * 90 + 10; },
          roomY(r) { return r.y * 60 + 10; },
          roomFill(r) {
              return { unknown:'#111118', explored:'#0d1f0d', current:'#1f1800', dangerous:'#1f0808', locked:'#0d0d1f' }[r.status] || '#111';
          },
          roomStroke(r) {
              return { unknown:'#2a2a3a', explored:'#2a5a2a', current:'#8a6a00', dangerous:'#6a1a1a', locked:'#2a2a6a' }[r.status] || '#333';
          },
          roomTextColor(r) {
              return { unknown:'#666', explored:'#88bb88', current:'#ffcc44', dangerous:'#ff8888', locked:'#8888ff' }[r.status] || '#aaa';
          },
          roomIcon(r) {
              return { unknown:'?', explored:'✓', current:'⬤', dangerous:'⚠', locked:'🔒' }[r.status] || '?';
          },
          statusLabel(s) {
              return { unknown:'未探索', explored:'已探索', current:'当前位置', dangerous:'危险', locked:'上锁' }[s] || s;
          },
          roomName(id) {
              const r = this.gameState.sceneMap.rooms.find(rm => rm.id === id);
              return r ? r.name : id;
          },
          toggleRoomDetail(room) {
              this.selectedRoom = (this.selectedRoom && this.selectedRoom.id === room.id) ? null : room;
          },
          goToRoom(room) {
              if (window.CoCAI && window.CoCAI.moveToLocation) window.CoCAI.moveToLocation(room.name);
          }
      },
      setup() { return Object.assign({}, window.CoCState, window.CoCAI); }
  };
  
window.StoryMap = StoryMap;
