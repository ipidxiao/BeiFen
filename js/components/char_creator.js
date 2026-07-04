// GENERATED from js/components/char_creator.mjs — do not edit; run: npm run build:js
window.CoCCreator = (function(State, Engine, Vue) {
    const CHARACTER_PRESETS = Object.freeze([
        {
            name: '私家侦探', label: '🔍 私家侦探', era: '1920s',
            job: { name: '私家侦探', skills: ['侦查','手枪','心理学','潜行','法律','乔装','汽车驾驶'] },
            attrs: { STR:50, CON:60, SIZ:50, DEX:60, APP:50, INT:70, POW:60, EDU:65, LUCK:50 },
            age: 35,
            skillPts: { '侦查':70, '手枪':60, '心理学':55, '潜行':50, '法律':40, '乔装':35, '汽车驾驶':45, '斗殴':40, '闪避':35 },
            desc: '雨夜办公室，最后一封委托信——这次案子不对劲。', avatar: '🕵️'
        },
        {
            name: '学者教授', label: '📖 学者教授', era: '1920s',
            job: { name: '教授', skills: ['图书馆使用','神秘学','外语','历史','考古学','心理学'] },
            attrs: { STR:40, CON:45, SIZ:50, DEX:55, APP:55, INT:80, POW:55, EDU:85, LUCK:50 },
            age: 45,
            skillPts: { '图书馆使用':80, '神秘学':65, '外语':60, '历史':55, '考古学':45, '心理学':40, '侦查':35, '说服':30 },
            desc: '密斯卡塔尼克大学的禁书区，藏着你永远不该翻阅的东西。', avatar: '📖'
        },
        {
            name: '退役军人', label: '🎖️ 退役军人', era: '1920s',
            job: { name: '士兵/陆战队', skills: ['斗殴','步枪/霰弹枪','急救','生存','攀爬','游泳','闪避'] },
            attrs: { STR:70, CON:75, SIZ:60, DEX:55, APP:45, INT:55, POW:50, EDU:55, LUCK:50 },
            age: 28,
            skillPts: { '斗殴':70, '步枪/霰弹枪':60, '急救':50, '生存':55, '攀爬':40, '游泳':35, '闪避':45, '投掷':40 },
            desc: '从弗兰德斯战壕活着回来，但有些恐怖超越了战争本身。', avatar: '🎖️'
        }
    ]);

    const applyPreset = (preset) => {
        if (!State || !Engine || !Vue) return;
        draftChar.attrs = { ...preset.attrs };
        draftChar.age = preset.age;
        draftChar.name = preset.name;
        draftChar.era = preset.era;
        draftChar.job = preset.job;
        draftChar.hp = Math.floor((preset.attrs.CON + preset.attrs.SIZ) / 10);
        draftChar.sanity = preset.attrs.POW;
        draftChar.luck = preset.attrs.LUCK;
        draftChar.mov = 8;
        draftChar.skillAllocations = {};
        Object.entries(preset.skillPts).forEach(([skill, val]) => {
            draftChar.skillAllocations[skill] = { occ: val, per: 0 };
        });
        draftChar.expPackage = null;
        draftChar.sanPenalty = 0;
        const derived = Engine.calculateDerived(draftChar.attrs, preset.age);
        draftChar.derived = derived;
        if (State.showToast) State.showToast(`✅ ${preset.name} 已就绪！可直接开始冒险。`, 'success');
        if (State.switchScreen) setTimeout(() => State.switchScreen('story'), 500);
    };

    if (!State || !Engine || !Vue) return { CHARACTER_PRESETS, applyPreset };
    const { computed, nextTick, watch, ref } = Vue;
    const { draftChar, gameState, activeCreatorTab, switchScreen } = State;
    const notify = (message, type = 'warning') => State.showToast ? State.showToast(message, type) : console.warn(message);
    
    let radarChartInstance = null;
    const showSTImport = ref(false);

    // 💡 智能过滤：根据当前选择的时代，过滤经历包
    const availableExperiences = computed(() => {
        let allExp = (typeof CoCExperiences !== "undefined" ? CoCExperiences : []) || [];
        let currentEra = draftChar.era || "1920s";
        return allExp.filter(exp => {
            if (!exp.era) return true;
            return exp.era.includes("所有") || exp.era.some(e => currentEra.includes(e));
        });
    });

    // 💡 智能过滤：根据时代自动屏蔽不相关的职业
    const availableJobs = computed(() => {
        let allJobs = Engine.Occupations || [];
        let currentEra = draftChar.era || "1920s";
        
        // 时代特征关键字提取
        const modernKeywords = ["现代", "网络主播", "YouTuber", "无人机", "网约车", "SWAT", "骇客", "计算机", "IT", "程序员", "CSI", "网络"];
        const gaslightKeywords = ["1890s", "维多利亚", "煤气灯", "马车夫"];

        return allJobs.filter(job => {
            if (currentEra === "1920s") {
                // 1920s 禁用现代和煤气灯职业
                return !modernKeywords.some(kw => job.name.includes(kw)) && !gaslightKeywords.some(kw => job.name.includes(kw));
            } else if (currentEra === "1890s") {
                // 1890s 禁用现代职业
                return !modernKeywords.some(kw => job.name.includes(kw));
            } else if (currentEra === "现代") {
                // 现代禁用煤气灯时代专属职业
                return !gaslightKeywords.some(kw => job.name.includes(kw));
            }
            return true;
        });
    });

    // 💡 监听时代变化：如果切换了时代导致当前职业不可用，自动重置职业
    watch(() => draftChar.era, () => {
        if (draftChar.job) {
            const isValid = availableJobs.value.some(j => j.name === draftChar.job.name);
            if (!isValid) {
                draftChar.job = null;
                draftChar.skillAllocations = {}; // 重置加点
            }
        }
        if (draftChar.expPackage) {
            const isValidExp = availableExperiences.value.some(e => e.name === draftChar.expPackage.name);
            if (!isValidExp) {
                draftChar.expPackage = null;
                draftChar.sanPenalty = 0;
            }
        }
    });

    const isVisibleSkill = (skillName) => !Engine.isVisibleSkillName || Engine.isVisibleSkillName(skillName);

    const dynamicSkillNames = computed(() => {
        const extraSkills = [];
        if (draftChar.expPackage && draftChar.expPackage.unlock) {
            draftChar.expPackage.unlock.forEach(s => { if (!extraSkills.includes(s)) extraSkills.push(s); });
        }
        Object.keys(draftChar.skillAllocations || {}).forEach(s => {
            if (!extraSkills.includes(s)) extraSkills.push(s);
        });

        if (Engine.getVisibleSkillNames) return Engine.getVisibleSkillNames(extraSkills);

        const baseSkills = Object.keys(Engine.BaseSkills || {});
        extraSkills.forEach(s => { if (!baseSkills.includes(s)) baseSkills.push(s); });
        return baseSkills.filter(isVisibleSkill);
    });

    const isClassSkill = (skillName) => {
        if (!draftChar.job) return false;
        if (Engine.isClassSkillName) return Engine.isClassSkillName(skillName, draftChar.job.classSkillsString);
        return draftChar.job.classSkillsString.includes(skillName);
    };

    const pointStats = computed(() => {
        let occMax = draftChar.job ? draftChar.job.calcPoints(draftChar.attrs) : 0;
        let bonus = draftChar.expPackage ? draftChar.expPackage.bonusPoints : 0;
        let perMax = (draftChar.attrs.INT * 2) + bonus;
        let occSpent = 0; let perSpent = 0;
        for (let skill in draftChar.skillAllocations) {
            if (!isVisibleSkill(skill)) continue;
            occSpent += draftChar.skillAllocations[skill].occ; perSpent += draftChar.skillAllocations[skill].per;
        }
        return { occMax, perMax, occSpent, perSpent, occRemain: occMax - occSpent, perRemain: perMax - perSpent };
    });

    const getSkillTotal = (skillName) => {
        let base = Engine.getSkillValue(draftChar, skillName); // 使用新的Engine.getSkillValue来获取基础值
        let alloc = draftChar.skillAllocations[skillName] || { occ: 0, per: 0 };
        return base + alloc.occ + alloc.per;
    };

    const applyExperience = () => {
        if (!draftChar.expPackage) { draftChar.sanPenalty = 0; draftChar.derived.san = draftChar.attrs.POW; return; }
        draftChar.sanPenalty = Engine.parseDice(draftChar.expPackage.sanLoss);
        draftChar.derived.san = Math.max(0, draftChar.attrs.POW - draftChar.sanPenalty);
    };

    let _autoAddTimer = null;
    const startAutoAdd = (skillName, type) => {
        // M-008 FIX: cancel previous auto-add before starting new skill
        if (_autoAddTimer) { clearTimeout(_autoAddTimer); clearInterval(_autoAddTimer); _autoAddTimer = null; }
        // First immediate add
        addSkillPoint(skillName, type);
        // Then repeat every 80ms after 300ms initial delay
        _autoAddTimer = setTimeout(() => {
            _autoAddTimer = setInterval(() => addSkillPoint(skillName, type), 80);
        }, 300);
    };
    const stopAutoAdd = () => {
        if (_autoAddTimer) {
            clearTimeout(_autoAddTimer);
            clearInterval(_autoAddTimer);
            _autoAddTimer = null;
        }
    };
    const addSkillPoint = (skillName, type) => {
        if (draftChar.attrs.STR === 0) { notify("请先掷骰决定基础属性！"); return; }
        if (!draftChar.skillAllocations[skillName]) draftChar.skillAllocations[skillName] = { occ: 0, per: 0 };
        
        if (type === 'occ') {
            if (!draftChar.job) { notify("请先选择职业！"); return; }
            
            // 💡 智能本职判定：支持父子技能继承（如职业有"射击"，允许给"手枪"加本职点）
            if (!isClassSkill(skillName)) { notify("此技能不是本职技能！"); return; }
            if (pointStats.value.occRemain >= 5 && getSkillTotal(skillName) + 5 <= 99) draftChar.skillAllocations[skillName].occ += 5;
        } else if (type === 'per') {
            if (pointStats.value.perRemain >= 5 && getSkillTotal(skillName) + 5 <= 99) draftChar.skillAllocations[skillName].per += 5;
        }
    };

    const removeSkillPoint = (skillName, type) => {
        if (draftChar.skillAllocations[skillName] && draftChar.skillAllocations[skillName][type] >= 5) draftChar.skillAllocations[skillName][type] -= 5;
    };

    const getSkillOcc = (skillName) => draftChar.skillAllocations[skillName] ? draftChar.skillAllocations[skillName].occ : 0;
    const getSkillPer = (skillName) => draftChar.skillAllocations[skillName] ? draftChar.skillAllocations[skillName].per : 0;
    const isUnlockedSkill = (skillName) => draftChar.expPackage && draftChar.expPackage.unlock && draftChar.expPackage.unlock.includes(skillName);

    const renderRadarChart = () => {
        nextTick(() => {
            const ctx = document.getElementById('radarChart');
            if (!ctx) return;
            const dataValues = [
                draftChar.attrs.STR, draftChar.attrs.CON, draftChar.attrs.SIZ,
                draftChar.attrs.DEX, draftChar.attrs.APP, draftChar.attrs.INT,
                draftChar.attrs.POW, draftChar.attrs.EDU
            ];
            if (radarChartInstance) {
                radarChartInstance.data.datasets[0].data = dataValues;
                radarChartInstance.update();
            } else {
                radarChartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['力量STR', '体质CON', '体型SIZ', '敏捷DEX', '外貌APP', '智力INT', '意志POW', '教育EDU'],
                        datasets: [{ label: '能力评估', data: dataValues, backgroundColor: 'rgba(240, 173, 78, 0.2)', borderColor: 'rgba(240, 173, 78, 1)', pointBackgroundColor: 'rgba(240, 173, 78, 1)', pointBorderColor: '#fff', }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.2)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#ccc', font: { size: 10 } }, ticks: { display: false, min: 0, max: 100, stepSize: 20 } } }, plugins: { legend: { display: false } } }
                });
            }
        });
    };

    const rollAllStats = () => {
        let rawAttrs = { STR: Engine.roll3D6x5(), CON: Engine.roll3D6x5(), DEX: Engine.roll3D6x5(), APP: Engine.roll3D6x5(), POW: Engine.roll3D6x5(), LUCK: Engine.roll3D6x5(), SIZ: Engine.roll2D6plus6x5(), INT: Engine.roll2D6plus6x5(), EDU: Engine.roll2D6plus6x5() };
        let age = parseInt(draftChar.age) || 25;
        let finalAttrs = Engine.applyAgeModifiers(rawAttrs, age);
        
        for (let key in finalAttrs) draftChar.attrModifiers[key] = finalAttrs[key] - rawAttrs[key];
        
        Object.assign(draftChar.attrs, finalAttrs);
        draftChar.derived = Engine.calculateDerived(draftChar.attrs, draftChar.age);
        draftChar.skillAllocations = {}; draftChar.job = null; draftChar.expPackage = null; draftChar.sanPenalty = 0;
        renderRadarChart();
    };

    const importPreview = Vue.ref(null);

      const importSTData = () => {
          const text = draftChar.stImportText || "";
          if (!text.trim()) { notify("请输入数据！"); return; }
          let cleanText = text.replace(/^\.st\s*/i, "").trim();

          // 属性映射 中英文
          const attrMapCN = {
              "力量":"STR","体质":"CON","体型":"SIZ","敏捷":"DEX",
              "外貌":"APP","智力":"INT","灵感":"INT","意志":"POW",
              "教育":"EDU","幸运":"LUCK","运气":"LUCK",
              "Strength":"STR","Constitution":"CON","Size":"SIZ","Dexterity":"DEX",
              "Appearance":"APP","Intelligence":"INT","Power":"POW","Education":"EDU","Luck":"LUCK"
          };
          const attrEN = ["STR","CON","SIZ","DEX","APP","INT","POW","EDU","LUCK"];
          // 信息字段
          const infoMapCN = { "姓名":"name","名字":"name","职业":"job","年龄":"age","性别":"gender" };

          const parsed = { attrs: {}, skills: {}, info: {} };
          const eng = (typeof CoCEngine !== "undefined" ? CoCEngine : null);
          const allSkillKeys = Object.keys(eng.BaseSkills || {});

          // 解析信息行 (姓名: 张三)
          const infoReg = /([^\d\s:：\n,，①②③]{1,6})[\s:：]+([^\d\n,，:：]{1,20})/g;
          let m;
          while ((m = infoReg.exec(cleanText)) !== null) {
              const k = m[1].trim(), v = m[2].trim();
              if (infoMapCN[k] && v.length > 0) parsed.info[infoMapCN[k]] = v;
          }

          // 解析数值对 (词+数字)
          const valReg = /([^\d\s,，\n\r:：\t①②③【】]{1,12})[\s:：\t]*?(\d{1,3})(?!\d)/g;
          while ((m = valReg.exec(cleanText)) !== null) {
              let name = m[1].trim().replace(/[①②③]/g,'');
              let val = parseInt(m[2]);
              if (val < 1 || val > 100) continue;  // 排除乱码数字
              if (name.length < 2) continue;

              // 1. 中文属性名
              if (attrMapCN[name]) { parsed.attrs[attrMapCN[name]] = val; continue; }
              // 2. 英文属性名
              if (attrEN.includes(name.toUpperCase())) { parsed.attrs[name.toUpperCase()] = val; continue; }
              // 3. 精确匹配技能
              if (eng.BaseSkills[name] !== undefined) { parsed.skills[name] = val; continue; }
              // 4. 别名匹配
              let aliasHit = false;
              for (const key of allSkillKeys) {
                  const def = eng.BaseSkills[key];
                  if (def.aliases && def.aliases.some(a => a.replace(/[①②③：:]/g,'').trim() === name)) {
                      parsed.skills[key] = val; aliasHit = true; break;
                  }
              }
              if (aliasHit) continue;
              // 5. 模糊包含匹配
              let fuzzyHit = false;
              for (const key of allSkillKeys) {
                  if ((key.includes(name) && name.length >= 2) || (name.includes(key) && key.length >= 3)) {
                      parsed.skills[key] = val; fuzzyHit = true; break;
                  }
              }
              if (fuzzyHit) continue;
              // 6. 未知技能 → 直接存入
              if (name.length >= 2) parsed.skills[name] = val;
          }

          if (!Object.keys(parsed.attrs).length && !Object.keys(parsed.skills).length) {
              notify("❌ 未能识别数据，请检查格式。\n\n支持：\n· .st 力量50 体质60...\n· STR:50 CON:60...\n· 侦查:75 聆听:60...", "danger");
              return;
          }
          importPreview.value = parsed;
      };

      const confirmImport = () => {
          const parsed = importPreview.value;
          if (!parsed) return;
          const eng = (typeof CoCEngine !== "undefined" ? CoCEngine : null);
          // 用导入的属性+当前属性作为基础来计算技能基础值
          const baseAttrs = Object.assign({}, draftChar.attrs, parsed.attrs);
          const dummyChar = { attrs: baseAttrs, skills: {} };

          // 写入属性
          Object.assign(draftChar.attrs, parsed.attrs);
          // 写入信息
          if (parsed.info.name) draftChar.name = parsed.info.name;
          if (parsed.info.age) draftChar.age = parseInt(parsed.info.age) || draftChar.age;

          // 关键：技能导入用"最终值 - 基础值 = occ加点"，确保 getSkillTotal 计算正确
          draftChar.skillAllocations = {};
          for (const [skillName, finalVal] of Object.entries(parsed.skills)) {
              if (eng.isVisibleSkillName && !eng.isVisibleSkillName(skillName)) continue;
              const baseVal = eng.getSkillValue(dummyChar, skillName);
              const delta = Math.max(0, finalVal - baseVal);
              if (delta > 0) draftChar.skillAllocations[skillName] = { occ: delta, per: 0 };
          }
          draftChar.derived = eng.calculateDerived(draftChar.attrs, draftChar.age);
          importPreview.value = null;
          showSTImport.value = false;
          draftChar.stImportText = "";
          renderRadarChart();
      };

      const cancelImport = () => { importPreview.value = null; };

      const saveDraftCharacter = () => {
        let finalSkills = {};
        for (let s of dynamicSkillNames.value) finalSkills[s] = getSkillTotal(s);
        const derivedData = JSON.parse(JSON.stringify(draftChar.derived));
        derivedData.maxHp = derivedData.maxHp || derivedData.hp;
        derivedData.hp = derivedData.maxHp;
        
        gameState.roster.push({ 
            name: draftChar.name, jobName: draftChar.job ? draftChar.job.name : "无业", 
            hp: derivedData.maxHp, sanity: draftChar.derived.san, 
            attrs: JSON.parse(JSON.stringify(draftChar.attrs)), derived: derivedData,
            skills: finalSkills, backstory: JSON.parse(JSON.stringify(draftChar.backstory)),
            expName: draftChar.expPackage ? draftChar.expPackage.name : "无", isInsane: false,
                    isActive: true, // 默认加入剧情
                    // C-003 FIX: flat status flags (consistent with UI and character.js handler)
                    hasMajorWound: false, isDying: false, isUnconscious: false,
                    equipment: { head: null, acc1: null, acc2: null, hands: null, feet: null, weapon: null }
                });
        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `调查员【${draftChar.name}】已登入。` });
        
        draftChar.name = ""; draftChar.player = ""; draftChar.job = null; draftChar.skillAllocations = {}; draftChar.expPackage = null; draftChar.sanPenalty = 0;
        for(let k in draftChar.attrs) draftChar.attrs[k] = 0; 
        if (radarChartInstance) { radarChartInstance.destroy(); radarChartInstance = null; }
        activeCreatorTab.value = 'stats'; switchScreen('character');
    };

    const goBack = () => {
        // 如果是从剧情界面跳过来的，返回剧情；否则返回大厅/小队管理
        if (gameState.roster.length > 0) {
            switchScreen('story');
        } else {
            switchScreen('character');
        }
    };

    return { 
        availableJobs, availableExperiences, dynamicSkillNames, pointStats, 
        getSkillTotal, addSkillPoint, startAutoAdd, stopAutoAdd, removeSkillPoint, getSkillOcc, getSkillPer, 
        applyExperience, isUnlockedSkill, isClassSkill, rollAllStats, saveDraftCharacter,
        showSTImport, importSTData, confirmImport, cancelImport, importPreview, goBack,
        getAttrEvaluation: Engine.getAttrEvaluation,
        CHARACTER_PRESETS, applyPreset
    };
})(window.CoCState, (typeof CoCEngine !== "undefined" ? CoCEngine : null), window.Vue);
