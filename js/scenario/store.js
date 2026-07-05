// GENERATED from js/scenario/store.mjs — do not edit; run: npm run build:js
/**
 * Scenario Store — catalog, local library, IndexedDB download persistence.
 * Built-in scenarios ship in js/data/scenarios/*.js; downloadable packs in packages/*.json.
 */
const IDB_NAME = 'coc_engine';
const IDB_STORE = 'scenarios';
const LS_KEY = 'coc_scenarios_downloaded';

const BUILTIN_IDS = [
    'tutorial', 'deep_one_shadow', 'abandoned_asylum', 'midnight_museum',
    'coastal_festival', 'university_occult', 'lighthouse_signal', 'missing_child',
    'train_to_nowhere', 'carnival_of_masks'
];

const BUILTIN_GETTERS = {
    tutorial: () => window.CoCScenarioTutorial,
    deep_one_shadow: () => window.CoCScenarioDeepOneShadow,
    abandoned_asylum: () => window.CoCScenarioAbandonedAsylum,
    midnight_museum: () => window.CoCScenarioMidnightMuseum,
    coastal_festival: () => window.CoCScenarioCoastalFestival,
    university_occult: () => window.CoCScenarioUniversityOccult,
    lighthouse_signal: () => window.CoCScenarioLighthouseSignal,
    missing_child: () => window.CoCScenarioMissingChild,
    train_to_nowhere: () => window.CoCScenarioTrainToNowhere,
    carnival_of_masks: () => window.CoCScenarioCarnivalOfMasks
};

let _downloaded = {};
let _downloadMeta = {};
let _useLocalStorage = false;
let _initPromise = null;

/** True when url points at bundled packages/*.json (same-origin, offline-capable). */
function isBundledPackageUrl(url) {
    return typeof url === 'string' && url.includes('/scenarios/packages/');
}

/** Resolve catalog entry into ordered download chain: primary → mirrors → fallback. */
function resolveDownloadChain(entry) {
    const fallback = entry.fallbackUrl || entry.packageUrl;
    const primary = entry.url || entry.packageUrl || fallback;
    const mirrors = Array.isArray(entry.mirrorUrls) ? entry.mirrorUrls : [];
    const chain = [];
    const seen = new Set();
    const push = (url, source) => {
        if (!url || seen.has(url)) return;
        seen.add(url);
        chain.push({ url, source });
    };
    const primarySource = (primary === fallback || isBundledPackageUrl(primary)) ? 'fallback' : 'remote';
    push(primary, primarySource);
    mirrors.forEach((u) => push(u, 'mirror'));
    push(fallback, 'fallback');
    return chain;
}

async function fetchScenarioPackage(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`下载失败 (${resp.status})`);
    return resp.json();
}

function getCatalogApi() {
    return window.CoCScenarioCatalog || null;
}

function getRemoteCatalog() {
    return window.CoCScenarioRemoteCatalog || { entries: [], get: () => null };
}

function getBuiltin(id) {
    const fn = BUILTIN_GETTERS[id];
    return fn ? fn() || null : null;
}

function metaFromScenario(scenario, extra = {}) {
    if (!scenario) return null;
    return {
        id: scenario.id,
        title: scenario.title,
        subtitle: scenario.subtitle || '',
        description: scenario.description || '',
        author: scenario.author || 'Unknown',
        license: scenario.license || 'Unknown',
        tags: Array.isArray(scenario.tags) ? scenario.tags : [],
        era: scenario.era || '1920s',
        estimatedMinutes: scenario.estimatedMinutes || null,
        playTime: scenario.estimatedMinutes || null,
        nodeCount: scenario.nodes ? Object.keys(scenario.nodes).length : 0,
        ...extra
    };
}

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            _useLocalStorage = true;
            resolve(null);
            return;
        }
        const req = indexedDB.open(IDB_NAME, 1);
        req.onerror = () => {
            _useLocalStorage = true;
            resolve(null);
        };
        req.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
    });
}

async function loadFromIDB() {
    _downloaded = {};
    _downloadMeta = {};
    const db = await openDB();
    if (!db) {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) || {};
                _downloaded = parsed.data || parsed;
                _downloadMeta = parsed.meta || {};
            }
        } catch (e) { /* ignore */ }
        return _downloaded;
    }
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
            (_downloaded = {});
            (_downloadMeta = {});
            (req.result || []).forEach((row) => {
                if (row && row.id && row.data) {
                    _downloaded[row.id] = row.data;
                    if (row.downloadSource) _downloadMeta[row.id] = { downloadSource: row.downloadSource };
                }
            });
            resolve(_downloaded);
        };
        req.onerror = () => resolve(_downloaded);
    });
}

async function persistDownload(id, scenario, downloadSource) {
    if (downloadSource) {
        _downloadMeta[id] = { downloadSource };
        scenario._downloadSource = downloadSource;
    }
    const db = await openDB();
    if (!db || _useLocalStorage) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ data: _downloaded, meta: _downloadMeta }));
            if (_useLocalStorage && JSON.stringify(_downloaded).length > 4_000_000) {
                console.warn('[ScenarioStore] localStorage fallback may exceed quota; prefer IndexedDB.');
            }
        } catch (e) {
            throw new Error('存储空间不足，无法保存下载模组');
        }
        return;
    }
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(IDB_STORE).put({ id, data: scenario, downloadSource, savedAt: Date.now() });
    });
}

async function deleteFromIDB(id) {
    delete _downloadMeta[id];
    const db = await openDB();
    if (!db || _useLocalStorage) {
        try { localStorage.setItem(LS_KEY, JSON.stringify({ data: _downloaded, meta: _downloadMeta })); } catch (e) { /* ignore */ }
        return;
    }
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.objectStore(IDB_STORE).delete(id);
    });
}

function resolveStatus(id) {
    if (getBuiltin(id)) return 'builtin';
    if (_downloaded[id]) return 'downloaded';
    return 'available';
}

const CoCScenarioStore = {
    BUILTIN_IDS,

    init() {
        if (!_initPromise) _initPromise = loadFromIDB();
        return _initPromise;
    },

    usesLocalStorageFallback() {
        return _useLocalStorage;
    },

    listCatalog() {
        const catalog = getCatalogApi();
        const builtIn = (catalog ? catalog.list() : BUILTIN_IDS.map((id) => metaFromScenario(getBuiltin(id)))).filter(Boolean);
        const builtInMap = new Map(builtIn.map((m) => [m.id, m]));
        const remote = getRemoteCatalog().entries || [];
        const merged = builtIn.map((m) => ({
            ...m,
            source: 'builtin',
            status: 'builtin',
            downloadable: false
        }));
        remote.forEach((entry) => {
            if (builtInMap.has(entry.id)) return;
            const status = resolveStatus(entry.id);
            const meta = _downloadMeta[entry.id] || {};
            const dlSource = meta.downloadSource || (_downloaded[entry.id] && _downloaded[entry.id]._downloadSource) || null;
            merged.push({
                ...entry,
                playTime: entry.playTime || entry.estimatedMinutes || null,
                estimatedMinutes: entry.estimatedMinutes || entry.playTime || null,
                nodeCount: entry.nodeCount || 0,
                source: 'remote',
                status,
                downloadable: status === 'available',
                downloadSource: status === 'downloaded' ? dlSource : null
            });
        });
        return merged;
    },

    listLocal() {
        return [...BUILTIN_IDS, ...Object.keys(_downloaded).filter((id) => !BUILTIN_IDS.includes(id))];
    },

    getScenario(id) {
        const builtin = getBuiltin(id);
        if (builtin) return builtin;
        return _downloaded[id] || null;
    },

    async downloadScenario(id) {
        if (getBuiltin(id)) return getBuiltin(id);
        if (_downloaded[id]) return _downloaded[id];

        const remote = getRemoteCatalog().get(id);
        const fallback = remote && (remote.fallbackUrl || remote.packageUrl);
        if (!remote || !fallback) throw new Error(`模组「${id}」不在下载目录中`);

        const chain = resolveDownloadChain(remote);
        let scenario = null;
        let downloadSource = null;
        let lastError = null;

        for (const { url, source } of chain) {
            try {
                scenario = await fetchScenarioPackage(url);
                downloadSource = source;
                break;
            } catch (e) {
                lastError = e;
            }
        }

        if (!scenario) {
            const detail = lastError && lastError.message ? lastError.message : '网络错误';
            throw new Error(`所有下载源均不可用（${detail}），请检查网络或稍后重试`);
        }

        const catalog = getCatalogApi();
        if (catalog && catalog.validate) {
            const v = catalog.validate(scenario);
            if (!v.ok) throw new Error('模组格式无效: ' + (v.errors || []).join(', '));
        }

        _downloaded[id] = scenario;
        await persistDownload(id, scenario, downloadSource);
        return scenario;
    },

    async removeDownload(id) {
        if (BUILTIN_IDS.includes(id)) return false;
        if (!_downloaded[id]) return false;
        delete _downloaded[id];
        await deleteFromIDB(id);
        return true;
    },

    isAvailable(id) {
        return !!getBuiltin(id) || !!_downloaded[id];
    },

    getStatus(id) {
        return resolveStatus(id);
    },

    validate: (scenario) => {
        const catalog = getCatalogApi();
        return catalog ? catalog.validate(scenario) : { ok: false, errors: ['catalog unavailable'] };
    }
};

try {
    if (typeof window !== 'undefined') window.CoCScenarioStore = CoCScenarioStore;
} catch (e) { /* non-browser */ }
