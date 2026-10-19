/** Align dsh state with the folder currently open in VS Code. */
import * as vscode from 'vscode'
import { rpcCall } from './rpc'

/** Subset of the host WorkspaceView the extension needs. */
interface WorkspaceView {
  workspaceId: string
  path: string
  sessionIds: string[]
}

/**
 * Ensure the dsh server has a workspace for VS Code's first workspace folder
 * and at least one session in it, so the GUI's session list surfaces the
 * folder the user is looking at. Callers treat failures as best-effort.
 */
export async function ensureWorkspaceSession(port: number): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (folder === undefined) return
  const list = await rpcCall<{ items: WorkspaceView[] }>(port, 'workspace.list', {})
  let ws = list.items.find(w => w.path === folder)
  if (ws === undefined) {
    const created = await rpcCall<{ workspace: WorkspaceView }>(port, 'workspace.create', { path: folder })
    ws = created.workspace
  }
  if (ws.sessionIds.length === 0) {
    await rpcCall(port, 'session.create', { workspaceId: ws.workspaceId })
  }
}
