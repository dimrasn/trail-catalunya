import Anthropic from '@anthropic-ai/sdk'
import races from '@/data/races.json'
import { getSupabase } from '@/app/lib/supabase'
import { rateLimit } from '@/app/lib/rate-limit'

const anthropic = new Anthropic()

// Build a compact race summary for the system prompt
function buildRaceSummary() {
  return races.map(r => {
    const parts = [`${r.name} (${r.town}, ${r.province})`]
    if (r.date) parts.push(`date: ${r.date}`)
    if (r.driveMinutes) parts.push(`drive: ${r.driveMinutes}min`)
    if (r.distances.length > 0) {
      const dists = r.distances.map(d => {
        let s = `${d.km}km`
        if (d.elevationGain) s += ` ↑${d.elevationGain}m`
        if (d.price) s += ` ${d.price}€`
        return s
      }).join(', ')
      parts.push(`distances: ${dists}`)
    }
    if (r.kidsRun) parts.push('has kids run')
    if (r.soldOut) parts.push('SOLD OUT')
    parts.push(`url: ${r.url}`)
    parts.push(`id: ${r.id}`)
    return parts.join(' | ')
  }).join('\n')
}

const RACE_SUMMARY = buildRaceSummary()

const SYSTEM_PROMPT = `You are a trail running assistant for Catalunya 2026. You help people find trail races based on their preferences.

You have access to a database of ${races.length} trail running races in Catalunya for 2026. Here is the full database:

${RACE_SUMMARY}

When users ask about races, use this data to give specific recommendations. You can filter by:
- Distance (km)
- Elevation gain (D+)
- Drive time from Barcelona (Plaça Glòries)
- Province (Barcelona, Girona, Tarragona, Lleida)
- Month/date
- Whether they have a kids run

If a user wants more details about a specific race (terrain, course description, registration info), use the fetch_race_url tool to get info from the race's website. Always check the cache first.

Keep responses concise and practical. Use the race names and data from the database. When recommending races, include key details: name, date, town, distances, drive time.

Respond in the same language the user writes in (Catalan, Spanish, or English).`

const TOOLS = [
  {
    name: 'search_races',
    description: 'Search and filter races from the database. Returns matching races based on criteria.',
    input_schema: {
      type: 'object',
      properties: {
        max_km: { type: 'number', description: 'Maximum distance in km' },
        min_km: { type: 'number', description: 'Minimum distance in km' },
        max_elevation: { type: 'number', description: 'Maximum elevation gain in meters' },
        min_elevation: { type: 'number', description: 'Minimum elevation gain in meters' },
        max_drive_minutes: { type: 'number', description: 'Maximum drive time from Barcelona in minutes' },
        province: { type: 'string', description: 'Province: BARCELONA, GIRONA, TARRAGONA, or LLEIDA' },
        month: { type: 'number', description: 'Month number (1-12)' },
        has_kids_run: { type: 'boolean', description: 'Filter for races with kids run' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
      },
    },
  },
  {
    name: 'fetch_race_url',
    description: 'Fetch content from a race website URL to get more details. Checks Supabase cache first. Use this when users want specific info about a race (terrain, registration, course details).',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The race URL to fetch' },
        race_id: { type: 'string', description: 'The race ID from the database (for caching)' },
      },
      required: ['url'],
    },
  },
]

function searchRaces(params) {
  let results = [...races]

  if (params.province) {
    results = results.filter(r => r.province === params.province.toUpperCase())
  }
  if (params.month) {
    results = results.filter(r => r.date && parseInt(r.date.slice(5, 7)) === params.month)
  }
  if (params.has_kids_run) {
    results = results.filter(r => r.kidsRun)
  }
  if (params.max_drive_minutes) {
    results = results.filter(r => r.driveMinutes != null && r.driveMinutes <= params.max_drive_minutes)
  }
  if (params.min_km != null || params.max_km != null) {
    results = results.filter(r => {
      if (r.distances.length === 0) return true
      return r.distances.some(d => {
        if (params.min_km != null && d.km < params.min_km) return false
        if (params.max_km != null && d.km > params.max_km) return false
        return true
      })
    })
  }
  if (params.min_elevation != null || params.max_elevation != null) {
    results = results.filter(r => {
      if (r.distances.length === 0) return true
      const hasElev = r.distances.some(d => d.elevationGain != null)
      if (!hasElev) return true
      return r.distances.some(d => {
        if (d.elevationGain == null) return false
        if (params.min_elevation != null && d.elevationGain < params.min_elevation) return false
        if (params.max_elevation != null && d.elevationGain > params.max_elevation) return false
        return true
      })
    })
  }

  const limit = params.limit || 10
  results = results.slice(0, limit)

  return results.map(r => ({
    id: r.id,
    name: r.name,
    date: r.date,
    town: r.town,
    province: r.province,
    driveMinutes: r.driveMinutes,
    distances: r.distances,
    kidsRun: r.kidsRun || false,
    soldOut: r.soldOut || false,
    url: r.url,
  }))
}

async function fetchRaceUrl(url, raceId) {
  const supabase = getSupabase()

  // Check cache first
  if (supabase) {
    const { data: cached } = await supabase
      .from('web_search_cache')
      .select('content, title')
      .eq('url', url)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return { source: 'cache', title: cached.title, content: cached.content }
    }
  }

  // Fetch the URL
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TrailCatalunya/1.0 (race info bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { source: 'fetch', error: `HTTP ${res.status}` }
    }

    const html = await res.text()

    // Extract text content from HTML (simple approach)
    const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() || ''
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#?\w+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // Limit content size

    // Cache in Supabase
    if (supabase && content.length > 50) {
      await supabase.from('web_search_cache').insert({
        race_id: raceId || null,
        url,
        title,
        content,
      }).then(() => {}) // fire and forget
    }

    return { source: 'fetch', title, content }
  } catch (err) {
    return { source: 'fetch', error: err.message }
  }
}

async function executeTool(toolName, toolInput) {
  if (toolName === 'search_races') {
    return searchRaces(toolInput)
  }
  if (toolName === 'fetch_race_url') {
    return await fetchRaceUrl(toolInput.url, toolInput.race_id)
  }
  return { error: 'Unknown tool' }
}

export async function POST(request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  const limit = rateLimit(ip)
  if (!limit.ok) {
    return Response.json(
      { error: 'Too many requests. Try again later.', retryAfter: limit.retryAfter },
      { status: 429 }
    )
  }

  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages required' }, { status: 400 })
    }

    // Cap conversation length
    const recentMessages = messages.slice(-20)

    // Call Anthropic with tool use loop
    let currentMessages = recentMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    let finalResponse = ''
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      })

      // Check if we got a text response
      const textBlocks = response.content.filter(b => b.type === 'text')
      const toolBlocks = response.content.filter(b => b.type === 'tool_use')

      if (toolBlocks.length === 0) {
        // No tool calls — we have the final answer
        finalResponse = textBlocks.map(b => b.text).join('\n')
        break
      }

      // Execute tool calls
      currentMessages.push({ role: 'assistant', content: response.content })

      const toolResults = []
      for (const tool of toolBlocks) {
        const result = await executeTool(tool.name, tool.input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: JSON.stringify(result),
        })
      }

      currentMessages.push({ role: 'user', content: toolResults })

      // If stop_reason is end_turn with text, also capture that
      if (response.stop_reason === 'end_turn' && textBlocks.length > 0) {
        finalResponse = textBlocks.map(b => b.text).join('\n')
        break
      }
    }

    return Response.json({ response: finalResponse })
  } catch (err) {
    console.error('Chat API error:', err)

    if (err.status === 401) {
      return Response.json({ error: 'AI service not configured' }, { status: 503 })
    }

    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
