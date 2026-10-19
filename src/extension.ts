/** Extension entry: launcher views, entry-point commands, status bar, theme sync. */
import * as vscode from 'vscode'
import { openNewChat } from './actions'
import { logLine, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'
import { DshLauncherProvider } from './view'

/**
 * First VS Code minor that renders `viewsContainers.secondarySidebar`. The
 * activity-bar container is gated on the inverse, so older builds keep the
 * left icon and newer builds place the launcher in the right sidebar.
 */
const SECONDARY_SIDEBAR_MIN_MINOR = 106

let providers: DshLauncherProvider[] = []

export function activate(context: vscode.ExtensionContext): void {
  const [, minor = '0'] = /^1\.(\d+)/.exec(vscode.version) ?? []
  const supportsSecondarySidebar = Number(minor) >= SECONDARY_SIDEBAR_MIN_MINOR
  // Context key drives the `when` clauses in package.json.
  void vscode.commands.executeCommand('setContext', 'dshHarness.doesNotSupportSecondarySidebar', !supportsSecondarySidebar)

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
    vscode.commands.registerCommand('dsh-vscode.openPanel', () => {
      const container = supportsSecondarySidebar ? 'workbench.view.extension.dshHarnessSidebar' : 'workbench.view.extension.dshHarness'
      void vscode.commands.executeCommand(container)
    }),
    vscode.commands.registerCommand('dsh-vscode.newChat', () => guard(openNewChat)),
    vscode.commands.registerCommand('dsh-vscode.refresh', () => {
      for (const provider of providers) provider.refresh()
      const container = supportsSecondarySidebar ? 'workbench.view.extension.dshHarnessSidebar' : 'workbench.view.extension.dshHarness'
      void vscode.commands.executeCommand(container)
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