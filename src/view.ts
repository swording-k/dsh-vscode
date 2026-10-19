/** Activity-bar launcher: the VS Code folder's conversations, opened on the right. */
import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import { connectSession, ensureWorkspace, listSessions, type SessionSummary, type WorkspaceRow } from './dshApi'
import { openConversation } from './conversation'
import { ensureRunning, logLine, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'

type LauncherMessage = { type: 'new' } | { type: 'open'; sessionId: string } | { type: 'refresh' }

/** Provides the `dshHarness.view` launcher. */
export class DshLauncherProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true }
    view.webview.onDidReceiveMessage(message => { void this.onMessage(message as LauncherMessage) })
    this.view = view
    void this.load()
  }

  /** Connect, then render the current folder's conversation list. */
  private async load(): Promise<void> {
    const cfg = readServerConfig()
    const view = this.view
    if (view === undefined) return
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (folder === undefined) {
      view.webview.html = renderMessage('在 VS Code 中打开一个文件夹后，这里会显示它的对话。')
      return
    }
    view.webview.html = renderMessage('正在连接 dsh web 服务…')
    try {
      await ensureRunning(cfg)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      view.webview.html = renderMessage(`dsh web 启动失败：${message}`)
      void vscode.window.showErrorMessage(`DSH: ${message}`)
      return
    }
    if (cfg.syncTheme) {
      try {
        await syncTheme(cfg.port)
      } catch (err) {
        logLine(`[dsh] theme sync failed: ${errMessage(err)}`)
      }
    }
    try {
      const { workspace } = await ensureWorkspace(cfg.port, folder)
      await this.renderList(cfg.port, workspace)
    } catch (err) {
      logLine(`[dsh] workspace align failed: ${errMessage(err)}`)
      view.webview.html = renderMessage(`工作区对齐失败：${errMessage(err)}`)
    }
  }

  private async renderList(port: number, ws: WorkspaceRow): Promise<void> {
    if (this.view === undefined) return
    const sessions = (await listSessions(port))
      .filter(s => ws.sessionIds.includes(s.sessionId))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 30)
    this.view.webview.html = renderLauncher(ws, sessions)
  }

  /** Launcher actions: new chat, open a session, refresh. */
  private async onMessage(message: LauncherMessage): Promise<void> {
    const cfg = readServerConfig()
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (folder === undefined) return
    if (message.type === 'refresh') {
      await this.load()
      return
    }
    try {
      const { workspace, archived } = await ensureWorkspace(cfg.port, folder)
      const sessionId = message.type === 'open'
        ? message.sessionId
        : await connectSession(cfg.port, workspace, archived)
      const summary = (await listSessions(cfg.port)).find(s => s.sessionId === sessionId)
      const label = summary?.title ?? (summary?.blank === true ? '新对话' : basename(folder))
      openConversation(cfg.port, sessionId, `${label} · DSH`)
      if (message.type === 'new') await this.renderList(cfg.port, workspace)
    } catch (err) {
      void vscode.window.showErrorMessage(`DSH: ${errMessage(err)}`)
    }
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function basename(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}

/** Placeholder page for loading and error states, styled after VS Code itself. */
function renderMessage(text: string): string {
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>body{margin:0;padding:24px 16px;color:var(--vscode-foreground);background:var(--vscode-sideBar-background);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size)}</style>
</head><body>${escapeHtml(text)}</body></html>`
}

/** The launcher itself: folder header, new-chat button, conversation rows. */
function renderLauncher(ws: WorkspaceRow, sessions: SessionSummary[]): string {
  const nonce = randomUUID()
  const rows = sessions.map(s => `
    <div class="row" data-session="${escapeHtml(s.sessionId)}">
      <span class="name">${escapeHtml(label(s))}${s.running ? '<span class="run">运行中</span>' : ''}</span>
      <span class="time">${escapeHtml(timeAgo(s.updatedAt))}</span>
    </div>`).join('')
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  body{margin:0;padding:12px;color:var(--vscode-foreground);background:var(--vscode-sideBar-background);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size)}
  .folder{font-weight:600;margin-bottom:2px}
  .path{color:var(--vscode-descriptionForeground);font-size:.9em;margin-bottom:12px;word-break:break-all}
  .new{display:block;width:100%;box-sizing:border-box;margin-bottom:12px;padding:7px 10px;border-radius:4px;border:1px solid var(--vscode-button-border,transparent);background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer;font:inherit;text-align:center}
  .new:hover{background:var(--vscode-button-hoverBackground)}
  .row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden}
  .row:hover{background:var(--vscode-list-hoverBackground)}
  .name{overflow:hidden;text-overflow:ellipsis}
  .run{margin-left:6px;color:var(--vscode-charts-green);font-size:.85em}
  .time{color:var(--vscode-descriptionForeground);font-size:.85em;flex:none}
  .empty{color:var(--vscode-descriptionForeground)}
  .refresh{margin-top:10px;text-align:center;color:var(--vscode-descriptionForeground);font-size:.85em;cursor:pointer;text-decoration:underline}
</style>
</head><body>
<div class="folder">${escapeHtml(basename(ws.path))}</div>
<div class="path">${escapeHtml(ws.path)}</div>
<button class="new" id="new">＋ 新建对话</button>
${rows === '' ? '<div class="empty">还没有对话，点上面开始。</div>' : rows}
<div class="refresh" id="refresh">刷新列表</div>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi()
  document.getElementById('new').onclick = () => vscode.postMessage({ type: 'new' })
  document.getElementById('refresh').onclick = () => vscode.postMessage({ type: 'refresh' })
  for (const row of document.querySelectorAll('.row')) {
    row.onclick = () => vscode.postMessage({ type: 'open', sessionId: row.dataset.session })
  }
</script>
</body></html>`
}

function label(s: SessionSummary): string {
  if (s.title !== undefined && s.title !== '') return s.title
  return s.blank ? '新对话' : '对话'
}

function timeAgo(updatedAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - updatedAt) / 60_000))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.round(hours / 24)} 天前`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
