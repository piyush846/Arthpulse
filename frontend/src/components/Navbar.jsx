import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { triggerFetch } from '../services/api'

function Navbar() {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')

 

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await triggerFetch()
      setLastUpdated(new Date().toLocaleTimeString())
      window.location.reload()
    } catch (err) {
      console.error("Refresh failed:", err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* Brand */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          Arth<span style={{ color: 'var(--accent-blue)' }}>Pulse</span>
        </span>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginLeft: '8px',
          letterSpacing: '0.1em'
        }}>
          FINANCIAL INTELLIGENCE
        </span>
      </Link>

      {/* Right side — last updated + refresh */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Last updated — now in navbar */}
        {lastUpdated && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            Updated: {lastUpdated}
          </span>
        )}

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: refreshing
              ? 'var(--bg-tertiary)'
              : 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s ease'
          }}
        >
          {refreshing ? 'Fetching...' : '⟳ Refresh'}
        </button>
      </div>
    </nav>
  )
}

export default Navbar