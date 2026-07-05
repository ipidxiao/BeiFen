/** Original mini-scenario — endless train mystery (not Chaosium IP). */
export const CoCScenarioTrainToNowhere = {
    id: 'train_to_nowhere',
    title: '无尽列车',
    subtitle: '午夜特快13号',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['列车', '1920s', '封闭空间', '时空'],
    description: '你Purchased 一张午夜特快13号的卧铺票。列车驶出波士顿后，窗外景色不再变化——永远同一片 fog 与 dead trees。列车员微笑说："本趟无终点站。"',
    era: '1920s',
    estimatedMinutes: 28,
    startNode: 'cabin',
    initialLocation: '13号列车·卧铺',
    setup: {
        location: '13号列车·卧铺',
        atmosphere: { level: 'calm', note: '摇晃的车厢' },
        map: {
            title: '午夜特快13号',
            rooms: [
                { id: 'cabin', name: '卧铺车厢', connections: ['dining', 'baggage'] },
                { id: 'dining', name: '餐车', connections: ['cabin', 'engine'] },
                { id: 'baggage', name: '行李车', connections: ['cabin', 'caboose'] },
                { id: 'engine', name: '车头', connections: ['dining'] },
                { id: 'caboose', name: '守车', connections: ['baggage'] }
            ],
            currentRoomId: 'cabin'
        },
        journal: '意外登上午夜特快13号——必须找到下车方法。'
    },
    nodes: {
        cabin: {
            narrative: '卧铺票上印刷的日期是1920年——今天是1928年。对面铺位坐着穿1920年时装的老先生，他读报纸，报纸标题是"列车失踪第八年"。他似乎没注意到你。',
            choices: [
                { id: 'talk', label: '与老先生交谈', next: 'talk_check', skillCheck: { skill: '心理学' } },
                { id: 'dining', label: '去餐车', next: 'dining' },
                { id: 'window', label: '仔细观察窗外', next: 'window' }
            ]
        },
        window: {
            narrative: '窗外 fog 中偶尔闪过 faces——都是乘客的面孔，贴玻璃向内看，然后消失。',
            effects: { san: 2, clues: [{ id: 'tn_faces', title: '窗外面孔', content: '雾中闪过乘客面孔，贴窗向内。', type: 'note' }] },
            choices: [
                { id: 'd', label: '去餐车打听', next: 'dining' },
                { id: 'b', label: '搜查行李车', next: 'baggage' }
            ]
        },
        talk_check: {
            narrative: '老先生缓缓抬头。',
            branch: { success: 'talk_ok', failure: 'talk_fail' }
        },
        talk_ok: {
            narrative: '"你也是上错车的？" 他低语，"车头没有司机——只有一张嘴在喂煤。守车有下车的钥匙，但钥匙要换一样东西。"',
            effects: {
                clues: [{ id: 'tn_oldman', title: '老先生证词', content: '车头有"嘴"喂煤；守车钥匙需交换。', type: 'testimony' }],
                journal: '守车有下车钥匙。'
            },
            choices: [
                { id: 'caboose', label: '前往守车', next: 'caboose' },
                { id: 'engine', label: '调查车头', next: 'engine' }
            ]
        },
        talk_fail: {
            narrative: '老先生继续读报，报纸上的日期随你注视而变成今天。你感到不安。',
            effects: { san: 1 },
            choices: [{ id: 'din', label: '去餐车', next: 'dining' }]
        },
        dining: {
            narrative: '餐车供应永远温热的炖菜。列车员胸牌无名字，只有编号13。他说："所有乘客最终都会成为永久旅客——除非在下一停靠站前下车。" 窗外闪过站牌：「Nowhere」。',
            effects: { location: '餐车', mapRoom: 'dining' },
            choices: [
                { id: 'ask', label: '追问停靠站', next: 'ask_check', skillCheck: { skill: '说服' } },
                { id: 'bag', label: '去行李车', next: 'baggage' },
                { id: 'eng', label: '去车头', next: 'engine' }
            ]
        },
        ask_check: {
            narrative: '列车员微笑不变。',
            branch: { success: 'ask_ok', failure: 'ask_fail' }
        },
        ask_ok: {
            narrative: '"Nowhere站只停一次——当车头吃饱时。" 他指向餐车厨房——里面不是厨师，而是一团蠕动的人形 shadow。',
            effects: { san: 2, journal: 'Nowhere站与车头"饥饿"有关。' },
            choices: [{ id: 'e', label: '调查车头', next: 'engine' }]
        },
        ask_fail: {
            narrative: '列车员递给你一杯 stew。"吃，就不饿了。" 你闻到其中的 iron 味。',
            choices: [
                { id: 'refuse', label: '拒绝并离开', next: 'baggage' },
                { id: 'eat', label: '尝一口', next: 'eat_bad' }
            ]
        },
        eat_bad: {
            narrative: 'stew 里有 familiar 的味道——像记忆本身。你看见自己过去的片段被吞食。SAN 重创。',
            effects: { san: 5 },
            choices: [{ id: 'flee', label: '逃向行李车', next: 'baggage' }]
        },
        baggage: {
            narrative: '行李车堆满从未被领取的 suitcases。一个属于你的箱子自动打开——里面是另一张13号车票，日期是1936年。',
            effects: { location: '行李车', mapRoom: 'baggage', san: 2 },
            choices: [
                { id: 'search', label: '搜查其他行李', next: 'search_check', skillCheck: { skill: '侦查' } },
                { id: 'cab', label: '去守车', next: 'caboose' }
            ]
        },
        search_check: {
            narrative: '行李箱中藏有乘客遗物。',
            branch: { success: 'search_ok', failure: 'caboose' }
        },
        search_ok: {
            narrative: '你找到一名"永久旅客"的日记：守车钥匙在列车长手中，列车长就是第一个上车的人——永远留在车头。',
            effects: { clues: [{ id: 'tn_diary', title: '永久旅客日记', content: '列车长=第一个上车者；钥匙在车头。', type: 'document' }] },
            choices: [{ id: 'c', label: '前往守车', next: 'caboose' }]
        },
        engine: {
            narrative: '车头没有司机。锅炉前是一张 giant 的 lipless mouth，由 rails 与 smoke 构成，吞噬煤炭——以及偶尔 passenger 的 shadow。它感知到你，发出汽笛般的 hunger。',
            effects: { location: '车头', mapRoom: 'engine', san: 4, atmosphere: { level: 'dread', note: '列车之口' } },
            choices: [
                { id: 'feed', label: '用行李中的遗物"喂"它', next: 'feed_ok' },
                { id: 'run', label: '逃向守车', next: 'caboose' }
            ]
        },
        feed_ok: {
            narrative: 'mouth 暂时 satiated。列车减速——Nowhere 站站台浮现，只有一分钟。',
            effects: { journal: '车头暂时满足，Nowhere站出现。' },
            choices: [{ id: 'jump', label: '跳下列车', next: 'finale', skillCheck: { skill: '敏捷' } }]
        },
        caboose: {
            narrative: '守车镜中映出的不是你——是第一个上车的人，已半与列车融合。他/它说："钥匙给你——但要用一段记忆交换。"',
            effects: { location: '守车', mapRoom: 'caboose', san: 2 },
            choices: [
                { id: 'trade', label: '交换一段记忆', next: 'trade_check', skillCheck: { skill: '意志' } },
                { id: 'take', label: '强行夺取钥匙', next: 'take_check', skillCheck: { skill: '力量' } }
            ]
        },
        trade_check: {
            narrative: '你感到某段童年记忆被抽走——空白，但不痛。',
            branch: { success: 'finale', failure: 'ending_trapped' }
        },
        take_check: {
            narrative: '镜像中的存在抓住你的手腕。',
            branch: { success: 'finale', failure: 'ending_trapped' }
        },
        finale: {
            narrative: 'Nowhere 站台的 fog 中，下车机会只有一次。',
            branch: { success: 'ending_escape', failure: 'ending_trapped' }
        },
        ending_escape: {
            narrative: '你跌落在 fog 外的真实铁轨上——普通货运列车呼啸而过。你活了下来，但车票夹里永远夹着一张13号票，日期是明天。\n\n【结局：逃离无尽列车】',
            effects: { journal: '逃离13号列车，但诅咒未完全解除。', san: 2 },
            end: true
        },
        ending_trapped: {
            narrative: '列车加速，Nowhere 站消失。餐车列车员为你预留了铺位——对面坐着失去一段记忆后的你，正在读报纸，标题是"列车失踪第九年"。\n\n【结局：永久旅客】',
            effects: { san: 6 },
            end: true
        }
    }
};
