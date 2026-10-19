/** Extension entry: launcher view, focus command, theme-change sync. */
import * as vscode from 'vscode'
import { logLine, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'
import { DshLauncherProvider } from './view'

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('dshHarness.view', new DshLauncherProvider()),
    vscode.commands.registerCommand('dsh-vscode.openPanel', () => {
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

/** The dsh web server keeps its own lifecycle; nothing to clean up here. */
export function deactivate(): void {}
