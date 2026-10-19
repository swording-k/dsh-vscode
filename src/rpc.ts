/** Minimal caller for the dsh web BFF's unary HTTP RPC (`POST /api/<endpoint>`). */
import { randomUUID } from 'node:crypto'

/** Wire envelope: result is a tagged union — ok with a value, or a structured error. */
type ServerBody<T> = {
  rpcId?: string
  result?: { ok: true; value: T } | { ok: false; error: { code: string; message: string } }
}

/**
 * Call one unary RPC endpoint and unwrap its value.
 * Throws on transport failure, rpcId mismatch, malformed envelopes, or server errors.
 */
export async function rpcCall<T>(port: number, endpoint: string, payload: unknown): Promise<T> {
  const rpcId = randomUUID()
  const res = await fetch(`http://127.0.0.1:${port}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId, method: endpoint, payload }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`RPC ${endpoint}: HTTP ${res.status}`)
  const body = (await res.json()) as ServerBody<T>
  if (body.rpcId !== rpcId) throw new Error(`RPC ${endpoint}: rpcId mismatch`)
  if (body.result === undefined) throw new Error(`RPC ${endpoint}: malformed response envelope`)
  if (!body.result.ok) throw new Error(`RPC ${endpoint}: ${body.result.error.message}`)
  return body.result.value
}
