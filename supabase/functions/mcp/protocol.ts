// Minimal hand-rolled MCP (Model Context Protocol) JSON-RPC surface for a
// stateless, read-only tools server. Plain application/json responses — no
// SSE, no session id. Protocol version pinned to 2025-03-26 with graceful
// negotiation. ~enough to satisfy Claude / ChatGPT remote MCP clients.

export const PROTOCOL_VERSION = '2025-03-26'

export const SERVER_INFO = {
  name: 'trail-catalunya',
  version: '0.1.0',
  // R17: anonymous-logging disclosure, surfaced where clients show server info.
  description:
    'Trail running races in Catalunya. Read-only. Queries are logged ' +
    'anonymously (no IP, no identity) for 90 days to improve the tool.',
}

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

// A registered tool: JSON-Schema input + a handler returning a JSON-able value.
export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown
}

export function rpcResult(id: JsonRpcRequest['id'], result: unknown): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, result })
}

export function rpcError(
  id: JsonRpcRequest['id'],
  code: number,
  message: string,
): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })
}

// MCP tools/call envelope: structured payload as text content + structuredContent,
// with isError separating a tool-level failure from a JSON-RPC protocol error.
export function toolResult(id: JsonRpcRequest['id'], payload: unknown): Response {
  return rpcResult(id, {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError: false,
  })
}

export function toolError(id: JsonRpcRequest['id'], message: string): Response {
  return rpcResult(id, {
    content: [{ type: 'text', text: message }],
    isError: true,
  })
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
