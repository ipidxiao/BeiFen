# 程序（Programmer）专属指南 — CoC 7th Engine V16.5

## 文件归属速查

```
【程序 51文件】  js/coc.js  js/ai_logic.js  js/state/*  js/tools/*  
                js/ai/*  js/app.js  js/char_creator.js  sw.js
【策划 16文件】  js/data/*  (jobs/skills/items/experiences/tomes/spells/tables)
【美术  5文件】  css/  vendor/  icons/  js/components/story_equip.js
【QA   20文件】  tests/
【共享  3文件】  index.html  package.json  docs/ground_truth_canvas.md
```

## 无损合并流程

```
策划修改 jobs.js ──→ roles/designer/js/data/jobs.js
美术修改 style.css ─→ roles/artist/css/style.css
QA 新增测试     ──→ roles/qa/tests/new_test.js
                          │
                   ┌──────▼──────┐
                   │   merge.py  │  ← 哈希比对 + 归属校验
                   └──────┬──────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
         ✅ 覆盖       ❌ 阻止       ⚠️ 警告
      (归属匹配)   (非归属修改)   (共享文件)
```

### 命令

```bash
python3 merge.py --dry-run           # 预览，安全
python3 merge.py --conflict-report    # 查看所有文件归属
python3 merge.py                      # 执行合并
python3 merge.py --from roles/artist/ # 仅合并美术
```

### 保护规则

| 场景 | 行为 |
|------|------|
| 美术修改 `js/coc.js` | ❌ 阻止 — 归属【程序】 |
| 策划修改 `css/style.css` | ❌ 阻止 — 归属【美术】 |
| 程序修改 `js/data/jobs.js` | ⚠️ 警告 — 归属【策划】, 建议走 roles/ |
| 任何人修改 `index.html` | ⚠️ 警告 — 共享文件, 需人工 diff |

## 发布前检查清单

- [ ] `node tests/run_all_smoke.js` → 18/18 PASS
- [ ] `grep -rn "eval(" js/` → 0
- [ ] ZIP 不含嵌套 .zip
- [ ] SW 缓存与 index.html 同步
- [ ] Tauri icons 存在

## 版本号

修改 `docs/ground_truth_canvas.md` → 更新 `js/data/dev_logs.js` → `python3 build_zip.py`
