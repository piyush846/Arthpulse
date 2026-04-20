import { useState, useEffect } from 'react'
import { getMarketBreadth } from '../services/api'

function MarketBreadthBar() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {/* Scrolling ticker tape */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',  // spread evenly across full width
        padding: '0 24px',
      }}>
        {data.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: '0 12px',
              borderRight: i < data.length - 1
                ? '1px solid var(--border)'
                : 'none',
            }}
          >
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}>
              {item.name}
            </span>
            <span style={{
              fontSize: '0.78rem',
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
              color: item.positive
                ? 'var(--accent-green)'
                : 'var(--accent-red)'
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