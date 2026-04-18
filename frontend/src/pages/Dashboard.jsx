// Dashboard.jsx
// Main page of ArthPulse — the first thing users see.
//
// THREE SECTIONS:
// 1. Stats Bar    — overall market sentiment, article counts
// 2. Ticker Grid  — all tickers with sentiment signals
// 3. News Feed    — latest scored articles with search

import { useState, useEffect } from 'react'
import { getDashboard, getTickers, getNews } from '../services/api'
import TickerCard from '../components/TickerCard'
import NewsCard from '../components/newscard'

function Dashboard() {
  // Three separate state variables — one per API call
  const [stats, setStats]       = useState(null)
  const [tickers, setTickers]   = useState([])
  const [articles, setArticles] = useState([])

  // Loading and error states for good UX
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching]     = useState(false)

  // Fetch all data on first render
  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    setError(null)
    try {
      // Run all three API calls simultaneously — faster than sequential
      // Promise.all waits for ALL three to finish before continuing
      const [dashRes, tickersRes, newsRes] = await Promise.all([
        getDashboard(),
        getTickers(),
        getNews(20, 0)
      ])
      setStats(dashRes.data)
      setTickers(tickersRes.data)
      setArticles(newsRes.data)
    } catch (err) {
      setError('Failed to load data. Is the backend running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Search handler — calls /api/news?q=keyword
  async function handleSearch(e) {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await getNews(20, 0, searchQuery)
      setArticles(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  // Clear search — reload all articles
  async function handleClearSearch() {
    setSearchQuery('')
    const res = await getNews(20, 0)
    setArticles(res.data)
  }

  // Signal → color mapping for stats bar
  function getSignalColor(signal) {
    if (!signal) return 'var(--accent-yellow)'
    if (signal.includes('BULLISH')) return 'var(--accent-green)'
    if (signal.includes('BEARISH')) return 'var(--accent-red)'
    return 'var(--accent-yellow)'
  }

  // ─── LOADING STATE ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
        Loading market intelligence...
      </p>
    </div>
  )

  // ─── ERROR STATE ──────────────────────────────────────────────────
  if (error) return (
    <div style={{
      textAlign: 'center',
      paddingTop: '80px',
      color: 'var(--accent-red)'
    }}>
      <p style={{ fontSize: '1.2rem' }}>⚠ {error}</p>
      <button
        onClick={fetchAllData}
        style={{
          marginTop: '16px',
          background: 'var(--accent-blue)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          cursor: 'pointer'
        }}
      >
        Retry
      </button>
    </div>
  )

  // ─── MAIN RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

      {/* ── SECTION 1: STATS BAR ────────────────────────────────── */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>

          {/* Overall Signal */}
          <div className="card" style={{
            borderTop: `3px solid ${getSignalColor(stats.signal)}`
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              MARKET SIGNAL
            </p>
            <p style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: getSignalColor(stats.signal)
            }}>
              {stats.signal}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Score: {stats.overall_sentiment > 0 ? '+' : ''}{stats.overall_sentiment?.toFixed(3)}
            </p>
          </div>

          {/* Total Articles */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              TOTAL ARTICLES
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {stats.total_articles}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Across all sources
            </p>
          </div>

          {/* Sentiment Breakdown */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              SENTIMENT SPLIT
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                😊 {stats.positive_count}
              </span>
              <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>
                😐 {stats.neutral_count}
              </span>
              <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>
                😟 {stats.negative_count}
              </span>
            </div>
          </div>

          {/* Most Bullish */}
          {stats.most_bullish && (
            <div className="card" style={{ borderTop: '3px solid var(--accent-green)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                MOST BULLISH
              </p>
              <a
                href={stats.most_bullish.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-green)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {stats.most_bullish.title}
              </a>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                +{stats.most_bullish.sentiment?.toFixed(3)}
              </p>
            </div>
          )}

          {/* Most Bearish */}
          {stats.most_bearish && (
            <div className="card" style={{ borderTop: '3px solid var(--accent-red)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                MOST BEARISH
              </p>
              <a
                href={stats.most_bearish.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-red)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {stats.most_bearish.title}
              </a>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats.most_bearish.sentiment?.toFixed(3)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: TICKER GRID ──────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          Ticker Signals — {tickers.length} tracked
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {tickers.map(t => (
            <TickerCard
              key={t.ticker}
              ticker={t.ticker}
              avg_sentiment={t.avg_sentiment}
              article_count={t.article_count}
              signal={t.signal}
              latest_title={t.latest_title}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION 3: NEWS FEED + SEARCH ───────────────────────── */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            News Feed — {articles.length} articles
          </h2>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '220px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              {searching ? '...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Articles list */}
        {articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No articles found.
          </div>
        ) : (
          articles.map(article => (
            <NewsCard key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard