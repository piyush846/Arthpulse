// Watchlist.jsx
// Shows pinned tickers at top of dashboard.
// User can add/remove tickers from watchlist.

import { useState, useEffect } from 'react'
import { getWatchlist, removeFromWatchlist } from '../services/watchlist'
import { useNavigate } from 'react-router-dom'

function Watchlist({ allTickers }) {
  const navigate = useNavigate()
 const [watchlist, setWatchlist] = useState(() => getWatchlist())

  function handleRemove(ticker) {
    removeFromWatchlist(ticker)
    setWatchlist(getWatchlist())
  }

  // Get full ticker data for watchlisted tickers
  const watchlistData = watchlist
    .map(symbol => allTickers.find(t => t.ticker === symbol))
    .filter(Boolean)

  if (watchlist.length === 0) return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <p style={{
        fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: '8px'
      }}>
        ⭐ Watchlist
      </p>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        No tickers in watchlist yet. Click ★ on any ticker card to add it.
      </p>
    </div>
  )

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <p style={{
        fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: '16px'
      }}>
        ⭐ Watchlist — {watchlist.length} tickers
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '10px'
      }}>
        {watchlistData.map(t => {
          const color = t.signal?.includes('BULLISH')
            ? 'var(--accent-green)'
            : t.signal?.includes('BEARISH')
            ? 'var(--accent-red)'
            : 'var(--accent-yellow)'

          return (
            <div
              key={t.ticker}
              style={{
                background: 'var(--bg-tertiary)',
                border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '8px',
                padding: '10px 12px',
                position: 'relative'
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => handleRemove(t.ticker)}
                style={{
                  position: 'absolute',
                  top: '6px', right: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px'
                }}
              >
                ✕
              </button>

              {/* Ticker */}
              <div
                onClick={() => navigate(`/ticker/${t.ticker}`)}
                style={{ cursor: 'pointer' }}
              >
                <p style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  marginBottom: '4px'
                }}>
                  {t.ticker}
                </p>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color
                }}>
                  {t.avg_sentiment > 0 ? '+' : ''}{t.avg_sentiment?.toFixed(3)}
                </p>
                <p style={{
                  fontSize: '0.68rem',
                  color,
                  marginTop: '2px'
                }}>
                  {t.signal}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Watchlist