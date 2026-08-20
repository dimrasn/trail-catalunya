'use client'

import { useState } from 'react'
import { buildPrompt, chatgptUrl, claudeUrl } from './askPrompt'

const MCP_URL = 'https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp'

export default function AskAI({ filteredRaces, filters }) {
  const [copied, setCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const disabled = !filteredRaces || filteredRaces.length === 0

  function open(urlFn) {
    if (disabled) return
    const prompt = buildPrompt(filteredRaces, filters)
    window.open(urlFn(prompt), '_blank', 'noopener,noreferrer')
  }

  async function copy() {
    if (disabled) return
    try {
      await navigator.clipboard.writeText(buildPrompt(filteredRaces, filters))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — deep-link buttons still work
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(MCP_URL)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 1800)
    } catch {
      // ignore — the URL is shown in full for manual copy
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

      <button onClick={() => setShowHelp(true)}
        style={{
          ...btn, opacity: 1, cursor: 'pointer', backgroundColor: 'transparent',
          color: '#666', fontWeight: '400', fontSize: '12px', padding: '6px 4px',
          textDecoration: 'underline', textUnderlineOffset: '2px',
        }}
        title="Connect this race data to your own Claude or ChatGPT (Claude any plan; ChatGPT paid plans)">
        Connect your own AI
      </button>

      {showHelp && (
        <McpHelp
          url={MCP_URL}
          urlCopied={urlCopied}
          onCopyUrl={copyUrl}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}

function McpHelp({ url, urlCopied, onCopyUrl, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#12122a', border: '1px solid #26263f', borderRadius: '14px',
          maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
          padding: '22px', color: '#e8e8f0', fontSize: '14px', lineHeight: '1.55',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Connect your own AI</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: '20px', lineHeight: 1, padding: '2px 4px',
          }}>×</button>
        </div>

        <p style={{ color: '#9a9ab0', marginTop: 0, marginBottom: '14px' }}>
          This lets Claude or ChatGPT search the full race database live — ask things like
          “scenic races under 1h from Barcelona in October”. It’s a one-time setup, and works
          on Claude (including Free — one connector) or a paid ChatGPT plan that supports custom
          connectors. Details below.
        </p>

        <p style={{ color: '#9a9ab0', marginTop: 0, marginBottom: '14px' }}>
          <strong style={{ color: '#c9c9d6' }}>Even more with your training data.</strong>{' '}
          If you also connect a Strava or Garmin MCP to the same Claude or ChatGPT, it can
          join your recent training with these races and tell you whether you’re ready for a
          race and roughly what time you’d run — ask “Am I ready for this one, and what time
          would I run?”. Your training data stays in your AI; this connector never sees it.
        </p>

        <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '6px' }}>
          Server URL
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '18px' }}>
          <code style={{
            flex: 1, backgroundColor: '#0a0a14', border: '1px solid #26263f', borderRadius: '8px',
            padding: '9px 11px', fontSize: '12px', color: '#cccccc', wordBreak: 'break-all',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>{url}</code>
          <button onClick={onCopyUrl} style={{
            flexShrink: 0, padding: '0 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            backgroundColor: urlCopied ? '#064e3b' : '#2563eb', color: '#fff', fontWeight: 600, fontSize: '13px',
          }}>{urlCopied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <p style={{ color: '#62627a', fontSize: '12px', marginTop: '-12px', marginBottom: '18px' }}>
          Don’t open this URL in a browser — it’s not a web page. Paste it into the connector
          settings below.
        </p>

        <Section title="Claude (any plan — see Free / Team notes)">
          <ol style={{ margin: '6px 0 0', paddingLeft: '20px', listStyleType: 'decimal' }}>
            <li>On <strong>Pro or Max</strong>: open <strong>Settings → Connectors</strong>, click
              <strong> Add custom connector</strong>, paste the URL above and click <strong>Add</strong>.</li>
            <li>On <strong>Team or Enterprise</strong>, an <strong>Owner</strong> adds it first under
              <strong> Organization Settings → Connectors</strong>; then enable it from your own Connectors list.</li>
            <li>On <strong>Free</strong>, add it the same way — Free allows <strong>one</strong> custom connector.</li>
            <li>In a chat, enable the <strong>trail-catalunya</strong> tool and ask away.</li>
          </ol>
        </Section>

        <Section title="ChatGPT (a paid plan with Developer mode)">
          <ol style={{ margin: '6px 0 0', paddingLeft: '20px', listStyleType: 'decimal' }}>
            <li>Turn on <strong>Developer mode</strong> in ChatGPT settings (currently
              <strong> Settings → Apps → Advanced → Developer mode</strong>; the exact wording moves —
              look for “Developer mode” under Apps/Connectors).</li>
            <li>Add a new MCP server and paste the URL above.</li>
            <li>Start a chat with the connector enabled.</li>
          </ol>
        </Section>

        <div style={{
          marginTop: '16px', padding: '10px 12px', borderRadius: '8px',
          backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          color: '#d6b25a', fontSize: '13px',
        }}>
          On <strong>ChatGPT Free</strong>? Custom connectors aren’t available — use the
          <strong> Ask Claude</strong> / <strong>Ask ChatGPT</strong> buttons instead (no setup).
          On <strong>Claude Free</strong> you can add this as your one custom connector.
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</div>
      <div style={{ color: '#bcbcd0', fontSize: '13px' }}>{children}</div>
    </div>
  )
}
