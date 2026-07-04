# CoC 7th Engine V16.5 — 多角色整合指南

## 文件归属

```
         ┌──────────────┐
         │   shared     │  index.html, ground_truth
         └──────┬───────┘
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ 程序  │ │ 策划  │ │ 美术  │
│ 51文件│ │ 16文件│ │ 5文件 │
└───┬───┘ └───┬───┘ └───┬───┘
    │          │          │
    │     ┌───▼───┐      │
    │     │  QA   │      │
    │     │ 20文件│      │
    │     └───────┘      │
    └─────────┬──────────┘
              │
        ┌─────▼─────┐
        │  merge.py │
        └─────┬─────┘
              │
        ┌─────▼─────┐
        │   dist/   │  ← 完整引擎
        └───────────┘
```

## 工作流程

### 程序员
```
1. 修改 js/coc.js, js/ai_logic.js, js/state/* 等
2. 将修改后的文件放入 roles/programmer/ 对应路径
3. 运行: python3 merge.py --from roles/programmer/
```

### 美术
```
1. 修改 css/style.css, vendor/, 图标等
2. 将修改后的文件放入 roles/artist/ 对应路径
3. 交付 roles/artist/ 目录给程序员
```

### 策划
```
1. 修改 js/data/* (职业/技能/物品/典籍/法术/表)
2. 将修改后的文件放入 roles/designer/ 对应路径
3. 交付 roles/designer/ 目录给程序员
```

### QA
```
1. 编写/修改 tests/ 目录下的测试
2. 将修改后的文件放入 roles/qa/ 对应路径
3. 交付 roles/qa/ 目录给程序员
```

## 整合命令

```bash
python3 merge.py --dry-run          # 预览
python3 merge.py --conflict-report   # 查看归属
python3 merge.py                     # 合并所有
python3 merge.py --from roles/artist/  # 合并指定角色
```

## 合并规则

| 场景 | 行为 |
|------|------|
| 角色修改自己归属的文件 | ✅ 直接覆盖 |
| 角色修改他人归属的文件 | ❌ 阻止 + 报告冲突 |
| 角色修改 shared 文件 | ⚠️ 警告 + 覆盖 |
| 文件未在 MANIFEST 声明 | ⚠️ 跳过 |

## 交付物格式

```
roles/artist/
├── css/style.css
└── icons/

roles/designer/
└── js/data/
    ├── jobs.js / skills.js / items.js / items_db.js
    ├── experiences.js / mythos_tomes.js / spells.js
    └── insanity_tables.js / injury_tables.js

roles/qa/
└── tests/
    ├── auditfix*.js / esm_*.mjs / deep_verify.mjs
    └── helpers/
```

> V16.5 程序员包 | 2026-06-30
