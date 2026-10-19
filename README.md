# dsh-vscode

在 VS Code 里使用 DeepSeek Harness：一个命令打开嵌有完整 DSH Web GUI 的面板，
服务未运行时自动拉起 `dsh web`。

## 使用

1. 命令面板（`Cmd+Shift+P`）→ `DSH: Open Panel`。
2. 服务未运行时自动启动（约几秒），已在运行则直接复用。
3. 面板里就是完整的 DSH GUI；为 VS Code 当前打开的文件夹创建/选择会话后，
   agent 读写的就是你编辑器里的同一批文件。

## 设置

| 设置 | 默认 | 说明 |
|---|---|---|
| `dshHarness.repoPath` | `~/Desktop/deepseek-harness-demo/deepseek-harness` | 用于启动 `dsh web` 的 DSH 源码 checkout 路径 |
| `dshHarness.port` | `3080` | dsh web 服务端口 |
| `dshHarness.autoStart` | `true` | 服务未运行时是否自动拉起 |

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
