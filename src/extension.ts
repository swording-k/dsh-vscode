/** Extension entry: launcher views, entry-point commands, status bar, theme sync. */
import * as vscode from 'vscode'
import { openNewChat } from './actions'
import { logLine, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'
import { DshLauncherProvider } from './view'

let providers: DshLauncherProvider[] = []

export function activate(context: vscode.ExtensionContext): void {
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
      for (const provider of providers) provider.refresh()
      void revealLauncher()
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

/**
 * Focus the launcher container. Both the activity-bar and secondary-side-bar
 * containers are declared unconditionally; the first reveal that succeeds wins,
 * and a build that honours neither still gets a conversation panel.
 */
async function revealLauncher(): Promise<void> {
  for (const container of ['workbench.view.extension.dshHarnessSidebar', 'workbench.view.extension.dshHarness']) {
    try {
      await vscode.commands.executeCommand(container)
      return
    } catch {
      // Container absent on this build; try the next entry point.
    }
  }
  await openNewChat()
}

/** Run an action, surfacing failures as a notification instead of an unhandled rejection. */
function guard(action: () => Promise<void>): void {
  void action().catch(err => {
    void vscode.window.showErrorMessage(`DSH: ${err instanceof Error ? err.message : String(err)}`)
  })
}

/** The dsh web server keeps its own lifecycle; nothing to clean up here. */
export function deactivate(): void {}