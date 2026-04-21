import { useState, useEffect } from 'react'
import { getMarketBreadth } from '../services/api'
import { useWindowSize } from '../hooks/useWindowSize'

function MarketBreadthBar() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const { isMobile }          = useWindowSize()

  useEffect(() => {
    async function load() {
      try {
        const res = await getMarketBreadth()
        setData(res.data)
      } catch (err) {
        console.error('Breadth bar error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading || data.length === 0) return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      height: '36px'
    }} />
  )

  // On mobile show only most important indicators
  const displayData = isMobile
    ? data.filter(d => ['S&P 500', 'NIFTY 50', 'SENSEX', 'BTC'].includes(d.name))
    : data

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      height: isMobile ? 'auto' : '36px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        padding: isMobile ? '8px 12px' : '0 24px',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '8px' : '0',
        minHeight: '36px',
      }}>
        {displayData.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: isMobile ? '0' : '0 12px',
              borderRight: (!isMobile && i < displayData.length - 1)
                ? '1px solid var(--border)'
                : 'none',
            }}
          >
            <span style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}>
              {item.name}
            </span>
            <span style={{
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {item.price > 1000
                ? item.price.toLocaleString()
                : item.price.toFixed(2)}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: item.positive ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              {item.positive ? '▲' : '▼'} {Math.abs(item.change_pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketBreadthBar