/** Ensure the deep-link client plugin is installed into the web profile. */
import { spawn } from 'node:child_process'
import { logLine } from './serverManager'

const PLUGIN_NAME = 'dsh-plugin-deep-link'

/**
 * Probe and, when missing, install `dsh-plugin-deep-link` through the DSH
 * web profile so the running GUI acquires session-targeting support.  Skips
 * when the running server is a source checkout whose own fork already
 * provides the deep link.
 */
export async function ensureDeepLinkPlugin(port: number, extensionPath: string, repoPath: string): Promise<void> {
  // A source checkout already includes the deep-link patch; skip npm install.
  if (repoPath !== '') return
  try {
    const res = await fetch(`http://127.0.0.1:${port}/plugins/${PLUGIN_NAME}/client.js`, {
      signal: AbortSignal.timeout(2_000),
    })
    if (res.ok) return
  } catch {
    // The server may not yet be fully booted; proceed with install.
  }
  addFromLocal(extensionPath)
}

async function addFromLocal(extensionPath: string): Promise<void> {
  const source = `${extensionPath}/plugin`
  logLine(`[dsh] installing deep-link plugin from ${source}`)
  await new Promise<void>((resolve, reject) => {
    const child = spawn('dsh', ['plugin', '--profile', 'web', 'add', source], {
      env: process.env,
      stdio: 'pipe',
    })
    let stdout = ''
    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr?.on('data', (d: Buffer) => { stdout += d.toString() })
    child.on('error', (err) => reject(err))
    child.on('exit', (code) => {
      logLine(`[dsh] dsh plugin add exited ${code ?? 'null'}${stdout ? `: ${stdout.trim()}` : ''}`)
      if (code === 0) resolve()
      else reject(new Error(`dsh plugin add exited with code ${code ?? 'null'}`))
    })
  })
}