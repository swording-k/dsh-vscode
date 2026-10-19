/** Editor-area panel hosting one DSH conversation (right of the editor). */
import * as vscode from 'vscode'

let panel: vscode.WebviewPanel | undefined
let currentUrl: string | undefined
let deepLinkSupport: boolean | undefined

/**
 * Whether the running GUI accepts `#session=<id>`. Stock dsh releases do not;
 * the custom-branch patch does. Checked once per session by inspecting the
 * served client bundle, so a stock server degrades to opening the plain GUI.
 */
async function supportsDeepLink(port: number): Promise<boolean> {
  if (deepLinkSupport !== undefined) return deepLinkSupport
  try {
    const res = await fetch(`http://127.0.0.1:${port}/plugins/@deepseek-ai/dsh-client-runtime/client.js`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!res.ok) return false
    deepLinkSupport = (await res.text()).includes('#session=')
    return deepLinkSupport
  } catch {
    return false
  }
}

/**
 * Open the conversation panel on the given session, or switch it there.
 * With deep-link support the iframe reloads onto the session; without it the
 * GUI opens normally and the user picks the conversation there.
 */
export async function openConversation(port: number, sessionId: string, title: string): Promise<void> {
  const base = `http://127.0.0.1:${port}`
  const url = await supportsDeepLink(port) ? `${base}/#session=${sessionId}` : base
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