/**
 * DeepSeek Harness client plugin: #session=<id> deep-link redirect.
 *
 * Reads the URL fragment on load. When the fragment matches
 * `#session=<sessionId>` the plugin removes the marker from the address bar
 * and directs the sessions service to open that session immediately — the user
 * lands on the intended conversation without an extra click.
 */
export function apply(ctx: { sessions?: { open: (id: string) => void }; root?: { sessions?: { open: (id: string) => void } } }): void {
  const match = /^#session=([A-Za-z0-9-]+)$/.exec(location.hash)
  if (match === null) return
  const sessionId = match[1]
  // Remove the hash fragment so a follow-up reload does not re-trigger.
  history.replaceState(null, '', location.pathname + location.search)

  function tryOpen(tries: number): void {
    const sessions = ctx.sessions ?? ctx.root?.sessions
    if (sessions !== undefined && sessions !== null) {
      sessions.open(sessionId)
      return
    }
    if (tries > 0) setTimeout(() => tryOpen(tries - 1), 100)
  }
  tryOpen(20)
}