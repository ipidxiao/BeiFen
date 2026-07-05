// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

import {
    filterActiveInitiativeOrder,
    computeActiveTurnIdx,
    resolveFirstWoundedChar,
} from './combat_ui_helpers.mjs';

export const StoryCombat = {
      data() { return { expandInitiative: false }; },
      template: `
          <div class="modal-overlay" style="z-index:50;">
              <div class="combat-panel">
                  
                  <!-- Header -->
                  <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom combat-header">
                      <div>
                          <span class="text-danger fw-bold">⚔️ 战斗中</span>
                          <span class="badge bg-danger ms-2">第 {{ gameState.combat.round }} 回合</span>
                      </div>
                      <div class="text-muted small">{{ gameState.combat.location }}</div>
                  </div>

                  <!-- Current Turn Banner -->
                  <div class="px-3 py-2 text-center combat-turn-banner">
                      <div class="text-warning fw-bold combat-turn-label">现在行动：{{ currentTurnName }}</div>
                      <div v-if="currentTurnIsEnemy" class="text-danger small">敌人回合 — 等待守秘人裁定</div>
                      <div v-else class="text-light small">联网：自由描述行动 · 离线：选下方快速指令</div>
                  </div>

                  <!-- Initiative Order (collapsible) -->
                  <div class="px-3 py-1 border-bottom border-secondary combat-initiative-bar">
                      <div class="d-flex justify-content-between align-items-center combat-initiative-toggle" tabindex="0" role="button" aria-label="切换先攻排序" @click="expandInitiative=!expandInitiative" @keydown.enter="expandInitiative=!expandInitiative" @keydown.space.prevent="expandInitiative=!expandInitiative">
                          <span class="text-muted combat-initiative-text">先攻顺序</span>
                          <span class="text-muted combat-initiative-text">{{ expandInitiative ? '▲' : '▼' }}</span>
                      </div>
                      <div v-if="expandInitiative" class="d-flex flex-wrap gap-1 mt-1 pb-1">
                          <span v-for="(t, i) in activeOrder" :key="t.id"
                              class="badge"
                              :style="'font-size:0.65rem; background:' + (i===activeTurnIdx ? (t.isEnemy?'#cc2200':'#c9a227') : '#1a1a1a') + '; color:' + (t.isEnemy?'#ff9999':'#ffe070') + '; border:1px solid ' + (i===activeTurnIdx?'#ff6600':'#333')">
                              {{ i===activeTurnIdx ? '▶ ' : '' }}{{ t.name }}
                          </span>
                      </div>
                  </div>

                  <!-- Enemies Section -->
                  <div class="px-3 pt-2 pb-1" style="flex-shrink:0;">
                      <div class="text-danger fw-bold mb-2 combat-section-title">敌 方</div>
                      <div v-for="enemy in gameState.combat.enemies" :key="enemy.id"
                          class="mb-2 p-2 rounded combat-enemy-card"
                          :class="enemy.isDefeated ? 'defeated' : ''">
                          <div class="d-flex justify-content-between align-items-start mb-1">
                              <div>
                                  <span class="fw-bold combat-enemy-name" :class="enemy.isDefeated ? 'defeated' : ''">{{ enemy.name }}</span>
                                  <span v-if="enemy.armor" class="badge ms-1 combat-armor-badge">护甲 {{ enemy.armor }}</span>
                                  <span v-if="enemy.isDefeated" class="badge bg-secondary ms-1 combat-defeated-badge">💀 击败</span>
                              </div>
                              <span v-if="!enemy.isDefeated" class="text-danger fw-bold combat-enemy-hp">{{ enemy.hp }}/{{ enemy.maxHp }}</span>
                          </div>
                          <div v-if="!enemy.isDefeated" class="progress combat-hp-progress">
                              <div class="progress-bar bg-danger" :style="'width:' + Math.max(0, enemy.hp/enemy.maxHp*100) + '%; transition:width 0.4s;'"></div>
                          </div>
                          <div v-if="enemy.description" class="text-muted mt-1 combat-enemy-desc">{{ enemy.description }}</div>
                      </div>
                  </div>

                  <!-- Investigators Section -->
                  <div class="px-3 pt-1 pb-2 border-top border-secondary">
                      <div class="text-warning fw-bold mb-2 combat-section-title">调查员</div>
                      <div class="d-flex flex-wrap gap-2">
                          <div v-for="char in activeChars" :key="char.name" class="p-2 rounded flex-grow-1 combat-char-card">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                  <span class="text-warning fw-bold combat-char-name">{{ char.name }}</span>
                                  <span v-if="char.isInsane" class="badge bg-danger combat-char-insane">疯狂</span>
                              </div>
                              <div class="progress mb-1 combat-hp-progress-inv">
                                  <div class="progress-bar bg-danger" :style="'width:' + Math.max(0, char.hp/(char.derived?.hp||1)*100) + '%;'"></div>
                              </div>
                              <div class="d-flex justify-content-between combat-char-stats">
                                  <span>HP {{ char.hp }}/{{ char.derived?.hp }}</span>
                                  <span>SAN {{ char.sanity }}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Quick Actions -->
                  <div class="px-3 pb-2 border-top border-secondary pt-2 combat-actions-bar">
                      <div class="text-muted mb-2 combat-actions-label" title="离线主互动；联网时可自由描述，菜单为可选参考">快速指令（CoC 7e · 离线主互动 / 联网可自由描述）</div>
                      <div class="d-flex flex-wrap gap-1">
                          <button class="btn btn-sm btn-outline-danger py-0 px-2 combat-quick-btn" @click="quickAction('我向最近的敌人发起近战攻击！')">🗡️ 近战</button>
                          <button class="btn btn-sm btn-outline-warning py-0 px-2 combat-quick-btn" @click="quickAction('我开枪射击！')">🔫 射击</button>
                          <button class="btn btn-sm btn-outline-danger py-0 px-2 combat-quick-btn" @click="quickAction('我放弃闪避，对攻击者进行反击！')">⚔️ 反击</button>
                          <button class="btn btn-sm btn-outline-info py-0 px-2 combat-quick-btn" @click="quickAction('我尝试闪避并寻找掩体。')">🛡️ 生存</button>
                          <button class="btn btn-sm btn-outline-secondary py-0 px-2 combat-quick-btn" @click="quickAction('我们撤退！')">🏃 逃脱</button>
                          <button class="btn btn-sm btn-outline-light py-0 px-2 combat-quick-btn" @click="quickAction('我尝试擒抱最近的敌人！')">🤼 擒抱</button>
                          <button class="btn btn-sm btn-outline-success py-0 px-2 combat-quick-btn" @click="quickAction('我对' + firstWoundedChar + '进行急救。')">💊 技能</button>
                          <button class="btn btn-sm btn-outline-primary py-0 px-2 combat-quick-btn" @click="quickAction('我尝试威吓敌人！')">🗣️ 交涉</button>
                          <button class="btn btn-sm btn-outline-info py-0 px-2 combat-quick-btn" @click="quickAction('我利用周围的环境（家具/障碍物）获取掩护！')">🏚️ 环境</button>
                      </div>
                  </div>

                  <!-- Close only if combat inactive -->
                  <div v-if="!gameState.combat.active" class="px-3 pb-3 text-center">
                      <button class="btn btn-secondary" @click="closeModal">关闭战斗面板</button>
                  </div>

              </div>
          </div>
      `,
      computed: {
          activeChars() { return this.gameState.roster.filter(c => c.isActive); },
          activeOrder() {
              return filterActiveInitiativeOrder(
                  this.gameState.combat.initiativeOrder,
                  this.gameState.combat.enemies,
                  this.gameState.roster
              );
          },
          activeTurnIdx() { return computeActiveTurnIdx(this.gameState.combat.currentTurnIdx, this.activeOrder.length); },
          currentTurn() { return this.activeOrder[this.activeTurnIdx] || null; },
          currentTurnName() { return this.currentTurn ? this.currentTurn.name : '—'; },
          currentTurnIsEnemy() { return this.currentTurn ? this.currentTurn.isEnemy : false; },
          firstWoundedChar() {
              return resolveFirstWoundedChar(this.gameState.roster, this.activeChars);
          }
      },
      methods: {
          quickAction(text) {
              window.CoCState.playerInput.value = text;
              if (window.CoCAI && window.CoCAI.handlePlayerAction) window.CoCAI.handlePlayerAction();
          }
      },
      setup() { return Object.assign({}, window.CoCState); }
  };

window.StoryCombat = StoryCombat;
