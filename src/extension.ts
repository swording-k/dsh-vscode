/** Extension entry: launcher views, entry-point commands, status bar, theme sync. */
import * as vscode from 'vscode'
import { openNewChat } from './actions'
import { logLine, readServerConfig } from './serverManager'
import { ensureDeepLinkPlugin } from './pluginSetup'
import { setPostServerReady } from './registry'
import { syncTheme } from './themeSync'
import { DshLauncherProvider } from './view'

let providers: DshLauncherProvider[] = []
let extPath = ''

export function activate(context: vscode.ExtensionContext): void {
  extPath = context.extensionPath
  setPostServerReady((port, repoPath) => ensureDeepLinkPlugin(port, extPath, repoPath))
  const barProvider = new DshLauncherProvider()
  const sideProvider = new DshLauncherProvider()
  providers = [barProvider, sideProvider]

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  status.text = '$(comment-discussion) DSH'
  status.tooltip = 'DeepSeek Harness'
  status.command = 'dsh-vscode.openPanel'
  status.show()

  context.subscriptions.push(
    status,
    vscode.window.registerWebviewViewProvider('dshHarness.view', barProvider),
    vscode.window.registerWebviewViewProvider('dshHarness.viewSecondary', sideProvider),
    vscode.commands.registerCommand('dsh-vscode.openPanel', () => guard(revealLauncher)),
    vscode.commands.registerCommand('dsh-vscode.newChat', () => guard(openNewChat)),
    vscode.commands.registerCommand('dsh-vscode.refresh', () => {
      for (const p of providers) p.refresh()
      void revealLauncher()
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      const cfg = readServerConfig()
      if (!cfg.syncTheme) return
      void syncTheme(cfg.port).catch(err =>
        logLine(`[dsh] theme sync failed: ${err instanceof Error ? err.message : String(err)}`),
      )
    }),
  )
}

/**
 * Focus the launcher container. Both the activity-bar and secondary-side-bar
 * containers are registered unconditionally; the first reveal that succeeds wins.
 */
async function revealLauncher(): Promise<void> {
  for (const id of ['workbench.view.extension.dshHarnessSidebar', 'workbench.view.extension.dshHarness']) {
    try { await vscode.commands.executeCommand(id); return } catch { /* absent on this build */ }
  }
  await openNewChat()
}

/** Surface unhandled failures as a notification. */
function guard(action: () => Promise<void>): void {
  void action().catch(err => {
    void vscode.window.showErrorMessage(`DSH: ${err instanceof Error ? err.message : String(err)}`)
  })
}

/**
 * Ensure the session-targeting plugin is available before the launcher
 * asks for its first conversation.  Called by `actions.ensureReady`.
 */
export async function ensurePlugin(port: number, repoPath: string): Promise<void> {
  await ensureDeepLinkPlugin(port, extPath, repoPath)
}

export function deactivate(): void {}