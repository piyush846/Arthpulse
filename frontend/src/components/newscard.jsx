// NewsCard.jsx
// Displays a single news article with sentiment score.
// Used in the news feed on Dashboard and TickerPage.

import SentimentBar from './SentimentBar'
import { Link } from 'react-router-dom'

function NewsCard({ article }) {
  const { title, description, url, source, published_at, sentiment, tickers } = article

  // Format date — "Apr 17, 2026 10:30 AM"
  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return '' }
  }

  // Sentiment label for badge
  function getSignalClass(score) {
    if (score === null || score === undefined) return 'badge-neutral'
    if (score >= 0.5)  return 'badge-bullish'
    if (score >= 0.1)  return 'badge-slightly-bullish'
    if (score > -0.1)  return 'badge-neutral'
    if (score > -0.5)  return 'badge-slightly-bearish'
    return 'badge-bearish'
  }

  function getSignalLabel(score) {
    if (score === null || score === undefined) return 'Unscored'
    if (score >= 0.5)  return 'Bullish'
    if (score >= 0.1)  return 'Sl. Bullish'
    if (score > -0.1)  return 'Neutral'
    if (score > -0.5)  return 'Sl. Bearish'
    return 'Bearish'
  }

  return (
    <div className="card" style={{ marginBottom: '12px' }}>

      {/* Header — source + date + signal badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--accent-blue)',
            fontWeight: 600
          }}>
            {source}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatDate(published_at)}
          </span>
        </div>
        <span className={`badge ${getSignalClass(sentiment)}`}>
          {getSignalLabel(sentiment)}
        </span>
      </div>

      {/* Title — clicking opens original article */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          display: 'block',
          marginBottom: '6px'
        }}
      >
        {title}
      </a>

      {/* Description */}
      {description && (
        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          marginBottom: '10px',
          // Clamp to 2 lines
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {description}
        </p>
      )}

      {/* Tickers — clicking navigates to that ticker's page */}
      {tickers && tickers.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '10px'
        }}>
          {tickers.filter(t => t).map(ticker => (
            <Link
              key={ticker}
              to={`/ticker/${ticker}`}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-blue)',
                background: 'rgba(59,130,246,0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              {ticker}
            </Link>
          ))}
        </div>
      )}

      {/* Sentiment bar */}
      <SentimentBar score={sentiment} />
    </div>
  )
}

export default NewsCard