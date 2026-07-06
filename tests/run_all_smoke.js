// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * CoC 7th Engine — 统一 Smoke 测试入口
 *
 * 用法：  node tests/run_all_smoke.js
 *
 * 按顺序运行所有 smoke 测试文件，收集通过/失败/跳过结果。
 * 测试按阶段分组，阶段内独立执行，某个测试失败不阻塞后续测试。
 *
 * auditfix3~8 套件别名（历史命名，文件未重命名）：
 *   auditfix3 — CoCState核心/聊天裁剪/角色移除
 *   auditfix4 — 角色装备/背包工具链
 *   auditfix5 — 线索/NPC/上下文管理
 *   auditfix6 — 战斗/地图/骰子引擎
 *   auditfix7 — 存档迁移/Handler注册/浏览器加载链
 *   auditfix8 — 文件完整性/异常ToolCall/技能可见性/功能回归
 */

/**
 * @role    测试/QA (Quality Assurance)
 * @owner   测试用例 / 覆盖验证
 * @caution 程序合并时通过 roles/qa/ 目录接收
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TESTS_DIR = __dirname;

// ── 测试清单（按推荐顺序） ──────────────────────────────────────
const SUITES = [
  // Phase 1 — 文件完整性与加载链
  { phase: 'Phase 1: 文件完整性与加载链', tests: [
    'auditfix8_file_integrity_smoke.js',
    'build_export_smoke.js',
    'idb_backup_smoke.mjs',
    'sw_cache_smoke.js',
    'scenario_smoke.js',
    'pdf_import_smoke.js',
    'scenario_store_smoke.js',
    'masks_london_smoke.js',
    'kp_execution_smoke.js',
    'kp_semantics_smoke.js',
    'audit2_smoke.js',
    'audit3_smoke.js',
    'batch4_robustness_smoke.js',
  ]},

  // Phase 2 — 核心引擎与规则
  { phase: 'Phase 2: 核心引擎与规则', tests: [
    'auditfix3_smoke.js',
    'auditfix4_smoke.js',
    'auditfix5_smoke.js',
    'auditfix6_smoke.js',
    'coverage_gap_smoke.js',
    'a11y_smoke.js',
    'test_v18_engines.mjs',
    'ui/component_helpers_smoke.mjs',
    'ui/dom_parse_smoke.mjs',
    'esm_utils_smoke.mjs',
    'esm_tool_dispatch.mjs',
  ]},

  // Phase 3 — 重构验证（迁移 + Handler + 浏览器模拟）
  { phase: 'Phase 3: 重构验证', tests: [
    'auditfix7_migration_smoke.js',
    'save_migration_smoke.js',
    'flow_lobby_combat_smoke.js',
    'auditfix7_handler_smoke.js',
    'auditfix7_browser_smoke.js',
  ]},

  // Phase 4 — AUDITFIX8 专项
  { phase: 'Phase 4: AUDITFIX8 专项', tests: [
    'auditfix8_malformed_tool_calls_smoke.js',
    'auditfix8_verification_smoke.js',
    'auditfix8_secondary_skill_visibility_smoke.js',
    'auditfix8_review_functional_smoke.js',
  ]},

  // Phase 5 — ESM 导入链验证
  { phase: 'Phase 5: ESM 导入链', tests: [
    'esm_smoke.mjs',
    'esm_engine.mjs',
    'esm_state.mjs',
    'esm_ai.mjs',
    'esm_phase2_boot_smoke.mjs',
    'deep_verify.mjs',
  ]},
];

// ── 执行逻辑 ────────────────────────────────────────────────────
let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;

const startTime = Date.now();

for (const { phase, tests } of SUITES) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${phase}`);
  console.log(`${'═'.repeat(60)}`);

  for (const testFile of tests) {
    const fullPath = path.join(TESTS_DIR, testFile);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ◌ SKIP  ${testFile}  (文件不存在)`);
      totalSkipped++;
      continue;
    }

    try {
      const timeoutMs = /\.mjs$/.test(testFile) && testFile.includes('dom_parse') ? 60000 : 30000;
      const output = execSync(`node "${fullPath}"`, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log(`  ✓ PASS  ${testFile}`);
      if (output.trim()) {
        output.trim().split('\n').forEach(line => console.log(`         ${line}`));
      }
      totalPassed++;
    } catch (err) {
      console.log(`  ✗ FAIL  ${testFile}`);
      const stderr = err.stderr || '';
      const stdout = err.stdout || '';
      const msg = err.message || String(err);
      // Print last 5 lines of output for debugging
      const lines = (stdout + '\n' + stderr).trim().split('\n').filter(Boolean);
      const tail = lines.slice(-5);
      tail.forEach(line => console.log(`         ${line}`));
      if (err.code) console.log(`         exit code: ${err.code}`);
      totalFailed++;
    }
  }
}

// ── 汇总 ─────────────────────────────────────────────────────────
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n${'═'.repeat(60)}`);
console.log(`  测试汇总  (${elapsed}s)`);
console.log(`${'═'.repeat(60)}`);
console.log(`  ✓ 通过: ${totalPassed}`);
console.log(`  ✗ 失败: ${totalFailed}`);
console.log(`  ◌ 跳过: ${totalSkipped}`);
console.log(`${'═'.repeat(60)}`);

process.exit(totalFailed > 0 ? 1 : 0);
