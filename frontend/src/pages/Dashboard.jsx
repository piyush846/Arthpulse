// Dashboard.jsx
// ═══════════════════════════════════════════════════════════════
// ArthPulse main dashboard — fully featured fintech UI
// Sections:
// 1. Header stats bar — market signal, counts, fear/greed
// 2. Top Movers — most bullish and bearish tickers
// 3. Sector breakdown — bar chart by sector
// 4. Trending keywords — topic cloud with sentiment
// 5. Ticker grid — all tracked tickers
// 6. News feed — with search and filtering
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { getDashboard, getTickers, getNews, getSectors, getTrending, getMovers ,getNarrative} from '../services/api'
import TickerCard from '../components/TickerCard'
import NewsCard from '../components/newscard'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import MarketNarrative from '../components/MarketNarrative'
import SentimentTimeline from '../components/SentimentTimeline'
import Watchlist from '../components/Watchlist'
import AlertsPanel from '../components/AlertsPanel'
import { checkAlerts } from '../services/watchlist'
import TabToggle from '../components/TabToggle'
function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats]       = useState(null)
  const [tickers, setTickers]   = useState([])
  const [narrative, setNarrative] = useState([])
  const [articles, setArticles] = useState([])
  const [sectors, setSectors]   = useState([])
  const [trending, setTrending] = useState([])
  const [movers, setMovers]     = useState({ bullish: [], bearish: [] })

  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching]     = useState(false)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [triggeredAlerts, setTriggeredAlerts] = useState([])

  useEffect(() => { fetchAllData() }, [])

  async function fetchAllData() {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, tickersRes, newsRes, sectorsRes, trendingRes, moversRes,narrativeRes] =
        await Promise.all([
          getDashboard(),
          getTickers(),
          getNews(30, 0),
          getSectors(),
          getTrending(),
          getMovers(),
          getNarrative()
        ])
      setStats(dashRes.data)
      setTickers(tickersRes.data)
      const triggered = checkAlerts(tickersRes.data)
setTriggeredAlerts(triggered)
      setArticles(newsRes.data)
      setSectors(sectorsRes.data)
      setTrending(trendingRes.data)
      setMovers(moversRes.data)
      
      setNarrative(narrativeRes.data)
    } catch (err) {
      setError('Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    setSearching(true)
    try {
      const { getNews } = await import('../services/api')
      const res = await getNews(30, 0, searchQuery)
      setArticles(res.data)
    } finally {
      setSearching(false)
    }
  }

  async function handleClearSearch() {
    setSearchQuery('')
    setActiveFilter('ALL')
    const res = await getNews(30, 0)
    setArticles(res.data)
  }

  // Filter articles by sentiment signal
  function filteredArticles() {
    if (activeFilter === 'ALL') return articles
    if (activeFilter === 'POSITIVE') return articles.filter(a => a.sentiment > 0.1)
    if (activeFilter === 'NEGATIVE') return articles.filter(a => a.sentiment < -0.1)
    if (activeFilter === 'NEUTRAL')  return articles.filter(a => a.sentiment >= -0.1 && a.sentiment <= 0.1)
    return articles
  }

  function getSignalColor(signal) {
    if (!signal) return 'var(--accent-yellow)'
    if (signal.includes('BULLISH')) return 'var(--accent-green)'
    if (signal.includes('BEARISH')) return 'var(--accent-red)'
    return 'var(--accent-yellow)'
  }

  // Fear/Greed score — 0 to 100 based on overall sentiment
  function getFearGreed(score) {
    const value = Math.round(((score + 1) / 2) * 100)
    if (value >= 75) return { value, label: 'Extreme Greed', color: 'var(--accent-green)' }
    if (value >= 55) return { value, label: 'Greed',         color: 'var(--accent-green)' }
    if (value >= 45) return { value, label: 'Neutral',       color: 'var(--accent-yellow)' }
    if (value >= 25) return { value, label: 'Fear',          color: 'var(--accent-red)' }
    return                  { value, label: 'Extreme Fear',  color: 'var(--accent-red)' }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
        Loading market intelligence...
      </p>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--accent-red)' }}>
      <p style={{ fontSize: '1.2rem' }}>⚠ {error}</p>
      <button onClick={fetchAllData} style={{
        marginTop: '16px', background: 'var(--accent-blue)',
        color: 'white', border: 'none', borderRadius: '8px',
        padding: '10px 20px', cursor: 'pointer'
      }}>Retry</button>
    </div>
  )

  const fearGreed = stats ? getFearGreed(stats.overall_sentiment) : null

  return (
  <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
{/* Tab Toggle */}
<TabToggle/>
{/* Watchlist */}
<Watchlist allTickers={tickers} />

{/* Alerts Panel */}
<AlertsPanel
    allTickers={tickers}
    triggeredAlerts={triggeredAlerts}
/>
    {/* ── MARKET OVERVIEW ─────────────────────────────────── */}
    <MarketNarrative narrative={narrative} />

    {/* ── TIMELINE & REFRESH ──────────────────────────────── */}
    <div style={{ display: 'flex', width:'100%',alignItems: 'center', marginBottom: '24px' }}>
      <SentimentTimeline />
      
      {/* The Refresh button now lives inside a proper wrapper */}
      
    </div>
       {/* Market Narrative — first thing users see */}

      {/* ── SECTION 1: STATS BAR ─────────────────────────────── */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>

          {/* Market Signal */}
          <div className="card" style={{
            borderTop: `3px solid ${getSignalColor(stats.signal)}`
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
              MARKET SIGNAL
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: getSignalColor(stats.signal) }}>
              {stats.signal}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Score: {stats.overall_sentiment > 0 ? '+' : ''}{stats.overall_sentiment?.toFixed(3)}
            </p>
          </div>

          {/* Fear/Greed Meter */}
          {fearGreed && (
            <div className="card" style={{ borderTop: `3px solid ${fearGreed.color}` }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                FEAR / GREED
              </p>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: fearGreed.color }}>
                {fearGreed.value} — {fearGreed.label}
              </p>
              {/* Progress bar */}
              <div style={{
                marginTop: '8px', height: '4px',
                background: 'var(--bg-tertiary)', borderRadius: '2px'
              }}>
                <div style={{
                  width: `${fearGreed.value}%`, height: '100%',
                  background: fearGreed.color, borderRadius: '2px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}

          {/* Article Stats */}
          <div className="card">
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
              ARTICLES TODAY
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {stats.total_articles}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>
                😊 {stats.positive_count}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)' }}>
                😐 {stats.neutral_count}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                😟 {stats.negative_count}
              </span>
            </div>
          </div>

          {/* Most Bullish */}
          {stats.most_bullish && (
            <div className="card" style={{ borderTop: '3px solid var(--accent-green)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                🚀 MOST BULLISH
              </p>
              <a href={stats.most_bullish.url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem', color: 'var(--accent-green)',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                {stats.most_bullish.title}
              </a>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                +{stats.most_bullish.sentiment?.toFixed(3)}
              </p>
            </div>
          )}

          {/* Most Bearish */}
          {stats.most_bearish && (
            <div className="card" style={{ borderTop: '3px solid var(--accent-red)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                📉 MOST BEARISH
              </p>
              <a href={stats.most_bearish.url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem', color: 'var(--accent-red)',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                {stats.most_bearish.title}
              </a>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {stats.most_bearish.sentiment?.toFixed(3)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: TOP MOVERS ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '32px'
      }}>

        {/* Top Bullish */}
        <div className="card">
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--accent-green)', letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            🚀 TOP BULLISH MOVERS
          </p>
          {movers.bullish?.map((t, i) => (
            <div
              key={t.ticker}
              onClick={() => navigate(`/ticker/${t.ticker}`)}
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < movers.bullish.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.ticker}</span>
                <p style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis', maxWidth: '180px'
                }}>
                  {t.latest_title}
                </p>
              </div>
              <span style={{
                color: 'var(--accent-green)',
                fontWeight: 700, fontSize: '0.9rem'
              }}>
                +{t.avg_sentiment?.toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        {/* Top Bearish */}
        <div className="card">
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--accent-red)', letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            📉 TOP BEARISH MOVERS
          </p>
          {movers.bearish?.map((t, i) => (
            <div
              key={t.ticker}
              onClick={() => navigate(`/ticker/${t.ticker}`)}
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < movers.bearish.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.ticker}</span>
                <p style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis', maxWidth: '180px'
                }}>
                  {t.latest_title}
                </p>
              </div>
              <span style={{
                color: 'var(--accent-red)',
                fontWeight: 700, fontSize: '0.9rem'
              }}>
                {t.avg_sentiment?.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: SECTOR BREAKDOWN ──────────────────────── */}
      {sectors.length > 0 && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: '16px'
          }}>
            📊 Sector Sentiment Breakdown
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectors} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" vertical={false} />
              <XAxis
                dataKey="sector"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v > 0 ? `+${v}` : v}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}
                formatter={(value) => [
                  (value > 0 ? '+' : '') + value?.toFixed(4),
                  'Avg Sentiment'
                ]}
              />
              <Bar dataKey="avg_sentiment" radius={[4, 4, 0, 0]}>
                {sectors.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.avg_sentiment >= 0
                      ? 'var(--accent-green)'
                      : 'var(--accent-red)'
                    }
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── SECTION 4: TRENDING KEYWORDS ─────────────────────── */}
      {trending.length > 0 && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: '16px'
          }}>
            🔥 Trending Topics
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {trending.map(item => {
              const color = item.avg_sentiment > 0.1
                ? 'var(--accent-green)'
                : item.avg_sentiment < -0.1
                ? 'var(--accent-red)'
                : 'var(--accent-yellow)'

              // Size based on count — more mentions = bigger
              const size = Math.min(1.2, 0.75 + item.count * 0.08)

              return (
                <span
                  key={item.keyword}
                  onClick={() => {
                    setSearchQuery(item.keyword)
                    getNews(30, 0, item.keyword).then(res => setArticles(res.data))
                  }}
                  style={{
                    fontSize: `${size}rem`,
                    color,
                    background: 'var(--bg-tertiary)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: item.count > 3 ? 700 : 400,
                    border: `1px solid ${color}22`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.keyword}
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginLeft: '4px'
                  }}>
                    {item.count}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 5: TICKER GRID ───────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-secondary)', letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: '16px'
        }}>
          📈 Ticker Signals — {tickers.length} tracked
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
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
    momentum_label={t.momentum_label}
    momentum_color={t.momentum_color}
/>
          ))}
        </div>
      </div>

      {/* ── SECTION 6: NEWS FEED ─────────────────────────────── */}
      <div>
        {/* Header + search + filters */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
          flexWrap: 'wrap', gap: '12px'
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)', letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            📰 News Feed — {filteredArticles().length} articles
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Sentiment filters */}
            {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  background: activeFilter === f ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: activeFilter === f ? 'white' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px',
                  padding: '6px 12px', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600
                }}
              >
                {f}
              </button>
            ))}

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '6px 12px',
                  color: 'var(--text-primary)', fontSize: '0.82rem',
                  width: '180px', outline: 'none'
                }}
              />
              <button type="submit" disabled={searching} style={{
                background: 'var(--accent-blue)', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600
              }}>
                {searching ? '...' : '🔍'}
              </button>
              {searchQuery && (
                <button type="button" onClick={handleClearSearch} style={{
                  background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  border: 'none', borderRadius: '8px',
                  padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem'
                }}>
                  ✕
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Articles */}
        {filteredArticles().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No articles found.
          </div>
        ) : (
          filteredArticles().map(article => (
            <NewsCard key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard