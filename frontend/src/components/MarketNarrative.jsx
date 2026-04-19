// MarketNarrative.jsx
// Shows the 3-4 forces driving the market today.
// The most important section of the dashboard.

function MarketNarrative({ narrative }) {
  if (!narrative || narrative.length === 0) return null

  function getColor(color) {
    if (color === 'green')  return 'var(--accent-green)'
    if (color === 'red')    return 'var(--accent-red)'
    return 'var(--accent-yellow)'
  }

  function getBg(color) {
    if (color === 'green')  return 'var(--bg-secondary)'
    if (color === 'red')    return 'var(--bg-secondary)'
    return 'var(--bg-secondary)'
}

  return (
    <div style={{ marginBottom: '32px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '3px', height: '20px',
          background: 'var(--accent-blue)',
          borderRadius: '2px'
        }} />
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }}>
          🧠 Market Narrative — What's driving markets today
        </p>
      </div>

      {/* Theme cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px'
      }}>
        {narrative.map((theme, i) => (
          <div
            key={theme.theme}
            style={{
              background: getBg(theme.direction_color),
              border: `1px solid ${getColor(theme.direction_color)}22`,
              borderLeft: `3px solid ${getColor(theme.direction_color)}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            {/* Theme header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <div>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>
                  {theme.icon}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  {theme.theme}
                </span>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: getColor(theme.direction_color),
                background: `${getColor(theme.direction_color)}18`,
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                {theme.direction}
              </span>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '10px'
            }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  DOMINANCE
                </p>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: getColor(theme.direction_color)
                }}>
                  {theme.dominance}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  ARTICLES
                </p>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
                }}>
                  {theme.article_count}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  SENTIMENT
                </p>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: getColor(theme.direction_color)
                }}>
                  {theme.avg_sentiment > 0 ? '+' : ''}{theme.avg_sentiment?.toFixed(3)}
                </p>
              </div>
            </div>

            {/* Top headline */}
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              borderTop: `1px solid ${getColor(theme.direction_color)}22`,
              paddingTop: '8px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              "{theme.top_headline}"
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketNarrative