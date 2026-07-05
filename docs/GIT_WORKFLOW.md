# Git 工作流（本地优先，无需 gh CLI）

本仓库可在**无 GitHub 远程、无 `gh` 命令行**的情况下完整开发与测试。以下流程适用于 OneDrive / 离线 / 单机维护场景。

## 日常开发

```bash
npm run build:js      # 修改 .mjs 后必跑
npm test              # 全量 smoke
npm run stats:readme  # 查看 README 统计（--write 写回）
```

## 本地提交

```bash
git status
git add <files>
git commit -m "简述变更原因"
```

- 不要在没有远程需求时执行 `git remote add`。
- 不要 `git push --force` 到 shared 分支。

## 可选：手动推送到 GitHub

若已在 GitHub 网页创建空仓库：

1. 复制仓库 HTTPS URL（例如 `https://github.com/you/coc-engine.git`）。
2. **一次性**添加远程（在终端或 Git GUI 中）：
   ```bash
   git remote add origin https://github.com/you/coc-engine.git
   git push -u origin main
   ```
3. 之后可用网页 **Pull requests → New pull request** 创建 PR，无需安装 `gh`。

## 发布说明草稿

```bash
node scripts/prepare_release_notes.mjs
node scripts/prepare_release_notes.mjs --since v18.0.0 --limit 50
```

将输出粘贴到 GitHub Release 或 PR 描述即可。

## PR 模板

添加远程后，仓库内 `.github/pull_request_template.md` 会在 GitHub 新建 PR 时自动预填。

## 与 CI 的关系

- `npm run ci:smoke` — 本地 CI 门禁（build:js:check + test）。
- 无远程时不触发 GitHub Actions；以本地 `npm test` 为准。
