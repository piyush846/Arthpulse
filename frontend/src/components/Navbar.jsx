import { Link } from 'react-router-dom'
import { useState } from 'react'
import { triggerFetch } from '../services/api'
import { useWindowSize } from '../hooks/useWindowSize'

function Navbar() {
  const [refreshing, setRefreshing]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState(
    new Date().toLocaleTimeString()  // ← set initial value directly, no useEffect needed
  )
  const { isMobile } = useWindowSize()

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
      padding: isMobile ? '0 16px' : '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: 700,
          color: 'var(--text-primary)'
        }}>
          Arth<span style={{ color: 'var(--accent-blue)' }}>Pulse</span>
        </span>
        {!isMobile && (
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginLeft: '8px',
            letterSpacing: '0.1em'
          }}>
            FINANCIAL INTELLIGENCE
          </span>
        )}
      </Link>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '16px'
      }}>
        {!isMobile && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Updated: {lastUpdated}
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: refreshing ? 'var(--bg-tertiary)' : 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s ease'
          }}
        >
          {refreshing ? '...' : '⟳ Refresh'}
        </button>
      </div>
    </nav>
  )
}

export default Navbar