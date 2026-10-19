/** Extension entry: launcher view, entry-point commands, status bar, theme sync. */
import * as vscode from 'vscode'
import { openNewChat } from './actions'
import { logLine, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'
import { DshLauncherProvider } from './view'

let provider: DshLauncherProvider | undefined

export function activate(context: vscode.ExtensionContext): void {
  provider = new DshLauncherProvider()
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  status.text = '$(comment-discussion) DSH'
  status.tooltip = 'DeepSeek Harness'
  status.command = 'dsh-vscode.openPanel'
  status.show()
  context.subscriptions.push(
    status,
    vscode.window.registerWebviewViewProvider('dshHarness.view', provider),
    vscode.commands.registerCommand('dsh-vscode.openPanel', () => {
      void vscode.commands.executeCommand('workbench.view.extension.dshHarness')
    }),
    vscode.commands.registerCommand('dsh-vscode.newChat', () => guard(openNewChat)),
    vscode.commands.registerCommand('dsh-vscode.refresh', () => {
      provider?.refresh()
      void vscode.commands.executeCommand('workbench.view.extension.dshHarness')
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      const cfg = readServerConfig()
      if (!cfg.syncTheme) return
      // A running GUI adopts the preference live; the next view load boots with it.
      void syncTheme(cfg.port).catch(err =>
        logLine(`[dsh] theme sync failed: ${err instanceof Error ? err.message : String(err)}`),
      )
    }),
  )
}

/** Run an action, surfacing failures as a notification instead of an unhandled rejection. */
function guard(action: () => Promise<void>): void {
  void action().catch(err => {
    void vscode.window.showErrorMessage(`DSH: ${err instanceof Error ? err.message : String(err)}`)
  })
}

/** The dsh web server keeps its own lifecycle; nothing to clean up here. */
export function deactivate(): void {}