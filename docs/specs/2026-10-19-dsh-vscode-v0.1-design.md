# dsh-vscode 扩展 v0.1 设计

日期：2026-10-19
状态：用户已批准（2026-10-19 对话确认）

## 目标

让 DeepSeek Harness（DSH）在 VS Code 里可用：一个命令打开嵌有完整 DSH Web GUI 的面板，
服务未运行时自动拉起。对标 Claude Code 的 VS Code 扩展的"在编辑器里直接用"体验。

## 背景事实（已核实）

- DSH Web 服务：`dsh web`，监听 `http://127.0.0.1:3080`；只有它能注入 `window.__DSH_BOOT__`，
  直接打开 `apps/web` 的 Vite 构建产物无法独立工作。
- 服务实际运行 checkout：`/Users/baojian/Desktop/deepseek-harness-demo/deepseek-harness`，
  启动命令（见 `~/.dsh/web.log`）：`node --import tsx/esm apps/cli/src/bin.ts web`。
- 服务端 API `session.create` 接受 `cwd` 参数（与 `workspaceId` 互斥）——
  会话可以工作在任意目录，不要求与服务 checkout 同目录。
- GUI 为单页应用，无 URL 深链到指定会话的能力（未找到 hash/query 路由）。
- 用户机器：已装 VS Code（`/Applications/Visual Studio Code.app`），`code` CLI 未装。

## v0.1 范围

1. 命令 `DSH: Open Panel`：
   - 健康检查 `http://127.0.0.1:3080/`；未运行且 `autoStart` 为真时拉起服务；
     拉起后轮询健康检查（超时 60s）再显示面板。
   - 创建 webview 面板加载该 URL，`retainContextWhenHidden: true`。
2. 设置项：
   - `dshHarness.repoPath`（默认 `/Users/baojian/Desktop/deepseek-harness-demo/deepseek-harness`）
   - `dshHarness.port`（默认 `3080`）
   - `dshHarness.autoStart`（默认 `true`）
3. 工作区对齐：面板内就是完整 GUI，用户在其中为 VS Code 当前文件夹创建/选择会话
   （与浏览器内操作一致；DSH 会话按 cwd 工作，agent 读写的就是 VS Code 打开的同一批文件）。

## 非目标（v0.1 不做）

- 编辑器联动：当前文件/选区/诊断注入对话（v0.2，经 webview postMessage 注入输入框）。
- 扩展侧直接调 BFF RPC 自动建会话（v0.2，需先调研 Typert RPC 客户端成本）。
- 发布 VS Code 市场（发布版需解决"用户机器无 dsh checkout"，v1.0 再说）。
- 自动化测试（个人本地工具，手动验收）。

## 架构

纯 VS Code 扩展，TypeScript，`vsce` 打包为本地 `.vsix`。后端零改动，复用现有 `dsh web`。

```
dsh-vscode/
  package.json          # 扩展清单：命令、设置项、activationEvents
  tsconfig.json
  src/
    extension.ts        # activate：注册命令；deactivate：不动服务（服务生命周期归用户）
    serverManager.ts    # isHealthy(port) / ensureRunning(config)：spawn 服务、轮询、日志
    panel.ts            # createOrReveal：webview、CSP 放行 http://127.0.0.1:<port>
  docs/specs/           # 本文件
```

数据流：用户执行命令 → `serverManager.ensureRunning()` → 健康检查 OK →
`panel.createOrReveal(url)`；失败路径一律落到 VS Code 通知 + 输出面板日志。

## 错误处理

- `repoPath` 不存在 → 错误通知，引导打开设置。
- 端口被非 DSH 进程占用（健康检查返回非预期）→ 报错提示换 `port`，不误连。
- spawn 失败或服务 60s 未就绪 → 通知 + 输出面板显示服务 stdout/stderr。
- webview CSP：`default-src 'none'` 收紧，仅放行 `http://127.0.0.1:<port>` 的 frame/connect/img/style/script。

## 验收（手动）

1. `DSH: Open Panel` 能打开面板并完成一轮对话。
2. 杀掉 3080 服务后再执行命令，能自动拉起并显示。
3. 服务已在跑时执行命令，直接复用，不重复拉起。
4. 与 Codex 扩展并排开启互不干扰。
5. 在面板会话里让 agent 改一个 VS Code 当前文件夹下的文件，编辑器中能看到改动。

## 交付与安装

- `vsce package` 产出 `.vsix`；用户侧安装：VS Code 命令面板 "Extensions: Install from VSIX..."
  （或先装 `code` CLI：命令面板 "Shell Command: Install 'code' command"）。
- 项目位置：`~/Desktop/feishu-project-management-agent/dsh-vscode/`，独立 git 仓库，
  不污染 DSH 源码 checkout。

## v0.2（2026-10-19 用户批准，已交付）

v0.1 反馈后的修订。BFF 线协议已实测：一元 RPC 为 `POST /api/<endpoint>`，
正文 `{type:'client-request', rpcId, method, payload}`，响应 `result` 是
`{ok:true,value} | {ok:false,error}` 标签联合。

1. **活动栏入口**：`viewsContainers.activitybar` + webview 视图 `dshHarness.view`
   （Claude Code 同款位置）；`DSH: Open Panel` 命令改为聚焦该视图。编辑器标签页方案废弃。
2. **工作区对齐**：读 VS Code 第一个工作区文件夹 → `workspace.list` 按 `path` 匹配，
   没有则 `workspace.create({path})`，工作区无会话则 `session.create({workspaceId})`。
   失败仅记输出频道，GUI 照常可用。GUI 无 URL 深链，用户在其会话列表点选。
3. **主题跟随**：`settings.mutate` 写 `{ns:'ui-theme', ops:[{op:'set', path:['preference'],
   value:'dark'|'light'}]}`，跟随 `window.activeColorTheme.kind`（含 HighContrast 归为 dark）。
   在 iframe 加载前同步，运行中的 GUI 经 settings 订阅实时生效；主题切换事件同样只同步、
   不重载页面。设置 `dshHarness.syncTheme`（默认开）可关闭。
4. 新增文件：`src/rpc.ts`、`src/workspaceAlign.ts`、`src/themeSync.ts`、`src/view.ts`、
   `media/icon.svg`；删除 `src/panel.ts`。

## v0.3（2026-10-19 用户反馈迭代，已交付）

v0.2 的对齐其实成功创建了工作区（服务端留痕），但 GUI 启动时恢复
"persisted selection"（localStorage `dsh.sessions.current`），永远落回旧会话；
且用户要的形态是 Claude Code 式"左启动器、右对话"。修订：

1. **DSH 深链（custom 分支补丁 cb0e6220c5）**：`packages/client/runtime` 的 sessions
   service 构造时读 `#session=<id>` 覆盖恢复的选中项（读后 replaceState 清除，
   Node 环境 location 守卫保持惰性）。已 tsc+tsdown 重建，服务 no-cache 直接生效。
2. **左启动器 / 右对话**：活动栏视图改为启动器（当前文件夹 + 会话列表 +
   新建对话按钮，nonce CSP）；点击经 `ViewColumn.Beside` 在编辑器右侧开
   `createWebviewPanel`（retainContextWhenHidden），iframe URL 带深链。
   新建复用 GUI 的 connectWorkspace 规则（blank+cwd+成员+未归档，否则创建）。
3. `src/dshApi.ts` 取代 `src/workspaceAlign.ts`（类型化 RPC 包装：listWorkspaces/
   listSessions/ensureWorkspace/connectSession）。
4. 会话切换 = 重设 iframe URL（深链重载）；同 URL 不重载。
