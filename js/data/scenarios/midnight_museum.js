// GENERATED from js/data/scenarios/midnight_museum.mjs — do not edit; run: npm run build:js
/** Original mini-scenario — museum heist / occult exhibit (not Chaosium IP). */
window.CoCScenarioMidnightMuseum = {
    id: 'midnight_museum',
    title: '午夜博物馆',
    subtitle: '失窃的古埃及面具',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['博物馆', '1920s', '盗窃', '古埃及'],
    description: '大都会自然史博物馆新展「法老之夜」开幕前夜，核心展品「奈布-卡面具」被盗。馆长雇你在闭馆后潜入调查。',
    era: '1920s',
    estimatedMinutes: 20,
    startNode: 'roof',
    initialLocation: '博物馆·屋顶',
    setup: {
        location: '博物馆·屋顶',
        atmosphere: { level: 'calm', note: '城市灯火与月光' },
        map: {
            title: '大都会自然史博物馆',
            rooms: [
                { id: 'roof', name: '屋顶', connections: ['hall'] },
                { id: 'hall', name: '主展厅', connections: ['roof', 'egypt', 'office'] },
                { id: 'egypt', name: '埃及厅', connections: ['hall', 'vault'] },
                { id: 'vault', name: '保险库', connections: ['egypt'] },
                { id: 'office', name: '馆长办公室', connections: ['hall'] }
            ],
            currentRoomId: 'roof'
        },
        journal: '委托：找回奈布-卡面具，查明内鬼。报酬丰厚。'
    },
    nodes: {
        roof: {
            narrative: '你从天窗绳降入博物馆。警报已被馆长远程关闭一小时。主展厅里埃及厅的方向有手电光晃动——不止你一人。',
            choices: [
                { id: 'stealth', label: '沿阴影潜入主展厅', next: 'hall_sneak', skillCheck: { skill: '潜行' } },
                { id: 'direct', label: '直接前往埃及厅', next: 'egypt' }
            ]
        },
        hall_sneak: {
            narrative: '你在展柜间移动。',
            branch: { success: 'hall', failure: 'hall_spotted' }
        },
        hall_spotted: {
            narrative: '保安转身看见你！他竟是便衣——"别动，我是市警。" 他压低声音，"面具还在馆内，窃贼没跑远。"',
            effects: { clues: [{ id: 'mus_cop', title: '便衣警察', content: '警方已介入，面具仍在馆内。', type: 'testimony' }] },
            choices: [{ id: 'team', label: '与警察合作', next: 'hall' }]
        },
        hall: {
            narrative: '主展厅中央恐龙骨架投下巨大阴影。埃及厅入口被警戒线拦住，但侧门被撬开。',
            effects: { location: '主展厅', mapRoom: 'hall' },
            choices: [
                { id: 'egypt', label: '进入埃及厅', next: 'egypt' },
                { id: 'office', label: '搜查馆长办公室', next: 'office' }
            ]
        },
        office: {
            narrative: '办公室保险柜半开。里面不是面具，而是一叠走私清单——馆长名字在签名栏。',
            effects: {
                location: '馆长办公室',
                mapRoom: 'office',
                clues: [{ id: 'mus_smuggle', title: '走私清单', content: '馆长参与文物走私；面具可能是掩护。', type: 'document' }]
            },
            choices: [
                { id: 'confront', label: '持清单对质馆长', next: 'confront', skillCheck: { skill: '说服' } },
                { id: 'egypt2', label: '返回埃及厅', next: 'egypt' }
            ]
        },
        confront: {
            narrative: '馆长脸色煞白。',
            branch: { success: 'confront_ok', failure: 'confront_fail' }
        },
        confront_ok: {
            narrative: '"面具在保险库！我的合伙人背叛了我——他要用它举行仪式！" 馆长交出保险库钥匙。',
            effects: { items: [{ name: '保险库钥匙', qty: 1 }], journal: '面具在保险库，有仪式阴谋。' },
            choices: [{ id: 'vault', label: '前往保险库', next: 'vault' }]
        },
        confront_fail: {
            narrative: '馆长拔枪——便衣警察及时制服他。保险库方向传来 chanting 声。',
            choices: [{ id: 'v', label: '冲向保险库', next: 'vault' }]
        },
        egypt: {
            narrative: '埃及厅展柜空了一格。地面有沙粒与新鲜脚印通向隐藏的保险库门——门缝渗出 incense 味。',
            effects: { location: '埃及厅', mapRoom: 'egypt' },
            choices: [
                { id: 'track', label: '追踪脚印', next: 'track_check', skillCheck: { skill: '追踪' } },
                { id: 'vault2', label: '尝试打开保险库门', next: 'vault' }
            ]
        },
        track_check: {
            narrative: '脚印在展柜后消失——有人用沙掩盖了踪迹。',
            branch: { success: 'track_ok', failure: 'vault' }
        },
        track_ok: {
            narrative: '你发现展柜底座有暗门开关。暗门通向保险库侧通道。',
            effects: { clues: [{ id: 'mus_secret', title: '隐藏通道', content: '走私团伙的馆内通道。', type: 'physical' }] },
            choices: [{ id: 'side', label: '沿侧通道潜入', next: 'vault' }]
        },
        vault: {
            narrative: '保险库内，戴面具的黑袍人正在吟诵。面具悬浮在沙阵上方，双眼槽发出 amber 光。这不是普通盗窃——是唤醒仪式。',
            effects: { location: '保险库', mapRoom: 'vault', san: 2, atmosphere: { level: 'ritual', note: '面具仪式' } },
            choices: [
                { id: 'disrupt', label: '破坏沙阵', next: 'ritual_check', skillCheck: { skill: '神秘学' } },
                { id: 'grab', label: '强行夺取面具', next: 'grab_fail' }
            ]
        },
        grab_fail: {
            narrative: '触碰面具的瞬间，你看见奈布-卡王朝最后的记忆——万人坑与沙暴中的巨眼。理智剧震。',
            effects: { san: 4 },
            choices: [{ id: 'd2', label: '仍试图破坏沙阵', next: 'ritual_check', skillCheck: { skill: '神秘学' } }]
        },
        ritual_check: {
            narrative: '沙阵的弱点在四角盐缺失处。',
            branch: { success: 'ending_win', failure: 'ending_partial' }
        },
        ending_win: {
            narrative: '你撒盐封阵，面具坠落。黑袍人化为沙粒。馆长走私网被便衣一网打尽。\n\n【结局：面具回收】',
            effects: { journal: '阻止仪式，面具归还展柜。' },
            end: true
        },
        ending_partial: {
            narrative: '沙阵半毁，面具碎裂——其中涌出沙暴，博物馆埃及厅被掩埋。你逃出，但城市上空浮现巨大的沙之眼。\n\n【结局：迟了一步】',
            effects: { san: 5 },
            end: true
        }
    }
};
