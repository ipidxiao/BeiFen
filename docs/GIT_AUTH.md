# Git / GitHub 认证（Windows）

> **模组资源不依赖 GitHub。** 剧本/模组下载使用同域包或你自行部署的公开静态网站；本节仅说明 **可选的** Git 推送/拉取认证。

本仓库在 Windows 上推荐使用 **Git Credential Manager (GCM)** 做 HTTPS 推送/拉取，而不是依赖「设备码」流程。

## 为什么收不到 6 位 / 8 位验证码？

`gh auth login` 在无图形终端、非 TTY 环境（例如 Cursor 后台 Agent 终端）里常会走 **Device Code Flow**：

1. 验证码 **只打印在运行命令的那一个终端窗口**里。
2. GitHub **不会**把该码发到手机、短信或邮件。
3. 你需要自己在浏览器打开 [https://github.com/login/device](https://github.com/login/device)，把终端里显示的码粘贴进去。

如果你在 Cursor 里让 Agent 跑 `gh auth login`，终端输出你可能根本看不到，就会误以为「Git 没发验证码」——实际是码已经生成，只是你没看到输出。

## 推荐：浏览器登录（无需记验证码）

在本机 **PowerShell**（不是后台 Agent）中执行：

```powershell
cd "C:\Users\x1767\OneDrive\Desktop\CoC_Engine_V17.2_CCGS"
git credential-manager github login --browser
```

按提示在默认浏览器完成 GitHub 授权即可。GCM 会保存令牌，之后 `git push` / `git pull` / `git fetch` 一般 **不需要** 再装或登录 `gh`。

查看已登录账号：

```powershell
git credential-manager github list
```

## 可选：GitHub CLI（`gh`）

若已安装 [GitHub CLI](https://cli.github.com/)，同样在本机交互式 PowerShell 里用 **网页** 方式，避免设备码：

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

注意：在非交互 / 无 TTY 环境里，`--web` 仍可能回退到设备码；此时必须在 **同一终端** 里看到码并手动到 device 页面粘贴。

检查 CLI 状态：

```powershell
gh auth status
```

## 若必须使用设备码

1. 在本机打开 PowerShell（Win+X → Windows PowerShell）。
2. 运行 `gh auth login` 或带 `--web` 的命令。
3. **不要关闭该窗口**，复制终端里显示的 **8 位**（或 6 位）码。
4. 浏览器访问 [https://github.com/login/device](https://github.com/login/device) 并粘贴。

## 验证能否访问 GitHub

配置好 remote 后：

```powershell
git ls-remote origin HEAD
```

若 remote 尚未添加，先：

```powershell
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
```

认证成功但提示 `Repository not found` 表示：凭据有效，但仓库不存在或你没有权限——需要在 GitHub 上创建仓库或检查名称。

## 本仓库当前约定

- 本地 `user.name` / `user.email` 应在仓库目录用 `git config --local` 设置（勿随意改全局无关项）。
- **不要**在 Agent 后台终端里做首次登录；首次授权请在本机 PowerShell + 浏览器完成。
