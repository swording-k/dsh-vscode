# DeepSeek Harness for VS Code

> **Unofficial community extension** — not affiliated with DeepSeek.  
> The DeepSeek Harness runtime is MIT-licensed open source ([deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)).
>
> 非官方社区扩展，与 DeepSeek 官方无隶属关系。DeepSeek Harness 本体是 MIT 协议的开源项目。

Put DeepSeek Harness in your editor: the **left launcher** shows your folder's
conversations; one click opens the full GUI **beside the editor** — ready to
read and write your source tree.

用 VS Code 管理 DeepSeek Harness 对话：左侧启动器列出当前文件夹的历史对话，一点就在编辑器右侧打开完整 GUI，直接读写你的项目文件。

## Entry points  /  入口（four places to reach it）

| Location | What |
|---|---|
| Left side bar (activity bar) | Whale icon → launcher with folder name, session list, and a new-chat button |
| Secondary side bar (right) | Same launcher, native right-side slot (VS Code ≥ 1.94) |
| Editor title (top-right) | Whale button → new conversation for the active folder |
| Status bar (bottom-right) | `DSH` → open the launcher |
| Command palette | `DSH: Open Panel`, `DSH: New Conversation`, `DSH: Refresh Conversations` |

## Prerequisites  /  先决条件

- Node.js ≥ 22
- DeepSeek Harness: `npm i -g @deepseek-ai/dsh`  
  The extension calls the `dsh` executable on PATH by default, or a
  checkout when `dshHarness.repoPath` is set.
- An API key: set `DEEPSEEK_API_KEY` in your environment or use `~/.dsh/.credentials.yaml`.  
  The GUI's built-in Account settings let you enter the key on first launch.

## Usage  /  使用

1. Click the DeepSeek Harness icon in the left side bar (or use any entry point above).
2. The launcher shows your VS Code folder and its conversations; click **`+ New Conversation`**
   or pick a saved one. The full DSH GUI opens **on the right**, ready to read/write
   your workspace files.
3. The server starts automatically on first use; the theme follows your
   VS Code colour scheme (disable `dshHarness.syncTheme` if you prefer manual control).

## Settings  /  设置

| Setting | Default | Notes |
|---|---|---|
| `dshHarness.repoPath` | `""` | Optional path to a deepseek-harness source checkout (leave empty to rely on `dsh` from PATH) |
| `dshHarness.command` | `dsh` | Executable used when `repoPath` is empty (e.g. `dsh`, `pnpm dsh`) |
| `dshHarness.port` | `3080` | dsh web server port |
| `dshHarness.autoStart` | `true` | Start the server automatically when it is not running |
| `dshHarness.syncTheme` | `true` | Keep the DSH colour scheme in sync with your VS Code theme |

## Publishing  /  发布

The extension ships with a companion `dsh-plugin-deep-link` client plugin under
`plugin/`. On a stock `dsh` install it is auto-installed into the web profile
via `dsh plugin --profile web add …`. A source checkout already includes the
deep-link patch and does not need it.

Before publishing to the Marketplace:

1. Create a publisher: [VS Code Marketplace](https://marketplace.visualstudio.com/manage) → create publisher.
2. Generate a Personal Access Token (Azure DevOps → Marketplace scope → **Manage**).
3. Log in: `npx @vscode/vsce login <publisher-id>`.
4. Replace `publisher` in `package.json` with your publisher id.
5. Replace the placeholder `repository.url` in `package.json` with your real GitHub repo URL.
6. Run `npm run package` (produces a `.vsix`) then `npx @vscode/vsce publish`.

## Known issues  /  已知限制

- Session targeting via `#session=<id>` relies on the `dsh-plugin-deep-link`
  plugin. Stock `@deepseek-ai/dsh` users get it auto-installed; source-checkout
  users on the `custom` branch already have it patched. Without either, the GUI
  opens normally and you select the conversation in the GUI sidebar — one extra click.
- The secondary side bar slot is not shown on VS Code builds older than 1.94.
- Multi-root workspaces are not yet supported (only the first folder is aligned).

## Development  /  开发

```bash
npm install
npm run compile        # tsc → out/
npm run package        # produces .vsix
```

Server logs appear in the **Output** panel under *DeepSeek Harness Server*.