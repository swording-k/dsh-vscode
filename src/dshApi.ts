/** Typed wrappers over the dsh web BFF RPC surface the extension uses. */
import { rpcCall } from './rpc'

/** Subset of WorkspaceView rows the extension needs. */
export interface WorkspaceRow {
  workspaceId: string
  path: string
  sessionIds: string[]
}

/** Subset of session.list summaries the extension needs. */
export interface SessionSummary {
  sessionId: string
  updatedAt: number
  running: boolean
  blank: boolean
  cwd?: string
  title?: string
}

/** Workspaces (and archived session ids) known to the host. */
export async function listWorkspaces(port: number): Promise<{ items: WorkspaceRow[]; archived: string[] }> {
  return rpcCall<{ items: WorkspaceRow[]; archivedSessionIds: string[] }>(port, 'workspace.list', {})
    .then(({ items, archivedSessionIds }) => ({ items, archived: archivedSessionIds }))
}

/** All session summaries known to the host, newest first. */
export async function listSessions(port: number): Promise<SessionSummary[]> {
  return rpcCall<{ items: Array<Record<string, unknown>> }>(port, 'session.list', {})
    .then(({ items }) => items.map(item => {
      const projections = item.projections as { title?: unknown } | undefined
      const title = typeof projections?.title === 'string' ? projections.title : undefined
      const cwd = typeof item.cwd === 'string' ? item.cwd : undefined
      return {
        sessionId: String(item.sessionId),
        updatedAt: Number(item.updatedAt),
        running: item.running === true,
        blank: item.blank === true,
        ...(cwd !== undefined ? { cwd } : {}),
        ...(title !== undefined ? { title } : {}),
      }
    }))
}

/** Find (or create) the workspace row for a filesystem path. */
export async function ensureWorkspace(port: number, path: string): Promise<{ workspace: WorkspaceRow; archived: string[] }> {
  const { items, archived } = await listWorkspaces(port)
  const existing = items.find(w => w.path === path)
  if (existing !== undefined) return { workspace: existing, archived }
  const created = await rpcCall<{ workspace: WorkspaceRow }>(port, 'workspace.create', { path })
  return { workspace: created.workspace, archived }
}

/**
 * The session a fresh "new chat" lands on for one workspace: a live blank
 * session that is a member of the workspace (mirrors the GUI's own
 * connectWorkspace rule), or a newly created one.
 */
export async function connectSession(port: number, ws: WorkspaceRow, archived: string[]): Promise<string> {
  const sessions = await listSessions(port)
  const blank = sessions.find(s => s.blank && s.cwd === ws.path
    && ws.sessionIds.includes(s.sessionId) && !archived.includes(s.sessionId))
  if (blank !== undefined) return blank.sessionId
  const created = await rpcCall<{ sessionId: string }>(port, 'session.create', { workspaceId: ws.workspaceId })
  return created.sessionId
}
