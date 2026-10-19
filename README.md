# DeepSeek Harness for VS Code

> **非官方社区扩展**：本项目由社区开发，与 DeepSeek 官方无隶属关系。
> DeepSeek Harness 本体是 MIT 协议的开源项目（[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)）。

在 VS Code 里使用 DeepSeek Harness：左侧启动器列出当前文件夹的对话，
点一下就在**编辑器右侧**打开完整 GUI，并直接落到那条对话。

## 入口（四个都能找到）

| 位置 | 内容 |
|---|---|
| 左侧活动栏 | DeepSeek Harness 图标 → 启动器（当前文件夹 + 对话列表 + 新建对话） |
| 编辑器右上角 | 鲸鱼图标按钮 → 为当前文件夹新建对话 |
| 底部状态栏右侧 | `DSH` → 打开启动器 |
| 命令面板 | `DSH: Open Panel` / `DSH: New Conversation` / `DSH: Refresh Conversations` |

## 先决条件

- Node.js ≥ 22
- DeepSeek Harness：`npm i -g dsh`（扩展默认从 PATH 调用 `dsh`），
  或者把 `dshHarness.repoPath` 指向一份 deepseek-harness 源码 checkout。

## 使用

1. 点左侧活动栏的 DeepSeek Harness 图标。
2. 启动器显示 VS Code 当前文件夹及其对话；点"＋ 新建对话"或某条对话，
   完整 GUI 在编辑器右侧打开。
3. 服务未运行时自动启动；主题跟随 VS Code 深/浅色。

## 设置

| 设置 | 默认 | 说明 |
|---|---|---|
| `dshHarness.repoPath` | `""` | 可选：deepseek-harness 源码 checkout 路径（空则用 `dsh` 可执行文件） |
| `dshHarness.command` | `dsh` | 从 PATH 启动服务时使用的命令，如 `dsh`、`pnpm dsh` |
| `dshHarness.port` | `3080` | dsh web 服务端口 |
| `dshHarness.autoStart` | `true` | 服务未运行时是否自动拉起 |
| `dshHarness.syncTheme` | `true` | 让 DSH 外观跟随 VS Code 深/浅主题 |

## 已知限制

- **对话直落（深链 `#session=<id>`）需要带该补丁的 DSH 构建**。当前仓库配套的
  custom 分支已包含（提交 `cb0e6220c5`）。使用官方 npm 版 `dsh` 时，扩展会检测到
  不支持并降级为"打开 GUI，由你在里面选对话"，其余功能不受影响。
- 右侧"辅助边栏"位置无法由扩展声明式贡献；拖动活动栏图标到右侧即可，
  VS Code 会记住位置。

## 开发

```
npm install
npm run compile   # tsc → out/
npm run package   # 产出 .vsix
```

服务日志在 VS Code 输出面板的 "DeepSeek Harness Server" 频道。