/** Activity-bar webview view hosting the dsh web GUI. */
import * as vscode from 'vscode'
import { ensureRunning, logLine, readServerConfig } from './serverManager'
import { ensureWorkspaceSession } from './workspaceAlign'
import { syncTheme } from './themeSync'

/** Provides the `dshHarness.view` webview: connect → align → theme → embed GUI. */
export class DshViewProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true }
    void this.load(view)
  }

  /**
   * Connect to (or start) dsh web, then embed the GUI. Theme sync runs before
   * the iframe loads so the boot page paints with the right preference; the
   * workspace alignment is best-effort — the GUI works without it.
   */
  private async load(view: vscode.WebviewView): Promise<void> {
    const cfg = readServerConfig()
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
        logLine(`[dsh] theme sync failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    try {
      await ensureWorkspaceSession(cfg.port)
    } catch (err) {
      logLine(`[dsh] workspace align failed: ${err instanceof Error ? err.message : String(err)}`)
    }
    const url = `http://127.0.0.1:${cfg.port}`
    view.webview.html = renderGui(url)
  }
}

/** CSP locks the host page down; the GUI itself loads inside the iframe. */
function renderGui(url: string): string {
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url}; style-src 'unsafe-inline';">
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${url}"></iframe></body></html>`
}

/** Placeholder page for loading and error states, styled after VS Code itself. */
function renderMessage(text: string): string {
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>body{margin:0;padding:24px 16px;color:var(--vscode-foreground);background:var(--vscode-sideBar-background);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size)}</style>
</head><body>${escapeHtml(text)}</body></html>`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
