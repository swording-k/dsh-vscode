/** Probe and lifecycle management for the local `dsh web` server. */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as vscode from 'vscode'

/** User-configured server location and behavior. */
export interface ServerConfig {
  repoPath: string
  command: string
  port: number
  autoStart: boolean
  syncTheme: boolean
}

/** Marker in the dsh web root HTML; distinguishes dsh from a foreign process on the port. */
const BOOT_MARKER = '__DSH_BOOT__'
const START_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 1_000

/** How to launch the server on this machine. */
interface Launch {
  command: string
  args: string[]
  cwd?: string
}

type Probe = 'dsh' | 'foreign' | 'free'

let child: ChildProcess | undefined
let output: vscode.OutputChannel | undefined

/** Read the extension's server configuration. */
export function readServerConfig(): ServerConfig {
  const c = vscode.workspace.getConfiguration('dshHarness')
  return {
    repoPath: c.get('repoPath', ''),
    command: c.get('command', 'dsh'),
    port: c.get('port', 3080),
    autoStart: c.get('autoStart', true),
    syncTheme: c.get('syncTheme', true),
  }
}

/** Append one line to the server output channel, creating it on first use. */
export function logLine(line: string): void {
  output ??= vscode.window.createOutputChannel('DeepSeek Harness Server')
  output.appendLine(line)
}

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
 * Pick the launch strategy: a configured checkout wins (source launch through
 * tsx), otherwise the configured executable runs with a trailing `web` verb.
 */
function resolveLaunch(cfg: ServerConfig): Launch {
  if (cfg.repoPath !== '' && existsSync(cfg.repoPath)) {
    return {
      command: resolveNode(),
      args: ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'],
      cwd: cfg.repoPath,
    }
  }
  const parts = cfg.command.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) throw new Error('dshHarness.command is empty; set it to the dsh executable.')
  return { command: parts[0], args: [...parts.slice(1), 'web'] }
}

/**
 * Return once a dsh web server answers on `cfg.port`, starting it when needed.
 * Throws with a user-facing message on foreign port occupation, unusable
 * configuration, early server exit, or startup timeout.
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
  const launch = resolveLaunch(cfg)
  const display = [launch.command, ...launch.args].join(' ')
  logLine(`[dsh] start: ${display}${launch.cwd === undefined ? '' : ` (cwd: ${launch.cwd})`}`)
  child = spawn(launch.command, launch.args, {
    env: process.env,
    ...(launch.cwd === undefined ? {} : { cwd: launch.cwd }),
  })
  child.on('error', err => logLine(`[dsh] spawn failed: ${err.message}`))
  child.stdout?.on('data', (d: Buffer) => output?.append(d.toString()))
  child.stderr?.on('data', (d: Buffer) => output?.append(d.toString()))
  child.on('exit', code => logLine(`[dsh] server exited (code ${code ?? 'null'})`))
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    if (child.exitCode !== null) {
      output?.show()
      throw new Error(`dsh web exited during startup; see the "DeepSeek Harness Server" output channel. Install it with \`npm i -g dsh\` or set dshHarness.repoPath.`)
    }
    if ((await probe(cfg.port)) === 'dsh') return
  }
  output?.show()
  throw new Error('Timed out (60s) waiting for dsh web; see the "DeepSeek Harness Server" output channel.')
}