// GENERATED from js/data/scenarios/coastal_festival.mjs — do not edit; run: npm run build:js
/** Original mini-scenario — coastal town cult festival (not Chaosium IP). */
window.CoCScenarioCoastalFestival = {
    id: 'coastal_festival',
    title: '沿海祭典',
    subtitle: '盐雾中的丰收节',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['小镇', '祭典', '1920s', '邪教'],
    description: '每年秋分，盐港镇举行「海父丰收节」。今年游客接连失踪，你以记者身份混入庆典。',
    era: '1920s',
    estimatedMinutes: 30,
    startNode: 'pier',
    initialLocation: '盐港镇·码头',
    setup: {
        location: '盐港镇·码头',
        atmosphere: { level: 'calm', note: '节庆灯笼与盐雾' },
        map: {
            title: '盐港镇',
            rooms: [
                { id: 'pier', name: '码头', connections: ['square'] },
                { id: 'square', name: '庆典广场', connections: ['pier', 'shrine', 'tavern'] },
                { id: 'shrine', name: '海父神龛', connections: ['square', 'cave'] },
                { id: 'tavern', name: '盐雾酒馆', connections: ['square'] },
                { id: 'cave', name: '潮间洞窟', connections: ['shrine'] }
            ],
            currentRoomId: 'pier'
        },
        journal: '调查：盐港镇丰收节游客失踪案。'
    },
    nodes: {
        pier: {
            narrative: '码头挂满纸灯笼，渔民唱着古老渔歌。一个卖贝壳的老人塞给你一枚刻着触手纹的贝壳："别吃庆典的盐渍鱼。"',
            effects: { clues: [{ id: 'cf_shell', title: '触手纹贝壳', content: '老人警告勿食盐渍鱼。', type: 'physical' }] },
            choices: [
                { id: 'square', label: '前往庆典广场', next: 'square' },
                { id: 'tavern', label: '去盐雾酒馆打听', next: 'tavern' }
            ]
        },
        tavern: {
            narrative: '酒馆里外地记者已经醉倒。老板低声说："失踪的人都在神龛后的洞窟——他们「自愿」献给海父。"',
            effects: { location: '盐雾酒馆', mapRoom: 'tavern', clues: [{ id: 'cf_tip', title: '老板密告', content: '失踪者在潮间洞窟被献祭。', type: 'testimony' }] },
            choices: [
                { id: 'sq', label: '去广场观察游行', next: 'square' },
                { id: 'shrine', label: '直接前往神龛', next: 'shrine' }
            ]
        },
        square: {
            narrative: '游行队伍抬着巨大的盐渍鱼模型——鱼眼是真人眼球。人群齐声高呼"海父赐福"，声音整齐得不自然。',
            effects: { location: '庆典广场', mapRoom: 'square', san: 1 },
            choices: [
                { id: 'follow', label: '跟踪游行队伍', next: 'follow_check', skillCheck: { skill: '潜行' } },
                { id: 'photo', label: '拍摄鱼模型', next: 'photo_ok' },
                { id: 'shrine2', label: '前往神龛', next: 'shrine' }
            ]
        },
        photo_ok: {
            narrative: '照片显影后，鱼模型内部隐约可见人形轮廓——失踪游客被塞在模型里。',
            effects: { clues: [{ id: 'cf_photo', title: '游行照片', content: '盐渍鱼模型内有人形。', type: 'physical' }], san: 2 },
            choices: [{ id: 'sh', label: '冲向神龛', next: 'shrine' }]
        },
        follow_check: {
            narrative: '你混在人群末尾。',
            branch: { success: 'shrine', failure: 'caught' }
        },
        caught: {
            narrative: '镇民发现你——他们微笑邀请你"共饮庆典酒"。你闻到酒里咸腥的腐味。',
            choices: [
                { id: 'refuse', label: '拒绝并逃跑', next: 'shrine', skillCheck: { skill: '敏捷' } },
                { id: 'drink', label: '假装饮酒', next: 'poisoned' }
            ]
        },
        poisoned: {
            narrative: '酒液入喉如吞海水。视野边缘出现鳞片幻视。',
            effects: { san: 3 },
            choices: [{ id: 'run', label: '强撑逃向神龛', next: 'shrine' }]
        },
        shrine: {
            narrative: '神龛供着非人的海父雕像——由珊瑚、骨骼与盐堆成。祭司正在准备秋分午夜仪式，失踪者被绑在洞窟入口。',
            effects: { location: '海父神龛', mapRoom: 'shrine', atmosphere: { level: 'ritual', note: '丰收祭' } },
            choices: [
                { id: 'rescue', label: '趁乱解救人质', next: 'rescue_check', skillCheck: { skill: '锁匠' } },
                { id: 'cave', label: '潜入潮间洞窟', next: 'cave' },
                { id: 'expose', label: '大声揭露阴谋', next: 'expose' }
            ]
        },
        rescue_check: {
            narrative: '人质手腕被贝壳绳捆住。',
            branch: { success: 'rescue_ok', failure: 'cave' }
        },
        rescue_ok: {
            narrative: '你解救两名游客。他们颤抖指认祭司就是镇长。但仪式仍将在洞窟完成。',
            effects: { journal: '镇长是祭司，仪式在洞窟。' },
            choices: [{ id: 'c', label: '进入洞窟阻止仪式', next: 'cave' }]
        },
        expose: {
            narrative: '人群转头看你——所有瞳孔在同一瞬间收缩成竖缝。合唱声变得尖锐。',
            effects: { san: 3 },
            choices: [{ id: 'c2', label: '逃入洞窟', next: 'cave' }]
        },
        cave: {
            narrative: '洞窟尽头是淹没的祭坛。镇长/祭司站在齐膝黑水中，朗诵非人经文。秋分月光从顶缝投下，照亮水面下蠕动的阴影。',
            effects: { location: '潮间洞窟', mapRoom: 'cave', san: 2 },
            choices: [
                { id: 'disrupt', label: '破坏祭坛盐圈', next: 'finale', skillCheck: { skill: '神秘学' } },
                { id: 'fight', label: '与祭司搏斗', next: 'fight' }
            ]
        },
        fight: {
            narrative: '祭司力气异常，皮肤下鳞片浮现。你勉强将其推入黑水——水中阴影将其拖走。仪式中断，但海父的目光已注视盐港。',
            effects: { san: 3 },
            choices: [{ id: 'f', label: '带人质逃离', next: 'ending_pyrrhic' }]
        },
        finale: {
            narrative: '盐圈结构复杂。',
            branch: { success: 'ending_win', failure: 'ending_fail' }
        },
        ending_win: {
            narrative: '你打翻盐罐，海水倒灌封死通道。盐港镇丰收节永远取消。你带着证据与幸存者离开——但每个秋分仍会梦见合唱。\n\n【结局：仪式破坏】',
            effects: { journal: '破坏丰收祭，救出部分失踪者。' },
            end: true
        },
        ending_fail: {
            narrative: '盐圈只碎一半。洞窟水面升起无数面孔——全是历年失踪者。他们齐声邀请你"回家"。\n\n【结局：成为祭品】',
            effects: { san: 8 },
            end: true
        },
        ending_pyrrhic: {
            narrative: '你逃出洞窟，但回头时整个盐港镇仍在狂欢——他们的笑容一模一样。\n\n【结局：生还·小镇沦陷】',
            end: true
        }
    }
};
