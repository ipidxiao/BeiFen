// GENERATED from js/views/creator_view.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

window.ViewCreator = {
    template: `
        <div class="card card-custom p-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-secondary btn-sm" @click="goBack">⬅ 返回</button>
                    <h4 class="text-warning m-0">📝 调查员档案</h4>
                </div>
                <!-- Quick-start presets -->
                <div v-if="!draftChar.name" class="creator-quick-start mb-3 p-2 rounded">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="creator-quick-start-label">⚡ 快速开始 — 选择一个预置调查员</span>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <button v-for="p in CHARACTER_PRESETS" :key="p.name"
                            class="btn btn-sm btn-outline-warning py-1 px-2"
                            @click="applyPreset(p)"
                            :title="p.desc">
                            {{ p.avatar }} {{ p.label }}
                        </button>
                    </div>
                    <div class="creator-quick-start-hint">一键创建完整角色，即刻开始冒险。也可手动填写下方表单。</div>
                </div>
            </div>
            <ul class="nav nav-tabs creator-nav-tabs mb-3" role="tablist">
                <li class="nav-item" role="presentation"><a class="nav-link" role="tab" :class="{active: activeCreatorTab === 'stats'}" :aria-selected="activeCreatorTab === 'stats'" @click="activeCreatorTab = 'stats'" href="javascript:void(0)">数值与技能</a></li>
                <li class="nav-item" role="presentation"><a class="nav-link" role="tab" :class="{active: activeCreatorTab === 'backstory'}" :aria-selected="activeCreatorTab === 'backstory'" @click="activeCreatorTab = 'backstory'" href="javascript:void(0)">背景与经历</a></li>
            </ul>

            <div v-show="activeCreatorTab === 'stats'">
                <div class="row g-2 mb-2">
                    <div class="col-6">
                        <label class="sheet-label" for="creator-name">姓名</label>
                        <input id="creator-name" type="text" class="form-control form-control-sm bg-dark text-light border-secondary" v-model="draftChar.name" aria-describedby="creator-name-hint" autocomplete="name">
                        <div id="creator-name-hint" class="form-field-hint">调查员在模组中的称呼</div>
                    </div>
                    <div class="col-6">
                        <label class="sheet-label" for="creator-player">玩家</label>
                        <input id="creator-player" type="text" class="form-control form-control-sm bg-dark text-light border-secondary" v-model="draftChar.player" aria-describedby="creator-player-hint">
                        <div id="creator-player-hint" class="form-field-hint">桌游玩家姓名或昵称</div>
                    </div>
                </div>
                
                <div class="row g-2 mb-3">
                    <div class="col-4">
                        <label class="sheet-label" for="creator-age">年龄 (影响属性)</label>
                        <input id="creator-age" type="number" class="form-control form-control-sm bg-dark text-light border-secondary" v-model="draftChar.age" aria-describedby="creator-age-hint" min="15" max="90">
                        <div id="creator-age-hint" class="form-field-hint">影响属性修正与移动力</div>
                    </div>
                    <div class="col-8">
                        <label class="sheet-label text-info" for="creator-era">时代背景 (决定可选职业)</label>
                        <select id="creator-era" class="form-select form-select-sm bg-dark text-light border-secondary" v-model="draftChar.era" aria-describedby="creator-era-hint">
                            <option value="1920s">1920s (经典)</option>
                            <option value="现代">现代 (Modern)</option>
                            <option value="1890s">1890s (煤气灯)</option>
                        </select>
                        <div id="creator-era-hint" class="form-field-hint">切换时代会过滤不可用职业</div>
                    </div>
                </div>
                
                <div class="d-flex mb-2 gap-2">
                    <button class="btn btn-info flex-grow-1 fw-bold btn-sm" @click="rollAllStats">🎲 掷骰生成</button>
                    <button class="btn btn-outline-warning btn-sm" @click="showSTImport = !showSTImport">📥 .st 导入</button>
                </div>
                
                <div v-if="showSTImport" class="mb-3 p-2 border border-warning rounded bg-dark">
                      <div v-if="!importPreview">
                          <label class="sheet-label text-warning fw-bold">📥 粘贴角色数据</label>
                          <div class="text-muted small mb-2">支持 .st指令 / 属性表 / 技能表，中英文均可</div>
                          <textarea class="form-control form-control-sm bg-dark text-light border-secondary mb-2" rows="5" v-model="draftChar.stImportText" placeholder=".st 力量50 体质60 体型65 敏捷70 外貌45 智力75 意志55 教育80 幸运60&#10;侦查:75 聆听:60 图书馆使用:55 急救:45"></textarea>
                          <button class="btn btn-warning btn-sm w-100 fw-bold" @click="importSTData">🔍 解析数据</button>
                      </div>
                      <div v-else>
                          <div class="text-warning fw-bold mb-2">✅ 解析结果预览</div>
                          <div v-if="Object.keys(importPreview.info).length > 0" class="mb-2">
                              <div class="text-muted small fw-bold mb-1">【人物信息】</div>
                              <div class="d-flex flex-wrap gap-1">
                                  <span v-for="(val, key) in importPreview.info" :key="key" class="badge bg-dark border border-secondary text-light">{{key}}: {{val}}</span>
                              </div>
                          </div>
                          <div v-if="Object.keys(importPreview.attrs).length > 0" class="mb-2">
                              <div class="text-info small fw-bold mb-1">【基础属性】(共 {{Object.keys(importPreview.attrs).length}} 项)</div>
                              <div class="d-flex flex-wrap gap-1">
                                  <span v-for="(val, key) in importPreview.attrs" :key="key" class="badge bg-secondary text-white">{{key}}: {{val}}</span>
                              </div>
                          </div>
                          <div v-if="Object.keys(importPreview.skills).length > 0" class="mb-2">
                              <div class="text-success small fw-bold mb-1">【技能】(共 {{Object.keys(importPreview.skills).length}} 项)</div>
                              <div class="d-flex flex-wrap gap-1 creator-import-skills">
                                  <span v-for="(val, key) in importPreview.skills" :key="key" class="badge" style="background:#1a4a5a; color:#a0f0ff;">{{key}}: {{val}}</span>
                              </div>
                          </div>
                          <div class="text-muted small mb-2">⚠️ 确认后将覆盖现有数值。</div>
                          <div class="d-flex gap-2">
                              <button class="btn btn-success btn-sm flex-grow-1 fw-bold" @click="confirmImport">✅ 确认导入</button>
                              <button class="btn btn-outline-secondary btn-sm" @click="cancelImport">✏️ 重新编辑</button>
                          </div>
                      </div>
                  </div>

                <div v-show="draftChar.attrs.STR > 0">
                    
                    <div class="mb-3 bg-dark border border-secondary rounded shadow-sm creator-radar-wrap">
                        <canvas v-if="!chartUnavailable" id="radarChart"></canvas>
                        <div v-else class="text-muted small text-center pt-5 px-2" role="status">
                            雷达图不可用（Chart.js 未加载）。属性数值见下方网格。
                        </div>
                    </div>
                    
                    <div class="row g-1 mb-3">
                        <div class="col-4" v-for="(val, key) in draftChar.attrs" :key="key">
                            <div class="attr-grid-box">
                                <div class="attr-eval-badge badge" :class="val>=80 ? 'bg-danger' : (val>=50 ? 'bg-success' : 'bg-secondary')">
                                    {{ getAttrEvaluation(val) }}
                                </div>
                                <div class="attr-title">{{ key }}</div>
                                <div class="attr-val">
                                    {{ val }}
                                    <span v-if="draftChar.attrModifiers[key] > 0" class="text-success ms-1" style="font-size: 0.5em; vertical-align: super;">+{{ draftChar.attrModifiers[key] }}</span>
                                    <span v-else-if="draftChar.attrModifiers[key] < 0" class="text-danger ms-1" style="font-size: 0.5em; vertical-align: super;">{{ draftChar.attrModifiers[key] }}</span>
                                </div>
                                <div class="attr-sub">
                                    <span>半:{{ Math.floor(val/2) }}</span>
                                    <span>极:{{ Math.floor(val/5) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-2 mb-3 text-center shadow-sm creator-derived-panel">
                        <div class="row border-bottom border-secondary pb-2 mb-2">
                            <div class="col"><strong class="text-danger d-block">HP</strong> {{ draftChar.derived.hp }}</div>
                            <div class="col border-start border-end border-secondary"><strong class="text-primary d-block">MP</strong> {{ draftChar.derived.mp }}</div>
                            <div class="col"><strong class="text-info d-block">SAN</strong> {{ draftChar.derived.san }}</div>
                        </div>
                        <div class="row g-2 px-1">
                            <div class="col-4"><div class="sheet-box border-info p-1"><div class="sheet-micro-label">伤害加值</div><div class="sheet-micro-val fw-bold text-white mt-1">{{ draftChar.derived.db }}</div></div></div>
                            <div class="col-4"><div class="sheet-box border-info p-1"><div class="sheet-micro-label">体格</div><div class="sheet-micro-val fw-bold text-white mt-1">{{ draftChar.derived.build }}</div></div></div>
                            <div class="col-4"><div class="sheet-box border-info p-1"><div class="sheet-micro-label">移动力</div><div class="sheet-micro-val fw-bold text-white mt-1">{{ draftChar.derived.mov }}</div></div></div>
                        </div>
                    </div>
                    
                    <div class="border border-warning rounded p-2 mb-3 bg-dark shadow-sm">
                        <h6 class="text-warning mb-2 border-bottom border-warning pb-1">💼 选择职业</h6>
                        <label class="sheet-label text-light mb-1">根据上述属性，为你挑选最合适的行当：</label>
                        <select class="form-select form-select-sm bg-dark text-light border-warning" v-model="draftChar.job">
                            <option :value="null" disabled>请选择职业以解锁本职技能点</option>
                            <option v-for="(job, idx) in availableJobs" :key="idx" :value="job">{{ job.name }}</option>
                        </select>
                    </div>
                    
                    <div class="border border-secondary rounded p-2 mb-3 bg-dark shadow-sm" :style="{ opacity: draftChar.job ? 1 : 0.5, pointerEvents: draftChar.job ? 'auto' : 'none' }">
                        <h6 class="text-success mb-2 border-bottom border-secondary pb-1">🔧 技能分配面板</h6>
                        <div class="row align-items-center small mb-2 border-bottom border-dark pb-2">
                            <div class="col-4 fw-bold" style="color:#e0e0e0;">🎯 可用点数：</div>
                            <div class="col-8 d-flex justify-content-end gap-3" style="color:#cccccc;">
                                <span>本职 <strong class="text-warning fs-6" :class="pointStats.occRemain === 0 ? 'text-success' : ''">{{ pointStats.occRemain }}</strong></span>
                                <span>兴趣 <strong class="text-info fs-6" :class="pointStats.perRemain === 0 ? 'text-success' : ''">{{ pointStats.perRemain }}</strong></span>
                            </div>
                        </div>
                        <div v-if="pointStats.occRemain !== 0 || pointStats.perRemain !== 0" class="small text-warning mb-2" role="status">
                            须将本职与兴趣技能点全部分配完毕（剩余=0）方可登记归档。
                        </div>
                        <div class="row align-items-center small fw-bold mb-2 pb-1 border-bottom border-secondary" style="padding-right: 6px; color: #cccccc;">
                            <div class="col-4">📋 技能名称</div>
                            <div class="col-2 text-center px-0">总值</div>
                            <div class="col-3 text-center text-warning px-0">本职(±5)</div>
                            <div class="col-3 text-center text-info px-0">兴趣(±5)</div>
                        </div>
                        <div class="creator-skill-scroll">
                            <div v-for="skill in dynamicSkillNames" :key="skill" class="row align-items-center flex-nowrap mb-1 border-bottom border-dark pb-1">
                                <div class="col-4 small text-truncate" :class="isUnlockedSkill(skill) ? 'unlocked-skill' : ''" style="padding-right:0; color: #e0e0e0;">
                                    {{ skill }}
                                    <span v-if="isClassSkill(skill)" class="badge bg-warning text-dark ms-1" style="font-size: 0.55em;">本职</span>
                                    <span v-if="isUnlockedSkill(skill)" class="badge bg-danger ms-1" style="font-size: 0.55em;">解锁</span>
                                </div>
                                <div class="col-2 text-center fw-bold px-0" :class="isUnlockedSkill(skill) ? 'text-danger' : 'text-white'">{{ getSkillTotal(skill) }}</div>
                                <div class="col-3 d-flex justify-content-center align-items-center px-0 flex-nowrap">
                                    <button class="btn btn-sm btn-outline-warning py-0 px-1" style="line-height:1;" :disabled="!isClassSkill(skill)" @click="removeSkillPoint(skill, 'occ')">-</button>
                                    <span class="text-warning fw-bold" style="width: 22px; text-align: center; font-size: 0.85rem;">{{ getSkillOcc(skill) }}</span>
                                    <button class="btn btn-sm btn-warning py-0 px-1" style="line-height:1;" :disabled="!isClassSkill(skill) || pointStats.occRemain < 5" @mousedown.prevent="startAutoAdd(skill, 'occ')" @mouseup="stopAutoAdd" @mouseleave="stopAutoAdd" @touchstart.prevent="startAutoAdd(skill, 'occ')" @touchend="stopAutoAdd" @touchcancel="stopAutoAdd">+</button>
                                </div>
                                <div class="col-3 d-flex justify-content-center align-items-center px-0 flex-nowrap">
                                    <button class="btn btn-sm btn-outline-info py-0 px-1" style="line-height:1;" @click="removeSkillPoint(skill, 'per')">-</button>
                                    <span class="text-info fw-bold" style="width: 22px; text-align: center; font-size: 0.85rem;">{{ getSkillPer(skill) }}</span>
                                    <button class="btn btn-sm btn-info py-0 px-1" style="line-height:1;" :disabled="pointStats.perRemain < 5" @mousedown.prevent="startAutoAdd(skill, 'per')" @mouseup="stopAutoAdd" @mouseleave="stopAutoAdd" @touchstart.prevent="startAutoAdd(skill, 'per')" @touchend="stopAutoAdd" @touchcancel="stopAutoAdd">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="activeCreatorTab === 'backstory'">
                <div class="mb-3 border border-warning rounded p-2 bg-dark shadow-sm">
                    <label class="sheet-label text-warning fw-bold">🎭 可选规则：有故事的调查员</label>
                    <select class="form-select form-select-sm bg-dark text-light border-secondary mb-2" v-model="draftChar.expPackage" @change="applyExperience" :disabled="draftChar.attrs.STR === 0">
                        <option :value="null">无特殊经历 (理智正常)</option>
                        <option v-for="(exp, idx) in availableExperiences" :key="idx" :value="exp">{{ exp.name }}</option>
                    </select>
                    <div v-if="draftChar.expPackage" class="small text-muted">
                        <span>{{ draftChar.expPackage.desc }}</span><br>
                        <strong class="text-danger">⚠️ 代价：</strong> 掷骰扣除 {{ draftChar.expPackage.sanLoss }} 理智 <strong class="text-danger">(当前已扣除 {{ draftChar.sanPenalty }} 点)</strong><br>
                        <strong class="text-info">💎 奖励：</strong> 获得 {{ draftChar.expPackage.bonusPoints }} 额外兴趣点，解锁技能 [{{ draftChar.expPackage.unlock.join(', ') }}]。
                    </div>
                </div>
                
                <div class="row g-2 mb-2 border-top border-secondary pt-2">
                    <div class="col-12"><label class="sheet-label">形象描述</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.description"></textarea></div>
                    <div class="col-12"><label class="sheet-label">思想与信念</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.ideology"></textarea></div>
                    <div class="col-12"><label class="sheet-label text-info">重要之人 (极易触发剧情)</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.significantPeople"></textarea></div>
                    <div class="col-12"><label class="sheet-label">意义非凡之地</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.meaningfulLocations"></textarea></div>
                    <div class="col-12"><label class="sheet-label">宝贵之物</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.treasuredPossessions"></textarea></div>
                    <div class="col-12"><label class="sheet-label">特质</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.traits"></textarea></div>
                    <div class="col-12"><label class="sheet-label text-danger">伤疤与疤痕</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.injuries"></textarea></div>
                    <div class="col-12"><label class="sheet-label text-danger">恐惧症与狂躁症</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.phobias"></textarea></div>
                    <div class="col-12"><label class="sheet-label text-warning">神话遭遇</label><textarea class="form-control form-control-sm bg-dark text-light border-secondary" rows="1" v-model="draftChar.backstory.encounters"></textarea></div>
                </div>
            </div>
            
            <div class="d-flex gap-2 mt-3 pt-2 border-top border-secondary">
                <button class="btn btn-outline-secondary" @click="switchScreen('character')">放弃</button>
                <button class="btn btn-success fw-bold flex-grow-1" @click="saveDraftCharacter" :disabled="!draftChar.name || draftChar.attrs.STR === 0 || !draftChar.job || pointStats.occRemain !== 0 || pointStats.perRemain !== 0">💾 登记归档</button>
            </div>
        </div>
    `,
    setup() { return Object.assign({ Engine: window.CoCEngine }, window.CoCState, window.CoCCreator); }
};
