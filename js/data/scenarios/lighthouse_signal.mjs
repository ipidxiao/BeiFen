/** Original mini-scenario — lighthouse mystery (not Chaosium IP). */
export const CoCScenarioLighthouseSignal = {
    id: 'lighthouse_signal',
    title: '灯塔信号',
    subtitle: '风暴角的三长两短',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['灯塔', '1920s', '海洋', '孤立'],
    description: '风暴角灯塔三周未回应海岸警卫队呼叫。最后一封电报只有摩尔斯码：三长两短，重复七次。你乘补给船登岛调查。',
    era: '1920s',
    estimatedMinutes: 22,
    startNode: 'landing',
    initialLocation: '风暴角·登陆点',
    setup: {
        location: '风暴角·登陆点',
        atmosphere: { level: 'calm', note: '咸风与浪涌' },
        map: {
            title: '风暴角灯塔',
            rooms: [
                { id: 'landing', name: '登陆点', connections: ['path'] },
                { id: 'path', name: '崖顶小径', connections: ['landing', 'lighthouse', 'cottage'] },
                { id: 'cottage', name: '守塔人小屋', connections: ['path'] },
                { id: 'lighthouse', name: '灯塔底部', connections: ['path', 'top'] },
                { id: 'top', name: '灯室', connections: ['lighthouse'] }
            ],
            currentRoomId: 'landing'
        },
        journal: '调查风暴角灯塔失联与异常摩尔斯信号。'
    },
    nodes: {
        landing: {
            narrative: '补给船远去。登陆点堆着未拆的补给箱——三周无人领取。崖顶灯塔灯室无光亮，但你能听见灯室内有机械运转声。',
            choices: [
                { id: 'path', label: '沿崖顶小径上行', next: 'path' },
                { id: 'cottage', label: '先查守塔人小屋', next: 'cottage' }
            ]
        },
        cottage: {
            narrative: '小屋内餐桌摆三人份餐具，食物腐烂。墙上挂着摩尔斯码对照表，"三长两短"被圈红并标注"不要应答"。',
            effects: {
                location: '守塔人小屋',
                mapRoom: 'cottage',
                clues: [{ id: 'lh_morse', title: '摩尔斯注释', content: '"三长两短"不要应答——被圈红。', type: 'document' }]
            },
            choices: [
                { id: 'log', label: '阅读守塔日志', next: 'keeper_log' },
                { id: 'p', label: '前往灯塔', next: 'path' }
            ]
        },
        keeper_log: {
            narrative: '日志记录：第三守塔人开始听见灯室里的"应答"。他们不应答后，第一守塔人走上灯室再未下来。第二人发送求救信号后消失。',
            effects: {
                clues: [{ id: 'lh_log', title: '守塔日志', content: '灯室有"应答"；两名守塔人失踪。', type: 'document' }],
                san: 1,
                journal: '灯室存在某种"应答"。'
            },
            choices: [{ id: 'go', label: '前往灯塔', next: 'path' }]
        },
        path: {
            narrative: '小径湿滑，崖下黑浪拍击礁石。灯塔门虚掩，门内楼梯向上延伸，向下则通向储油室。',
            effects: { location: '崖顶小径', mapRoom: 'path' },
            choices: [
                { id: 'up', label: '上楼梯前往灯室', next: 'lighthouse' },
                { id: 'down', label: '检查储油室', next: 'oil_check', skillCheck: { skill: '侦查' } }
            ]
        },
        oil_check: {
            narrative: '储油室角落有新鲜拖拽痕迹。',
            branch: { success: 'oil_ok', failure: 'lighthouse' }
        },
        oil_ok: {
            narrative: '你发现被藏起的守塔人制服——属于第二守塔人，胸口有盐结晶形成的触手状纹路。',
            effects: { clues: [{ id: 'lh_uniform', title: '守塔人制服', content: '胸口盐结晶触手纹——非自然形成。', type: 'physical' }], san: 1 },
            choices: [{ id: 'u', label: '上灯室', next: 'lighthouse' }]
        },
        lighthouse: {
            narrative: '灯塔底部齿轮自行运转。墙上电报机仍在自动发送——三长两短，无限循环。你感到若有若无的视线从上方投下。',
            effects: { location: '灯塔底部', mapRoom: 'lighthouse' },
            choices: [
                { id: 'stop', label: '切断电报机电源', next: 'stop_telegraph' },
                { id: 'top', label: '登上灯室', next: 'top' }
            ]
        },
        stop_telegraph: {
            narrative: '电源切断后，沉默持续三秒——然后灯室传来一声长啸，像信号本身在愤怒。',
            effects: { san: 1, journal: '切断信号激怒了灯室中的存在。' },
            choices: [{ id: 't', label: '冲上灯室', next: 'top' }]
        },
        top: {
            narrative: '灯室透镜转动的不是光，而是深海水影。三名守塔人站在灯架旁——皮肤半透明，体内有东西缓慢游动。他们齐声用摩尔斯节奏开口："应答……应答……"',
            effects: { location: '灯室', mapRoom: 'top', san: 4, atmosphere: { level: 'dread', note: '深海信号' } },
            choices: [
                { id: 'destroy', label: '砸毁透镜', next: 'destroy_check', skillCheck: { skill: '力量' } },
                { id: 'respond', label: '用摩尔斯应答', next: 'ending_respond' },
                { id: 'flee', label: '关闭灯室门逃跑', next: 'ending_flee' }
            ]
        },
        destroy_check: {
            narrative: '透镜由强化玻璃与金属框架固定。',
            branch: { success: 'ending_win', failure: 'ending_wounded' }
        },
        ending_win: {
            narrative: '透镜碎裂，海水幻影倾泻后蒸发。守塔人倒下，恢复人类外形——已死亡多时。风暴角灯塔永久熄灭，但海岸再未收到三长两短。\n\n【结局：信号终止】',
            effects: { journal: '摧毁透镜，终止深海信号。' },
            end: true
        },
        ending_wounded: {
            narrative: '你只打碎一角。海水涌入灯室——你在溺毙前被下一班补给船救起，但每个夜晚都听见摩尔斯在耳膜里敲击。\n\n【结局：生还·诅咒信号】',
            effects: { san: 5 },
            end: true
        },
        ending_respond: {
            narrative: '你应答的瞬间，守塔人微笑——你的意识被拖入深海水影。补给船找到的空灯室里，多了一具穿你衣服的半透明躯体。\n\n【结局：成为新信号源】',
            effects: { san: 10 },
            end: true
        },
        ending_flee: {
            narrative: '你锁上灯室门乘小船逃离。回望时灯塔重新亮起——光芒是磷绿色，向大海有节奏闪烁：三长两短。\n\n【结局：逃离·信号扩散】',
            end: true
        }
    }
};
