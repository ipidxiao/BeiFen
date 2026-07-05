// V18.1: 使用 CoCStateAccessor
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const ViewLobby = {
      data() { return { autoSave: null, saveSlots: [], modules: [], modulesLoading: true, newModName: '', editingModId: null, editingModName: '', rememberKey: false, scenarios: [], pendingScenarioId: null, storeItems: [], selectedStoreId: null, storeSearch: '', storeTagFilter: '', storeLoading: false, storeError: '', publicCatalogBase: '', storeImportStep: '', storeImportDetail: '' }; },
      template: `
          <div>
              <!-- ===== 模组选择界面 ===== -->
              <div v-if="gameState.currentScreen === 'modules'" class="card card-custom p-3 shadow-sm">
                  <div class="text-center mb-4">
                      <h3 class="coc-section-title mb-1">📚 模组管理</h3>
                      <div class="coc-section-subtitle">每个模组拥有独立的角色队伍与剧情存档</div>
                  </div>

                  <div v-if="modulesLoading" class="empty-state">
                      <coc-icon name="storage" :size="36" class="empty-state-icon empty-state-pulse"></coc-icon>
                      <div class="empty-state-title">正在加载模组…</div>
                  </div>

                  <div v-else-if="modules.length === 0" class="empty-state">
                      <coc-icon name="storage" :size="40" class="empty-state-icon"></coc-icon>
                      <div class="empty-state-title">尚无模组</div>
                      <div class="empty-state-hint">在下方创建你的第一个调查模组</div>
                  </div>

                  <div v-for="mod in modules" :key="mod.id" class="mb-3 p-3 border rounded lobby-mod-card coc-panel-card" :class="mod.id === gameState.activeModuleId ? 'active' : ''">
                      <!-- 重命名输入态 -->
                      <div v-if="editingModId === mod.id" class="d-flex gap-2 mb-1">
                          <input class="form-control form-control-sm bg-dark text-light border-secondary flex-grow-1" v-model="editingModName" @keyup.enter="confirmRename(mod.id)" placeholder="模组名称">
                          <button class="btn btn-sm btn-success" @click="confirmRename(mod.id)">✓</button>
                          <button class="btn btn-sm btn-outline-secondary" @click="editingModId = null">✕</button>
                      </div>
                      <!-- 常规态 -->
                      <div v-else class="d-flex justify-content-between align-items-start">
                          <div class="flex-grow-1 me-2" style="min-width:0;">
                              <div class="d-flex align-items-center gap-2 mb-1">
                                  <span class="fw-bold text-warning">{{ mod.name }}</span>
                                  <span v-if="mod.id === 'default'" class="badge" style="background:#333;color:#999;font-size:0.65rem;">默认</span>
                              </div>
                              <div v-if="mod.autoSave" class="text-muted" style="font-size:0.72rem;">
                                  👥 {{ mod.autoSave.charNames }} · 📍 {{ mod.autoSave.location }}<br>
                                  💾 自动存档：{{ mod.autoSave.savedAt }}
                              </div>
                              <div v-else class="text-secondary" style="font-size:0.72rem;">尚无存档</div>
                          </div>
                          <div class="d-flex flex-column gap-1 flex-shrink-0">
                              <button class="btn btn-sm btn-warning fw-bold" @click="doEnterModule(mod.id)">进入 ▶</button>
                              <button class="btn btn-sm btn-outline-secondary py-0" style="font-size:0.75rem;" @click="startRename(mod)">✏️ 改名</button>
                              <button v-if="mod.id !== 'default'" class="btn btn-sm btn-outline-danger py-0" style="font-size:0.75rem;" @click="doDeleteModule(mod.id)">🗑️ 删除</button>
                          </div>
                      </div>
                  </div>

                  <!-- 新建模组 -->
                  <div class="border border-secondary rounded p-2 mt-2" style="background:#0a0a0a;">
                      <div class="d-flex gap-2">
                          <input class="form-control form-control-sm bg-dark text-light border-secondary flex-grow-1" v-model="newModName" placeholder="新模组名称（如：假面、独自对抗黑暗…）" @keyup.enter="doCreateModule">
                          <button class="btn btn-sm btn-success fw-bold" @click="doCreateModule" :disabled="!newModName.trim()">＋ 新建</button>
                      </div>
                  </div>
              </div>

              <!-- ===== 大厅界面 ===== -->
              <div v-if="gameState.currentScreen === 'lobby'" class="card card-custom p-3 shadow-sm text-center">
                  <h3 class="coc-section-title mb-1">模组大厅</h3>
                  <div class="coc-section-subtitle mb-4" v-if="currentModName">📚 {{ currentModName }}</div>

                  <!-- 自动存档快速恢复 -->
                  <div v-if="autoSave" class="mb-3 p-2 border border-warning rounded text-start lobby-autosave-banner">
                      <div class="d-flex justify-content-between align-items-center">
                          <div>
                              <div class="text-warning fw-bold small">🔄 检测到自动存档</div>
                              <div class="text-muted" style="font-size:0.75rem;">{{ autoSave.charNames }} · {{ autoSave.location }}</div>
                              <div class="text-muted" style="font-size:0.72rem;">{{ autoSave.savedAt }}</div>
                          </div>
                          <button class="btn btn-warning btn-sm fw-bold" @click="quickLoad">继续 ▶</button>
                      </div>
                  </div>

                  <button class="btn btn-warning fw-bold mb-3 p-3 w-100 lobby-action-btn" @click="switchScreen('character')">👥 调查员小队管理</button>
                  <button class="btn btn-outline-warning mb-3 p-3 w-100 fw-bold lobby-action-btn" @click="openScenarios">📜 本地剧本模式</button>
                  <button class="btn btn-outline-success mb-3 p-3 w-100 fw-bold lobby-action-btn" @click="openScenarioStore">📚 模组库</button>
                  <button class="btn btn-outline-info mb-3 p-3 w-100 lobby-action-btn" @click="switchScreen('settings')">⚙️ AI 引擎设置</button>
                  <div class="mb-3 p-3 border rounded text-start lobby-kp-panel" :class="gameState.kpEngine?.enabled ? 'active border-warning' : 'border-secondary'">
                      <div class="form-check form-switch mb-2">
                          <input class="form-check-input" type="checkbox" id="kpEngineToggle" :checked="gameState.kpEngine?.enabled" @change="toggleKpEngine($event)">
                          <label class="form-check-label text-warning fw-bold" for="kpEngineToggle">⚙️ KP 协议引擎</label>
                      </div>
                      <div class="text-muted" style="font-size:0.72rem;">规则在代码层强制执行（行动校验、缩放、输出协议等）。与战役存档独立，可单独开启。</div>
                      <div v-if="gameState.kpEngine?.enabled" class="lobby-kp-stats mt-2">
                          注意力 {{ gameState.londonKpState?.ATTENTION_LEVEL ?? gameState.kpEngine?.global?.attention ?? 0 }} ·
                          战力 {{ gameState.londonKpState?.PLAYER_POWER ?? gameState.kpEngine?.global?.playerPower ?? 0 }} ·
                          阶段 {{ gameState.londonKpState?.PHASE ?? gameState.kpEngine?.global?.phase ?? 'CALM' }}
                      </div>
                  </div>
                  <div class="row g-2 mb-2">
                      <div class="col-6"><button class="btn btn-outline-secondary p-2 w-100" @click="switchScreen('saves')">💾 存档管理</button></div>
                      <div class="col-6"><button class="btn btn-outline-warning p-2 w-100" @click="backToModules">📚 切换模组</button></div>
                  </div>
                  <button class="btn btn-outline-secondary p-2 w-100" @click="switchScreen('devlog')">🛠️ 开发者日志</button>
              </div>

              <!-- ===== 本地剧本选择 ===== -->
              <div v-if="gameState.currentScreen === 'scenarios'" class="card card-custom p-3 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                      <h3 class="text-warning m-0">📜 本地剧本</h3>
                      <button class="btn btn-outline-secondary btn-sm" @click="switchScreen('lobby')">← 返回</button>
                  </div>
                  <div class="text-muted small mb-3">无需 AI 与网络，由内置剧本驱动剧情。首次在线加载后完全离线可玩。Chaosium 商业模组请自行取得授权后按 JSON 格式导入（见 README）。</div>
                  <div v-for="sc in scenarios" :key="sc.id" class="mb-3 p-3 border rounded lobby-scenario-card">
                      <div class="fw-bold text-warning">{{ sc.title }}</div>
                      <div v-if="sc.subtitle" class="text-info small">{{ sc.subtitle }}</div>
                      <div class="text-muted small mt-1">{{ sc.description }}</div>
                      <div class="text-secondary mt-1" style="font-size:0.72rem;">{{ sc.era }} · 约 {{ sc.estimatedMinutes || '?' }} 分钟 · {{ sc.nodeCount }} 节点</div>
                      <button class="btn btn-sm btn-warning fw-bold mt-2" @click="startLocalScenario(sc.id)">开始剧本 ▶</button>
                  </div>
                  <div v-if="!scenarios.length" class="text-muted text-center py-3">暂无可用剧本</div>
              </div>

              <!-- ===== 模组库 ===== -->
              <div v-if="gameState.currentScreen === 'scenario_store'" class="card card-custom p-3 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                      <h3 class="text-warning m-0">📚 模组库</h3>
                      <button class="btn btn-outline-secondary btn-sm" @click="switchScreen('lobby')">← 返回</button>
                  </div>
                  <div class="text-muted small mb-3">浏览内置、可下载与 Chaosium 官方模组。官方 PDF 可「一键导入并转换」为本地剧本（仅存 IndexedDB，个人使用）。亦可自行导入 JSON。详见 <code>docs/CHAOSIUM_LICENSING.md</code>。</div>
                  <div class="alert alert-secondary py-2 small mb-3">ℹ️ Chaosium 官方模组版权归 Chaosium。转换在浏览器本地完成，请勿再分发转换后的剧情 JSON。</div>
                  <div class="mb-3 p-2 border border-secondary rounded" style="background:#101010;">
                      <label class="form-label text-muted small mb-1">公开资源基址（可选）</label>
                      <div class="input-group input-group-sm">
                          <input class="form-control bg-dark text-light border-secondary" v-model="publicCatalogBase" placeholder="https://example.com/coc-engine/" @keyup.enter="savePublicCatalogBase">
                          <button class="btn btn-outline-info" type="button" @click="savePublicCatalogBase">保存</button>
                      </div>
                      <div class="text-secondary mt-1" style="font-size:0.72rem;">可将引擎 ZIP 部署到任意公开静态网站，在此填写基址 URL 即可下载扩展模组。留空则仅使用同域包（完全离线）。</div>
                  </div>
                  <div v-if="storeUsesFallback" class="alert alert-warning py-2 small mb-3">⚠️ IndexedDB 不可用，已降级为 localStorage（容量有限）。</div>
                  <div class="row g-2 mb-3">
                      <div class="col-md-6">
                          <input class="form-control form-control-sm bg-dark text-light border-secondary" v-model="storeSearch" placeholder="搜索标题或描述…" @input="refreshStore">
                      </div>
                      <div class="col-md-6">
                          <select class="form-select form-select-sm bg-dark text-light border-secondary" v-model="storeTagFilter" @change="refreshStore">
                              <option value="">全部标签</option>
                              <option v-for="tag in storeAllTags" :key="tag" :value="tag">{{ tag }}</option>
                          </select>
                      </div>
                  </div>
                  <div class="row g-3">
                      <div class="col-lg-7">
                          <div class="row g-2">
                              <div v-for="item in filteredStoreItems" :key="item.id" class="col-md-6">
                                  <div class="p-2 border rounded h-100" :class="selectedStoreId === item.id ? 'border-warning' : 'border-secondary'" style="background:#111;cursor:pointer;" @click="selectStoreItem(item.id)">
                                      <div class="d-flex justify-content-between align-items-start gap-1">
                                          <div class="fw-bold text-warning small">{{ item.title }}</div>
                                      <span v-if="item.importOnly && item.status === 'downloaded' && item.convertedFromPdf" class="badge flex-shrink-0 bg-success" style="font-size:0.6rem;">已转换 · 个人使用</span>
                                      <span v-else-if="item.importOnly && item.status === 'downloaded'" class="badge flex-shrink-0 bg-success" style="font-size:0.6rem;">已导入</span>
                                      <span v-else-if="item.pdfConvert" class="badge flex-shrink-0 bg-info text-dark" style="font-size:0.6rem;">官方 PDF · 可本地转换</span>
                                      <span v-else-if="item.importOnly" class="badge flex-shrink-0 bg-info text-dark" style="font-size:0.6rem;">官方 · 需自行下载</span>
                                      <span v-else class="badge flex-shrink-0" :class="storeStatusBadge(item.status)">{{ storeStatusLabel(item.status) }}</span>
                                      </div>
                                      <div class="text-muted" style="font-size:0.7rem;">{{ item.author }} · {{ item.license }}</div>
                                      <div class="text-secondary mt-1" style="font-size:0.72rem;line-height:1.3;">{{ (item.description || '').slice(0, 60) }}…</div>
                                      <div class="mt-1">
                                          <span v-for="t in (item.tags || []).slice(0, 3)" :key="t" class="badge me-1" style="background:#333;font-size:0.6rem;">{{ t }}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div v-if="!filteredStoreItems.length" class="text-muted text-center py-4">无匹配模组</div>
                      </div>
                      <div class="col-lg-5">
                          <div v-if="selectedStoreItem" class="p-3 border border-secondary rounded" style="background:#0a0a0a;">
                              <h5 class="text-warning">{{ selectedStoreItem.title }}</h5>
                              <div v-if="selectedStoreItem.subtitle" class="text-info small">{{ selectedStoreItem.subtitle }}</div>
                              <div class="text-muted small mt-2">{{ selectedStoreItem.description }}</div>
                              <div class="mt-2 small">
                                  <div><span class="text-secondary">作者：</span>{{ selectedStoreItem.author }}</div>
                                  <div class="d-flex align-items-center gap-1 flex-wrap">
                                      <span class="text-secondary">许可：</span>
                                      <span class="badge bg-dark border border-secondary">{{ selectedStoreItem.license }}</span>
                                      <a v-if="selectedStoreItem.licenseUrl" :href="selectedStoreItem.licenseUrl" target="_blank" rel="noopener noreferrer" class="badge bg-info text-dark text-decoration-none" style="font-size:0.65rem;">许可详情 ↗</a>
                                  </div>
                                  <div v-if="selectedStoreItem.source === 'remote' || selectedStoreItem.source === 'official'">
                                      <span class="text-secondary">资源：</span>
                                      <span v-if="selectedStoreItem.importOnly" class="badge bg-info text-dark">官方链接（无再分发）</span>
                                      <span v-else class="badge bg-secondary">{{ publicCatalogBase ? '公开网站 + 同域包' : '同域包（离线可用）' }}</span>
                                  </div>
                                  <div v-if="selectedStoreItem.officialUrl">
                                      <span class="text-secondary">官方页面：</span>
                                      <a :href="selectedStoreItem.officialUrl" target="_blank" rel="noopener noreferrer" class="small">{{ selectedStoreItem.officialUrl }}</a>
                                  </div>
                                  <div v-if="selectedStoreItem.status === 'downloaded' && selectedStoreItem.downloadSource">
                                      <span class="text-secondary">下载自：</span>
                                      <span class="badge" :class="downloadSourceBadge(selectedStoreItem.downloadSource)">{{ downloadSourceLabel(selectedStoreItem.downloadSource) }}</span>
                                  </div>
                                  <div><span class="text-secondary">时长：</span>约 {{ selectedStoreItem.estimatedMinutes || selectedStoreItem.playTime || '?' }} 分钟</div>
                                  <div><span class="text-secondary">节点：</span>{{ selectedStoreItem.nodeCount || '?' }}</div>
                              </div>
                              <div class="mt-2">
                                  <span v-for="t in (selectedStoreItem.tags || [])" :key="t" class="badge me-1 mb-1" style="background:#2a2a3a;">{{ t }}</span>
                              </div>
                              <div v-if="storeError" class="text-danger small mt-2">{{ storeError }}</div>
                              <div v-if="storeImportStep" class="text-info small mt-2">{{ importProgressLabel(storeImportStep, storeImportDetail) }}</div>
                              <div class="d-flex flex-wrap gap-2 mt-3">
                                  <button v-if="selectedStoreItem.pdfConvert && selectedStoreItem.status !== 'downloaded'" class="btn btn-sm btn-warning fw-bold" :disabled="storeLoading" @click="doImportOfficialOneClick(selectedStoreItem.id)">
                                      {{ storeLoading ? importProgressLabel(storeImportStep, storeImportDetail) || '处理中…' : '⚡ 一键导入并转换' }}
                                  </button>
                                  <label v-if="selectedStoreItem.pdfConvert && selectedStoreItem.status !== 'downloaded'" class="btn btn-sm btn-outline-warning mb-0" style="cursor:pointer;">
                                      📄 选择 PDF 转换
                                      <input type="file" accept=".pdf,application/pdf" style="display:none" @change="doImportOfficialPdfFile($event, selectedStoreItem.id)">
                                  </label>
                                  <button v-if="selectedStoreItem.importOnly && selectedStoreItem.officialUrl" class="btn btn-sm btn-outline-info" @click="openOfficialUrl(selectedStoreItem.officialUrl)">
                                      ↗ 前往官方页面
                                  </button>
                                  <label v-if="selectedStoreItem.importOnly && selectedStoreItem.status !== 'downloaded' && !selectedStoreItem.pdfConvert" class="btn btn-sm btn-outline-warning mb-0" style="cursor:pointer;">
                                      📥 我已下载，导入本地 JSON
                                      <input type="file" accept=".json,application/json" style="display:none" @change="doImportOfficialPack($event, selectedStoreItem.id)">
                                  </label>
                                  <label v-if="selectedStoreItem.importOnly && selectedStoreItem.status !== 'downloaded' && selectedStoreItem.pdfConvert" class="btn btn-sm btn-outline-secondary mb-0" style="cursor:pointer;">
                                      📥 导入 JSON
                                      <input type="file" accept=".json,application/json" style="display:none" @change="doImportOfficialPack($event, selectedStoreItem.id)">
                                  </label>
                                  <button v-if="selectedStoreItem.downloadable && selectedStoreItem.status === 'available'" class="btn btn-sm btn-success fw-bold" :disabled="storeLoading" @click="doDownloadScenario(selectedStoreItem.id)">
                                      {{ storeLoading ? '下载中…' : '⬇ 下载到本地' }}
                                  </button>
                                  <button v-if="selectedStoreItem.status === 'downloaded'" class="btn btn-sm btn-outline-danger" :disabled="storeLoading" @click="doRemoveDownload(selectedStoreItem.id)">移除下载</button>
                                  <button v-if="selectedStoreItem.status !== 'available'" class="btn btn-sm btn-warning fw-bold" @click="startLocalScenario(selectedStoreItem.id)">开始剧本 ▶</button>
                              </div>
                              <div v-if="selectedStoreItem.pdfConvert && selectedStoreItem.status !== 'downloaded'" class="text-secondary mt-2" style="font-size:0.68rem;line-height:1.4;">
                                  个人使用 · 版权归 Chaosium · 请勿再分发。转换在您的浏览器内完成，不会上传至引擎服务器。
                              </div>
                          </div>
                          <div v-else class="text-muted text-center py-5 border border-secondary rounded" style="background:#0a0a0a;">← 选择左侧模组查看详情</div>
                      </div>
                  </div>
              </div>

              <!-- ===== 存档管理界面 ===== -->
              <div v-if="gameState.currentScreen === 'saves'" class="card card-custom p-3 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                      <h4 class="text-warning m-0">💾 存档管理</h4>
                      <button class="btn btn-outline-secondary btn-sm" @click="switchScreen('lobby')">← 返回</button>
                  </div>
                  <div class="mb-3 p-2 border rounded" :class="gameState.storageStatus.warning ? 'border-warning' : 'border-secondary'" style="background:#101010;">
                      <div class="d-flex justify-content-between small">
                          <span class="text-muted">浏览器存储估算</span>
                          <span class="text-light">{{ formatStorageBytes(gameState.storageStatus.usedBytes) }} / {{ formatStorageBytes(gameState.storageStatus.quotaBytes) }}</span>
                      </div>
                      <div class="text-secondary" style="font-size:0.72rem;">当前战役预估存档 {{ formatStorageBytes(gameState.storageStatus.currentSaveBytes) }}；写入后约 {{ ((gameState.storageStatus.projectedRatio || 0) * 100).toFixed(1) }}%</div>
                      <div v-if="gameState.storageStatus.warning" class="text-warning" style="font-size:0.72rem;">⚠️ {{ gameState.storageStatus.warning }}</div>
                  </div>
                  <div v-for="slot in saveSlots" :key="slot.key" class="mb-2 p-2 border border-secondary rounded" style="background:#111;">
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="flex-grow-1 me-2">
                              <div class="fw-bold text-light small">{{ slot.label }}</div>
                              <div v-if="slot.hasData" class="text-muted" style="font-size:0.72rem;">{{ slot.charNames }} · {{ slot.location }}<br>{{ slot.savedAt }}</div>
                              <div v-else class="text-secondary" style="font-size:0.72rem;">— 空槽位 —</div>
                          </div>
                          <div class="d-flex gap-1">
                              <button class="btn btn-sm btn-info" @click="lobbyLoad(slot.key)" :disabled="!slot.hasData">读取</button>
                              <button class="btn btn-sm btn-outline-danger" @click="lobbyDelete(slot.key)" :disabled="!slot.hasData">删</button>
                          </div>
                      </div>
                  </div>
                  <div class="border-top border-secondary pt-3 mt-2">
                      <div class="text-muted small mb-2">JSON 文件备份（跨设备转移）</div>
                      <div class="d-flex gap-2">
                          <button class="btn btn-sm btn-outline-success flex-grow-1" @click="exportGame">📤 导出</button>
                          <label class="btn btn-sm btn-outline-info flex-grow-1 mb-0" style="cursor:pointer;">
                              📥 导入<input type="file" accept=".json" style="display:none" @change="doLobbyImport($event)">
                          </label>
                      </div>
                  </div>
              </div>

              <!-- ===== AI 设置界面 ===== -->
              <div v-if="gameState.currentScreen === 'settings'" class="card card-custom p-3 shadow-sm settings-panel">
                  <h3 class="coc-section-title mb-3">AI 引擎设置</h3>
                  <div class="mb-3"><label class="form-label">接口地址</label><input type="text" class="form-control bg-dark text-light border-secondary" v-model="gameState.aiSettings.baseUrl"></div>
                  <div class="mb-3"><label class="form-label">API 密钥</label><input type="password" class="form-control bg-dark text-light border-secondary" v-model="gameState.aiSettings.apiKey" placeholder="DeepSeek / OpenAI 兼容密钥"></div>
                  <div v-if="!(gameState.aiSettings.apiKey || '').trim()" class="empty-state empty-state-compact empty-state-inline mb-3">
                      <coc-icon name="settings" :size="28" class="empty-state-icon"></coc-icon>
                      <div class="empty-state-title">未配置 API 密钥</div>
                      <div class="empty-state-hint">联网 AI 守秘人需要密钥；本地剧本模式无需配置</div>
                  </div>
                  <div class="mb-3"><label class="form-label">模型名称</label><input type="text" class="form-control bg-dark text-light border-secondary" v-model="gameState.aiSettings.model"></div>
                  <div class="mb-3">
                      <label class="form-label">守秘人难度</label>
                      <select class="form-select bg-dark text-light border-secondary settings-difficulty-select" v-model="gameState.aiSettings.difficultyPreset" @change="onDifficultyPresetChange($event)">
                          <option value="merciful">仁慈 — 宽容线索与判定</option>
                          <option value="standard">标准 — CoC 7e 默认</option>
                          <option value="brutal">致命 — 残酷后果</option>
                          <option value="divine_war">神战 — 神话战争级严苛模式</option>
                      </select>
                      <div v-if="gameState.aiSettings.difficultyPreset === 'divine_war' && !gameState.kpEngine?.enabled" class="alert alert-warning py-2 small mt-2 mb-0 settings-difficulty-hint">
                          ⚠️ 神战预设建议启用 KP 协议引擎（大厅开关），以获得注意力、敌对组织与五段输出协议的完整 enforcement。
                      </div>
                  </div>
                  <div class="mb-3 form-check">
                        <input class="form-check-input" type="checkbox" id="rememberKey" v-model="rememberKey" style="background:#111;border-color:#555;">
                        <label class="form-check-label" for="rememberKey" style="font-size:0.7rem;color:#aaa;">记住密钥（跨会话保存；取消则关闭浏览器后自动清除）</label>
                  </div>
                  <button class="btn btn-success" @click="saveSettings(rememberKey)">💾 保存</button>
              </div>

              <!-- ===== 调查员管理界面 ===== -->
              <div v-if="gameState.currentScreen === 'character'" class="card card-custom p-3 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                      <h3 class="text-warning m-0">调查员小队</h3>
                      <button class="btn btn-warning btn-sm fw-bold" @click="switchScreen('story')" :disabled="gameState.roster.length === 0">进入剧情 ▶</button>
                  </div>
                  <ul class="list-group list-group-flush mb-4">
                      <li v-if="gameState.roster.length === 0" class="list-group-item bg-dark text-muted">没有调查员，请先建立。</li>
                      <li v-for="(char, index) in gameState.roster" :key="index" class="list-group-item bg-dark text-light border-secondary">
                          <div class="d-flex justify-content-between align-items-start">
                              <div>
                                  <strong class="text-warning">{{ char.name }}</strong>
                                  <span v-if="char.jobName" class="badge ms-1 badge-job">{{ char.jobName }}</span>
                                  <span v-if="char.isInsane" class="badge bg-danger ms-1">疯狂</span><br>
                                  <span class="badge badge-hp me-1">HP: {{ char.hp }}</span>
                                  <span class="badge badge-san me-1">SAN: {{ char.sanity }}</span>
                                  <span class="badge" style="background:#3a3a4a; color:#cccccc;">STR: {{ char.attrs.STR }}</span>
                              </div>
                              <div class="d-flex flex-column align-items-end gap-1">
                                  <div class="form-check form-switch">
                                      <input class="form-check-input" type="checkbox" v-model="char.isActive">
                                      <label class="form-check-label small" style="color:#aaa;">{{ char.isActive ? '参与行动' : '暂离' }}</label>
                                  </div>
                                  <button class="btn btn-sm btn-outline-danger py-0" style="font-size:0.72rem;" @click="deleteInvestigator(index, char)">移除</button>
                              </div>
                          </div>
                      </li>
                  </ul>
                  <div class="d-flex gap-2">
                      <button class="btn btn-outline-secondary" @click="switchScreen('lobby')">返回大厅</button>
                      <button class="btn btn-success flex-grow-1" @click="switchScreen('creator')">🎲 创建新调查员</button>
                  </div>
              </div>
          </div>
      `,
      computed: {
          currentModName() {
              const id = CoCStateAccessor.getGameState().activeModuleId;
              if (!id || id === 'default') return '默认模组';
              try {
                  const meta = safeJsonParse(localStorage.getItem('coc_module_' + id + '_meta'), {});
                  return meta.name || '未命名模组';
              } catch(e) { return ''; }
          },
          selectedStoreItem() {
              if (!this.selectedStoreId) return null;
              return this.storeItems.find((i) => i.id === this.selectedStoreId) || null;
          },
          storeAllTags() {
              const tags = new Set();
              (this.storeItems || []).forEach((i) => (i.tags || []).forEach((t) => tags.add(t)));
              return [...tags].sort();
          },
          filteredStoreItems() {
              let items = this.storeItems || [];
              const q = (this.storeSearch || '').trim().toLowerCase();
              if (q) {
                  items = items.filter((i) =>
                      (i.title || '').toLowerCase().includes(q) ||
                      (i.description || '').toLowerCase().includes(q) ||
                      (i.tags || []).some((t) => t.toLowerCase().includes(q))
                  );
              }
              if (this.storeTagFilter) {
                  items = items.filter((i) => (i.tags || []).includes(this.storeTagFilter));
              }
              return items;
          },
          storeUsesFallback() {
              return window.CoCScenarioStore && window.CoCScenarioStore.usesLocalStorageFallback && window.CoCScenarioStore.usesLocalStorageFallback();
          }
      },
      setup() {
          const state = window.CoCState;

          const quickLoad = () => {
              const ok = state.loadGame('auto');
              if (ok) { state.switchScreen('story'); state.scrollToBottom(); }
              else { state.showToast && state.showToast('自动存档读取失败。', 'danger'); }
          };
          const lobbyLoad = async (slotKey) => {
              const okConfirm = await state.confirmAction('载入存档将覆盖当前游戏进度，确认吗？', { title: '读取存档' });
              if (!okConfirm) return;
              const ok = state.loadGame(slotKey);
              if (ok) { state.switchScreen('story'); state.scrollToBottom(); }
              else { state.showToast && state.showToast('读取失败：存档损坏或不存在。', 'danger'); }
          };
          const lobbyDelete = async (slotKey) => {
              const okConfirm = await state.confirmAction('确认删除该存档？', { title: '删除存档', danger: true, okText: '删除' });
              if (!okConfirm) return;
              state.deleteSave(slotKey);
              state.showToast && state.showToast('存档已删除。', 'success');
          };
          const doLobbyImport = async (event) => {
              const file = event.target.files[0]; if (!file) return;
              try { await state.importGame(file); state.switchScreen('story'); state.scrollToBottom(); state.showToast && state.showToast('导入成功。', 'success'); }
              catch(e) { state.showToast && state.showToast('导入失败：' + e, 'danger'); }
              event.target.value = '';
          };
          const deleteInvestigator = async (index, char) => {
              const name = char && char.name ? char.name : '该调查员';
              const ok = await state.confirmAction(`确认将 ${name} 从小队移除？`, { title: '移除调查员', danger: true, okText: '移除' });
              if (!ok) return;
              if (state.removeCharacterAt(index)) state.showToast && state.showToast(`${name} 已移除。`, 'success');
              else state.showToast && state.showToast('移除失败：调查员索引无效。', 'danger');
          };

          return Object.assign({}, state, { quickLoad, lobbyLoad, lobbyDelete, doLobbyImport, deleteInvestigator });
      },
      methods: {
          refreshData() {
              this.autoSave = CoCStateAccessor.getAutoSave();
              this.saveSlots = CoCStateAccessor.getSaveSlots();
              this.modules = CoCStateAccessor.getModules();
              this.modulesLoading = false;
              CoCStateAccessor.getStorageStatus('slot1', '预估存档');
          },
          backToModules() {
              this.refreshData();
              CoCStateAccessor.switchScreen('modules');
          },
          doEnterModule(id) {
              CoCStateAccessor.enterModule(id);
              this.autoSave = CoCStateAccessor.getAutoSave();
              this.saveSlots = CoCStateAccessor.getSaveSlots();
          },
          doCreateModule() {
              const name = this.newModName.trim();
              if (!name) return;
              const id = CoCStateAccessor.createModule(name);
              this.newModName = '';
              this.modules = CoCStateAccessor.getModules();
              CoCStateAccessor.enterModule(id);
          },
          async doDeleteModule(id) {
              const ok = await CoCStateAccessor.confirmAction('删除模组将永久清除其所有存档，确认吗？', { title: '删除模组', danger: true, okText: '删除' });
              if (!ok) return;
              CoCStateAccessor.deleteModule(id);
              CoCStateAccessor.showToast('模组已删除。', 'success');
              this.modules = CoCStateAccessor.getModules();
          },
          startRename(mod) {
              this.editingModId = mod.id;
              this.editingModName = mod.name;
          },
          confirmRename(id) {
              if (this.editingModName.trim()) {
                  CoCStateAccessor.renameModule(id, this.editingModName.trim());
                  this.modules = CoCStateAccessor.getModules();
              }
              this.editingModId = null;
          },
          refreshScenariosList() {
              const store = window.CoCScenarioStore;
              if (store) {
                  store.init().then(() => {
                      if (window.CoCScenarioCatalog) window.CoCScenarioCatalog.refresh();
                      this.scenarios = store.listCatalog().filter((i) => store.isAvailable(i.id));
                  });
              } else if (window.CoCScenarioCatalog) {
                  window.CoCScenarioCatalog.refresh();
                  this.scenarios = window.CoCScenarioCatalog.list();
              }
          },
          openScenarios() {
              this.refreshScenariosList();
              CoCStateAccessor.switchScreen('scenarios');
          },
          refreshScenarioStore() {
              this.storeError = '';
              const store = window.CoCScenarioStore;
              if (!store) return;
              store.init().then(() => {
                  if (window.CoCScenarioCatalog) window.CoCScenarioCatalog.refresh();
                  this.refreshStore();
              });
          },
          openScenarioStore() {
              const store = window.CoCScenarioStore;
              if (!store) {
                  window.CoCState.showToast && window.CoCState.showToast('模组库未加载。', 'danger');
                  return;
              }
              this.loadPublicCatalogBase();
              this.refreshScenarioStore();
              CoCStateAccessor.switchScreen('scenario_store');
          },
          loadPublicCatalogBase() {
              const store = window.CoCScenarioStore;
              if (store && store.getPublicCatalogBase) {
                  this.publicCatalogBase = store.getPublicCatalogBase() || '';
              }
          },
          savePublicCatalogBase() {
              const store = window.CoCScenarioStore;
              if (!store || !store.setPublicCatalogBase) return;
              store.setPublicCatalogBase(this.publicCatalogBase);
              window.CoCState.showToast && window.CoCState.showToast('公开资源基址已保存。', 'success');
          },
          refreshStore() {
              const store = window.CoCScenarioStore;
              if (!store) return;
              this.storeItems = store.listCatalog();
              if (this.selectedStoreId && !this.storeItems.find((i) => i.id === this.selectedStoreId)) {
                  this.selectedStoreId = null;
              }
          },
          selectStoreItem(id) {
              this.selectedStoreId = id;
              this.storeError = '';
          },
          storeStatusLabel(status) {
              return { builtin: '已内置', downloaded: '已下载', available: '可下载', official: '官方链接' }[status] || status;
          },
          storeStatusBadge(status) {
              return { builtin: 'bg-warning text-dark', downloaded: 'bg-success', available: 'bg-secondary', official: 'bg-info text-dark' }[status] || 'bg-secondary';
          },
          downloadSourceLabel(source) {
              return { public: '公开网站', mirror: '公开网站', bundled: '同域包', fallback: '同域包', remote: '公开网站', import: '本地导入', official_pdf_converted: 'PDF 本地转换' }[source] || source;
          },
          downloadSourceBadge(source) {
              return { public: 'bg-info text-dark', mirror: 'bg-info text-dark', bundled: 'bg-secondary', fallback: 'bg-secondary', remote: 'bg-info text-dark', import: 'bg-warning text-dark', official_pdf_converted: 'bg-warning text-dark' }[source] || 'bg-secondary';
          },
          importProgressLabel(step, detail) {
              const labels = { download: '下载中…', parse: '解析 PDF…', convert: '生成剧情…', ai_chunk: 'AI 转换中…', done: '完成' };
              if (step === 'ai_chunk' && detail && detail.total) {
                  return `AI 转换中… (${detail.index || '?'}/${detail.total})`;
              }
              return labels[step] || step || '';
          },
          openOfficialUrl(url) {
              if (url) window.open(url, '_blank', 'noopener,noreferrer');
          },
          async doImportOfficialOneClick(catalogId) {
              const store = window.CoCScenarioStore;
              if (!store || !store.importOfficialOneClick) {
                  window.CoCState.showToast && window.CoCState.showToast('PDF 转换功能未加载。', 'danger');
                  return;
              }
              this.storeLoading = true;
              this.storeError = '';
              this.storeImportStep = 'download';
              this.storeImportDetail = '';
              try {
                  await store.importOfficialOneClick(catalogId, (step, detail) => {
                      this.storeImportStep = step;
                      this.storeImportDetail = detail || {};
                  });
                  this.refreshStore();
                  window.CoCState.showToast && window.CoCState.showToast('已导入，可在本地剧本模式游玩', 'success');
              } catch (e) {
                  this.storeError = String(e.message || e);
                  window.CoCState.showToast && window.CoCState.showToast('转换失败：' + this.storeError, 'danger');
              } finally {
                  this.storeLoading = false;
                  this.storeImportStep = '';
                  this.storeImportDetail = '';
              }
          },
          async doImportOfficialPdfFile(event, catalogId) {
              const file = event.target.files && event.target.files[0];
              event.target.value = '';
              if (!file) return;
              const store = window.CoCScenarioStore;
              if (!store || !store.importOfficialOneClick) return;
              this.storeLoading = true;
              this.storeError = '';
              this.storeImportStep = 'parse';
              try {
                  const arrayBuffer = await file.arrayBuffer();
                  await store.importOfficialOneClick(catalogId, (step, detail) => {
                      this.storeImportStep = step;
                      this.storeImportDetail = detail || {};
                  }, { arrayBuffer, forceRuleBased: true });
                  this.refreshStore();
                  window.CoCState.showToast && window.CoCState.showToast('已导入，可在本地剧本模式游玩', 'success');
              } catch (e) {
                  this.storeError = String(e.message || e);
                  window.CoCState.showToast && window.CoCState.showToast('转换失败：' + this.storeError, 'danger');
              } finally {
                  this.storeLoading = false;
                  this.storeImportStep = '';
                  this.storeImportDetail = '';
              }
          },
          async doImportOfficialPack(event, catalogId) {
              const file = event.target.files && event.target.files[0];
              event.target.value = '';
              if (!file) return;
              const store = window.CoCScenarioStore;
              if (!store || !store.importOfficialPack) {
                  window.CoCState.showToast && window.CoCState.showToast('导入功能未加载。', 'danger');
                  return;
              }
              this.storeLoading = true;
              this.storeError = '';
              try {
                  await store.importOfficialPack(catalogId, file);
                  this.refreshStore();
                  window.CoCState.showToast && window.CoCState.showToast('官方模组 JSON 已导入本地。', 'success');
              } catch (e) {
                  this.storeError = String(e.message || e);
                  window.CoCState.showToast && window.CoCState.showToast('导入失败：' + this.storeError, 'danger');
              } finally {
                  this.storeLoading = false;
              }
          },
          async doDownloadScenario(id) {
              const store = window.CoCScenarioStore;
              if (!store) return;
              this.storeLoading = true;
              this.storeError = '';
              try {
                  await store.downloadScenario(id);
                  this.refreshStore();
                  window.CoCState.showToast && window.CoCState.showToast('模组已下载到本地。', 'success');
              } catch (e) {
                  this.storeError = String(e.message || e);
                  window.CoCState.showToast && window.CoCState.showToast('下载失败：' + this.storeError, 'danger');
              } finally {
                  this.storeLoading = false;
              }
          },
          async doRemoveDownload(id) {
              const store = window.CoCScenarioStore;
              if (!store) return;
              const ok = await window.CoCState.confirmAction('确认从本地移除该模组？（内置模组无法移除）', { title: '移除下载', danger: true, okText: '移除' });
              if (!ok) return;
              this.storeLoading = true;
              try {
                  await store.removeDownload(id);
                  this.refreshStore();
                  window.CoCState.showToast && window.CoCState.showToast('已移除本地模组。', 'success');
              } catch (e) {
                  window.CoCState.showToast && window.CoCState.showToast('移除失败。', 'danger');
              } finally {
                  this.storeLoading = false;
              }
          },
          startLocalScenario(scenarioId) {
              if (window.CoCState.gameState.roster.length === 0) {
                  window.CoCState.showToast && window.CoCState.showToast('请先创建至少一名调查员。', 'warning');
                  this.pendingScenarioId = scenarioId;
                  CoCStateAccessor.switchScreen('character');
                  return;
              }
              const runner = window.CoCScenarioRunner;
              if (!runner || !runner.startScenario(scenarioId)) {
                  window.CoCState.showToast && window.CoCState.showToast('剧本加载失败。', 'danger');
                  return;
              }
              this.pendingScenarioId = null;
              CoCStateAccessor.switchScreen('story');
              window.CoCState.scrollToBottom && window.CoCState.scrollToBottom();
          },
          toggleKpEngine(event) {
              const eng = window.KpExecutionEngine || window.CoCLondonKpEngine;
              if (!eng || !eng.setKpEngineEnabled) {
                  window.CoCState.showToast && window.CoCState.showToast('KP 引擎模块未加载。', 'danger');
                  if (event && event.target) event.target.checked = false;
                  return;
              }
              const gs = window.CoCState.gameState;
              const enabled = !!(event && event.target && event.target.checked);
              eng.setKpEngineEnabled(gs, enabled);
              if (!enabled) gs.londonKpState = null;
              if (window.CoCKpConfig && window.CoCKpConfig.saveKpPreference) {
                  window.CoCKpConfig.saveKpPreference(gs.activeModuleId, enabled);
              }
              if (enabled && window.KpGameLoop) {
                  window.KpGameLoop.register(gs);
              } else if (window.KpGameLoop) {
                  window.KpGameLoop.unregister();
              }
              window.CoCState.showToast && window.CoCState.showToast(
                  enabled ? 'KP 协议引擎已启用。' : 'KP 协议引擎已关闭。',
                  enabled ? 'success' : 'secondary'
              );
          },
          onDifficultyPresetChange(event) {
              const preset = event && event.target ? event.target.value : '';
              if (preset === 'divine_war' && !window.CoCState.gameState.kpEngine?.enabled) {
                  window.CoCState.showToast && window.CoCState.showToast(
                      '神战预设建议启用 KP 协议引擎（大厅开关）。',
                      'warning'
                  );
              }
          }
      },
      mounted() { this.refreshData(); },
      watch: {
          'gameState.currentScreen'(newScreen) {
              if (newScreen === 'modules') this.modules = CoCStateAccessor.getModules();
              if (newScreen === 'lobby') this.autoSave = CoCStateAccessor.getAutoSave();
              if (newScreen === 'scenarios') this.refreshScenariosList();
              if (newScreen === 'scenario_store') this.refreshScenarioStore();
              if (newScreen === 'saves') { this.saveSlots = CoCStateAccessor.getSaveSlots(); CoCStateAccessor.getStorageStatus('slot1', '预估存档'); }
          }
      }
  };
  
window.ViewLobby = ViewLobby;
