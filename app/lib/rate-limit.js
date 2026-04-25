// Simple in-memory rate limiter per IP
// Resets on server restart — good enough for low-traffic app

const store = new Map()

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 30 // per hour per IP

export function rateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'

  if (!store.has(key)) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }

  const entry = store.get(key)

  if (now > entry.resetAt) {
    entry.count = 1
    entry.resetAt = now + WINDOW_MS
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }

  entry.count++

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }

  return { ok: true, remaining: MAX_REQUESTS - entry.count }
}
