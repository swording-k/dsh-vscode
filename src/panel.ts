/** Webview panel hosting the dsh web GUI. */
import * as vscode from 'vscode'

let panel: vscode.WebviewPanel | undefined

/** Create the panel on first use, reveal it afterwards. */
export function createOrReveal(port: number): void {
  if (panel) {
    panel.reveal()
    return
  }
  const url = `http://127.0.0.1:${port}`
  panel = vscode.window.createWebviewPanel('dshHarness', 'DeepSeek Harness', vscode.ViewColumn.Beside, {
    enableScripts: true,
    retainContextWhenHidden: true,
  })
  panel.webview.html = render(url)
  panel.onDidDispose(() => {
    panel = undefined
  })
}

/** CSP locks the host page down; the GUI itself loads inside the iframe. */
function render(url: string): string {
  return `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url}; style-src 'unsafe-inline';">
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${url}"></iframe></body></html>`
}
