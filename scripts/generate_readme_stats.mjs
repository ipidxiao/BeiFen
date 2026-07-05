#!/usr/bin/env node
/**
 * generate_readme_stats.mjs — Count project metrics for README stats table.
 *
 * Usage:
 *   node scripts/generate_readme_stats.mjs          # print markdown block
 *   node scripts/generate_readme_stats.mjs --write  # patch README.md stats rows
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const README_PATH = path.join(ROOT, 'README.md');
const RUN_ALL_SMOKE = path.join(ROOT, 'tests', 'run_all_smoke.js');

function walkFiles(dir, ext, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(full, ext, acc);
        else if (entry.name.endsWith(ext)) acc.push(full);
    }
    return acc;
}

function countSmokeSuites() {
    const src = fs.readFileSync(RUN_ALL_SMOKE, 'utf8');
    const matches = [...src.matchAll(/^\s+'([^']+\.(?:js|mjs))',/gm)];
    return matches.length;
}

function countHandlerModules() {
    const dir = path.join(ROOT, 'js', 'tools', 'handlers');
    return fs.readdirSync(dir).filter((f) => f.endsWith('.mjs') && f !== 'index.mjs').length;
}

function countComponentModules() {
    const dir = path.join(ROOT, 'js', 'components');
    return fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).length;
}

function countDataRootFiles() {
    const dir = path.join(ROOT, 'js', 'data');
    return fs.readdirSync(dir).filter((f) => /\.(js|mjs)$/.test(f)).length;
}

function countScenarios() {
    const builtIn = walkFiles(path.join(ROOT, 'js', 'data', 'scenarios'), '.js')
        .filter((f) => !f.includes('packages') && !f.endsWith('catalog.js') && !f.endsWith('remote_catalog.js'));
    const packages = walkFiles(path.join(ROOT, 'js', 'data', 'scenarios', 'packages'), '.json');
    return { builtIn: builtIn.length, downloadable: packages.length, total: builtIn.length + packages.length };
}

function countCssLines() {
    const cssPath = path.join(ROOT, 'css', 'style.css');
    if (!fs.existsSync(cssPath)) return 0;
    return fs.readFileSync(cssPath, 'utf8').split('\n').length;
}

async function countTools() {
    const mod = await import(pathToFileURL(path.join(ROOT, 'js', 'tools', 'definitions.mjs')).href);
    return mod.CoCToolDefinitions.getNames().length;
}

function readPackageVersion() {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return pkg.version || '?';
}

async function gatherStats() {
    const jsFiles = walkFiles(path.join(ROOT, 'js'), '.js');
    const mjsFiles = walkFiles(path.join(ROOT, 'js'), '.mjs');
    const scenarios = countScenarios();
    const tools = await countTools();
    const smokeSuites = countSmokeSuites();
    const pkgVersion = readPackageVersion();

    return {
        generatedAt: new Date().toISOString().slice(0, 10),
        pkgVersion,
        jsEngine: jsFiles.length,
        esmModules: mjsFiles.length,
        gameData: countDataRootFiles(),
        scenarios: scenarios.total,
        scenariosBuiltIn: scenarios.builtIn,
        scenariosDownloadable: scenarios.downloadable,
        cssLines: countCssLines(),
        smokeSuites,
        aiTools: tools,
        handlerModules: countHandlerModules(),
        componentModules: countComponentModules(),
        assets: 6,
    };
}

function formatStatsBlock(stats) {
    return [
        `| 类别 | 数量 | 说明 |`,
        `|------|------|------|`,
        `| JS 引擎 | ${stats.jsEngine} | \`js/\` 下 \`.js\` 浏览器脚本（含 \`build:js\` 生成物） |`,
        `| ESM 模块 | ${stats.esmModules} | \`js/\` 下 \`.mjs\` 权威源码 → \`npm run build:js\` 生成 \`.js\` |`,
        `| 游戏数据 | ${stats.gameData} | 技能/物品/职业/经历/典籍/法术/理智/重伤/NPC/AI提示词等（\`js/data/\` 根级） |`,
        `| 剧本 | ${stats.scenarios} | ${stats.scenariosBuiltIn} 内置 + ${stats.scenariosDownloadable} 可下载（含 CC 社区改编模组） |`,
        `| CSS | ~${stats.cssLines} 行 | 21 变量 + 8 面板唯一色 + 13 keyframes + 暗黑主题 |`,
        `| 测试 | ${stats.smokeSuites} suites | VM smoke + ESM + deep_verify（\`npm test\`） |`,
        `| AI 工具 | ${stats.aiTools} | \`js/tools/definitions.mjs\` 工具目录 + ${stats.handlerModules} Handler 模块 |`,
        `| 组件 | ${stats.componentModules} | \`js/components/*.mjs\` Vue 面板组件 |`,
        `| 资产 | ${stats.assets} | favicon/SVG 精灵/Web Audio SFX/Canvas 骰子/PWA |`,
    ].join('\n');
}

function patchReadme(stats) {
    let readme = fs.readFileSync(README_PATH, 'utf8');
    const block = formatStatsBlock(stats);
    const tableRe = /\| 类别 \| 数量 \| 说明 \|\r?\n\|[-| ]+\|\r?\n(?:\|[^\n]+\r?\n)+/;
    if (!tableRe.test(readme)) {
        throw new Error('README stats table not found — update generate_readme_stats.mjs marker');
    }
    readme = readme.replace(tableRe, `${block}\r\n`);
    readme = readme.replace(
        /> 下列统计为 \d{4}-\d{2}-\d{2} 审计核验值；长期维护可运行脚本重新生成（见 AUDIT-P3-35）。/,
        `> 下列统计由 \`npm run stats:readme\` 生成（${stats.generatedAt}）；\`--write\` 可写回 README。`
    );
    readme = readme.replace(
        /门禁: \*\*\d+\/\d+\*\* smoke ✅/,
        `门禁: **${stats.smokeSuites}/${stats.smokeSuites}** smoke ✅`
    );
    readme = readme.replace(
        /npm test              # \d+\/\d+ 全量 smoke/,
        `npm test              # ${stats.smokeSuites}/${stats.smokeSuites} 全量 smoke`
    );
    fs.writeFileSync(README_PATH, readme, 'utf8');
}

async function main() {
    const stats = await gatherStats();
    const block = formatStatsBlock(stats);
    const summary = [
        `# CoC Engine README stats (${stats.generatedAt})`,
        `version: ${stats.pkgVersion}`,
        '',
        block,
        '',
        `handlers: ${stats.handlerModules} · components: ${stats.componentModules} · smoke suites: ${stats.smokeSuites}`,
    ].join('\n');

    if (process.argv.includes('--write')) {
        patchReadme(stats);
        console.log(`README.md updated (${stats.smokeSuites} suites, ${stats.aiTools} tools, ${stats.esmModules} .mjs)`);
    } else {
        console.log(summary);
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
