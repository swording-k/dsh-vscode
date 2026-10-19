/** Shared user actions: connect, align, then open a conversation on the right. */
import * as vscode from 'vscode'
import { connectSession, ensureWorkspace, listSessions } from './dshApi'
import { openConversation } from './conversation'
import { postServerReady } from './registry'
import { ensureRunning, readServerConfig } from './serverManager'
import { syncTheme } from './themeSync'

/** Connect to (or start) dsh web and sync the theme; throws a user-facing message on failure. */
export async function ensureReady(): Promise<number> {
  const cfg = readServerConfig()
  await ensureRunning(cfg)
  await postServerReady?.(cfg.port, cfg.repoPath)
  if (cfg.syncTheme) {
    try {
      await syncTheme(cfg.port)
    } catch {
      // Theme sync is cosmetic; a failed write must not block the conversation.
    }
  }
  return cfg.port
}

/** The first VS Code workspace folder, or undefined when none is open. */
export function workspaceFolder(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
}

/** Open a fresh (or reusable blank) conversation for the current folder on the right. */
export async function openNewChat(): Promise<void> {
  const folder = workspaceFolder()
  if (folder === undefined) {
    void vscode.window.showInformationMessage('DSH: 先在 VS Code 中打开一个文件夹。')
    return
  }
  const port = await ensureReady()
  const { workspace, archived } = await ensureWorkspace(port, folder)
  const sessionId = await connectSession(port, workspace, archived)
  openConversation(port, sessionId, `新对话 · ${basename(folder)}`)
}

/** Open the conversation for one session on the right. */
export async function openSession(sessionId: string): Promise<void> {
  const port = await ensureReady()
  const summary = (await listSessions(port)).find(s => s.sessionId === sessionId)
  const label = summary?.title ?? 'DSH'
  openConversation(port, sessionId, label)
}

/** Last path segment, for panel titles. */
export function basename(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}