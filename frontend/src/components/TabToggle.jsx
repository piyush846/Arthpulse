import { useNavigate, useLocation } from 'react-router-dom'

function TabToggle() {
  const navigate = useNavigate()
  const location = useLocation()
  const isIndia = location.pathname === '/india'

  return (
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
        onClick={() => navigate('/')}
        style={{
          background: !isIndia ? 'var(--accent-blue)' : 'transparent',
          color: !isIndia ? 'white' : 'var(--text-muted)',
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
          background: isIndia ? '#FF9933' : 'transparent',
          color: isIndia ? 'white' : 'var(--text-muted)',
          border: 'none',
          borderRadius: '7px',
          padding: '8px 20px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.85rem',
          transition: 'all 0.15s ease'
        }}
      >
        🇮🇳 India
      </button>
    </div>
  )
}

export default TabToggle