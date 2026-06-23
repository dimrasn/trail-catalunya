// Shared transactional-email helper for pipeline alerts (scrape failures,
// sanity-gate trips, golden-row failures, usage-threshold warnings).
//
// Uses Resend's HTTP API. Configure via env on the Edge Function:
//   RESEND_API_KEY  — Resend API key
//   ALERT_FROM      — verified sender, e.g. "alerts@yourdomain"
//   ALERT_TO        — maintainer recipient
//
// Design: never throws. A missing key or a Resend error is logged and
// swallowed so an alert failure can never crash the caller (the scrape must
// still complete and record its run even if the email can't go out).

export async function sendAlert(subject: string, body: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('ALERT_FROM')
  const to = Deno.env.get('ALERT_TO')

  if (!apiKey || !from || !to) {
    console.warn(
      `sendAlert skipped — missing ${!apiKey ? 'RESEND_API_KEY ' : ''}${
        !from ? 'ALERT_FROM ' : ''
      }${!to ? 'ALERT_TO' : ''}`.trim() + `. Subject was: ${subject}`,
    )
    return false
  }

  // Bounded so a hung Resend connection can't eat the caller's wall-clock
  // budget (the enrichment/scrape function awaits this in its error path).
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5_000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[trail-catalunya] ${subject}`,
        text: body,
      }),
    })
    if (!res.ok) {
      console.error(`sendAlert: Resend returned HTTP ${res.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`sendAlert: fetch error: ${err instanceof Error ? err.message : String(err)}`)
    return false
  } finally {
    clearTimeout(timer)
  }
}
