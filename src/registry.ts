/** Shared registry so extension.ts can inject lifecycle hooks reachable from actions. */

/** Called after dsh web is confirmed running. */
export let postServerReady: ((port: number, repoPath: string) => Promise<void>) | undefined
export function setPostServerReady(fn: typeof postServerReady): void { postServerReady = fn }