/** Sync the VS Code color theme onto the dsh GUI appearance preference. */
import * as vscode from 'vscode'
import { rpcCall } from './rpc'

/**
 * Write the dsh theme preference matching VS Code's current theme kind.
 * The preference lives in the host user-settings document (`ui-theme` ns);
 * a running GUI adopts the change live, a later load boots with it.
 */
export async function syncTheme(port: number): Promise<void> {
  const kind = vscode.window.activeColorTheme.kind
  const dark = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast
  await rpcCall(port, 'settings.mutate', {
    ns: 'ui-theme',
    ops: [{ op: 'set', path: ['preference'], value: dark ? 'dark' : 'light' }],
  })
}
