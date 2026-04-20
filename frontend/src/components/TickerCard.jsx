import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlist'

function TickerCard({ ticker, avg_sentiment, article_count, signal, latest_title, momentum_label, momentum_color }) {
  const navigate = useNavigate()
  
  const [watched, setWatched] = useState(() => isInWatchlist(ticker))

  function toggleWatchlist(e) {
    e.stopPropagation()  // prevent navigating to ticker page
    if (watched) {
      removeFromWatchlist(ticker)
    } else {
      addToWatchlist(ticker)
    }
    setWatched(!watched)
  }

  function getColors(signal) {
    if (signal?.includes('BULLISH')) return {
      border: 'var(--accent-green)',
      bg: 'rgba(16,185,129,0.05)',
      score: 'var(--accent-green)'
    }
    if (signal?.includes('BEARISH')) return {
      border: 'var(--accent-red)',
      bg: 'rgba(239,68,68,0.05)',
      score: 'var(--accent-red)'
    }
    return {
      border: 'var(--accent-yellow)',
      bg: 'rgba(245,158,11,0.05)',
      score: 'var(--accent-yellow)'
    }
  }

  const colors = getColors(signal)

  // Shorten signal label for display
  function shortSignal(s) {
    if (!s) return 'NEUTRAL'
    if (s === 'SLIGHTLY BULLISH') return 'SL. BULLISH'
    if (s === 'SLIGHTLY BEARISH') return 'SL. BEARISH'
    return s
  }

  return (
    <div
      onClick={() => navigate(`/ticker/${ticker}`)}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}33`,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = colors.border
        e.currentTarget.style.boxShadow = `0 4px 20px ${colors.border}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header row — ticker + signal on same line */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          color: 'var(--text-primary)'
        }}>
          {ticker}
        </span>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: colors.border,
          background: `${colors.border}18`,
          padding: '2px 7px',
          borderRadius: '4px',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap'  // ← prevents wrapping
        }}>
          {shortSignal(signal)}
        </span>
      </div>

      {/* Sentiment score */}
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 800,
        color: colors.score,
        lineHeight: 1,
        marginBottom: '6px'
      }}>
        {avg_sentiment > 0 ? '+' : ''}{avg_sentiment?.toFixed(3)}
      </div>

      {/* Article count + momentum on same row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {article_count} articles
        </span>
        {momentum_label && (
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: momentum_color || 'var(--accent-yellow)'
          }}>
            {momentum_label}
          </span>
        )}
      </div>

      {/* Latest headline */}
      {latest_title && (
        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          borderTop: `1px solid ${colors.border}22`,
          paddingTop: '8px',
          marginTop: '4px'
        }}>
          {latest_title}
        </p>
      )}
    </div>
  )
}

export default TickerCard