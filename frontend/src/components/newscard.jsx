import SentimentBar from './SentimentBar'
import { Link } from 'react-router-dom'

function NewsCard({ article }) {
  const {
    title, description, url, source,
    published_at, sentiment, tickers,
    summary, image_url
  } = article

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

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
    <div className="card news-card" style={{ marginBottom: '12px' }}>
      <div className="news-card-inner">

        {/* Article image */}
        {image_url && (
        <a  
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-image-link"
          >
            <img
              src={image_url}
              alt={title}
              className="news-card-image"
              onError={e => e.target.style.display = 'none'}
            />
          </a>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--accent-blue)',
                fontWeight: 600
              }}>
                {source}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {formatDate(published_at)}
              </span>
            </div>
            <span className={`badge ${getSignalClass(sentiment)}`}>
              {getSignalLabel(sentiment)}
            </span>
          </div>

          {/* Title */}
          
          <a  href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              display: 'block',
              marginBottom: '6px',
              textDecoration: 'none'
            }}
          >
            {title}
          </a>

          {/* Summary or description */}
          {(summary || description) && (
            <p style={{
              fontSize: '0.8rem',
              color: summary ? 'var(--text-secondary)' : 'var(--text-muted)',
              lineHeight: '1.5',
              marginBottom: '8px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {summary || description}
            </p>
          )}

          {/* Tickers */}
          {tickers && tickers.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
              marginBottom: '8px'
            }}>
              {tickers.filter(t => t).map(ticker => (
                <Link
                  key={ticker}
                  to={`/ticker/${ticker}`}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    background: 'rgba(59,130,246,0.1)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                >
                  {ticker}
                </Link>
              ))}
            </div>
          )}

          <SentimentBar score={sentiment} />
        </div>
      </div>
    </div>
  )
}

export default NewsCard