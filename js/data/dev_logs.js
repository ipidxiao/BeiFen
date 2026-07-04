// GENERATED from js/data/dev_logs.mjs — do not edit; run: npm run build:js
window.DevLogs = [
    {
        version: "V16.5 程序员版",
        date: "2026-07-01",
        title: "代码审计 + ESM同步 + 多角色协作整合",
        changes: [
            "【代码审计】5轮全量审计/7项问题修复/0 HIGH/0 MEDIUM/0 LOW安全漏洞",
            "【ESM同步】coc.mjs+405行(4引擎)/definitions.mjs+50行/persistence.mjs+IDB/ui.mjs+rAF批处理",
            "【多角色协作】MANIFEST.yaml(102文件→4角色)/merge.py无损合并/INTEGRATION.md+PROGRAMMER.md",
            "【测试补齐】coverage_gap_smoke.js(+23 assertions)/HealingEngine/age边界/enemy路径/extreme难度/引擎存在验证",
            "【安全增强】story_inv tooltip escapeHtml×7/Tauri CSP硬化(+img-src/font-src/frame-ancestors)/SW manifest修复",
            "【内联样式】42处静态style→CSS类(.cursor-pointer/.fs-micro等10个工具类)",
            "【代码整洁】safeJsonParse去重/CoCLog接入(5处)/handlePlayerAction异常通知/IDB失败Toast",
            "【Tauri】icons补齐(32×32/128×128/ico)/CSP最小权限/Windows bundle(mmsi+nsis)",
            "【测试】18/18 smoke全通过/181 deep verify checks/0安全漏洞"
        ]
    },
    {
        version: "V17 RC1",
        date: "2026-07-01",
        title: "Production Ready — 核心机制全面完善",
        changes: [
            "【理智系统】临时疯狂/不定疯狂/D10疯狂发作表/24恐惧症+24狂躁症/现实认知检定/SAN奖励/心理治疗",
            "【魔法典籍】5本核心典籍(死灵书/无名祭祀书/格拉基启示录/黄衣之王/伊波恩之书)+20法术",
            "【重伤系统】D20部位表/昏迷/内出血/武器掉落/濒死CON×5检定/部位伤情UI",
            "【推动检定】CoC 7e Pushed Roll机制/推动按钮UI/executePushedRoll引擎",
            "【运气消费】1:1消费LUCK调整检定/角色面板LUCK显示",
            "【武器连射】三发点射+全自动扫射/难度递增/弹药消耗",
            "【NPC模板】17种标准化NPC/怪物模板(9人类+8神话怪物)+spawn_npc工具",
            "【经历包】8→22项/覆盖三时代(1920s/1890s/现代)",
            "【大失败修正】skill≥50时96-100大失败,<50时仅100大失败→对齐CoC 7e规则",
            "【SAN视觉】屏幕边缘暗化/SAN冲击震动+红色闪烁/疯狂状态脉冲/低SAN警告色",
            "【CDN本地化】Vue+Bootstrap+Chart.js全部本地化至vendor/",
            "【测试】18/18 smoke测试全通过/181 deep verify checks/0安全漏洞"
        ]
    },

    {
        version: "v17",
        date: "2026-06-30",
        title: "APEX装备系统 + 性能全优化 + UX闭环 (Production Ready)",
        changes: [
            "【APEX装备系统】6槽位HUD (头盔/护甲/背包/主武器/副武器/近战), 五级稀有度 (S金/A紫/B蓝/C绿/神话红)",
            "【物品数据库】js/data/items_db.js — 50+武器 + 20+装备, 模糊匹配引擎, AI自动分类",
            "【物品分级】S级版本答案(泵动霰弹/冲锋枪) / A级强势首选(双管霰弹/栓动步枪) / B/C级过渡",
            "【物品详情】APEX风格点击弹窗 — 伤害/射程/弹容/护甲属性, 等级光效边框, 神话呼吸动画",
            "【DB规则对齐】伤害加值表全区间 (0→365+), 年龄修正对齐CoC 7e官方, MOV年龄惩罚",
            "【性能优化】CSS contain面板隔离, Vue keep-alive懒加载, ESM preload预加载",
            "【虚拟滚动】聊天500条消息仅渲染30个DOM节点, 滚动丝滑0卡顿",
            "【增量渲染】rAF批量消息插入 (pushMessageBatched), 避免重绘风暴",
            "【Service Worker】离线缓存全部静态资源, 二次打开秒开, API穿透",
            "【IndexedDB】异步双写存档 (IDB主 + localStorage保底), 非阻塞主线程",
            "【Tauri桌面】src-tauri/ 配置就绪, npx tauri build 一键生成 exe",
            "【Web Worker】AI网络请求Worker线程 (opt-in: COC_USE_WORKER=true)",
            "【Canvas聊天】canvas_chat.js Phase 1 架构, GPU渲染预留 (COC_CANVAS_CHAT=true)",
            "【对话导出】📋一键复制全部对话 / 📥导出Markdown文件",
            "【UX修复】剧情页⬅返回按钮 + ⚙设置入口, 装备页⚔标签栏, 长按技能+自动连加 (80ms)",
            "【工具栏修复】剧情页多余</div>布局Bug修复, 骰子/保存按钮归位",
            "【测试体系】17 suites / 300+ assertions / 0 failures, bug_hunt 119项边界, deep_verify 181项",
            "【文档】AUDIT_FINAL_V16_5 / LOGIC_REVIEW / EVALUATION_V16_5 / TEST_COVERAGE_GAP",
            "【代码量】153 files / 464KB, 67 .js + 52 .mjs (ESM 56%迁移)"
        ]
    },
    {
        version: "v16.5",
        date: "2026-06-27",
        title: "架构重整与 ESM 迁移 (AUDITFIX8 Final → V17 Phase 1)",
        changes: [
            "【模块拆分】ai_logic.js 拆为三层 (network/tool_dispatch/narrative, 577→113+122+426行)",
            "【模块拆分】state.js 拆为五模块 (core/ui/gameplay/persistence/aggregator, 920→73+92+340+418+147行)",
            "【数据解耦】coc.js BaseSkills 提取至 js/data/skills.js (490→443行)",
            "【ESM 迁移】全部模块创建 .mjs 版本 (44个), js/app.mjs 入口, ESM smoke 测试 4项 (117断言)",
            "【测试体系】run_all_smoke.js 统一入口 16 suites, engine_tests 11→34断言, 测试覆盖报告",
            "【代码质量】15函数 JSDoc 补全, safeJsonParse/Clone 统一至 utils.js, 8 handler JSDoc",
            "【CSS 重构】11组件内联样式提取 (style.css 107→521行), 6组件 CSS 类创建",
            "【安全加固】API Key sessionStorage 默认隔离 + 记住密钥开关, pushSystemNotice API",
            "【基础设施】GitHub Actions CI, vendor/ 本地化 (Vue+Bootstrap), 条件日志 logger.js",
            "【无障碍】5项 a11y 修复 (aria-live/aria-label/键盘焦点), a11y 审计报告",
            "【审计体系】综合审计 94/100分, 0 HIGH/0 MEDIUM/0 LOW, 5维自动化扫描",
            "【文档完善】ground_truth_canvas/ENGINEERING/humanpending/ROADMAP/EVALUATION 全量重写",
            "【数据整合】jobs_part1+2 合并为 jobs.js, 死代码清理 (15 .mjs)",
            "【存档安全】版本前向兼容检查, 自动存档失败醒目提示, navigator.storage.estimate()"
        ]
    },
    {
        version: "v16",
        date: "2026-05-28",
        title: "工程化升级与终极稳定性加固 (Pro Ultimate Final)",
        changes: [
            "【拨乱反正】基于 V15 稳定版重新构建，贯彻“八荣八耻”准则，通过四轮物理级 Diff 审计确保逻辑 100% 对齐。",
            "【UI 修复】修复 story_npc.js 描述渲染 Bug、story_map.js 依赖注入 Bug 以及 story_char.js 选中同步 Bug。",
            "【规则加固】修复 checkSkill 在极难成功判定上的细微偏差，确保与 CoC 7th 官方规则及 V15 表现完全一致。",
            "【全量回归】实装 `tests/engine_tests.js` 自动化测试套件，覆盖属性计算、技能匹配及 UI 接口可用性。",
            "【规范落地】确立 `ENGINEERING.md` 工程规范，明确“以破坏架构为耻，以遵循规范为荣”的开发底线。"
        ]
    },
    {
        version: "v15",
        date: "2026-05-25",
        title: "稳定性与 UI 同步优化",
        changes: [
            "【角色同步】修复随身物品装填/穿戴时角色不匹配的问题，实现多组件选人状态同步。",
            "【叙事监听】优化场景切换匹配逻辑，提高模糊地名的识别率与跳转准确度。",
            "【状态机加固】补全存档系统缺失字段，确保 atmosphere 等动态视觉状态在读档后完美恢复。",
            "【逻辑审计】修复 CombatEngine 与 ai_logic 对立判定中的未定义引用与回调参数错误。"
        ]
    },
    {
        version: "v14",
        date: "2026-05-25",
        title: "Zero-Pause 自动化革命：系统托底 v2.0",
        changes: [
            "【战斗引擎】实现全自动对立判定（攻击 vs 闪避/反击），支持多轮交火结算。",
            "【叙事监听】集成关键词监听器，AI 文本中提到发现线索或进入房间时，系统自动更新 UI，无需显式调用工具。",
            "【系统托底】fire_weapon 工具重构，现在由系统全权负责计算命中、闪避与伤害，彻底告别 AI 盲猜。",
            "【架构强化】引入 Ground Truth Canvas（真相画布）机制，确保复杂逻辑在多轮会话中保持一致性。"
        ]
    },
    {
        version: "v13",
        date: "2026-05-24",
        title: "系统托底架构与交互体验进化 (System Automation & UX Evolution)",
        changes: [
            "实装「系统托底」机制：检定大失败或关键感知失败自动触发氛围变色，无需 AI 介入",
            "彻底封印双击缩放：通过全局 JS 拦截 touchstart 事件，解决移动端连点加点时的页面抖动",
            "实装技能点「长按自动挡」：为 + / - 按钮增加定时器逻辑，支持按住自动连续增减数值",
            "完善战斗引擎闭环：修正 coc.js 中闪避判定 success 属性错误，统一 HP/Derived 数据模型",
            "优化多角色生命周期：在 creator_view.js 中增加「返回」按钮，支持中途加入角色并平滑回退",
            "精简 AI 提示词铁律：将规则维护工作完全移交系统底层，让 AI 专注于纯叙事创作"
        ]
    },
    {
        version: "v12",
        date: "2026-05-22",
        title: "动态气氛沉浸引擎与底层除虫 (Atmosphere Immersion & Bug Fixes)",
        changes: [
            "新增 set_atmosphere 工具，支持平静(calm)、紧张(tense)、恐惧(fear)、绝望(despair)四级全屏滤镜特效",
            "在 style.css 中建立 body::after 全局遮罩及内阴影呼吸渐变、屏幕震动动画",
            "在 state.js 中注入全局单例 setAtmosphere 方法，并与本地读档逻辑联动",
            "新增 record_engine_log 工具及第11条铁律，支持 AI 自动续写开发日志",
            "彻底修复 ai_logic.js 中因 API Key 换行或尾随空格导致的 HTTP 401 鉴权死锁 Bug",
            "重构 executeSkillCheck 检定处理器，修复 ${roll}/${sVal} 幽灵变量并植入防死锁容错拦截"
        ]
    },
    {
        version: "v11",
        date: "2026-05-21",
        title: "多角色装备系统解耦 (Multi-Character Equipment Refactor)",
        changes: [
            "解决装备系统冲突：将全局 gameState.equipment 迁移至角色个体，支持多角色独立装备",
            "修复角色初始化逻辑：确保 char_creator.js 中新角色拥有独立的装备槽位",
            "重构 story_char.js：纸娃娃 UI 完美支持多角色切换显示与独立的装备卸下操作",
            "优化 story_inv.js：背包穿戴逻辑自动关联当前操作的调查员，杜绝目标不明确报错"
        ]
    },
    {
        version: "v10",
        date: "2024-05-20",
        title: "线索板系统 (Clue Board)",
        changes: [
            "新增 add_clue, link_clues, mark_clue_status 工具供 AI 自动记录线索",
            "支持 7 种线索分类：物证、证词、文件、地点、事件、人物、异常",
            "实现卡片视图与 SVG 关联视图，支持玩家批注与状态标记"
        ]
    },
    {
        version: "v9",
        date: "2024-05-18",
        title: "场景地图系统 (Scene Map)",
        changes: [
            "新增 create_map, update_room, set_position 工具",
            "实现 SVG 场景图，支持房间状态（未探索、已探索、当前位置、危险、上锁）",
            "地图与位置系统无缝衔接，支持点击房间导航"
        ]
    },
    {
        version: "v8",
        date: "2024-05-15",
        title: "角色成长系统 (Growth System)",
        changes: [
            "实现 CoC 7E 核心规则：检定成功后自动记录，章节结束进行成长检定",
            "支持 EDU 成长检定与年龄增长衰老惩罚逻辑",
            "新增成长界面，支持一键全检定与结果展示"
        ]
    },
    {
        version: "v7",
        date: "2024-05-12",
        title: "回合制战斗系统 (Combat System)",
        changes: [
            "新增 start_combat, end_combat, update_enemy, enemy_attack 工具",
            "实现先攻顺序计算（敏捷 + D10）与自动轮转逻辑",
            "新增全屏战斗面板，包含敌人血条、先攻序列及快速指令按钮"
        ]
    },
    {
        version: "v6",
        date: "2024-05-10",
        title: "NPC 关系网络 (NPC Network)",
        changes: [
            "新增 register_npc, update_npc_status 工具",
            "实现卡片视图与 SVG 星图视图，按关系类型（盟友、中立、敌对等）分布",
            "支持 NPC 状态追踪（存活、死亡、失踪、疯狂）"
        ]
    },
    {
        version: "v5",
        date: "2024-05-08",
        title: "调查员记录本 (Journal)",
        changes: [
            "实现零打扰自动记录：检定、理智、生命、物品变化自动写入日志",
            "支持按日期分组显示，支持玩家手动添加笔记",
            "日志随存档同步保存与读取"
        ]
    },
    {
        version: "v4",
        date: "2024-05-05",
        title: "多模组管理 (Module Manager)",
        changes: [
            "支持创建多个独立游戏空间（模组），数据完全隔离",
            "新增模组管理界面，支持新建、重命名、删除与切换",
            "存档前缀动态化，确保不同模组存档互不干扰"
        ]
    },
    {
        version: "v3",
        date: "2024-05-02",
        title: "存档/读档系统 (Save/Load)",
        changes: [
            "实现 3 个手动存档位 + 1 个自动存档位",
            "支持 LocalStorage 本地存储与 JSON 文件导入导出",
            "大厅界面增加快速恢复卡片，支持一键继续游戏"
        ]
    },
    {
        version: "v2",
        date: "2024-04-28",
        title: "角色导入与 Bug 修复",
        changes: [
            "实现 .st 格式多格式解析器，支持中英文属性名及模糊匹配",
            "修复 executeSkillCheck 检定结果逻辑错误（Bug 1）",
            "修复强制检定（重伤/枪击）因缺少目标名导致的卡死（Bug 2）",
            "修复相同名称物品无法重复入库及 SAN 值恢复显示错误（Bug 3/4）"
        ]
    },

    {
        version: "V17.1-Integrated",
        date: "2026-07-01",
        title: "四方整合·32岗审查·全量纠错·10/10门禁",
        changes: [
            "【整合】四角色包无损合并为单一交付包",
            "【修复】P0: SIZ/fumble/DB公式/成功等级标签/groupRoll",
            "【新增】coc.mjs补全3引擎→9引擎全齐",
            "【修复】12个experience技能映射+6处items伤害冲突",
            "【清理】CSS 903→832行+21变量+重复块",
            "【新增】body纹理+safe-area+面板8色+脉冲动画",
            "【增强】narrativeListener 4→8正则+mjs a11y恢复",
            "【测试】18/18·0/179·0/129·浏览器交互0错误"
        ]
    },
    {
        version: "V17.2-CCGS",
        date: "2026-07-02",
        title: "CCGS工作室评估+8子系统补完+AI提示升级",
        changes: [
            "【CCGS】5角色评估(创意7.85/技术5.35/QA8.5/设计8.0/UX7.0)",
            "【新增】惩罚骰/奖励骰+武器贯穿+火器故障",
            "【新增】毒素引擎+环境伤害引擎(fall/fire/drown/elec/explosion)",
            "【新增】SAN叙事反馈+典籍仪式感+预置调查员模板(3个)",
            "【工具】3新AI工具+AI提示4新法则",
            "【修复】checkSkill双重除算Bug(skillValue替代targetValue)",
            "【架构】story_equip解耦+char_creator归位+items_db薄包装",
            "【文档】5份CCGS报告+V18路线图+INTEGRATION_LOG",
            "【规模】coc.js 1665→1833行·31工具·197文件·18/18"
        ]
    }
];
