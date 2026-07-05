// GENERATED from js/data/scenarios/carnival_of_masks.mjs — do not edit; run: npm run build:js
/** Original mini-scenario — carnival of masks (not Chaosium IP). */
window.CoCScenarioCarnivalOfMasks = {
    id: 'carnival_of_masks',
    title: '面具嘉年华',
    subtitle: '巡回马戏团的最后一夜',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['嘉年华', '1920s', '马戏团', '面具'],
    description: '「千面嘉年华」巡回至普罗维登斯郊外。当地少年在帐篷区失踪，马戏团老板邀请你"免费观看压轴戏"——条件是不摘面具。',
    era: '1920s',
    estimatedMinutes: 25,
    startNode: 'gate',
    initialLocation: '嘉年华·入口',
    setup: {
        location: '嘉年华·入口',
        atmosphere: { level: 'calm', note: '彩旗与风琴声' },
        map: {
            title: '千面嘉年华',
            rooms: [
                { id: 'gate', name: '入口', connections: ['midway', 'tent'] },
                { id: 'midway', name: '游艺区', connections: ['gate', 'tent', 'trailer'] },
                { id: 'tent', name: '主帐篷', connections: ['gate', 'midway', 'backstage'] },
                { id: 'trailer', name: '老板拖车', connections: ['midway'] },
                { id: 'backstage', name: '后台', connections: ['tent'] }
            ],
            currentRoomId: 'gate'
        },
        journal: '调查千面嘉年华少年失踪案。'
    },
    nodes: {
        gate: {
            narrative: '入口售票亭无人，但门敞开着。每个进入者都被递上一张空白面具——"戴上，才能看见真正的表演。" 你注意到失踪少年的自行车倒在栅栏边。',
            effects: { clues: [{ id: 'com_bike', title: '少年自行车', content: '失踪者最后出现在嘉年华入口。', type: 'physical' }] },
            choices: [
                { id: 'mask', label: '戴上面具进入', next: 'midway_masked' },
                { id: 'nomask', label: '拒绝面具潜入', next: 'midway_sneak', skillCheck: { skill: '潜行' } }
            ]
        },
        midway_sneak: {
            narrative: '你避开戴面具的人群。',
            branch: { success: 'midway', failure: 'midway_masked' }
        },
        midway_masked: {
            narrative: '戴上面具后，嘉年华景象扭曲——游艺摊位变成 skulls，表演者全是同一张脸。风琴声变成低语："成为面具……或成为观众……"',
            effects: { san: 2, atmosphere: { level: 'dread', note: '面具视界' } },
            choices: [
                { id: 'remove', label: '强行摘下面具', next: 'midway' },
                { id: 'tent', label: '跟随人群进主帐篷', next: 'tent' }
            ]
        },
        midway: {
            narrative: '正常视角下，游艺区热闹但空荡——摊主都是蜡像。拖车区传来老板 Ringmaster 的笑声，主帐篷压轴戏即将开始。',
            effects: { location: '游艺区', mapRoom: 'midway' },
            choices: [
                { id: 'trailer', label: '调查老板拖车', next: 'trailer' },
                { id: 'tent2', label: '进入主帐篷', next: 'tent' },
                { id: 'ask', label: '询问蜡像摊主', next: 'wax_check', skillCheck: { skill: '心理学' } }
            ]
        },
        wax_check: {
            narrative: '蜡像的眼珠随你移动。',
            branch: { success: 'wax_ok', failure: 'tent' }
        },
        wax_ok: {
            narrative: '蜡像嘴唇开合："老板用面具换脸……失踪的孩子都在压轴戏里。" 它指向后台方向。',
            effects: { clues: [{ id: 'com_wax', title: '蜡像告密', content: '失踪少年在压轴戏；老板用面具换脸。', type: 'testimony' }], journal: '压轴戏与失踪者有关。' },
            choices: [{ id: 'bs', label: '潜入后台', next: 'backstage' }]
        },
        trailer: {
            narrative: '拖车墙上挂满面具——每张都酷似某张失踪者的脸。老板 Ringmaster 坐在镜前，正在将一张少年面具缝到自己脸上。',
            effects: { location: '老板拖车', mapRoom: 'trailer', san: 3 },
            choices: [
                { id: 'confront', label: '对质老板', next: 'confront' },
                { id: 'steal', label: '偷走面具收藏', next: 'steal_check', skillCheck: { skill: '巧手' } }
            ]
        },
        steal_check: {
            narrative: '面具似乎活着，抓住你的手指。',
            branch: { success: 'steal_ok', failure: 'confront' }
        },
        steal_ok: {
            narrative: '你夺下最旧的面具——老板的第一张脸。他尖叫，脸皮裂开。',
            effects: { items: [{ name: '原始面具', qty: 1 }], journal: '获得老板原始面具。' },
            choices: [{ id: 't', label: '冲向主帐篷', next: 'tent' }]
        },
        confront: {
            narrative: '老板摘下面具——下面没有脸，只有旋转的小丑妆与触手状纹路。他邀请你："压轴戏缺一个主角。"',
            effects: { san: 2 },
            choices: [
                { id: 'fight', label: '战斗', next: 'fight' },
                { id: 'tent3', label: '虚与委蛇进帐篷', next: 'tent' }
            ]
        },
        fight: {
            narrative: '老板化为非人形态，你勉强将其击退——它逃向主帐篷后台。',
            choices: [{ id: 'b', label: '追入后台', next: 'backstage' }]
        },
        tent: {
            narrative: '主帐篷座无虚席——观众全是戴面具的 wax 人形。舞台中央，失踪少年站成一排，脸被空白面具覆盖。Ringmaster 宣布："压轴戏——千面归一！"',
            effects: { location: '主帐篷', mapRoom: 'tent', atmosphere: { level: 'ritual', note: '千面仪式' } },
            choices: [
                { id: 'stage', label: '冲上舞台', next: 'stage' },
                { id: 'back', label: '绕到后台', next: 'backstage' }
            ]
        },
        backstage: {
            narrative: '后台堆满面具模具与少年衣物。仪式核心是一面"万面镜"——所有面具最终汇入镜中，化为单一非人面孔。',
            effects: { location: '后台', mapRoom: 'backstage', san: 2 },
            choices: [
                { id: 'break', label: '砸碎万面镜', next: 'break_check', skillCheck: { skill: '力量' } },
                { id: 'join', label: '戴上面具参与仪式', next: 'ending_join' }
            ]
        },
        stage: {
            narrative: '你冲上舞台，少年们无反应——面具下已与皮肤融合。Ringmaster 在镜后大笑。',
            choices: [{ id: 'brk', label: '砸碎万面镜', next: 'break_check', skillCheck: { skill: '力量' } }]
        },
        break_check: {
            narrative: '万面镜由 salt 与 bone 框架固定。',
            branch: { success: 'ending_win', failure: 'ending_partial' }
        },
        ending_win: {
            narrative: '镜子碎裂，所有面具 simultaneously 脱落。少年们倒下 alive 但 SAN 受创。嘉年华在黎明中化为灰烬，老板消失无踪。\n\n【结局：千面破碎】',
            effects: { journal: '摧毁万面镜，救出失踪少年。' },
            end: true
        },
        ending_partial: {
            narrative: '镜子只裂一半——一半少年恢复，另一半与面具 permanently 融合。嘉年华下一夜在另一城镇出现，招牌不变。\n\n【结局：半胜·嘉年华续存】',
            effects: { san: 4 },
            end: true
        },
        ending_join: {
            narrative: '你戴上面具——皮肤下的脸开始融化重组。最后一个念头：原来压轴戏一直缺的是观众中的你。\n\n【结局：成为新千面】',
            effects: { san: 10 },
            end: true
        }
    }
};
