import { useState, useEffect } from 'react'
import { getMarketBreadth } from '../services/api'

function MarketBreadthBar() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getMarketBreadth()
        if (!cancelled) setData(res.data)
      } catch (err) {
        console.error('Breadth bar error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
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
      height: '36px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        paddingLeft: '24px',
        minWidth: '100%',
        justifyContent:'flex-end'
      }}>
        {data.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              padding: '0 16px',
              height: '36px',
              borderRight: i < data.length - 1
                ? '1px solid var(--border)'
                : 'none',
            }}
          >
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.04em'
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