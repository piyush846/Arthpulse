// Navbar.jsx
// Top navigation bar — appears on every page.
// Shows the ArthPulse brand and a manual refresh button.

import { Link } from 'react-router-dom'
import { useState } from 'react'
import { triggerFetch } from '../services/api'

function Navbar() {
  const [refreshing, setRefreshing] = useState(false)

  // Calls /api/fetch on backend — triggers fresh news fetch manually
  async function handleRefresh() {
    setRefreshing(true)
    try {
      await triggerFetch()
      // Reload page after fetch so new articles appear
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
      zIndex: 100,   // stays above all other content
    }}>

      {/* Brand — clicking takes you back to dashboard */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Live Market Intelligence
        </span>

        {/* Manual refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: refreshing ? 'var(--bg-tertiary)' : 'var(--accent-blue)',
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