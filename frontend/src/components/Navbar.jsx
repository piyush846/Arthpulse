import { Link } from 'react-router-dom'
import { useState } from 'react'
import { triggerFetch } from '../services/api'

function Navbar() {
  const [refreshing, setRefreshing] = useState(false)
 

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await triggerFetch()
      
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

      {/* Left — Brand */}
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

      {/* Center — Last updated */}
     
      {/* Right — Refresh button only */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        style={{
          background: refreshing ? 'var(--bg-tertiary)' : 'transparent',
          color: refreshing ? 'var(--text-muted)' : 'var(--accent-blue)',
          border: `1px solid ${refreshing ? 'var(--border)' : 'var(--accent-blue)'}`,
          borderRadius: '8px',
          padding: '6px 16px',
          fontSize: '0.85rem',
          cursor: refreshing ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          transition: 'all 0.2s ease'
        }}
      >
        {refreshing ? 'Fetching...' : '⟳ Refresh'}
      </button>
    </nav>
  )
}

export default Navbar