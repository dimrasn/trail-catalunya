'use client'

import { useState, useRef, useEffect } from 'react'

function ChatBubble({ onClick, unread }) {
  return (
    <button
      data-testid="chat-bubble"
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
        zIndex: 50,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unread && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          border: '2px solid #0a0a14',
        }} />
      )}
    </button>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '10px',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        backgroundColor: isUser ? '#2563eb' : '#1a1a2e',
        color: isUser ? '#ffffff' : '#cccccc',
        fontSize: '14px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
      <div style={{
        padding: '12px 16px',
        borderRadius: '16px 16px 16px 4px',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#555',
              display: 'inline-block',
              animation: `typing 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
            30% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return <ChatBubble onClick={() => setIsOpen(true)} />
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 49,
        }}
      />

      {/* Chat panel */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '100%',
        maxWidth: '420px',
        height: '70vh',
        maxHeight: '600px',
        backgroundColor: '#0a0a14',
        borderTop: '1px solid #1a1a2e',
        borderLeft: '1px solid #1a1a2e',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1a1a2e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
              Trail Assistant
            </span>
            <span style={{ fontSize: '11px', color: '#555', marginLeft: '8px' }}>
              powered by Claude
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              color: '#555',
              fontSize: '13px',
              marginTop: '40px',
              lineHeight: '1.6',
            }}>
              <p style={{ fontSize: '24px', marginBottom: '12px' }}>&#x1f3d4;&#xfe0f;</p>
              <p>Ask me about trail races in Catalunya!</p>
              <p style={{ marginTop: '8px', color: '#444' }}>
                Try: &quot;Races under 1h drive with kids run&quot;
                <br />
                or &quot;What ultra trails are in Girona?&quot;
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#2d1215',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '10px',
            }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #1a1a2e',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about races..."
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #1a1a2e',
              backgroundColor: '#12122a',
              color: '#ffffff',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.4',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: loading || !input.trim() ? '#1a1a2e' : '#2563eb',
              color: loading || !input.trim() ? '#555' : '#ffffff',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
