'use client'

import { useState } from 'react'
import { buildPrompt, chatgptUrl, claudeUrl } from './askPrompt'

const MCP_URL = 'https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp'

export default function AskAI({ filteredRaces, filters }) {
  const [copied, setCopied] = useState(false)
  const [showMcp, setShowMcp] = useState(false)
  const disabled = !filteredRaces || filteredRaces.length === 0

  function open(urlFn) {
    if (disabled) return
    const prompt = buildPrompt(filteredRaces, filters)
    window.open(urlFn(prompt), '_blank', 'noopener,noreferrer')
  }

  async function copy() {
    if (disabled) return
    const prompt = buildPrompt(filteredRaces, filters)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — no-op; deep-link buttons still work
    }
  }

  async function copyMcp() {
    try {
      await navigator.clipboard.writeText(MCP_URL)
      setShowMcp(true)
      setTimeout(() => setShowMcp(false), 1800)
    } catch {
      setShowMcp(true)
    }
  }

  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '999px', fontSize: '13px',
    fontWeight: '600', border: 'none', cursor: disabled ? 'default' : 'pointer',
    whiteSpace: 'nowrap', opacity: disabled ? 0.45 : 1,
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
      padding: '10px 16px', borderBottom: '1px solid #1a1a2e', backgroundColor: '#0a0a14',
    }}>
      <span style={{
        fontSize: '11px', color: '#666', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '2px',
      }}>
        Plan with AI
      </span>

      <button onClick={() => open(claudeUrl)} disabled={disabled}
        style={{ ...btn, backgroundColor: '#d97757', color: '#fff' }}
        title="Open these races in Claude">
        Ask Claude
      </button>
      <button onClick={() => open(chatgptUrl)} disabled={disabled}
        style={{ ...btn, backgroundColor: '#10a37f', color: '#fff' }}
        title="Open these races in ChatGPT">
        Ask ChatGPT
      </button>
      <button onClick={copy} disabled={disabled}
        style={{ ...btn, backgroundColor: '#1a1a2e', color: '#cccccc' }}
        title="Copy the prompt to paste into any AI">
        {copied ? '✓ Copied' : 'Copy prompt'}
      </button>

      <span style={{ flex: 1 }} />

      <button onClick={copyMcp}
        style={{
          ...btn, opacity: 1, cursor: 'pointer', backgroundColor: 'transparent',
          color: '#666', fontWeight: '400', fontSize: '12px', padding: '6px 4px',
          textDecoration: 'underline', textUnderlineOffset: '2px',
        }}
        title="For power users: add this URL as an MCP connector in Claude or ChatGPT">
        {showMcp ? '✓ MCP URL copied' : 'Connect via MCP'}
      </button>
    </div>
  )
}
