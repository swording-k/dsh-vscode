/** Editor-area panel hosting one DSH conversation (right of the editor). */
import * as vscode from 'vscode'

let panel: vscode.WebviewPanel | undefined
let currentUrl: string | undefined

/**
 * Open the conversation panel on the given session, or switch it there.
 * The GUI consumes `#session=<id>` at boot, so a session switch reloads
 * the iframe with the new deep link.
 */
export function openConversation(port: number, sessionId: string, title: string): void {
  const url = `http://127.0.0.1:${port}/#session=${sessionId}`
  if (panel === undefined) {
    panel = vscode.window.createWebviewPanel('dshHarness.conversation', title, vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })
    panel.onDidDispose(() => {
      panel = undefined
      currentUrl = undefined
    })
  } else {
    panel.title = title
    panel.reveal()
  }
  if (currentUrl === url) return
  currentUrl = url
  panel.webview.html = render(url)
}

/** CSP locks the host page down; the GUI itself loads inside the iframe. */
function render(url: string): string {
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${new URL(url).origin}; style-src 'unsafe-inline';">
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${url}"></iframe></body></html>`
}
