// GENERATED from js/data/scenarios/missing_child.mjs — do not edit; run: npm run build:js
/** Original mini-scenario — missing child investigation (not Chaosium IP). */
window.CoCScenarioMissingChild = {
    id: 'missing_child',
    title: '失踪孩童',
    subtitle: '橡树街的最后目击',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['失踪', '1920s', '郊区', '调查'],
    description: '波士顿郊区橡树街，8岁女孩艾米莉黄昏在自家后院消失。警方搜寻无果，父母雇你继续调查。',
    era: '1920s',
    estimatedMinutes: 20,
    startNode: 'house',
    initialLocation: '橡树街·艾米莉家',
    setup: {
        location: '橡树街·艾米莉家',
        atmosphere: { level: 'calm', note: '安静郊区' },
        map: {
            title: '橡树街',
            rooms: [
                { id: 'house', name: '艾米莉家', connections: ['yard', 'street'] },
                { id: 'yard', name: '后院', connections: ['house', 'woods'] },
                { id: 'street', name: '橡树街', connections: ['house', 'park', 'church'] },
                { id: 'park', name: '社区公园', connections: ['street'] },
                { id: 'woods', name: '边界树林', connections: ['yard', 'well'] },
                { id: 'well', name: '旧井', connections: ['woods'] }
            ],
            currentRoomId: 'house'
        },
        journal: '委托：寻找失踪女孩艾米莉·哈特。'
    },
    nodes: {
        house: {
            narrative: '艾米莉母亲红着眼展示女儿房间——墙上贴满蜡笔画，最近一幅画的是"树里的朋友"，人物没有脸，只有螺旋眼睛。',
            effects: { clues: [{ id: 'mc_drawing', title: '蜡笔画', content: '"树里的朋友"——螺旋眼无脸人形。', type: 'physical' }] },
            choices: [
                { id: 'yard', label: '搜查后院', next: 'yard' },
                { id: 'street', label: '沿橡树街走访', next: 'street' },
                { id: 'room', label: '仔细检查房间', next: 'room_check', skillCheck: { skill: '侦查' } }
            ]
        },
        room_check: {
            narrative: '床底藏着一本小日记。',
            branch: { success: 'diary', failure: 'yard' }
        },
        diary: {
            narrative: '日记用儿童拼写写着："朋友从井里上来。它说满月时树会开门。妈妈听不见它唱歌。"',
            effects: {
                clues: [{ id: 'mc_diary', title: '艾米莉日记', content: '朋友从井来；满月树开门。', type: 'document' }],
                journal: '线索指向井与树林。'
            },
            choices: [
                { id: 'y', label: '去后院', next: 'yard' },
                { id: 'w', label: '直接去边界树林', next: 'woods' }
            ]
        },
        yard: {
            narrative: '后院泥地有小孩脚印通向栅栏缺口——脚印在缺口处变成赤脚，趾间有蹼状拖痕。',
            effects: { location: '后院', mapRoom: 'yard', san: 1 },
            choices: [
                { id: 'woods', label: '跟踪脚印进树林', next: 'woods' },
                { id: 'neighbor', label: '询问邻居', next: 'street' }
            ]
        },
        street: {
            narrative: '邻居老太太说失踪前听见艾米莉在跟"没人"说话。社区公园方向有孩子常去的秋千。',
            effects: { location: '橡树街', mapRoom: 'street' },
            choices: [
                { id: 'park', label: '去社区公园', next: 'park' },
                { id: 'church', label: '去教堂查洗礼记录', next: 'church' },
                { id: 'woods2', label: '进边界树林', next: 'woods' }
            ]
        },
        park: {
            narrative: '秋千上绑着艾米莉的发带。沙坑里有非人的小爪印，通向树林。',
            effects: {
                location: '社区公园',
                mapRoom: 'park',
                clues: [{ id: 'mc_ribbon', title: '艾米莉发带', content: '绑在秋千上；沙坑有爪印通向树林。', type: 'physical' }]
            },
            choices: [{ id: 'w2', label: '进入树林', next: 'woods' }]
        },
        church: {
            narrative: '洗礼记录显示橡树街百年前曾献祭"树子"以保丰收——仪式在旧井举行，后被教会封禁。',
            effects: {
                location: '圣保罗教堂',
                mapRoom: 'church',
                clues: [{ id: 'mc_baptism', title: '教会档案', content: '百年前旧井献祭"树子"仪式。', type: 'document' }]
            },
            choices: [{ id: 'well', label: '按档案找旧井', next: 'well' }]
        },
        woods: {
            narrative: '树林中央有一棵异常巨大的橡树——树干有人形凹陷，像拥抱的轮廓。树内传出儿童哼唱声。',
            effects: { location: '边界树林', mapRoom: 'woods', san: 2 },
            choices: [
                { id: 'tree', label: '检查树洞', next: 'tree_check', skillCheck: { skill: '聆听' } },
                { id: 'well2', label: '沿小径找旧井', next: 'well' }
            ]
        },
        tree_check: {
            narrative: '哼唱声时远时近。',
            branch: { success: 'tree_ok', failure: 'well' }
        },
        tree_ok: {
            narrative: '你听出哼唱中有两个声部——艾米莉与另一个非人声音。树洞深处有磷光。',
            effects: { journal: '艾米莉在树内，有非人存在。' },
            choices: [
                { id: 'enter', label: '爬入树洞', next: 'finale' },
                { id: 'well3', label: '先去旧井找封印方法', next: 'well' }
            ]
        },
        well: {
            narrative: '旧井被石板封盖，石上刻着教会十字与盐圈——已有多处被撬开。井内传来艾米莉的哭声与水的回响。',
            effects: { location: '旧井', mapRoom: 'well' },
            choices: [
                { id: 'seal', label: '用盐和十字修复封印', next: 'seal_check', skillCheck: { skill: '神秘学' } },
                { id: 'rescue', label: '下井救人', next: 'finale' }
            ]
        },
        seal_check: {
            narrative: '封印需要正确顺序：盐、祈祷、封石。',
            branch: { success: 'ending_win', failure: 'finale' }
        },
        finale: {
            narrative: '树洞与井道相通。艾米莉坐在水边，眼神空洞——"朋友"在她身后，是树皮与触须构成的幼形。它伸出手："你也想玩吗？"',
            effects: { san: 3, atmosphere: { level: 'dread', note: '树中生物' } },
            choices: [
                { id: 'grab', label: '冲过去抢回艾米莉', next: 'grab_check', skillCheck: { skill: '敏捷' } },
                { id: 'talk', label: '与"朋友"交涉', next: 'talk_check', skillCheck: { skill: '心理学' } }
            ]
        },
        grab_check: {
            narrative: '你扑向艾米莉。',
            branch: { success: 'ending_rescue', failure: 'ending_lost' }
        },
        talk_check: {
            narrative: '"朋友"歪头看你。',
            branch: { success: 'ending_trade', failure: 'ending_lost' }
        },
        ending_win: {
            narrative: '封印生效，树洞与井道同时塌陷。"朋友"发出尖啸后化为枯木。艾米莉在井口被找到， alive 但不再说话。橡树街恢复平静——至少表面如此。\n\n【结局：封印成功】',
            effects: { journal: '封印旧井，救出艾米莉。' },
            end: true
        },
        ending_rescue: {
            narrative: '你抢回艾米莉，"朋友"缩回树内。女孩恢复意识，但每晚画螺旋眼。威胁未除，但家庭重聚。\n\n【结局：救出·后遗症】',
            effects: { journal: '救出艾米莉，树中威胁仍在。', san: 2 },
            end: true
        },
        ending_trade: {
            narrative: '"朋友"接受你的提议——用你换艾米莉。你感到意识被拖入树皮。父母找到艾米莉时，橡树多了一个新的人形凹陷。\n\n【结局：交换】',
            effects: { san: 8 },
            end: true
        },
        ending_lost: {
            narrative: '艾米莉与"朋友"同时消失在树内。搜救持续数周无果。橡树街的孩子开始画同样的螺旋眼。\n\n【结局：调查失败】',
            end: true
        }
    }
};
