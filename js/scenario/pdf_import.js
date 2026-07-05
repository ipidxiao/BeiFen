// GENERATED from js/scenario/pdf_import.mjs — do not edit; run: npm run build:js
/**
 * Client-side PDF → coc-engine-v1 scenario conversion (personal use only).
 * Output stays in IndexedDB; never shipped in repo packages/.
 */
const PDF_WORKER_SRC = './vendor/pdf.worker.min.js';
const PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_NODE_TEXT = 3200;
const AI_CHUNK_CHARS = 7000;

const SECTION_HEADING_RE = /^(?:#{1,3}\s*)?(?:Scene|Chapter|Part|Section|Act|Interlude|Episode|Appendix|Intro(?:duction)?|Prologue|Epilogue|\d+[\.\)]\s+|[IVXLC]+[\.\)]\s+|场景|章节|部分|幕|第[\d一二三四五六七八九十百千]+[章节幕节]|附录|序章|尾声)/i;

const SKILL_PATTERNS = [
    { re: /\bSpot Hidden\b/i, skill: '侦查' },
    { re: /\bListen(?:ing)?\b/i, skill: '聆听' },
    { re: /\bPsychology\b/i, skill: '心理学' },
    { re: /\bStealth\b/i, skill: '潜行' },
    { re: /\bOccult\b/i, skill: '神秘学' },
    { re: /\bLibrary Use\b/i, skill: '图书馆使用' },
    { re: /\bCredit Rating\b/i, skill: '信用评级' },
    { re: /\bPersuade\b/i, skill: '说服' },
    { re: /\bFast Talk\b/i, skill: '话术' },
    { re: /\bIntimidate\b/i, skill: '恐吓' },
    { re: /\bFight\b|\bBrawl\b/i, skill: '斗殴' },
    { re: /\bDodge\b/i, skill: '闪避' },
    { re: /侦查|聆听|心理学|潜行|神秘学|图书馆使用|信用评级|说服|话术|恐吓|斗殴|闪避|侦查检定|聆听检定/,
      map: (m) => String(m[0]).replace(/检定$/, '') },
    { re: /\b(DEX|STR|CON|INT|POW|APP|EDU|SIZ|CHA)\s*(?:roll|check|检定)\b/i,
      map: (m) => ({ DEX: '敏捷', STR: '力量', CON: '体质', INT: '智力', POW: '意志', APP: '外貌', EDU: '教育', SIZ: '体型', CHA: '魅力' }[m[1].toUpperCase()] || m[1]) }
];

let _pdfJsReady = null;

function pdfSafeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (_) {
        return fallback;
    }
}

function pdfIsBrowserOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
}

async function pdfFetchAiCompletionWithRetry(url, options = {}, timeoutMs = 60000, maxAttempts = 2) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
            const res = await fetch(url, controller ? { ...options, signal: controller.signal } : options);
            if (!res.ok) {
                const err = new Error(`HTTP ${res.status}`);
                err.status = res.status;
                throw err;
            }
            return { response: res, attempts: attempt };
        } catch (err) {
            lastError = err;
            if (attempt >= maxAttempts) throw err;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
    throw lastError || new Error('AI 请求失败');
}

function getFetch(fetchImpl) {
    return fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
}

function sanitizeText(text) {
    return String(text || '')
        .replace(/\u0000/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();
}

function truncateText(text, max = MAX_NODE_TEXT) {
    const t = sanitizeText(text);
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + '…';
}

function slugNodeId(index) {
    return `sec_${index + 1}`;
}

function detectSkillCheck(sectionText) {
    for (const pat of SKILL_PATTERNS) {
        const m = sectionText.match(pat.re);
        if (m) {
            const skill = typeof pat.map === 'function' ? pat.map(m) : pat.skill;
            if (skill) return { skill: String(skill).slice(0, 24) };
        }
    }
    return null;
}

function splitIntoSections(text) {
    const clean = sanitizeText(text);
    if (!clean) return [{ title: '开始', body: '（未能从 PDF 提取可读文本，请尝试 AI 转换或手动导入 JSON。）' }];

    const lines = clean.split('\n');
    const sections = [];
    let current = { title: '开场', bodyLines: [] };

    const pushCurrent = () => {
        const body = current.bodyLines.join('\n').trim();
        if (body || sections.length === 0) {
            sections.push({ title: current.title, body: body || current.title });
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && SECTION_HEADING_RE.test(trimmed) && current.bodyLines.length > 0) {
            pushCurrent();
            current = { title: trimmed.replace(/^#{1,3}\s*/, ''), bodyLines: [] };
            continue;
        }
        if (trimmed && SECTION_HEADING_RE.test(trimmed) && current.bodyLines.length === 0 && sections.length === 0) {
            current.title = trimmed.replace(/^#{1,3}\s*/, '');
            continue;
        }
        current.bodyLines.push(line);
    }
    pushCurrent();

    if (sections.length < 2) {
        const chunks = clean.split(/\n{2,}/).filter((p) => p.trim().length > 80);
        if (chunks.length >= 3) {
            return chunks.map((body, i) => ({
                title: `段落 ${i + 1}`,
                body: body.trim()
            }));
        }
    }

    if (sections.length === 1 && sections[0].body.length > 2400) {
        const parts = sections[0].body.split(/\n{2,}/).filter(Boolean);
        if (parts.length >= 3) {
            return parts.map((body, i) => ({ title: `部分 ${i + 1}`, body: body.trim() }));
        }
    }

    return sections.length ? sections : [{ title: '全文', body: clean }];
}

async function ensurePdfJs() {
    if (_pdfJsReady) return _pdfJsReady;
    _pdfJsReady = (async () => {
        if (typeof window === 'undefined') return null;
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
            return window.pdfjsLib;
        }
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = './vendor/pdf.min.js';
            s.onload = resolve;
            s.onerror = () => {
                const c = document.createElement('script');
                c.src = PDF_CDN;
                c.onload = resolve;
                c.onerror = () => reject(new Error('无法加载 PDF.js'));
                document.head.appendChild(c);
            };
            document.head.appendChild(s);
        });
        if (!window.pdfjsLib) throw new Error('PDF.js 未加载');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsLib.GlobalWorkerOptions.workerSrc
            || PDF_WORKER_SRC;
        try {
            await fetch(PDF_WORKER_SRC, { method: 'HEAD' });
        } catch (_) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
        }
        return window.pdfjsLib;
    })();
    return _pdfJsReady;
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>} paginated plain text
 */
async function extractTextFromPdf(arrayBuffer) {
    if (!arrayBuffer || !(arrayBuffer.byteLength > 0)) {
        throw new Error('PDF 数据为空');
    }

    if (typeof window !== 'undefined' && window.pdfjsLib) {
        await ensurePdfJs();
    } else if (typeof window !== 'undefined') {
        await ensurePdfJs();
    } else {
        throw new Error('PDF 解析需要浏览器环境中的 PDF.js');
    }

    const pdfjsLib = window.pdfjsLib;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    const parts = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
        parts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }

    return sanitizeText(parts.join('\n\n'));
}

/**
 * Rule-based Path A — offline conversion to coc-engine-v1.
 */
function convertPdfToScenario({ text, title, sourceUrl, id, author, era, tags }) {
    const sections = splitIntoSections(text);
    const nodes = {};
    const nodeIds = sections.map((_, i) => slugNodeId(i));
    const startNode = nodeIds[0];

    sections.forEach((section, index) => {
        const nodeId = nodeIds[index];
        const nextId = index < nodeIds.length - 1 ? nodeIds[index + 1] : null;
        const narrative = truncateText(
            (section.title && section.body.startsWith(section.title) ? section.body : `${section.title}\n\n${section.body}`)
        );
        const skill = detectSkillCheck(section.body);
        const choices = [];

        if (skill) {
            choices.push({
                id: 'skill_check',
                label: `${skill.skill}检定`,
                next: nextId || nodeId,
                skillCheck: skill
            });
        }
        if (nextId) {
            choices.push({ id: 'continue', label: '继续', next: nextId });
        } else {
            choices.push({ id: 'end', label: '结束', next: nodeId });
        }

        nodes[nodeId] = { narrative, choices };
    });

    return {
        id,
        title: title || id,
        subtitle: 'PDF 个人转换 · 仅供本地游玩',
        author: author || 'Chaosium Inc.',
        license: 'Chaosium © — Personal use only',
        tags: Array.isArray(tags) ? tags : ['官方', 'Chaosium', 'PDF转换'],
        era: era || '1920s',
        estimatedMinutes: Math.max(30, Math.min(180, sections.length * 8)),
        startNode,
        initialLocation: '模组起点',
        setup: {
            location: '模组起点',
            journal: `${title || id} — 由官方 PDF 本地转换，仅供个人使用。`
        },
        nodes,
        _downloadSource: 'official_pdf_converted',
        _personalUseOnly: true,
        _conversionMethod: 'rule_based',
        _sourceUrl: sourceUrl || null
    };
}

function getAiSettings() {
    if (typeof window !== 'undefined' && window.CoCState && window.CoCState.gameState) {
        return window.CoCState.gameState.aiSettings || {};
    }
    return {};
}

function canUseAiPath() {
    const settings = getAiSettings();
    if (pdfIsBrowserOffline()) return false;
    const key = (settings.apiKey || '').trim();
    const url = (settings.baseUrl || '').trim();
    const model = (settings.model || '').trim();
    return !!(key && url && model);
}

function chunkText(text, size = AI_CHUNK_CHARS) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + size));
        i += size;
    }
    return chunks.length ? chunks : [''];
}

function extractJsonFromAiContent(content) {
    const raw = String(content || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return pdfSafeJsonParse(candidate.slice(start, end + 1), null);
    }
    return pdfSafeJsonParse(candidate, null);
}

async function convertChunkWithAi(chunk, meta, chunkIndex, totalChunks) {
    const settings = getAiSettings();
    const prompt = [
        'Convert this Call of Cthulhu adventure PDF excerpt into coc-engine-v1 JSON.',
        'Output JSON only. Personal use. Do not add commentary.',
        'Required fields: id, title, startNode, nodes (object keyed by node id).',
        'Each node: narrative (string), choices (array with id, label, next; optional skillCheck {skill}).',
        `Scenario id: ${meta.id}. Title: ${meta.title}. Chunk ${chunkIndex + 1}/${totalChunks}.`,
        '---',
        chunk
    ].join('\n');

    const body = JSON.stringify({
        model: settings.model,
        messages: [
            { role: 'system', content: 'You convert TRPG PDF excerpts to coc-engine-v1 scenario JSON. Reply with JSON only.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.2
    });

    const { response } = await pdfFetchAiCompletionWithRetry(
        settings.baseUrl,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${settings.apiKey.trim()}`
            },
            body
        },
        60000,
        2
    );
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJsonFromAiContent(content);
    if (!parsed || !parsed.nodes) throw new Error('AI 返回的 JSON 无效');
    return parsed;
}

function mergeAiChunks(baseMeta, chunks) {
    const mergedNodes = {};
    let startNode = null;
    const orderedIds = [];

    chunks.forEach((part, ci) => {
        const nodes = part.nodes || {};
        Object.keys(nodes).forEach((oldId) => {
            const newId = `c${ci + 1}_${oldId}`;
            orderedIds.push(newId);
            const node = { ...nodes[oldId] };
            if (Array.isArray(node.choices)) {
                node.choices = node.choices.map((ch) => ({
                    ...ch,
                    next: ch.next ? `c${ci + 1}_${ch.next}` : ch.next
                }));
            }
            mergedNodes[newId] = node;
        });
        if (!startNode && part.startNode) startNode = `c${ci + 1}_${part.startNode}`;
    });

    for (let i = 0; i < orderedIds.length - 1; i++) {
        const node = mergedNodes[orderedIds[i]];
        if (!node || !Array.isArray(node.choices) || node.choices.length) continue;
        node.choices = [{ id: 'continue', label: '继续', next: orderedIds[i + 1] }];
    }

    return {
        id: baseMeta.id,
        title: baseMeta.title,
        subtitle: 'PDF AI 转换 · 仅供本地游玩',
        author: baseMeta.author || 'Chaosium Inc.',
        license: 'Chaosium © — Personal use only',
        tags: baseMeta.tags || ['官方', 'Chaosium', 'PDF转换'],
        era: baseMeta.era || '1920s',
        estimatedMinutes: baseMeta.estimatedMinutes || 60,
        startNode: startNode || orderedIds[0],
        initialLocation: '模组起点',
        setup: { location: '模组起点', journal: `${baseMeta.title} — AI 辅助 PDF 转换，仅供个人使用。` },
        nodes: mergedNodes,
        _downloadSource: 'official_pdf_converted',
        _personalUseOnly: true,
        _conversionMethod: 'ai_assisted',
        _sourceUrl: baseMeta.sourceUrl || null
    };
}

async function convertPdfToScenarioWithAi({ text, title, sourceUrl, id, author, era, tags }, onProgress) {
    const meta = { id, title, sourceUrl, author, era, tags, estimatedMinutes: 60 };
    const chunks = chunkText(text);
    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
        if (typeof onProgress === 'function') onProgress('ai_chunk', { index: i + 1, total: chunks.length });
        parts.push(await convertChunkWithAi(chunks[i], meta, i, chunks.length));
    }
    return mergeAiChunks(meta, parts);
}

/**
 * Resolve itch.io signed download URL via officialDownloadUrl + officialUploadId.
 */
async function resolveOfficialPdfDownloadUrl(catalogEntry, fetchImpl) {
    const fetchFn = getFetch(fetchImpl);
    if (!fetchFn) throw new Error('fetch 不可用');

    const apiUrl = catalogEntry.officialDownloadUrl;
    const uploadId = catalogEntry.officialUploadId;
    if (!apiUrl || !uploadId) throw new Error('目录缺少 officialDownloadUrl 或 officialUploadId');

    const referer = catalogEntry.officialUrl || apiUrl.replace(/\/download_url$/, '');
    const resp = await fetchFn(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: referer
        },
        body: new URLSearchParams({ upload_id: String(uploadId) })
    });

    if (!resp.ok) throw new Error(`获取下载链接失败 (${resp.status})`);
    const data = await resp.json();
    if (!data || !data.url) throw new Error('itch.io 未返回下载 URL');
    return data.url;
}

async function fetchOfficialPdfBuffer(catalogEntry, fetchImpl) {
    const fetchFn = getFetch(fetchImpl);
    const signedUrl = await resolveOfficialPdfDownloadUrl(catalogEntry, fetchFn);
    const referer = catalogEntry.officialUrl || signedUrl.split('/download/')[0];
    const resp = await fetchFn(signedUrl, { headers: { Referer: referer } });
    if (!resp.ok) throw new Error(`PDF 下载失败 (${resp.status})`);
    return resp.arrayBuffer();
}

/**
 * Full pipeline: download → extract → convert (AI if available, else rule-based).
 * @param {object} catalogEntry
 * @param {(step: string, detail?: object) => void} [onProgress]
 * @param {{ fetch?: typeof fetch, arrayBuffer?: ArrayBuffer, forceRuleBased?: boolean }} [options]
 */
async function importOfficialPdfOneClick(catalogEntry, onProgress, options = {}) {
    if (!catalogEntry || !catalogEntry.id) throw new Error('无效的目录条目');

    const report = (step, detail) => {
        if (typeof onProgress === 'function') onProgress(step, detail);
    };

    report('download');
    let arrayBuffer = options.arrayBuffer || null;
    if (!arrayBuffer) {
        try {
            arrayBuffer = await fetchOfficialPdfBuffer(catalogEntry, options.fetch);
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            const blocked = err instanceof TypeError || /failed to fetch|cors|network/i.test(msg);
            const wrapped = new Error(blocked
                ? '浏览器无法跨域下载 itch.io PDF。请先在官方页面下载 PDF，或使用「选择 PDF 转换」。'
                : msg);
            wrapped.code = blocked ? 'PDF_FETCH_BLOCKED' : 'PDF_FETCH_FAILED';
            throw wrapped;
        }
    }

    report('parse');
    const text = await extractTextFromPdf(arrayBuffer);

    report('convert');
    const base = {
        text,
        title: catalogEntry.title,
        sourceUrl: catalogEntry.officialUrl,
        id: catalogEntry.id,
        author: catalogEntry.author,
        era: catalogEntry.era,
        tags: catalogEntry.tags
    };

    let scenario = null;
    if (!options.forceRuleBased && canUseAiPath()) {
        try {
            scenario = await convertPdfToScenarioWithAi(base, report);
        } catch (_) {
            scenario = convertPdfToScenario(base);
            scenario._conversionMethod = 'rule_based_fallback';
        }
    } else {
        scenario = convertPdfToScenario(base);
    }

    report('done', { nodeCount: Object.keys(scenario.nodes || {}).length });
    return scenario;
}

const CoCScenarioPdfImport = {
    ensurePdfJs,
    extractTextFromPdf,
    convertPdfToScenario,
    resolveOfficialPdfDownloadUrl,
    fetchOfficialPdfBuffer,
    importOfficialPdfOneClick
};

try {
    if (typeof window !== 'undefined') window.CoCScenarioPdfImport = CoCScenarioPdfImport;
} catch (e) { /* non-browser */ }
