// MarketBreadthBar.jsx
// Always-visible strip below navbar showing live market indicators.
// S&P 500, NASDAQ, DOW, VIX, OIL, GOLD, BTC
// Makes ArthPulse instantly look like a real financial platform.

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
    // Refresh every 5 minutes
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
      padding: '0 24px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      overflowX: 'auto',
      scrollbarWidth: 'none',  // hide scrollbar on Firefox
    }}>
      {data.map((item, i) => (
        <div
          key={item.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 16px',
            borderRight: i < data.length - 1
              ? '1px solid var(--border)'
              : 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {/* Name */}
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            {item.name}
          </span>

          {/* Price */}
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            {item.price > 1000
              ? item.price.toLocaleString()
              : item.price.toFixed(2)}
          </span>

          {/* Change */}
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
  )
}

export default MarketBreadthBar