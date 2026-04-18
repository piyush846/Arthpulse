// TickerCard.jsx
// Displays a single ticker with aggregated sentiment data.
// Clicking navigates to the TickerPage for that stock.
// Used in the ticker grid on the Dashboard.

import { useNavigate } from 'react-router-dom'


function TickerCard({ ticker, avg_sentiment, article_count, signal, latest_title, momentum_label, momentum_color }) {
  const navigate = useNavigate()

  // Color based on signal
  function getSignalColor(signal) {
    if (signal === 'BULLISH')           return 'var(--accent-green)'
    if (signal === 'SLIGHTLY BULLISH')  return 'var(--accent-green)'
    if (signal === 'SLIGHTLY BEARISH')  return 'var(--accent-red)'
    if (signal === 'BEARISH')           return 'var(--accent-red)'
    return 'var(--accent-yellow)'  // NEUTRAL
  }

  function getBadgeClass(signal) {
    if (signal === 'BULLISH')           return 'badge-bullish'
    if (signal === 'SLIGHTLY BULLISH')  return 'badge-slightly-bullish'
    if (signal === 'SLIGHTLY BEARISH')  return 'badge-slightly-bearish'
    if (signal === 'BEARISH')           return 'badge-bearish'
    return 'badge-neutral'
  }

  const color = getSignalColor(signal)

  return (
    <div
      className="card"
      onClick={() => navigate(`/ticker/${ticker}`)}
      style={{
        cursor: 'pointer',
        borderLeft: `3px solid ${color}`,  // colored left border = signal at a glance
        transition: 'transform 0.15s ease, border-color 0.2s ease',
      }}
      // Subtle lift on hover
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Header — ticker symbol + signal badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '0.05em'
        }}>
          {ticker}
        </span>
        <span className={`badge ${getBadgeClass(signal)}`}>
          {signal}
        </span>
      </div>

      {/* Sentiment score — big and prominent */}
      <div style={{
        fontSize: '1.6rem',
        fontWeight: 700,
        color,
        marginBottom: '4px'
      }}>
        {avg_sentiment > 0 ? '+' : ''}{avg_sentiment?.toFixed(3)}
      </div>

      {/* Article count */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '8px'
      }}>
        {article_count} article{article_count !== 1 ? 's' : ''}
      </div>
      {/* Momentum indicator */}
{momentum_label && (
    <div style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: momentum_color || 'var(--accent-yellow)',
        marginTop: '4px'
    }}>
        {momentum_label}
    </div>
)}

      {/* Latest headline — truncated to one line */}
      {latest_title && (
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',  // "..." when text is too long
        }}>
          {latest_title}
        </p>
      )}
    </div>
  )
}

export default TickerCard