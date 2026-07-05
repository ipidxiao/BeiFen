/**
 * Remote scenario catalog — metadata for downloadable packs (same-origin JSON).
 * Full scenario JSON lives in js/data/scenarios/packages/*.json
 *
 * Primary url is same-origin (offline-capable). Optional mirrorUrls may point to
 * published CDN mirrors once the public repo is available.
 *
 * Schema per entry:
 *   id, title, author, license, licenseUrl?, sourceUrl?,
 *   url,           // primary — same-origin packages/*.json
 *   mirrorUrls[],  // optional external mirrors (empty until repo published)
 *   fallbackUrl,   // same-origin packages/*.json (deduped in download chain)
 *   packageUrl     // backward compat alias for fallbackUrl
 */
const PKG_BASE = './js/data/scenarios/packages';

export const CoCScenarioRemoteCatalog = {
    entries: [
        {
            id: 'isolated_lab',
            title: '隔离研究所',
            subtitle: '极地科考站的静默',
            author: 'CoC Engine Team',
            license: 'Original - CoC Engine',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
            sourceUrl: 'https://github.com/coc-engine/ccgs',
            description: '1925年，南极内陆科考站「长夜站」失去联络。救援队抵达时只剩一名幸存者——他声称「墙里的东西」带走了所有人。',
            playTime: 35,
            estimatedMinutes: 35,
            tags: ['极地', '1920s', '封闭空间', '科幻恐怖'],
            era: '1920s',
            nodeCount: 18,
            url: `${PKG_BASE}/isolated_lab.json`,
            mirrorUrls: [],
            fallbackUrl: `${PKG_BASE}/isolated_lab.json`,
            packageUrl: `${PKG_BASE}/isolated_lab.json`
        },
        {
            id: 'haunted_inheritance',
            title: '闹鬼的遗产',
            subtitle: '遗嘱与家族诅咒',
            author: 'CoC Engine Team',
            license: 'Original - CoC Engine',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
            sourceUrl: 'https://github.com/coc-engine/ccgs',
            description: '你继承了一栋维多利亚式老宅。律师警告：前七任继承者都在入住第一周内失踪。遗嘱附条件——必须在宅中住满三夜才能过户。',
            playTime: 30,
            estimatedMinutes: 30,
            tags: ['老宅', '1920s', '继承', '闹鬼'],
            era: '1920s',
            nodeCount: 17,
            url: `${PKG_BASE}/haunted_inheritance.json`,
            mirrorUrls: [],
            fallbackUrl: `${PKG_BASE}/haunted_inheritance.json`,
            packageUrl: `${PKG_BASE}/haunted_inheritance.json`
        },
        {
            id: 'cc_asylum_whispers',
            title: '疗养院低语',
            subtitle: '石岭镇封闭病房的回声',
            author: 'CoC Engine Community',
            license: 'CC-BY 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
            sourceUrl: 'https://creativecommons.org/licenses/by/4.0/',
            description: '1923年石岭疗养院在一场不明火灾后永久关闭。你受雇清点遗留档案，却在空荡走廊里听见轮椅的吱呀声与低语。改编自公共领域恐怖叙事传统。',
            playTime: 28,
            estimatedMinutes: 28,
            tags: ['精神病院', '1920s', '封闭空间', '社区模组'],
            era: '1920s',
            nodeCount: 20,
            url: `${PKG_BASE}/cc_asylum_whispers.json`,
            mirrorUrls: [],
            fallbackUrl: `${PKG_BASE}/cc_asylum_whispers.json`,
            packageUrl: `${PKG_BASE}/cc_asylum_whispers.json`
        },
        {
            id: 'cc_lighthouse_log',
            title: '灯塔日志',
            subtitle: '风暴角最后一条摩尔斯信号',
            author: 'CoC Engine Community',
            license: 'CC-BY 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
            sourceUrl: 'https://creativecommons.org/licenses/by/4.0/',
            description: '风暴角灯塔守塔人失踪三周。你调查最后一本航海日志——其中记录着向深海闪烁的磷绿信号。改编自公共海事恐怖传统。',
            playTime: 30,
            estimatedMinutes: 30,
            tags: ['海岸', '1920s', '灯塔', '社区模组'],
            era: '1920s',
            nodeCount: 19,
            url: `${PKG_BASE}/cc_lighthouse_log.json`,
            mirrorUrls: [],
            fallbackUrl: `${PKG_BASE}/cc_lighthouse_log.json`,
            packageUrl: `${PKG_BASE}/cc_lighthouse_log.json`
        },
        {
            id: 'cc_museum_night',
            title: '博物馆之夜',
            subtitle: '午夜展厅的苏醒雕像',
            author: 'CoC Engine Community',
            license: 'CC-BY 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
            sourceUrl: 'https://creativecommons.org/licenses/by/4.0/',
            description: '大都会自然史博物馆夜间安保巡检。闭馆后，某些展品在玻璃柜中改变了姿势。改编自公共都市怪谈传统。',
            playTime: 32,
            estimatedMinutes: 32,
            tags: ['博物馆', '1920s', '都市恐怖', '社区模组'],
            era: '1920s',
            nodeCount: 18,
            url: `${PKG_BASE}/cc_museum_night.json`,
            mirrorUrls: [],
            fallbackUrl: `${PKG_BASE}/cc_museum_night.json`,
            packageUrl: `${PKG_BASE}/cc_museum_night.json`
        }
    ],

    get(id) {
        return this.entries.find((e) => e.id === id) || null;
    },

    list() {
        return this.entries.slice();
    }
};

try {
    if (typeof window !== 'undefined') window.CoCScenarioRemoteCatalog = CoCScenarioRemoteCatalog;
} catch (e) { /* non-browser */ }
