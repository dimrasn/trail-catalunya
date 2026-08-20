// Canonical site origin, used by metadata, sitemap, and robots. When the
// custom domain lands, set NEXT_PUBLIC_SITE_URL in Vercel and everything
// (canonical, og:url, sitemap) follows — one env change, no code edits.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://trail-catalunya.vercel.app'
