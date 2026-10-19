# dsh-vscode

在 VS Code 里使用 DeepSeek Harness：一个命令打开嵌有完整 DSH Web GUI 的面板，
服务未运行时自动拉起 `dsh web`。

## 使用

1. 点击 VS Code **左侧活动栏的 DeepSeek Harness 图标**（或命令面板 → `DSH: Open Panel`）。
2. 服务未运行时自动启动（约几秒），已在运行则直接复用。
3. 扩展会自动确保 VS Code 当前文件夹有对应的 DSH 工作区和会话；
   在面板会话列表里点选它，agent 读写的就是你编辑器里的同一批文件。
4. 扩展会把 DSH 的外观偏好同步成 VS Code 的深/浅色（`dshHarness.syncTheme` 可关）。

## 设置

| 设置 | 默认 | 说明 |
|---|---|---|
| `dshHarness.repoPath` | `~/Desktop/deepseek-harness-demo/deepseek-harness` | 用于启动 `dsh web` 的 DSH 源码 checkout 路径 |
| `dshHarness.port` | `3080` | dsh web 服务端口 |
| `dshHarness.autoStart` | `true` | 服务未运行时是否自动拉起 |
| `dshHarness.syncTheme` | `true` | 让 DSH 外观跟随 VS Code 深/浅主题 |

## 安装

```
Extensions: Install from VSIX...  # 选择构建出的 dsh-vscode-x.y.z.vsix
```

## 开发

```
npm install
npm run compile   # tsc → out/
npm run package   # 产出 .vsix
```

服务启动日志在 VS Code 输出面板的 "DeepSeek Harness Server" 频道。
