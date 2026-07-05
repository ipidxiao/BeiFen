// GENERATED from js/data/scenarios/deep_one_shadow.mjs — do not edit; run: npm run build:js
/**
 * Original mini-scenario — classic CoC investigation tone (not Chaosium IP).
 */
window.CoCScenarioDeepOneShadow = {
    id: 'deep_one_shadow',
    title: '深潜者之影',
    subtitle: '沿海小镇的失踪案',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['深潜者', '1920s', '渔港', '调查'],
    description: '1928年，马布尔港连续有人于满月前后失踪。报社雇你调查码头仓库与教会档案。原创模组，约30分钟。',
    era: '1920s',
    estimatedMinutes: 30,
    startNode: 'arrival',
    initialLocation: '马布尔港·码头',
    setup: {
        location: '马布尔港·码头',
        atmosphere: { level: 'calm', note: '盐雾弥漫的渔港' },
        map: {
            title: '马布尔港',
            rooms: [
                { id: 'dock', name: '码头', connections: ['warehouse', 'inn'] },
                { id: 'warehouse', name: '17号仓库', connections: ['dock'] },
                { id: 'inn', name: '锚与烛台旅馆', connections: ['dock', 'church'] },
                { id: 'church', name: '圣布里吉德教堂', connections: ['inn', 'reef'] },
                { id: 'reef', name: '黑礁洞窟', connections: ['church'] }
            ],
            currentRoomId: 'dock'
        },
        journal: '委托：调查马布尔港满月失踪案。报酬已预付一半。'
    },
    nodes: {
        arrival: {
            narrative: '1928年9月，马布尔港。浓雾贴着水面流动，渔网在杆上滴着咸水。码头工人看见你，刻意别过脸。锚与烛台旅馆的招牌在风中吱呀作响——那里或许能打听到消息。',
            choices: [
                { id: 'inn', label: '去锚与烛台旅馆', next: 'inn_talk' },
                { id: 'warehouse', label: '调查17号仓库', next: 'warehouse_outside' },
                { id: 'fish', label: '向老渔夫打听', next: 'fisher_check', skillCheck: { skill: '说服' } }
            ]
        },
        fisher_check: {
            narrative: '老渔夫烟斗里的火光在雾中明灭。他欲言又止。',
            branch: { success: 'fisher_ok', failure: 'fisher_fail' }
        },
        fisher_ok: {
            narrative: '"别在满月夜靠近黑礁。"他压低声音，"仓库里的货……不是给活人的。" 他塞给你一张皱巴巴的码头工牌。',
            effects: {
                clues: [{ id: 'dos_badge', title: '码头工牌', content: '17号仓库夜班登记，持有人：E·马什。', type: 'physical' }],
                items: [{ name: '码头工牌', qty: 1 }]
            },
            choices: [
                { id: 'wh', label: '前往17号仓库', next: 'warehouse_outside' },
                { id: 'inn2', label: '去旅馆核对工牌', next: 'inn_talk' }
            ]
        },
        fisher_fail: {
            narrative: '老渔夫只嘟囔了一句"海会收回欠它的"，便不再开口。你仍注意到17号仓库方向有灯光。',
            choices: [
                { id: 'wh2', label: '独自调查仓库', next: 'warehouse_outside' },
                { id: 'inn3', label: '去旅馆', next: 'inn_talk' }
            ]
        },
        inn_talk: {
            narrative: '旅馆老板玛莎擦着永远擦不干净的玻璃杯。她说失踪者都曾帮教会运送"特殊货物"到黑礁。',
            effects: { location: '锚与烛台旅馆', mapRoom: 'inn' },
            choices: [
                { id: 'ask', label: '追问教会货物', next: 'church_hint', skillCheck: { skill: '心理学' } },
                { id: 'room', label: '搜查失踪记者的房间', next: 'room_search', skillCheck: { skill: '锁匠' } },
                { id: 'dock2', label: '返回码头', next: 'arrival', effects: { location: '马布尔港·码头', mapRoom: 'dock' } }
            ]
        },
        church_hint: {
            narrative: '玛莎手指发抖，指向镇子另一头的白色尖顶。',
            branch: { success: 'church_hint_ok', failure: 'church_hint_fail' }
        },
        church_hint_ok: {
            narrative: '"神父奥布莱恩……他说是为了安抚海里的东西。" 她递给你一把备用钥匙，"记者失踪前把它藏在我这。"',
            effects: {
                clues: [{ id: 'dos_martha', title: '玛莎的证词', content: '失踪者与教会运输"特殊货物"至黑礁；神父奥布莱恩知情。', type: 'testimony' }],
                items: [{ name: '记者房间钥匙', qty: 1 }]
            },
            choices: [
                { id: 'room2', label: '打开记者房间', next: 'room_found' },
                { id: 'church', label: '前往教堂', next: 'church_enter' }
            ]
        },
        church_hint_fail: {
            narrative: '玛莎闭紧嘴，只说了记者房间号：2A。',
            choices: [
                { id: 'room3', label: '试试撬开2A房门', next: 'room_search', skillCheck: { skill: '锁匠' } },
                { id: 'church2', label: '直接前往教堂', next: 'church_enter' }
            ]
        },
        room_search: {
            narrative: '锁芯已经生锈。',
            branch: { success: 'room_found', failure: 'room_fail' }
        },
        room_found: {
            narrative: '房间里有翻倒的打字机。未寄出的稿件标题是《深潜者之影——马布尔港下的交易》。稿件描述码头与教会勾结，在满月将活人"献祭给父神达贡"。',
            effects: {
                location: '锚与烛台旅馆·2A',
                clues: [
                    { id: 'dos_article', title: '未寄出稿件', content: '码头-教会-黑礁献祭链；提及"父神达贡"与"深潜者混血"。', type: 'document' }
                ],
                san: 1,
                journal: '记者稿件指向教会与黑礁献祭。'
            },
            choices: [
                { id: 'wh3', label: '带稿件去对质仓库', next: 'warehouse_outside' },
                { id: 'church3', label: '持稿件见神父', next: 'church_enter' }
            ]
        },
        room_fail: {
            narrative: '门纹丝不动。但你在门缝下捡到一张拍立得——照片上是蒙面人抬着裹尸袋走向码头。',
            effects: {
                clues: [{ id: 'dos_photo', title: '拍立得照片', content: '蒙面人在码头搬运裹尸袋，背景可见17号仓库。', type: 'physical' }]
            },
            choices: [
                { id: 'wh4', label: '去17号仓库', next: 'warehouse_outside' },
                { id: 'church4', label: '去教堂', next: 'church_enter' }
            ]
        },
        warehouse_outside: {
            narrative: '17号仓库铁门锈死，门缝渗出鱼腥味与海水滴答声。若你有工牌或记者稿件，或许能唬住门卫——否则只能另寻入口。',
            effects: { location: '17号仓库外', mapRoom: 'warehouse' },
            choices: [
                { id: 'bluff', label: '出示工牌/稿件强行进入', next: 'warehouse_in', requiresFlag: 'has_badge_or_article' },
                { id: 'sneak', label: '绕到侧窗潜入', next: 'warehouse_sneak', skillCheck: { skill: '潜行' } },
                { id: 'back_dock', label: '退回码头', next: 'arrival', effects: { location: '马布尔港·码头', mapRoom: 'dock' } }
            ]
        },
        warehouse_in: {
            narrative: '仓库内堆满标着"教会捐赠"的板条箱。一箱被撬开，里面是浸泡过盐水的渔人神像——人形与鱼形畸形融合。你听见里间有人在用非人语言计数。',
            effects: {
                san: 2,
                clues: [{ id: 'dos_idol', title: '渔人神像', content: '畸形融合造型，与深潜者混血描述一致。', type: 'physical' }]
            },
            choices: [
                { id: 'investigate', label: '悄悄调查里间', next: 'inner_check', skillCheck: { skill: '侦查' } },
                { id: 'confront', label: '直接闯入', next: 'confrontation' }
            ]
        },
        warehouse_sneak: {
            narrative: '侧窗被海水泡胀，难以无声打开。',
            branch: { success: 'warehouse_in', failure: 'sneak_fail' }
        },
        sneak_fail: {
            narrative: '你踩碎玻璃惊动守卫。只能逃回雾中——但记住了里间透出的磷光。',
            effects: { journal: '仓库惊动守卫，需从教堂或黑礁另寻突破口。' },
            choices: [
                { id: 'church5', label: '改道圣布里吉德教堂', next: 'church_enter' },
                { id: 'retry', label: '换条路再试', next: 'warehouse_outside' }
            ]
        },
        inner_check: {
            narrative: '你从板条箱缝隙窥视。',
            branch: { success: 'inner_ok', failure: 'confrontation' }
        },
        inner_ok: {
            narrative: '里间是临时祭坛。奥布莱恩神父与码头主马什正在整理一份名单——下一个名字被圈红。祭坛下地图标出黑礁洞窟入口。',
            effects: {
                clues: [
                    { id: 'dos_list', title: '献祭名单', content: '多名失踪者姓名；下一目标被圈红。', type: 'document' },
                    { id: 'dos_map', title: '黑礁地图', content: '洞窟入口在退潮时可步行抵达。', type: 'document' }
                ],
                journal: '确认仓库为中转站，黑礁为最终仪式地点。'
            },
            choices: [
                { id: 'church6', label: '带证据去教堂对质', next: 'church_enter' },
                { id: 'reef', label: '趁退潮前往黑礁', next: 'reef_path' }
            ]
        },
        confrontation: {
            narrative: '马什转身，虹膜已是竖瞳。他扑来时你看见他颈侧鳃裂开合——混血已深。仓库里展开一场恶战。',
            effects: { san: 3, atmosphere: { level: 'combat', note: '与深潜者混血交战' } },
            choices: [
                { id: 'fight', label: '全力应战（可手动开启战斗面板）', next: 'after_fight' },
                { id: 'run', label: '突围撤退', next: 'church_enter' }
            ]
        },
        after_fight: {
            narrative: '你击退了马什——他跌入板条箱堆，发出湿滑的嘶声后不再动弹。祭坛上的名单与黑礁地图落在你脚边。',
            effects: {
                clues: [
                    { id: 'dos_list', title: '献祭名单', content: '多名失踪者姓名；下一目标被圈红。', type: 'document' },
                    { id: 'dos_map', title: '黑礁地图', content: '洞窟入口在退潮时可步行抵达。', type: 'document' }
                ]
            },
            choices: [
                { id: 'reef2', label: '按地图前往黑礁', next: 'reef_path' },
                { id: 'police', label: '先报警（可能来不及）', next: 'ending_late' }
            ]
        },
        church_enter: {
            narrative: '圣布里吉德教堂空荡，圣水味道发腥。忏悔室门虚掩，里面传出低沉合唱——不是拉丁文，而是水泡般的音节。',
            effects: { location: '圣布里吉德教堂', mapRoom: 'church' },
            choices: [
                { id: 'confessional', label: '推开忏悔室', next: 'church_reveal' },
                { id: 'archive', label: '查教会档案室', next: 'archive_check', skillCheck: { skill: '图书馆使用' } },
                { id: 'reef3', label: '不再耽搁，直奔黑礁', next: 'reef_path' }
            ]
        },
        archive_check: {
            narrative: '档案室锁着，但钥匙就挂在神父袍挂钩上——仿佛刻意等待。',
            branch: { success: 'archive_ok', failure: 'church_reveal' }
        },
        archive_ok: {
            narrative: '1890年的记录记载：马布尔港曾与"海父"立约，以混血换取渔获。每代需献祭一人以"续签"。',
            effects: {
                clues: [{ id: 'dos_pact', title: '1890年立约记录', content: '小镇与"海父"交易：混血+定期献祭换取繁荣。', type: 'document' }],
                san: 1
            },
            choices: [
                { id: 'confessional2', label: '持记录质问神父', next: 'church_reveal' },
                { id: 'reef4', label: '前往黑礁阻止仪式', next: 'reef_path' }
            ]
        },
        church_reveal: {
            narrative: '忏悔室里，奥布莱恩神父的皮肤正一片片脱落，露出灰绿鳞片。他平静地说："你来得正好——名单上还需要一个外人。" 身后阴影中，更多鳃裂的轮廓在蠕动。',
            effects: { san: 4, atmosphere: { level: 'dread', note: '神话真相揭露' } },
            choices: [
                { id: 'stand', label: '拒绝并准备战斗', next: 'finale_fight' },
                { id: 'reef5', label: '虚与委蛇，退向黑礁', next: 'reef_path' }
            ]
        },
        reef_path: {
            narrative: '退潮露出黑礁小径。洞窟口堆满贝壳与盐，内壁刻满非欧几何纹。深处，磷光映出一个淹没的祭坛——今晚正是满月。',
            effects: { location: '黑礁洞窟', mapRoom: 'reef', atmosphere: { level: 'ritual', note: '满月仪式' } },
            choices: [
                { id: 'disrupt', label: '破坏祭坛盐阵', next: 'finale_ritual', skillCheck: { skill: '神秘学' } },
                { id: 'observe', label: '先观察仪式', next: 'observe_san', effects: { san: 3 } }
            ]
        },
        observe_san: {
            narrative: '你看见深潜者从水中浮起，合唱声直接撕裂理智。你强忍呕吐感，记住了盐阵的薄弱点。',
            choices: [{ id: 'disrupt2', label: '破坏盐阵', next: 'finale_ritual', skillCheck: { skill: '神秘学' } }]
        },
        finale_ritual: {
            narrative: '盐阵关系着通道稳定性。',
            branch: { success: 'ending_win', failure: 'ending_wounded' }
        },
        finale_fight: {
            narrative: '你在教堂与混血展开死斗。窗外满月升起，黑礁方向传来海啸般的合唱——时间所剩无几。',
            choices: [
                { id: 'to_reef', label: '解决眼前敌人后赶往黑礁', next: 'reef_path' },
                { id: 'hold', label: '守住教堂不让更多人被带走', next: 'ending_pyrrhic' }
            ]
        },
        ending_win: {
            narrative: '你打翻盐罐、划破自己的手掌将血洒在阵眼——非人之物发出无声的尖啸，潮水倒灌封死洞窟。马布尔港的失踪在今夜终止，但你知道达贡的目光仍从深处投来。\n\n【结局：封印黑礁】你以理智为代价换得小镇暂时的安宁。线索板中应已积累完整证据链。',
            effects: { journal: '黑礁仪式已破坏，洞窟封印。' },
            end: true
        },
        ending_wounded: {
            narrative: '盐阵只被破坏一半。深潜者拖着你的一条腿沉入水中——你活了下来，却永远跛足，且每个满月都能听见合唱在梦中回响。\n\n【结局：生还但诅咒】',
            effects: { san: 5, journal: '仪式半毁；调查员生还但受诅咒。' },
            end: true
        },
        ending_pyrrhic: {
            narrative: '你守住教堂，但黑礁的仪式完成。第二天，整个马布尔港的人对你微笑——他们的笑容一模一样，且都没有眨眼。\n\n【结局：迟了一步】',
            effects: { san: 6 },
            end: true
        },
        ending_late: {
            narrative: '警方赶到时，仓库已空。三天后你在报上读到：马布尔港"因渔业丰收举行感恩游行"。照片中，所有人都穿着相同的雨披。\n\n【结局：调查失败】',
            end: true
        }
    }
};
