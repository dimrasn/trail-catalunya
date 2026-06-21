// MCP server Edge Function — public, no-auth, read-only.
// Deploy with: supabase functions deploy mcp --no-verify-jwt
//
// Routes the MCP JSON-RPC handshake + tool calls. Tools are registered in
// tools.ts (U5); rate limiting + query logging wrap tools/call (U6).

import {
  CORS_HEADERS,
  type JsonRpcRequest,
  PROTOCOL_VERSION,
  rpcError,
  rpcResult,
  SERVER_INFO,
  toolError,
  toolResult,
  type ToolDef,
} from './protocol.ts'
import { TOOLS } from './tools.ts'
import { bumpInvocations, checkRateLimit, clientIpHash } from './ratelimit.ts'
import { logCall } from './log.ts'

const registry = new Map<string, ToolDef>(TOOLS.map((t) => [t.name, t]))

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (origin === 'null' || origin?.startsWith('file://')) {
    return new Response('forbidden origin', { status: 403 })
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method === 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
  }

  let body: JsonRpcRequest
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error: invalid JSON')
  }

  const { id, method, params } = body

  // Every JSON-RPC method counts as one Edge invocation against the free tier
  // (R12). Returns false when the global daily ceiling is crossed.
  const underCeiling = await bumpInvocations()

  switch (method) {
    case 'initialize': {
      // Graceful version negotiation: honour the client's requested version when
      // we can, otherwise return ours rather than hard-rejecting.
      const requested = (params?.protocolVersion as string) || PROTOCOL_VERSION
      const protocolVersion = requested === PROTOCOL_VERSION ? requested : PROTOCOL_VERSION
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      })
    }

    case 'notifications/initialized':
      return new Response(null, { status: 202, headers: CORS_HEADERS })

    case 'ping':
      return rpcResult(id, {})

    case 'tools/list':
      return rpcResult(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      })

    case 'tools/call': {
      const name = params?.name as string
      const args = (params?.arguments as Record<string, unknown>) || {}
      const tool = registry.get(name)
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`)

      // Global daily ceiling backstop (covers spoofed/distributed callers).
      if (!underCeiling) {
        return rpcError(id, -32000, 'Daily capacity reached. Try again tomorrow.')
      }

      // Per-IP rate limit (U6) before doing any work.
      const ipHash = await clientIpHash(req)
      const allowed = await checkRateLimit(ipHash)
      if (!allowed) {
        return rpcError(id, -32000, 'Rate limit exceeded. Try again shortly.')
      }

      // Anonymous query log (U6) — tool + args, never IP/identity.
      await logCall(name, args)

      try {
        const payload = await tool.handler(args)
        return toolResult(id, payload)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toolError(id, `Tool failed: ${msg}`)
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`)
  }
})
