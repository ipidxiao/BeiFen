/** Original mini-scenario — abandoned sanatorium investigation (not Chaosium IP). */
export const CoCScenarioAbandonedAsylum = {
    id: 'abandoned_asylum',
    title: '废弃疗养院',
    subtitle: '石岭镇的最后病人',
    author: 'CoC Engine Team',
    license: 'Original - CoC Engine',
    tags: ['精神病院', '1920s', '封闭空间', '调查'],
    description: '1924年，石岭疗养院在一场不明火灾后永久关闭。你受雇清点遗留档案，却在空荡走廊里听见轮椅的吱呀声。',
    era: '1920s',
    estimatedMinutes: 25,
    startNode: 'gate',
    initialLocation: '石岭疗养院·铁门',
    setup: {
        location: '石岭疗养院·铁门',
        atmosphere: { level: 'calm', note: '秋雾笼罩的山腰' },
        map: {
            title: '石岭疗养院',
            rooms: [
                { id: 'gate', name: '铁门', connections: ['lobby'] },
                { id: 'lobby', name: '大厅', connections: ['gate', 'ward', 'basement'] },
                { id: 'ward', name: '病房区', connections: ['lobby', 'office'] },
                { id: 'office', name: '院长办公室', connections: ['ward'] },
                { id: 'basement', name: '地下档案室', connections: ['lobby'] }
            ],
            currentRoomId: 'gate'
        },
        journal: '委托：清点石岭疗养院关闭前的病人档案与财物。'
    },
    nodes: {
        gate: {
            narrative: '生锈铁门上挂着「永久封闭」的牌子，但锁已被撬开。雾从门缝渗出，带着消毒水与焦糊味。大厅的落地窗碎了一半，里面漆黑。',
            choices: [
                { id: 'enter', label: '进入大厅', next: 'lobby' },
                { id: 'perimeter', label: '沿外墙搜索', next: 'perimeter_check', skillCheck: { skill: '侦查' } }
            ]
        },
        perimeter_check: {
            narrative: '你在碎窗下发现新鲜脚印，通向侧门。',
            branch: { success: 'side_door', failure: 'lobby' }
        },
        side_door: {
            narrative: '侧门虚掩。墙上有抓痕，像有人被拖过。',
            effects: { clues: [{ id: 'asylum_scratches', title: '墙上抓痕', content: '五道平行抓痕，指甲断裂残留。', type: 'physical' }] },
            choices: [{ id: 'in', label: '进入大厅', next: 'lobby' }]
        },
        lobby: {
            narrative: '大厅天花板熏黑，登记台翻倒。一本值班日志摊开，最后一页写着："第17号病人从未离开——他一直在墙里。"',
            effects: {
                location: '疗养院大厅',
                mapRoom: 'lobby',
                clues: [{ id: 'asylum_log', title: '值班日志', content: '"第17号病人从未离开——他一直在墙里。"', type: 'document' }]
            },
            choices: [
                { id: 'ward', label: '前往病房区', next: 'ward' },
                { id: 'basement', label: '下地下档案室', next: 'basement' },
                { id: 'listen', label: '静听楼内动静', next: 'listen_check', skillCheck: { skill: '聆听' } }
            ]
        },
        listen_check: {
            narrative: '远处传来轮椅压过地板的节奏……',
            branch: { success: 'listen_ok', failure: 'listen_fail' }
        },
        listen_ok: {
            narrative: '声音来自病房区深处——有人在反复哼唱同一首摇篮曲。',
            effects: { journal: '轮椅声与摇篮曲来自病房区。' },
            choices: [{ id: 'w', label: '前往病房区', next: 'ward' }]
        },
        listen_fail: {
            narrative: '只有风穿过碎窗的呜咽。但你注意到大厅通往地下室的楼梯。',
            choices: [
                { id: 'b', label: '下地下室', next: 'basement' },
                { id: 'w2', label: '去病房区', next: 'ward' }
            ]
        },
        ward: {
            narrative: '病房区走廊两侧门扇大开。17号病房门牌被钉死，门缝下渗出黑色液体，像稀释的墨水。',
            effects: { location: '病房区', mapRoom: 'ward', san: 1 },
            choices: [
                { id: 'door17', label: '检查17号病房', next: 'room17', skillCheck: { skill: '力量' } },
                { id: 'office', label: '去院长办公室', next: 'office' }
            ]
        },
        room17: {
            narrative: '门轴尖叫。房内空无床铺，只有一面镜子——镜中映出的不是你，而是一个穿拘束衣的瘦影。',
            branch: { success: 'mirror_ok', failure: 'mirror_fail' }
        },
        mirror_ok: {
            narrative: '你移开镜子，发现墙后的隐藏空间。里面堆满同一人的病历，姓名被涂黑，只留编号17。',
            effects: {
                clues: [{ id: 'asylum_records', title: '17号病历', content: '反复记录"患者声称墙壁在呼吸"。', type: 'document' }],
                journal: '17号病人与"墙中"有关。'
            },
            choices: [{ id: 'off', label: '带病历去院长办公室', next: 'office' }]
        },
        mirror_fail: {
            narrative: '镜中瘦影突然贴近镜面。你后退时打翻药瓶，黑色液体蔓延——理智受到冲击。',
            effects: { san: 2 },
            choices: [{ id: 'run', label: '逃向院长办公室', next: 'office' }]
        },
        office: {
            narrative: '院长办公室保存完好。桌上放着石岭疗养院的平面图，地下室标注着「实验性隔离区」。',
            effects: { location: '院长办公室', mapRoom: 'office' },
            choices: [
                { id: 'read', label: '阅读院长日记', next: 'diary' },
                { id: 'base', label: '按图前往地下档案室', next: 'basement' }
            ]
        },
        diary: {
            narrative: '日记写道：17号能"穿墙"，院长试图用电击固定其意识，却引发大火。最后一页："若你读到这行，说明墙已选中你。"',
            effects: {
                clues: [{ id: 'asylum_diary', title: '院长日记', content: '17号能穿墙；大火因实验引发。', type: 'document' }],
                san: 1
            },
            choices: [{ id: 'down', label: '前往地下隔离区', next: 'basement' }]
        },
        basement: {
            narrative: '地下档案室潮湿如墓穴。档案柜后面有一扇假墙，已被外力撞开——里面是空的，只有中央一块人形凹痕。',
            effects: { location: '地下档案室', mapRoom: 'basement', atmosphere: { level: 'dread', note: '墙中空间' } },
            choices: [
                { id: 'enter_wall', label: '进入凹痕空间', next: 'finale', skillCheck: { skill: '意志' } },
                { id: 'seal', label: '用档案柜封死入口', next: 'ending_seal' }
            ]
        },
        finale: {
            narrative: '意志检定决定你是否被墙吞噬。',
            branch: { success: 'ending_win', failure: 'ending_taken' }
        },
        ending_win: {
            narrative: '你抵抗低语，将盐与档案柜封死入口。17号的哼唱渐弱。石岭疗养院终于真正关闭。\n\n【结局：封印完成】',
            effects: { journal: '封印墙中空间，疗养院威胁解除。' },
            end: true
        },
        ending_taken: {
            narrative: '凹痕合拢。你从外面看，墙上缓缓浮现一张新面孔——是你的。\n\n【结局：成为第18号】',
            effects: { san: 6 },
            end: true
        },
        ending_seal: {
            narrative: '你用尽全力推回档案柜。墙后传来不甘的抓挠，但入口被堵死。你活着离开，却每个雨夜都梦见有人在墙里敲。\n\n【结局：生还·后遗症】',
            effects: { journal: '封死入口但未彻底消灭威胁。', san: 2 },
            end: true
        }
    }
};
