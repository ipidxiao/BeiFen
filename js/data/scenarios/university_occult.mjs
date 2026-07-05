/** Original mini-scenario — university occult club (not Chaosium IP). */
export const CoCScenarioUniversityOccult = {
    id: 'university_occult',
    title: '大学秘社',
    subtitle: '阿卡姆密斯卡托尼克大学',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['大学', '1920s', '秘社', '图书馆'],
    description: '密斯卡托尼克大学「星象研究会」成员接连在图书馆闭馆后失踪。校方雇你以客座研究员身份调查。',
    era: '1920s',
    estimatedMinutes: 25,
    startNode: 'campus',
    initialLocation: '密大·校园',
    setup: {
        location: '密大·校园',
        atmosphere: { level: 'calm', note: '秋夜学术氛围' },
        map: {
            title: '密斯卡托尼克大学',
            rooms: [
                { id: 'campus', name: '校园', connections: ['library', 'dorm'] },
                { id: 'library', name: '奥恩图书馆', connections: ['campus', 'stacks', 'basement'] },
                { id: 'stacks', name: '禁书区', connections: ['library'] },
                { id: 'dorm', name: '研究生宿舍', connections: ['campus'] },
                { id: 'basement', name: '地下阅览室', connections: ['library'] }
            ],
            currentRoomId: 'campus'
        },
        journal: '委托：调查星象研究会失踪案，不得惊动媒体。'
    },
    nodes: {
        campus: {
            narrative: '校园钟楼敲九下。布告栏贴着星象研究会的招新——"解读群星之外的呼唤"。一名女学生匆匆走过，掉落一张手绘星图。',
            effects: { clues: [{ id: 'uo_star', title: '手绘星图', content: '非人类星座排列，标注"图书馆B层"。', type: 'document' }] },
            choices: [
                { id: 'lib', label: '前往奥恩图书馆', next: 'library' },
                { id: 'dorm', label: '搜查研究生宿舍', next: 'dorm' }
            ]
        },
        dorm: {
            narrative: '失踪者的房间整洁异常。书桌抽屉里有一本密码日记，封面印着触手与星辰。',
            effects: { location: '研究生宿舍', mapRoom: 'dorm' },
            choices: [
                { id: 'decode', label: '破译日记', next: 'decode_check', skillCheck: { skill: '图书馆使用' } },
                { id: 'lib2', label: '带星图去图书馆', next: 'library' }
            ]
        },
        decode_check: {
            narrative: '日记使用拉丁字母移位密码。',
            branch: { success: 'diary_ok', failure: 'diary_fail' }
        },
        diary_ok: {
            narrative: '"我们在B层打开了门。群星对齐之夜，门会再开。" 最后一页有五个签名，三个已划掉。',
            effects: {
                clues: [{ id: 'uo_diary', title: '密码日记', content: 'B层有门；群星对齐夜再开。三人已"划掉"。', type: 'document' }],
                journal: 'B层与群星对齐有关。'
            },
            choices: [{ id: 'l', label: '前往图书馆B层', next: 'library' }]
        },
        diary_fail: {
            narrative: '你只能辨认出反复出现的词："门"与"群星"。',
            choices: [{ id: 'l2', label: '去图书馆', next: 'library' }]
        },
        library: {
            narrative: '管理员警告你闭馆后不得逗留。但你注意到地下室入口的锁是新换的——钥匙孔有蜡渍。',
            effects: { location: '奥恩图书馆', mapRoom: 'library' },
            choices: [
                { id: 'stacks', label: '申请进入禁书区', next: 'stacks', skillCheck: { skill: '说服' } },
                { id: 'sneak', label: '闭馆后潜入地下室', next: 'basement', skillCheck: { skill: '潜行' } }
            ]
        },
        stacks: {
            narrative: '管理员被你说服——或你失败了。',
            branch: { success: 'stacks_ok', failure: 'basement' }
        },
        stacks_ok: {
            narrative: '禁书区索引卡显示：「N星门注释」借阅者为星象研究会，归还日期空白。',
            effects: {
                location: '禁书区',
                mapRoom: 'stacks',
                clues: [{ id: 'uo_index', title: '禁书索引', content: 'N星门注释被星象研究会借走未还。', type: 'document' }]
            },
            choices: [{ id: 'b', label: '下地下室', next: 'basement' }]
        },
        basement: {
            narrative: '地下阅览室中央画着巨大的星阵。三名学生会成员站在阵中，目光空洞，朗诵非欧几何音节。阵心是一扇不应存在的门——门缝渗出星光。',
            effects: { location: '地下阅览室', mapRoom: 'basement', san: 3, atmosphere: { level: 'ritual', note: '星门' } },
            choices: [
                { id: 'interrupt', label: '打断朗诵', next: 'interrupt' },
                { id: 'study', label: '研究星阵弱点', next: 'study_check', skillCheck: { skill: '神秘学' } }
            ]
        },
        interrupt: {
            narrative: '你冲入阵中。一名学生转头——他的脸是旋转的星图。其余两人继续朗诵，门缝扩大。',
            effects: { san: 2 },
            choices: [{ id: 's', label: '强行研究星阵', next: 'study_check', skillCheck: { skill: '神秘学' } }]
        },
        study_check: {
            narrative: '星阵的锚点是四角蜡烛。',
            branch: { success: 'ending_win', failure: 'ending_taken' }
        },
        ending_win: {
            narrative: '你熄灭蜡烛，星阵崩溃。门在关闭前吐出一阵冷风——失踪者倒在地上， alive 但 SAN 重创。星象研究会解散。\n\n【结局：星门关闭】',
            effects: { journal: '关闭星门，救出失踪学生。' },
            end: true
        },
        ending_taken: {
            narrative: '门完全打开。你看见群星之间的巨眼——然后被吸入门中。校园恢复平静，布告栏上多了你的照片，标注"新成员"。\n\n【结局：成为研究会一员】',
            effects: { san: 10 },
            end: true
        }
    }
};
