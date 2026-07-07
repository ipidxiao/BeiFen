// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

window.ViewStory = {
    data() { return { activeStoryTab: 'chat', loadedTabs: {}, saveSlots: [] }; },
      
      components: {
          'story-chat': window.StoryChat,
          'story-char': window.StoryChar,
          'story-inv': window.StoryInv,
          'story-store': window.StoryStore,
        'story-journal': window.StoryJournal,
        'story-npc': window.StoryNpc,
        'story-combat': window.StoryCombat,
        'story-growth': window.StoryGrowth,
        'story-map': window.StoryMap,
        'story-clues': window.StoryClues,
        'story-dice': window.StoryDice,
        'story-equip': window.StoryEquip
      },
      
      template: `
          <div class="d-flex flex-column bg-dark" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 10;">
              <div class="d-flex align-items-center w-100 border-bottom border-secondary shadow-sm story-toolbar">
                  <button class="btn btn-sm btn-outline-light story-tab-btn flex-shrink-0" @click="switchScreen('lobby')" title="返回模组大厅" aria-label="返回模组大厅">⬅️</button>
                  <div v-if="gameState.kpEngine?.enabled" class="flex-shrink-0 px-2 py-1 rounded border border-danger" style="background:#1a0808;font-size:0.65rem;line-height:1.2;">
                      <span class="badge bg-danger" style="font-size:0.55rem;">KP</span>
                      <span class="text-warning">注意力{{ gameState.londonKpState?.ATTENTION_LEVEL ?? gameState.kpEngine?.global?.attention ?? 0 }}</span>
                      <span class="text-muted">·</span>
                      <span class="text-info">战力{{ gameState.londonKpState?.PLAYER_POWER ?? gameState.kpEngine?.global?.playerPower ?? 0 }}</span>
                      <span class="text-muted">·</span>
                      <span class="text-light">{{ gameState.londonKpState?.PHASE ?? gameState.kpEngine?.global?.phase ?? 'CALM' }}</span>
                  </div>
                  <div class="btn-group flex-shrink-0" role="tablist" aria-label="剧情子面板">
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'chat'" :class="activeStoryTab === 'chat' ? 'btn-warning' : 'btn-outline-secondary'" @click="activeStoryTab = 'chat'"><coc-icon name="scroll" :size="14"></coc-icon> 剧情</button>
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'character'" :class="activeStoryTab === 'character' ? 'btn-info' : 'btn-outline-secondary'" @click="activeStoryTab = 'character'"><coc-icon name="character" :size="14"></coc-icon> 人物</button>
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'inventory'" :class="activeStoryTab === 'inventory' ? 'btn-success' : 'btn-outline-secondary'" @click="activeStoryTab = 'inventory'"><coc-icon name="inventory" :size="14"></coc-icon> 随身</button>
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'storage'" :class="activeStoryTab === 'storage' ? 'btn-secondary' : 'btn-outline-secondary'" @click="activeStoryTab = 'storage'"><coc-icon name="storage" :size="14"></coc-icon> 仓库</button>
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'journal'" :class="activeStoryTab === 'journal' ? 'btn-light' : 'btn-outline-secondary'" @click="activeStoryTab = 'journal'"><coc-icon name="journal" :size="14"></coc-icon> 日志</button>
                      <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'npc'" :class="activeStoryTab === 'npc' ? 'btn-primary' : 'btn-outline-secondary'" @click="activeStoryTab = 'npc'"><coc-icon name="npc" :size="14"></coc-icon> NPC</button>
                        <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'growth'" :class="activeStoryTab === 'growth' ? 'btn-success' : 'btn-outline-secondary'" @click="activeStoryTab = 'growth'"><coc-icon name="growth" :size="14"></coc-icon> 成长</button>
                        <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'clues'" :class="activeStoryTab === 'clues' ? 'btn-danger' : 'btn-outline-secondary'" @click="activeStoryTab = 'clues'"><coc-icon name="clues" :size="14"></coc-icon> 线索</button>
                  </div>
                  <button class="btn btn-sm btn-outline-light fw-bold story-tab-btn flex-shrink-0" style="margin-left:auto;" @click="copyChat" title="复制全部对话" aria-label="复制全部对话">📋</button>
                  <button class="btn btn-sm btn-outline-light fw-bold story-tab-btn flex-shrink-0" @click="exportChat" title="导出对话文本" aria-label="导出对话文本">📥</button>
                  <button class="btn btn-sm btn-outline-info fw-bold story-tab-btn flex-shrink-0 d-inline-flex align-items-center gap-1" @click="switchScreen('settings')" title="AI引擎设置" aria-label="AI 引擎设置"><coc-icon name="settings" :size="14"></coc-icon></button>
                  <button class="btn btn-sm fw-bold story-tab-btn d-inline-flex align-items-center gap-1" role="tab" :aria-selected="activeStoryTab === 'equip'" :class="activeStoryTab === 'equip' ? 'btn-info' : 'btn-outline-secondary'" @click="activeStoryTab = 'equip'"><coc-icon name="equip" :size="14"></coc-icon> 装备</button>
                  <button class="btn btn-sm btn-outline-secondary fw-bold story-tab-btn flex-shrink-0 d-inline-flex align-items-center" @click="showModal('dice')" title="骰子台" aria-label="骰子台"><coc-icon name="dice" :size="16"></coc-icon></button>
                    <button class="btn btn-sm btn-outline-warning fw-bold story-tab-btn flex-shrink-0" @click="openSaveModal()" title="存档管理" aria-label="存档管理">💾</button>
              </div>

              <keep-alive :include="tabComponents">
              <story-chat v-if="activeStoryTab === 'chat'" @switch-tab="activeStoryTab = $event"></story-chat>
              <story-char v-if="activeStoryTab === 'character'" @switch-tab="activeStoryTab = $event"></story-char>
              <story-inv v-if="activeStoryTab === 'inventory'" @switch-tab="activeStoryTab = $event"></story-inv>
              <story-store v-if="activeStoryTab === 'storage'"></story-store>
            <story-journal v-if="activeStoryTab === 'journal'"></story-journal>
            <story-npc v-if="activeStoryTab === 'npc'"></story-npc>
              <story-growth v-if="activeStoryTab === 'growth'"></story-growth>
            <story-clues v-if="activeStoryTab === 'clues'"></story-clues>
              <story-equip v-if="activeStoryTab === 'equip'"></story-equip>
              </keep-alive>
              
              <!-- 战斗面板 — 战斗激活时自动弹出 -->
              <story-combat v-if="gameState.combat.active || gameState.activeModal === 'combat'"></story-combat>

              <!-- 地图 Modal -->
              <div v-if="gameState.activeModal === 'map'" class="modal-overlay">
                  <story-map></story-map>
              </div>

              <!-- 骰子台 Modal -->
                <div v-if="gameState.activeModal === 'dice'" class="modal-overlay">
                    <story-dice></story-dice>
                </div>

                <!-- 存档 Modal -->
              <div v-if="gameState.activeModal === 'save'" class="modal-overlay">
                  <div class="modal-content-custom" style="max-width: 380px;">
                      <div class="close-btn" @click="closeModal">×</div>
                      <h4 class="text-warning mb-3">💾 存档管理</h4>
                      <div class="mb-3 p-2 border rounded" :class="gameState.storageStatus.warning ? 'border-warning' : 'border-secondary'" style="background:#101010;">
                          <div class="d-flex justify-content-between small">
                              <span class="text-muted">浏览器存储估算</span>
                              <span class="text-light">{{ formatStorageBytes(gameState.storageStatus.usedBytes) }} / {{ formatStorageBytes(gameState.storageStatus.quotaBytes) }}</span>
                          </div>
                          <div class="text-secondary story-tab-btn">本次存档约 {{ formatStorageBytes(gameState.storageStatus.currentSaveBytes) }}，写入后预计 {{ ((gameState.storageStatus.projectedRatio || 0) * 100).toFixed(1) }}%</div>
                          <div v-if="gameState.storageStatus.warning" class="text-warning story-tab-btn">⚠️ {{ gameState.storageStatus.warning }}</div>
                      </div>
                      
                      <!-- 手动存档槽 -->
                      <div class="mb-3">
                          <div v-for="slot in saveSlots" :key="slot.key" class="mb-2 p-2 border border-secondary rounded" style="background:#111;">
                              <div class="d-flex justify-content-between align-items-start">
                                  <div class="flex-grow-1 me-2" style="min-width:0;">
                                      <div class="fw-bold text-light" style="font-size:0.85rem;">{{ slot.label }}</div>
                                      <div v-if="slot.hasData" class="text-muted text-truncate story-tab-btn">
                                          {{ slot.charNames }} · {{ slot.location }}<br>{{ slot.savedAt }}
                                      </div>
                                      <div v-else class="text-secondary story-tab-btn">— 空槽位 —</div>
                                  </div>
                                  <div class="d-flex flex-column gap-1">
                                      <button class="btn btn-sm btn-warning py-0 px-2 fs-6" @click="doSave(slot.key, slot.label)">存入</button>
                                      <button class="btn btn-sm btn-info py-0 px-2 fs-6" @click="doLoad(slot.key)" :disabled="!slot.hasData">读取</button>
                                      <button class="btn btn-sm btn-outline-danger py-0 px-2 fs-6" @click="doDelete(slot.key)" :disabled="!slot.hasData">删</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <!-- 导出/导入 -->
                      <div class="border-top border-secondary pt-3">
                          <div class="text-muted small mb-2">JSON 文件备份（跨设备转移）</div>
                          <div class="d-flex gap-2">
                              <button class="btn btn-sm btn-outline-success flex-grow-1" @click="exportGame">📤 导出</button>
                              <label class="btn btn-sm btn-outline-info flex-grow-1 mb-0 cursor-pointer">
                                  📥 导入<input type="file" accept=".json" style="display:none" @change="doImport($event)">
                              </label>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `,
      setup() {
          const tabComponents = ['story-chat','story-char','story-inv','story-store','story-journal','story-npc','story-growth','story-clues','story-equip'];
          const state = window.CoCState;
          const ai = window.CoCAI;
          const { ref } = window.Vue;
          
          const openSaveModal = function() {
              // this.saveSlots gets updated via the component instance
              // We use a different approach: expose refreshSlots via a shared ref
              window._refreshStorySaveSlots && window._refreshStorySaveSlots();
              state.getStorageStatus && state.getStorageStatus('slot1', '预估存档');
              state.showModal('save');
          };
          
          const doSave = function(slotKey, slotLabel) {
              const ok = state.saveGame(slotKey, slotLabel);
              if (ok) {
                  state.gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `💾 [存档] 已保存至"${slotLabel}"。` });
                  state.showToast && state.showToast(`已保存至"${slotLabel}"。`, 'success');
                  window._refreshStorySaveSlots && window._refreshStorySaveSlots();
              } else { state.showToast && state.showToast('存档失败，请检查浏览器存储设置。', 'danger'); }
          };
          
          const doLoad = async function(slotKey) {
              const okConfirm = await state.confirmAction('载入存档将覆盖当前游戏进度，确认吗？', { title: '读取存档' });
              if (!okConfirm) return;
              const ok = await state.loadGame(slotKey);
              if (ok) { state.closeModal(); state.scrollToBottom(); }
              else if (!state.gameState.ui.saveLoading) { state.showToast && state.showToast('读取失败：存档损坏或不存在。', 'danger'); }
          };
          
          const doDelete = async function(slotKey) {
              const okConfirm = await state.confirmAction('确认删除该存档？此操作不可恢复。', { title: '删除存档', danger: true, okText: '删除' });
              if (!okConfirm) return;
              state.deleteSave(slotKey);
              state.showToast && state.showToast('存档已删除。', 'success');
              window._refreshStorySaveSlots && window._refreshStorySaveSlots();
          };
          
          const doImport = async function(event) {
              const file = event.target.files[0];
              if (!file) return;
              try {
                  await state.importGame(file);
                  state.closeModal(); state.scrollToBottom();
                  state.showToast && state.showToast('导入成功。', 'success');
              } catch(e) { state.showToast && state.showToast('导入失败：' + e, 'danger'); }
              event.target.value = '';
          };
          
          const copyChat = function() { if (window.ChatExport) window.ChatExport.copyChatText(state); };
          const exportChat = function() { if (window.ChatExport) window.ChatExport.exportChatMarkdown(state); };
          return Object.assign({}, state, ai, { tabComponents, openSaveModal, doSave, doLoad, doDelete, doImport, copyChat, exportChat });
      },
      mounted() {
          // Register slot refresh hook
          window._refreshStorySaveSlots = () => {
              this.saveSlots = CoCStateAccessor.getSaveSlots();
              CoCStateAccessor.getStorageStatus('slot1', '预估存档');
          };
          this.saveSlots = CoCStateAccessor.getSaveSlots();
          CoCStateAccessor.getStorageStatus('slot1', '预估存档');
          const gs = window.CoCState && window.CoCState.gameState;
          if (gs && gs.kpEngine && gs.kpEngine.enabled && window.KpGameLoop) {
              window.KpGameLoop.register(gs);
          }
      },
      unmounted() {
          window._refreshStorySaveSlots = null;
          if (window.KpGameLoop) window.KpGameLoop.unregister();
      }
  };
window.ViewStory = ViewStory;
