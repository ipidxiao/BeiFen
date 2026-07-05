// GENERATED from js/tools/definitions.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC AI Tool Definitions Catalog (AUDITFIX8)
 *
 * Single source of truth for:
 *   1) OpenAI-compatible tool definitions sent to the model.
 *   2) Local argument schemas used before dispatching tool handlers.
 *
 * Internal validator-only flags such as `singleAsArray` are stripped from
 * the API-facing schema by buildTools(), but retained for local validation.
 */
window.CoCToolDefinitions = (function() {
    const TOOL_CATALOG = {
        spawn_npc: {
            description: '【必须调用】从模板生成NPC/怪物。使用标准属性模板（警察、邪教徒、深潜者、食尸鬼等），确保属性一致性。',
            parameters: {
                type: 'object',
                properties: {
                    template: { type: 'string', description: '模板名称（如"警察""邪教徒""深潜者""食尸鬼""米·戈"等）' },
                    name: { type: 'string', description: 'NPC/怪物名称（可选，默认使用模板名）' },
                    hp: { type: 'number', description: '覆写HP（可选）' },
                    armor: { type: 'number', description: '覆写护甲（可选）' },
                    description: { type: 'string', description: '外观/行为描述（可选）' }
                },
                required: ['template']
            }
        },
        push_skill_check: {
            description: '【推动检定】调查员以更大风险重试失败的技能检定。推动失败后果更严重。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '推动检定的调查员' },
                    skill_name: { type: 'string', description: '推动的技能名称' },
                    pushed_reason: { type: 'string', description: '推动理由（如何以不同方式重试）' },
                    difficulty: { type: 'string', enum: ['normal', 'hard', 'extreme'], description: '检定难度（默认normal）' }
                },
                required: ['target_name', 'skill_name']
            }
        },
        request_skill_check: {
            description: '要求特定调查员掷骰。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string' },
                    skill_name: { type: 'string' }
                },
                required: ['target_name', 'skill_name']
            }
        },
        update_character_status: {
            description: '更新特定调查员状态。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string' },
                    hp_change: { type: 'number' },
                    san_change: { type: 'number' },
                    note: { type: 'string', description: '变化原因备注' }
                },
                required: ['target_name']
            }
        },
        update_inventory: {
            description: '【必须调用】当玩家拾取、发现或获得物品时调用。枪械与弹药须分为两个独立物品；开火时从背包匹配弹药。',
            parameters: {
                type: 'object',
                properties: {
                    items: { type: 'array', minItems: 1, items: { type: 'string' }, singleAsArray: true },
                    source: { type: 'string', description: '物品获取来源（KP引擎启用时必填）' },
                    acquisition_source: { type: 'string', description: '同 source，获取记录' }
                },
                required: ['items']
            }
        },
        consume_inventory_items: {
            description: '消耗物品。',
            parameters: {
                type: 'object',
                properties: {
                    items: { type: 'array', minItems: 1, items: { type: 'string' }, singleAsArray: true }
                },
                required: ['items']
            }
        },
        system_alert: {
            description: '发送红色警告。',
            parameters: {
                type: 'object',
                properties: { message: { type: 'string' } },
                required: ['message']
            }
        },
        burst_fire: {
            description: '【连射/全自动开火】调查员使用自动武器进行三发点射或全自动扫射。消耗对应弹药数。',
            parameters: {
                type: 'object',
                properties: {
                    shooter_name: { type: 'string', description: '开火调查员' },
                    target_name: { type: 'string', description: '旧版兼容：同shooter_name' },
                    enemy_name: { type: 'string', description: '目标敌人' },
                    rounds: { type: 'number', description: '发射弹数（3=三发点射，5-30=全自动）' },
                    mode: { type: 'string', enum: ['burst', 'auto'], description: '射击模式' },
                    damage: { type: 'string', description: '武器伤害骰（可选）' }
                },
                required: ['shooter_name', 'enemy_name', 'rounds', 'mode']
            }
        },
        fire_weapon: {
            description: '开火结算（CoC 7e：常规火器伤害通常无视护甲，代码以 skipArmor 执行；特殊护甲/掩体由守秘人叙事处理）。优先指定 shooter_name 和 enemy_name；target_name 仅作旧版兼容。',
            parameters: {
                type: 'object',
                properties: {
                    shooter_name: { type: 'string', description: '开火的调查员姓名' },
                    target_name: { type: 'string', description: '旧版兼容字段：开火的调查员姓名，若已提供 shooter_name 可省略' },
                    enemy_name: { type: 'string', description: '目标敌人姓名；省略时默认第一个未被击败的敌人' },
                    damage: { type: 'string', description: '伤害骰，如 1D6/1D10+2' }
                },
                required: ['shooter_name']
            }
        },
        register_npc: {
            description: '【必须调用】剧情中初次出现有名字的NPC时，立即静默调用此工具记录到关系网络。',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'NPC姓名' },
                    description: { type: 'string', description: '一句话描述' },
                    relation: { type: 'string', description: '与调查员的关系：盟友/中立/敌对/可疑/线索来源/未知' },
                    status: { type: 'string', enum: ['alive', 'dead', 'missing', 'insane', 'unknown'] }
                },
                required: ['name', 'relation']
            }
        },
        update_npc_status: {
            description: 'NPC死亡、失踪、疯狂等状态变化时调用。',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    status: { type: 'string', enum: ['alive', 'dead', 'missing', 'insane', 'unknown'] },
                    note: { type: 'string', description: '状态变化备注' }
                },
                required: ['name', 'status']
            }
        },
        start_combat: {
            description: '【必须调用】当剧情进入激烈战斗时调用，激活回合制战斗界面。叙事须呈现 CoC 7e 完整行动菜单：防御（生存/逃脱/打断/保护）、攻击（近战/射击/反击）、战技（缴械/擒抱/推搡/击倒）、技能与环境、神秘学施法。',
            parameters: {
                type: 'object',
                properties: {
                    enemies: {
                        type: 'array',
                        description: '敌人列表',
                        minItems: 1,
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                hp: { type: 'number' },
                                armor: { type: 'number', description: '护甲减伤' },
                                description: { type: 'string' }
                            },
                            required: ['name', 'hp']
                        }
                    },
                    location: { type: 'string' },
                    notes: { type: 'string', description: '战斗起因备注' }
                },
                required: ['enemies']
            }
        },
        end_combat: {
            description: '战斗结束时调用（胜利/败北/撤退）。',
            parameters: {
                type: 'object',
                properties: {
                    outcome: { type: 'string', enum: ['victory', 'defeat', 'fled', 'other'] },
                    notes: { type: 'string' }
                },
                required: ['outcome']
            }
        },
        update_enemy: {
            description: '调查员攻击成功后，更新敌人HP。护甲会自动抵消伤害。',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: '敌人名称' },
                    hp_change: { type: 'number', description: '负数表示受伤（护甲前的原始伤害）' },
                    note: { type: 'string', description: '攻击描述' },
                    combat_action: { type: 'string', description: '战斗行动标签（默认 attack:melee）' }
                },
                required: ['name', 'hp_change']
            }
        },
        enemy_attack: {
            description: '敌人攻击调查员时调用，直接造成伤害。',
            parameters: {
                type: 'object',
                properties: {
                    enemy_name: { type: 'string' },
                    target_name: { type: 'string' },
                    damage: { type: 'number' },
                    description: { type: 'string' }
                },
                required: ['enemy_name', 'target_name', 'damage']
            }
        },
        dodge: {
            description: '【防御】调查员闪避或寻找掩体，计入战术多样性。',
            parameters: {
                type: 'object',
                properties: {
                    actor_name: { type: 'string', description: '执行闪避的调查员' },
                    enemy_name: { type: 'string', description: '威胁来源（可选）' },
                    skill_name: { type: 'string', description: '检定技能（默认闪避）' },
                    difficulty: { type: 'string', enum: ['normal', 'hard', 'extreme'], description: '检定难度' }
                },
                required: ['actor_name']
            }
        },
        fight_back: {
            description: '【反击】放弃闪避换取近战反击（CoC 7e fight back）。',
            parameters: {
                type: 'object',
                properties: {
                    actor_name: { type: 'string' },
                    target_name: { type: 'string', description: '旧版兼容：同 actor_name' },
                    enemy_name: { type: 'string' },
                    skill_name: { type: 'string', description: '反击技能（默认斗殴）' },
                    damage: { type: 'string', description: '反击伤害骰' }
                },
                required: ['actor_name', 'enemy_name']
            }
        },
        disarm: {
            description: '【战技】缴械对手。',
            parameters: {
                type: 'object',
                properties: {
                    actor_name: { type: 'string' },
                    enemy_name: { type: 'string' },
                    skill_name: { type: 'string' },
                    difficulty: { type: 'string', enum: ['normal', 'hard', 'extreme'] }
                },
                required: ['actor_name', 'enemy_name']
            }
        },
        grapple: {
            description: '【战技】擒抱或摔跤擒拿。',
            parameters: {
                type: 'object',
                properties: {
                    actor_name: { type: 'string' },
                    enemy_name: { type: 'string' },
                    skill_name: { type: 'string' },
                    difficulty: { type: 'string', enum: ['normal', 'hard', 'extreme'] }
                },
                required: ['actor_name', 'enemy_name']
            }
        },
        create_map: {
            description: '进入新场景/建筑时，绘制房间布局地图。用坐标(x:0-8, y:0-5)定位房间。',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: '场景名称' },
                    rooms: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', description: '唯一ID，如r1/r2' },
                                name: { type: 'string' },
                                status: { type: 'string', enum: ['unknown', 'explored', 'current', 'dangerous', 'locked'], description: 'unknown=未探索' },
                                x: { type: 'number' },
                                y: { type: 'number' },
                                connections: { type: 'array', items: { type: 'string' }, description: '连接的其他房间id', singleAsArray: true },
                                note: { type: 'string' }
                            },
                            required: ['id', 'name', 'x', 'y']
                        }
                    }
                },
                required: ['title', 'rooms']
            }
        },
        update_room: {
            description: '调查员探索/发现某房间时，更新其状态。',
            parameters: {
                type: 'object',
                properties: {
                    room_id: { type: 'string', description: '房间ID或名称' },
                    status: { type: 'string', enum: ['unknown', 'explored', 'current', 'dangerous', 'locked'] },
                    note: { type: 'string', description: '新发现的备注' }
                },
                required: ['room_id']
            }
        },
        set_position: {
            description: '调查员移动到某房间时调用，标记当前位置（前一个房间自动变为已探索）。',
            parameters: {
                type: 'object',
                properties: { room_id: { type: 'string' } },
                required: ['room_id']
            }
        },
        add_clue: {
            description: '【必须调用】调查员发现有意义的线索、证据、信息时，立即静默记录到线索板。',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: '唯一ID，如clue_knife' },
                    title: { type: 'string', description: '线索简称（≤10字）' },
                    content: { type: 'string', description: '详细描述' },
                    type: { type: 'string', enum: ['physical', 'testimony', 'document', 'location', 'event', 'person', 'supernatural'], description: '物证/证词/文件/地点/事件/人物/异常' },
                    related_ids: { type: 'array', items: { type: 'string' }, description: '与已有线索的关联ID', singleAsArray: true }
                },
                required: ['id', 'title', 'content', 'type']
            }
        },
        link_clues: {
            description: '发现两条线索存在直接联系时，建立连接并注明关系。',
            parameters: {
                type: 'object',
                properties: {
                    from_id: { type: 'string' },
                    to_id: { type: 'string' },
                    note: { type: 'string', description: '连接关系说明（如：同一把刀/时间吻合）' }
                },
                required: ['from_id', 'to_id']
            }
        },
        mark_clue_status: {
            description: '线索状态变化时调用：new新发现/investigating调查中/solved已解释/key关键线索。',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    status: { type: 'string', enum: ['new', 'investigating', 'solved', 'key'] },
                    note: { type: 'string' }
                },
                required: ['id', 'status']
            }
        },
        roll_dice: {
            description: '进行自定义骰子检定，支持任意骰子表示法。用于非技能的特殊骰子场合（仪式、运气、伤害、随机事件等）。',
            parameters: {
                type: 'object',
                properties: {
                    notation: { type: 'string', description: '骰子表示法：1d6 / 2d6+3 / 3d10k2（取最高2）/ 1d100 等' },
                    label: { type: 'string', description: '检定描述，如：黑暗中的运气、仪式成功率' },
                    context: { type: 'string', description: '出现此检定的原因' }
                },
                required: ['notation', 'label']
            }
        },
        group_roll: {
            description: '全体或指定调查员同时进行相同技能检定（如察觉、躲避等集体检定）。',
            parameters: {
                type: 'object',
                properties: {
                    char_names: { type: 'array', items: { type: 'string' }, description: '调查员名称列表，空数组=全体', singleAsArray: true },
                    skill_name: { type: 'string' },
                    context: { type: 'string' }
                },
                required: ['skill_name']
            }
        },
        opposed_roll: {
            description: '两个角色对抗检定（如：追逐/逃脱、说服/抵抗等）。',
            parameters: {
                type: 'object',
                properties: {
                    char_name: { type: 'string', description: '调查员名称' },
                    char_skill: { type: 'string' },
                    opponent_name: { type: 'string' },
                    opponent_value: { type: 'number', description: '对手的技能值（0-99）' },
                    label: { type: 'string' }
                },
                required: ['char_name', 'char_skill', 'opponent_name', 'opponent_value', 'label']
            }
        },
        apply_environmental_damage: {
            description: '【环境伤害】对调查员施加坠落/火焰/溺水/电击/爆炸等环境伤害。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '目标调查员名称' },
                    type: { type: 'string', enum: ['fall','fire','drowning','electric','explosion'], description: '伤害类型' },
                    value: { type: 'number', description: '参数值(坠落英尺/火焰强度1-4/电压等级1-4/爆炸距离英尺)' },
                    intensity: { type: 'string', description: '强度描述(可选,如minor/moderate/severe/inferno)' }
                },
                required: ['target_name', 'type', 'value']
            }
        },
        apply_poison: {
            description: '【毒素】对目标施加毒素效果(每轮持续伤害+CON检定抵抗)。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '目标名称' },
                    potency: { type: 'string', enum: ['mild','moderate','lethal'], description: '毒性等级' },
                    delay_rounds: { type: 'number', description: '延迟发作回合数(默认0)' }
                },
                required: ['target_name', 'potency']
            }
        },
        bonus_penalty_roll: {
            description: '【奖励/惩罚骰】为下次技能检定施加奖励骰或惩罚骰(CoC 7e核心机制)。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '调查员名称' },
                    skill_name: { type: 'string', description: '技能名称' },
                    bonus_dice: { type: 'number', description: '奖励骰数量(优势场景)' },
                    penalty_dice: { type: 'number', description: '惩罚骰数量(劣势场景)' },
                    difficulty: { type: 'string', enum: ['normal','hard','extreme'], description: '难度等级' }
                },
                required: ['target_name', 'skill_name']
            }
        },
        record_engine_log: {
            description: '【铁律】当系统架构发生重大变化、Bug被修复或新功能实装时，必须调用此工具记录开发者日志。',
            parameters: {
                type: 'object',
                properties: {
                    version: { type: 'string', description: '版本号，如 v11' },
                    title: { type: 'string', description: '更新标题' },
                    changes: { type: 'array', minItems: 1, items: { type: 'string' }, description: '改动要点列表', singleAsArray: true }
                },
                required: ['version', 'title', 'changes']
            }
        },
        study_tome: {
            description: '调查员阅读/研读神话典籍。weeks 参数为 0 表示初次浏览，>0 表示投入周数进行完整研读。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '研读者的姓名' },
                    tome_name: { type: 'string', description: '典籍名称' },
                    weeks: { type: 'number', description: '研读周数（0=浏览）' }
                },
                required: ['target_name', 'tome_name']
            }
        },
        cast_spell: {
            description: '【调查员施放法术】消耗POW/SAN/MP施放已学会的神话法术。',
            parameters: {
                type: 'object',
                properties: {
                    caster_name: { type: 'string', description: '施法者姓名' },
                    spell_name: { type: 'string', description: '法术名称' },
                    target_name: { type: 'string', description: '目标名称（可选）' }
                },
                required: ['caster_name', 'spell_name']
            }
        },
        spend_luck: {
            description: '调查员消耗幸运点数改变命运。1点幸运=1%技能值加成。',
            parameters: {
                type: 'object',
                properties: {
                    target_name: { type: 'string', description: '使用幸运的调查员姓名' },
                    amount: { type: 'number', description: '消耗的幸运点数' }
                },
                required: ['target_name', 'amount']
            }
        },
    };

    const INTERNAL_SCHEMA_KEYS = new Set(['singleAsArray']);

    const clone = (value) => {
        if (Array.isArray(value)) return value.map(clone);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((key) => { out[key] = clone(value[key]); });
            return out;
        }
        return value;
    };

    const stripInternalSchemaKeys = (value) => {
        if (Array.isArray(value)) return value.map(stripInternalSchemaKeys);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((key) => {
                if (!INTERNAL_SCHEMA_KEYS.has(key)) out[key] = stripInternalSchemaKeys(value[key]);
            });
            return out;
        }
        return value;
    };

    const addStrictObjectBoundaries = (value) => {
        if (Array.isArray(value)) return value.map(addStrictObjectBoundaries);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((key) => { out[key] = addStrictObjectBoundaries(value[key]); });
            if (out.type === 'object' && out.additionalProperties === undefined) out.additionalProperties = false;
            return out;
        }
        return value;
    };

    const getDefinition = (name) => TOOL_CATALOG[name] || null;
    const getSchema = (name) => getDefinition(name)?.parameters || null;
    const getNames = () => Object.keys(TOOL_CATALOG);
    const buildTools = () => getNames().map((name) => {
        const def = TOOL_CATALOG[name];
        return {
            type: 'function',
            function: {
                name,
                description: def.description,
                parameters: addStrictObjectBoundaries(stripInternalSchemaKeys(def.parameters))
            }
        };
    });

    const argumentSchemas = Object.freeze(getNames().reduce((acc, name) => {
        acc[name] = TOOL_CATALOG[name].parameters;
        return acc;
    }, {}));

    const auditAgainstHandlers = (handlerNames = [], specialNames = ['request_skill_check', 'push_skill_check']) => {
        const handlerSet = new Set(Array.isArray(handlerNames) ? handlerNames : []);
        const specialSet = new Set(Array.isArray(specialNames) ? specialNames : []);
        const catalogNames = getNames();
        const missingHandlers = catalogNames.filter(name => !handlerSet.has(name) && !specialSet.has(name));
        const handlersWithoutCatalog = [...handlerSet].filter(name => !TOOL_CATALOG[name]);
        const duplicateNames = catalogNames.filter((name, idx) => catalogNames.indexOf(name) !== idx);
        return {
            ok: missingHandlers.length === 0 && handlersWithoutCatalog.length === 0 && duplicateNames.length === 0,
            catalogNames,
            missingHandlers,
            handlersWithoutCatalog,
            duplicateNames
        };
    };

    return {
        catalog: TOOL_CATALOG,
        argumentSchemas,
        getDefinition,
        getSchema,
        getNames,
        buildTools,
        stripInternalSchemaKeys,
        addStrictObjectBoundaries,
        auditAgainstHandlers,
        clone
    };
})();
