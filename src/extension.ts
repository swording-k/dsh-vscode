/** Extension entry: register `DSH: Open Panel`. */
import * as vscode from 'vscode'
import { ensureRunning, type ServerConfig } from './serverManager'
import { createOrReveal } from './panel'

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('dsh-vscode.openPanel', async () => {
      const cfg = readConfig()
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'DSH: starting server…', cancellable: false },
          () => ensureRunning(cfg),
        )
      } catch (err) {
        vscode.window.showErrorMessage(`DSH: ${err instanceof Error ? err.message : String(err)}`)
        return
      }
      createOrReveal(cfg.port)
    }),
  )
}

function readConfig(): ServerConfig {
  const c = vscode.workspace.getConfiguration('dshHarness')
  return {
    repoPath: c.get('repoPath', '/Users/baojian/Desktop/deepseek-harness-demo/deepseek-harness'),
    port: c.get('port', 3080),
    autoStart: c.get('autoStart', true),
  }
}

/** The dsh web server keeps its own lifecycle; nothing to clean up here. */
export function deactivate(): void {}
