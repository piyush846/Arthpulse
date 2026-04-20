// IndiaDashboard.jsx
// India-specific market intelligence dashboard.
// Shows Indian indices, stocks, news filtered to Indian markets.

import { useState, useEffect } from 'react'
import { getIndiaBreadth, getIndiaTickers, getIndiaNews, getIndiaMovers, getIndiaNarrative } from '../services/api'
import NewsCard from '../components/newscard'
import MarketNarrative from '../components/MarketNarrative'
import { useNavigate } from 'react-router-dom'

function IndiaDashboard() {
  const navigate = useNavigate()

  const [breadth, setBreadth]     = useState([])
  const [tickers, setTickers]     = useState([])
  const [articles, setArticles]   = useState([])
  const [movers, setMovers]       = useState({ bullish: [], bearish: [] })
  const [narrative, setNarrative] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [breadthRes, tickersRes, newsRes, moversRes, narrativeRes] =
        await Promise.all([
          getIndiaBreadth(),
          getIndiaTickers(),
          getIndiaNews(30, 0),
          getIndiaMovers(),
          getIndiaNarrative()
        ])
      setBreadth(breadthRes.data)
      setTickers(tickersRes.data)
      setArticles(newsRes.data)
      setMovers(moversRes.data)
      setNarrative(narrativeRes.data)
    } catch (err) {
      setError('Failed to load India market data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    const { getIndiaNews } = await import('../services/api')
    const res = await getIndiaNews(30, 0, searchQuery)
    setArticles(res.data)
  }

  async function handleClearSearch() {
    setSearchQuery('')
    setActiveFilter('ALL')
    const res = await getIndiaNews(30, 0)
    setArticles(res.data)
  }

  function filteredArticles() {
    if (activeFilter === 'ALL')      return articles
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

  function shortSignal(s) {
    if (!s) return 'NEUTRAL'
    if (s === 'SLIGHTLY BULLISH') return 'SL. BULLISH'
    if (s === 'SLIGHTLY BEARISH') return 'SL. BEARISH'
    return s
  }

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
        Loading India market intelligence...
      </p>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--accent-red)' }}>
      <p>{error}</p>
      <button onClick={fetchAll} style={{
        marginTop: '16px', background: 'var(--accent-blue)',
        color: 'white', border: 'none', borderRadius: '8px',
        padding: '10px 20px', cursor: 'pointer'
      }}>Retry</button>
    </div>
  )

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
      {/* Tab Toggle */}
<div style={{
  display: 'flex',
  gap: '4px',
  marginBottom: '24px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '4px',
  width: 'fit-content'
}}>
  <button
    style={{
      background: 'var(--accent-blue)',  // active = blue (Global page)
      color: 'white',
      border: 'none',
      borderRadius: '7px',
      padding: '8px 20px',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: '0.85rem',
      transition: 'all 0.15s ease'
    }}
  >
    🌍 Global
  </button>
  <button
    onClick={() => navigate('/india')}
    style={{
      background: 'transparent',
      color: 'var(--text-muted)',
      border: 'none',
      borderRadius: '7px',
      padding: '8px 20px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.85rem',
      transition: 'all 0.15s ease'
    }}
  >
    🇮🇳 India
  </button>
</div>

      {/* ── INDIA BREADTH BAR ───────────────────────────────── */}
      {breadth.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          {breadth.map((item, i) => (
            <div
              key={item.name}
              style={{
                flex: '1 1 120px',
                padding: '12px 16px',
                borderRight: i < breadth.length - 1
                  ? '1px solid var(--border)'
                  : 'none',
                textAlign: 'center'
              }}
            >
              <p style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                {item.name}
              </p>
              <p style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '2px'
              }}>
                {item.price > 1000
                  ? item.price.toLocaleString('en-IN')
                  : item.price.toFixed(2)}
              </p>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: item.positive
                  ? 'var(--accent-green)'
                  : 'var(--accent-red)'
              }}>
                {item.positive ? '▲' : '▼'} {Math.abs(item.change_pct).toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── INDIA MARKET NARRATIVE ──────────────────────────── */}
      <MarketNarrative narrative={narrative} />

      {/* ── INDIA TOP MOVERS ────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Bullish */}
        <div className="card">
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--accent-green)',
            letterSpacing: '0.1em', marginBottom: '12px'
          }}>
            🚀 TOP BULLISH — INDIA
          </p>
          {movers.bullish?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No data yet — more Indian news needed
            </p>
          ) : movers.bullish?.map((t, i) => (
            <div
              key={t.ticker}
              onClick={() => navigate(`/ticker/${t.ticker}`)}
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < movers.bullish.length - 1
                  ? '1px solid var(--border)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {t.ticker}
                </span>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis', maxWidth: '200px'
                }}>
                  {t.name}
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

        {/* Bearish */}
        <div className="card">
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--accent-red)',
            letterSpacing: '0.1em', marginBottom: '12px'
          }}>
            📉 TOP BEARISH — INDIA
          </p>
          {movers.bearish?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No data yet — more Indian news needed
            </p>
          ) : movers.bearish?.map((t, i) => (
            <div
              key={t.ticker}
              onClick={() => navigate(`/ticker/${t.ticker}`)}
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < movers.bearish.length - 1
                  ? '1px solid var(--border)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {t.ticker}
                </span>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis', maxWidth: '200px'
                }}>
                  {t.name}
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

      {/* ── INDIA TICKER GRID ───────────────────────────────── */}
      {tickers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            🇮🇳 Indian Stocks — {tickers.length} tracked
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {tickers.map(t => (
              <div
                key={t.ticker}
                onClick={() => navigate(`/ticker/${t.ticker}`)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${getSignalColor(t.signal)}`,
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {t.ticker}
                  </span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700,
                    color: getSignalColor(t.signal),
                    background: `${getSignalColor(t.signal)}18`,
                    padding: '2px 6px', borderRadius: '4px'
                  }}>
                    {shortSignal(t.signal)}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginBottom: '6px'
                }}>
                  {t.name}
                </p>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: getSignalColor(t.signal)
                }}>
                  {t.avg_sentiment > 0 ? '+' : ''}{t.avg_sentiment?.toFixed(3)}
                </div>
                <p style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  {t.sector} · {t.article_count} articles
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INDIA NEWS FEED ─────────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
          flexWrap: 'wrap', gap: '12px'
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            📰 India News — {filteredArticles().length} articles
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  background: activeFilter === f
                    ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: activeFilter === f ? 'white' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px',
                  padding: '6px 12px', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600
                }}
              >
                {f}
              </button>
            ))}

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search India news..."
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '6px 12px',
                  color: 'var(--text-primary)', fontSize: '0.82rem',
                  width: '180px', outline: 'none'
                }}
              />
              <button type="submit" style={{
                background: 'var(--accent-blue)', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600
              }}>🔍</button>
              {searchQuery && (
                <button type="button" onClick={handleClearSearch} style={{
                  background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  border: 'none', borderRadius: '8px',
                  padding: '6px 12px', cursor: 'pointer'
                }}>✕</button>
              )}
            </form>
          </div>
        </div>

        {filteredArticles().length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            color: 'var(--text-muted)'
          }}>  No India-specific articles found yet</div>):(
          filteredArticles().map(article =>(
          <newscard key ={article.id} article={article}/>
          ))
          )}
      </div>   {/* End of news section */}
    </div>    
  )
}

export default IndiaDashboard