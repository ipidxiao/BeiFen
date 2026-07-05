/**
 * Tutorial scenario — teaches offline local-script mode (original content).
 * CoC 7e style mini-adventure for engine onboarding.
 */
export const CoCScenarioTutorial = {
    id: 'tutorial',
    title: '引擎教程·暗夜初探',
    subtitle: '10分钟上手本地剧本',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['教程', '1920s', '老宅', '入门'],
    description: '在一栋废弃老宅中完成基础调查，学习选项、检定、线索与地图等引擎功能。无需 AI，完全离线可玩。',
    era: '1920s',
    estimatedMinutes: 10,
    startNode: 'intro',
    initialLocation: '老宅门厅',
    setup: {
        location: '老宅门厅',
        atmosphere: { level: 'calm', note: '教程模组' },
        map: {
            title: '哈特利老宅',
            rooms: [
                { id: 'hall', name: '门厅', connections: ['parlor', 'stairs'] },
                { id: 'parlor', name: '客厅', connections: ['hall'] },
                { id: 'stairs', name: '楼梯间', connections: ['hall', 'attic'] },
                { id: 'attic', name: '阁楼', connections: ['stairs'] }
            ],
            currentRoomId: 'hall'
        },
        journal: '接受委托：调查哈特利老宅中流传的怪声。'
    },
    nodes: {
        intro: {
            narrative: '雨夜。你推开哈特利老宅的木门，霉味与灰尘扑面而来。门厅里只剩一张翻倒的衣帽架和墙上褪色的家族肖像。本地剧本模式已启动——下方会出现可选行动；你也可以在输入框用自然语言描述做法。',
            choices: [
                { id: 'look', label: '环顾门厅', next: 'hall_look' },
                { id: 'portrait', label: '端详家族肖像', next: 'portrait' },
                { id: 'parlor', label: '进入客厅', next: 'parlor_enter' }
            ]
        },
        hall_look: {
            narrative: '门厅地板上有新鲜泥印，通向客厅方向。壁炉早已熄灭，但灰烬里有一枚尚未完全烧尽的蜡封碎片。',
            effects: {
                clues: [{ id: 'tut_wax', title: '蜡封碎片', content: '蜡印残留着扭曲的触手纹样，边缘有盐渍。', type: 'physical' }]
            },
            choices: [
                { id: 'take_wax', label: '拾起蜡封碎片', next: 'intro' },
                { id: 'to_parlor', label: '跟随泥印进入客厅', next: 'parlor_enter' }
            ]
        },
        portrait: {
            narrative: '肖像中的哈特利夫人双眼被刮去，画布背后用铅笔写着一行字："它们从井里来。"',
            effects: {
                clues: [{ id: 'tut_inscription', title: '画布背面的字迹', content: '"它们从井里来。"', type: 'document' }],
                san: 0
            },
            choices: [
                { id: 'remember', label: '记下这句话', next: 'intro' },
                { id: 'parlor2', label: '去客厅看看', next: 'parlor_enter' }
            ]
        },
        parlor_enter: {
            narrative: '客厅窗帘湿透，仿佛有人从窗外拖进海水。中央茶几上摊着一本湿漉漉的日志。',
            effects: { location: '老宅客厅', mapRoom: 'parlor' },
            choices: [
                { id: 'read_log', label: '阅读日志', next: 'read_log' },
                { id: 'listen', label: '屏息聆听', next: 'listen_check', skillCheck: { skill: '聆听' } },
                { id: 'back', label: '退回门厅', next: 'intro', effects: { location: '老宅门厅', mapRoom: 'hall' } }
            ]
        },
        read_log: {
            narrative: '日志最后几页被水泡糊，但你仍辨认出："满月之夜，井口会打开……" 字迹在最后一页变得潦草，仿佛作者正在失去理智。',
            effects: {
                clues: [{ id: 'tut_log', title: '哈特利日志残页', content: '满月之夜，井口会打开。', type: 'document' }],
                journal: '日志提及满月与井口。'
            },
            choices: [
                { id: 'stairs', label: '上楼查看怪声来源', next: 'stairs' },
                { id: 'stay', label: '继续在客厅搜查', next: 'search_check', skillCheck: { skill: '侦查' } }
            ]
        },
        listen_check: {
            narrative: '你屏住呼吸。楼上传来有节奏的滴水声，像是什么湿滑的东西在缓慢移动……',
            branch: { success: 'listen_ok', failure: 'listen_fail' }
        },
        listen_ok: {
            narrative: '你准确判断出声源来自阁楼。楼梯木阶第三级发出危险的吱呀声——最好轻手轻脚。',
            effects: { journal: '怪声来自阁楼。' },
            choices: [{ id: 'up', label: '轻手轻脚上楼', next: 'stairs' }]
        },
        listen_fail: {
            narrative: '雨声盖过了其他动静。你不确定声音从何而来，但直觉仍指向楼上。',
            choices: [
                { id: 'up2', label: '上楼一探究竟', next: 'stairs' },
                { id: 'dice', label: '打开骰子台自行检定', next: 'parlor_enter' }
            ]
        },
        search_check: {
            narrative: '你在茶几抽屉里摸索。',
            branch: { success: 'search_ok', failure: 'search_fail' }
        },
        search_ok: {
            narrative: '抽屉深处有一把生锈的钥匙，齿纹形如波浪。',
            effects: {
                clues: [{ id: 'tut_key', title: '波浪齿纹钥匙', content: '可能是阁楼或地下室用的钥匙。', type: 'physical' }],
                items: [{ name: '波浪齿纹钥匙', qty: 1 }]
            },
            choices: [{ id: 'up3', label: '拿钥匙上楼', next: 'stairs' }]
        },
        search_fail: {
            narrative: '抽屉里只有烂掉的扑克牌。不过你注意到牌背印着同样的触手纹样。',
            choices: [{ id: 'up4', label: '上楼', next: 'stairs' }]
        },
        stairs: {
            narrative: '楼梯间潮湿阴冷，墙皮鼓胀如同呼吸。阁楼门缝下渗出微弱磷光。',
            effects: { location: '楼梯间', mapRoom: 'stairs' },
            choices: [
                { id: 'open_attic', label: '推开阁楼门', next: 'attic', skillCheck: { skill: '力量' } },
                { id: 'peek', label: '从门缝窥探', next: 'attic_peek' }
            ]
        },
        attic_peek: {
            narrative: '透过门缝，你看见阁楼中央立着一口填满黑水的井——井沿刻满非人文字。一阵低语直接灌入脑海。',
            effects: { san: 1, atmosphere: { level: 'dread', note: '神话目击' } },
            choices: [
                { id: 'enter', label: '冲进去阻止仪式', next: 'finale' },
                { id: 'retreat', label: '悄悄撤退求援', next: 'ending_retreat' }
            ]
        },
        attic: {
            narrative: '门轴尖叫着打开。阁楼里的井口涌着腥咸黑水，一个披鳞的人形正背对你吟诵。它尚未察觉。',
            effects: { location: '老宅阁楼', mapRoom: 'attic', san: 1 },
            branch: { success: 'finale', failure: 'attic_fail' }
        },
        attic_fail: {
            narrative: '门撞在墙上发出巨响。人形猛地回头——面孔已是鱼与人的杂交。你感到 SAN 值在滑落。',
            effects: { san: 2 },
            choices: [
                { id: 'fight', label: '拼死一搏', next: 'finale' },
                { id: 'flee', label: '转身逃跑', next: 'ending_retreat' }
            ]
        },
        finale: {
            narrative: '你打翻了井沿的盐罐——老日志提过盐能暂时封印通道。黑水退潮，人形发出无声的尖啸后化为腥泥。满月尚未来临，哈特利老宅暂时安静了。\n\n【教程完成】你已体验：选项分支、技能检定、线索板、地图移动、理智损失与日志。可在「线索」「地图」「日志」标签查看记录。AI 守秘人在线时可随时切换回自由叙事。',
            effects: {
                journal: '教程模组：封印井口，怪声停止。',
                clues: [{ id: 'tut_done', title: '教程通关', content: '成功体验本地剧本全部核心机制。', type: 'note' }]
            },
            end: true
        },
        ending_retreat: {
            narrative: '你逃出老宅，在雨中回头看——阁楼窗口闪过一道磷光。你活了下来，但井口仍开着。\n\n【教程结束·生还】本地剧本支持多种结局。下次可尝试检定成功路线以减少 SAN 损失。',
            effects: { journal: '教程模组：撤退生还，威胁未除。' },
            end: true
        }
    }
};
