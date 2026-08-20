import { SITE_URL } from './lib/site'

// One URL today; per-race pages (slice 3 step 2) will extend this from the
// same events data the page renders.
export default function sitemap() {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
