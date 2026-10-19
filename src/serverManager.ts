/** Probe and lifecycle management for the local `dsh web` server. */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as vscode from 'vscode'

/** User-configured server location and behavior. */
export interface ServerConfig {
  repoPath: string
  port: number
  autoStart: boolean
}

/** Marker in the dsh web root HTML; distinguishes dsh from a foreign process on the port. */
const BOOT_MARKER = '__DSH_BOOT__'
const START_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 1_000

type Probe = 'dsh' | 'foreign' | 'free'

let child: ChildProcess | undefined
let output: vscode.OutputChannel | undefined

/** Classify what answers on `port`: dsh web, a foreign HTTP process, or nothing. */
async function probe(port: number): Promise<Probe> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2_000) })
    if (!res.ok) return 'foreign'
    return (await res.text()).includes(BOOT_MARKER) ? 'dsh' : 'foreign'
  } catch {
    return 'free'
  }
}

/** Resolve a node binary; VS Code's GUI-launch PATH may lack Homebrew. */
function resolveNode(): string {
  for (const candidate of ['node', '/opt/homebrew/bin/node', '/usr/local/bin/node']) {
    const r = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return candidate
  }
  throw new Error('No node binary found (tried PATH, /opt/homebrew/bin, /usr/local/bin).')
}

/**
 * Return once a dsh web server answers on `cfg.port`, starting it when needed.
 * Throws with a user-facing message on foreign port occupation, missing repoPath,
 * early server exit, or startup timeout.
 */
export async function ensureRunning(cfg: ServerConfig): Promise<void> {
  const state = await probe(cfg.port)
  if (state === 'dsh') return
  if (state === 'foreign') {
    throw new Error(`Port ${cfg.port} is used by another application; change the dshHarness.port setting.`)
  }
  if (!cfg.autoStart) {
    throw new Error('dsh web is not running and dshHarness.autoStart is off.')
  }
  if (!existsSync(cfg.repoPath)) {
    throw new Error(`dshHarness.repoPath does not exist: ${cfg.repoPath}`)
  }
  const node = resolveNode()
  output ??= vscode.window.createOutputChannel('DeepSeek Harness Server')
  output.appendLine(`[dsh] start: ${node} --import tsx/esm apps/cli/src/bin.ts web (cwd: ${cfg.repoPath})`)
  child = spawn(node, ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'], {
    cwd: cfg.repoPath,
    env: process.env,
  })
  child.stdout?.on('data', (d: Buffer) => output?.append(d.toString()))
  child.stderr?.on('data', (d: Buffer) => output?.append(d.toString()))
  child.on('exit', code => output?.appendLine(`[dsh] server exited (code ${code ?? 'null'})`))
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    if (child.exitCode !== null) {
      output.show()
      throw new Error('dsh web exited during startup; see the "DeepSeek Harness Server" output channel.')
    }
    if ((await probe(cfg.port)) === 'dsh') return
  }
  output.show()
  throw new Error('Timed out (60s) waiting for dsh web; see the "DeepSeek Harness Server" output channel.')
}
