import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNewsByTicker, getTickerInfo,getTickerHistory,getTickerPrices } from '../services/api'
import NewsCard from '../components/newscard'

import SentimentChart from '../components/SentimentChart'

function TickerPage() {
  const { symbol } = useParams()
  
  const navigate = useNavigate()
  const[history,setHistory] = useState([])
  const[prices,setPrices] =useState([])
  const [articles, setArticles]     = useState([])
  const [companyInfo, setCompanyInfo] = useState(null)  // ← NEW
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const avgSentiment = articles.length
    ? articles.reduce((sum, a) => sum + (a.sentiment || 0), 0) / articles.length
    : 0

  function getSignal(score) {
    if (score >= 0.5)  return { label: 'BULLISH',          color: 'var(--accent-green)' }
    if (score >= 0.1)  return { label: 'SLIGHTLY BULLISH', color: 'var(--accent-green)' }
    if (score > -0.1)  return { label: 'NEUTRAL',          color: 'var(--accent-yellow)' }
    if (score > -0.5)  return { label: 'SLIGHTLY BEARISH', color: 'var(--accent-red)' }
    return               { label: 'BEARISH',               color: 'var(--accent-red)' }
  }

  const signal = getSignal(avgSentiment)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Fetch both news AND company info simultaneously
        const [newsRes, infoRes] = await Promise.all([
          getNewsByTicker(symbol),
          getTickerInfo(symbol)
        ])
        if (!cancelled) {
          setArticles(newsRes.data)
          setCompanyInfo(infoRes.data)  // ← NEW
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load ticker news.')
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
const [newsRes, infoRes, historyRes, pricesRes] = await Promise.all([
    getNewsByTicker(symbol),
    getTickerInfo(symbol),
    getTickerHistory(symbol),
    getTickerPrices(symbol)
])
if (!cancelled) {
    setArticles(newsRes.data)
    setCompanyInfo(infoRes.data)
    setHistory(historyRes.data)
    setPrices(pricesRes.data)
}
    }

    load()
    return () => { cancelled = true }
  }, [symbol])

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
        Loading {symbol} intelligence...
      </p>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', paddingTop: '80px' }}>
      <p style={{ color: 'var(--accent-red)' }}>{error}</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          borderRadius: '8px',
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '24px'
        }}
      >
        ← Back to Dashboard
      </button>

{/* Company Info Header */}
{companyInfo && (
    <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {companyInfo.name}
            </h1>
            <span style={{
                fontSize: '0.75rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                padding: '3px 10px',
                borderRadius: '20px'
            }}>
                {companyInfo.sector}
            </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {companyInfo.description}
        </p>
    </div>
)}
      {/* ── TICKER STATS CARD ────────────────────────────────────── */}
      <div className="card" style={{
        marginBottom: '24px',
        borderLeft: `4px solid ${signal.color}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: 'var(--text-primary)'
            }}>
              {symbol}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {articles.length} article{articles.length !== 1 ? 's' : ''} tracked
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: signal.color
            }}>
              {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(3)}
            </div>
            <span className={`badge badge-${signal.label.toLowerCase().replace(' ', '-')}`}>
              {signal.label}
            </span>
          </div>
        </div>

        {articles.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>
              😊 {articles.filter(a => a.sentiment > 0.1).length} positive
            </span>
            <span style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
              😐 {articles.filter(a => a.sentiment >= -0.1 && a.sentiment <= 0.1).length} neutral
            </span>
            <span style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>
              😟 {articles.filter(a => a.sentiment < -0.1).length} negative
            </span>
          </div>
        )}
      </div>
{/* Sentiment History Chart */}
<div className="card" style={{ marginBottom: '24px' }}>
    <SentimentChart
        sentimentData={history}
        priceData={prices}
        ticker={symbol}
    />
</div>
      {/* ── NEWS ARTICLES ────────────────────────────────────────── */}
      <h2 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '16px'
      }}>
        Latest News
      </h2>

      {articles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: 'var(--text-muted)'
        }}>
          No articles found for {symbol}.
        </div>
      ) : (
        articles.map(article => (
          <NewsCard key={article.id} article={article} />
        ))
      )}
    </div>
  )
}

export default TickerPage