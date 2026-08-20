import { NextResponse } from 'next/server'

// Crawl-rate signal for the SEO measurement loop. We match search + AI crawler
// user-agents and write one row per hit (bot + path + time) to Supabase via the
// log_crawler_hit RPC. Vercel hobby request logs vanish in ~1h, so crawl rate —
// the earliest indicator in the loop — has to be persisted ourselves.
//
// Cost/latency: the fetch is fire-and-forget via event.waitUntil (never blocks
// the response), and only fires for matched bot UAs. Real users add just one
// regex test. Failure is swallowed — analytics must never break a page load.

const BOT_RE = /(googlebot|bingbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|applebot|duckduckbot|yandexbot|baiduspider)/i

export const config = {
  // Run on pages + sitemap/robots/llms (all real crawl targets); skip Next
  // internals and image assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)).*)'],
}

export function middleware(req, event) {
  const ua = req.headers.get('user-agent') || ''
  const m = ua.match(BOT_RE)
  if (m) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      event.waitUntil(
        fetch(`${url}/rest/v1/rpc/log_crawler_hit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            p_bot: m[1].toLowerCase(),
            p_path: req.nextUrl.pathname,
            p_ua: ua.slice(0, 500),
          }),
        }).catch(() => {}),
      )
    }
  }
  return NextResponse.next()
}
