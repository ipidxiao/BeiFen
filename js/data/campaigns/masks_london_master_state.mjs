// Campaign master state — London Soho underground altar crisis (user-provided archive)

export const CAMPAIGN_MASTER_STATE = {
    campaign_master_state: {
        system_anchor: {
            current_location: 'London_Soho_Bluebell_Street_7_Underground_Altar',
            current_time: '03:20_AM',
            core_objective: 'Operate_Mouth_of_Death_Exhaust_Valve_Within_5_Minutes',
            immediate_threats: [
                'Oxygen_Depletion_Under_5_Percent',
                'Enraged_Underground_Mythos_Entity',
                'Toxic_Black_Water_Steam_And_Rising_Pressure'
            ]
        },
        timeline_log: {
            event_01: 'Infiltrated_Southwark_Lab_Seized_Tentacle_Heart',
            event_02: 'V_Breached_Door_With_Spatial_Gun_Suffered_SAN_Impact',
            event_03: 'Thames_River_Battle_Spatial_Gun_Damaged_Mythos_Creature',
            event_04: 'Xiu_Destroyed_Crane_Blocked_Pursuit',
            event_05: 'Arrived_Private_Dock_Physiological_Settlement_Neil_Sleeps',
            event_06: 'Time_02_00_Soho_Warehouse_Breakout',
            event_07: 'Time_02_30_Lifeboat_Arrived_Thames_Secret_Gate',
            event_08: 'Time_03_00_Entered_Bluebell_Street_7',
            event_09: 'Time_03_15_Altar_Battle_Victory_Ritual_Stopped',
            event_10: 'Time_03_20_Current_Mouth_of_Death_Exhaust_Crisis'
        },
        investigator_roster: {
            V_Leader: {
                status: 'Active',
                hp: 14,
                max_hp: 14,
                san: 46,
                condition: 'Highly_Focused_Mild_Hypoxia_Lung_Burning',
                equipped: ['Spatial_Disintegration_Gun', 'Police_Revolver']
            },
            Xiu_Avenger: {
                status: 'Active',
                hp: 10,
                max_hp: 10,
                san: 66,
                condition: 'Lucid_Decisive_Action_Ready',
                equipped: ['Neil_Bio_Suppressant_Sprayer', 'Bronze_Mythos_Dagger', 'Lead_Box']
            },
            Hugo_Scholar: {
                status: 'Active',
                hp: 8,
                max_hp: 8,
                san: 84,
                condition: 'Extreme_Fear_Hypoxia_Auditory_Hallucinations_Survival_Instinct',
                equipped: ['Ebony_Cane']
            },
            Neil_Engineer: {
                status: 'Offline',
                condition: 'Deep_Rest_Standby_Mode',
                note: 'Nerve_Damage_In_Hands_Awaiting_Activation_Command'
            }
        },
        inventory_registry: {
            weapons_and_combat_gear: {
                spatial_disintegration_gun: {
                    holder: 'V',
                    status: 'Overload_Cooling_Unstable',
                    cost: '1D10_SAN_Per_Shot'
                },
                police_revolver: { holder: 'V', ammo: 3 },
                improvised_bomb: { quantity: 1, location: 'Pre_placed_at_counter' },
                bronze_dagger: { holder: 'Xiu', property: 'Black_Pharaoh_Mythos_Energy' },
                energy_absorption_grenade: { holder: 'Neil_Offline', quantity: 1 }
            },
            special_devices: {
                neil_bio_suppressant_sprayer: {
                    holder: 'Xiu',
                    contents: '200ml_Active_Slime_High_Corrosive',
                    condition: 'Cracked_Pump_Handle_Due_To_Impact_And_Pressure'
                },
                magnetic_disintegration_generator: {
                    holder: 'Left_by_Neil_Maintained_by_Xiu',
                    durability: '85_Percent',
                    condition: 'Stable_Gear_Loose_Fasteners_Coils_Melted',
                    components: ['Pulley_Base', 'Lead_Shield', 'Frequency_Array']
                },
                neil_repair_kit: { holder: 'Xiu', location: 'Next_to_Generator' },
                blue_light_lantern: { status: 'High_Frequency_Mode_Visual_Interference' }
            },
            mythos_materials_and_artifacts: {
                lead_box_contents: {
                    holder: 'Xiu',
                    lead_grey_core: 'Pulsing_Magnetic_Interference',
                    black_gem: 'Extreme_Cold_Extracted_From_Despair_Mask'
                },
                purple_silk_parcel: 'Contains_High_Energy_Glowing_Liquid',
                black_carapace_fragment: 'With_Neil_Awaiting_Upgrade'
            },
            intel_and_evidence: {
                jackson_elias_journal: 'London_Chapter_Unlocked',
                bloody_tongue_receipt: 'Soho_Logistics_Hub_Identified',
                reverse_golden_watch: 'Counter_Clockwise_Time_Logic_Manipulation',
                silver_scarab_seal: 'High_Level_Clearance_Card',
                parchment_fragment: 'Underground_Lab_Password',
                tentacle_heart_specimen: 'Shielded_Tracking_Source'
            },
            general_supplies: {
                first_aid_kit: '50_Percent_Capacity',
                ebony_cane: 'Used_by_Hugo_for_probing'
            }
        },
        environment_interactive_nodes: {
            room_seal: 'Absolute_Seal_Rune_Active',
            atmosphere: 'Heavy_Ozone_Toxic_Black_Water_Steam_Hypoxia',
            pressure_dynamics: 'Rising_Underground_Pressure_Red_Liquid_Seeping_From_Walls',
            death_mouth_exhaust_valve: {
                status: 'Heavily_Rusted',
                obstruction: 'Wrapped_In_Purple_Dried_Tentacles',
                requirement: 'Requires_Specific_Technique_Or_Tool_To_Open'
            }
        }
    }
};

/** Campaign-era default clock for londonKpState.TIME (Masks London only). */
export const LONDON_KP_TIME_DEFAULTS = {
    date: '1925-03-15',
    anchorTime: '03:20_AM'
};

/** Build TIME block from campaign anchor time (e.g. 03:20_AM). */
export function buildLondonKpTime(anchorTime) {
    const raw = anchorTime || LONDON_KP_TIME_DEFAULTS.anchorTime;
    return {
        date: LONDON_KP_TIME_DEFAULTS.date,
        hour: String(raw).replace(/_/g, ':').replace(/AM/i, '').trim(),
        environment: { entropy_increment: 0 }
    };
}

/** Human-readable location label for UI */
export function getLocationLabel() {
    const loc = CAMPAIGN_MASTER_STATE.campaign_master_state.system_anchor.current_location;
    const map = {
        London_Soho_Bluebell_Street_7_Underground_Altar: '伦敦·苏活区·风铃街7号·地下祭坛'
    };
    return map[loc] || loc.replace(/_/g, ' ');
}

if (typeof window !== 'undefined') {
    window.CoCMasksLondonMasterState = CAMPAIGN_MASTER_STATE;
}
