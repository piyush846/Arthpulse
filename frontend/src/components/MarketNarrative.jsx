function MarketNarrative({ narrative }) {
  if (!narrative || narrative.length === 0) return null

  function getColor(color) {
    if (color === 'green')  return 'var(--accent-green)'
    if (color === 'red')    return 'var(--accent-red)'
    return 'var(--accent-yellow)'
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '10px', marginBottom: '16px'
      }}>
        <div style={{
          width: '3px', height: '20px',
          background: 'var(--accent-blue)', borderRadius: '2px'
        }} />
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          🧠 Market Narrative — What's driving markets today
        </p>
      </div>

      <div className="narrative-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px'
      }}>
        {narrative.map((theme) => (
          <div key={theme.theme} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderTop: `3px solid ${getColor(theme.direction_color)}`,
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>{theme.icon}</span>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: 'var(--text-primary)', lineHeight: '1.2'
                }}>
                  {theme.theme}
                </span>
              </div>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700,
                color: getColor(theme.direction_color),
                background: `${getColor(theme.direction_color)}18`,
                padding: '2px 7px', borderRadius: '4px',
                whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {theme.direction}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px', marginBottom: '12px'
            }}>
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  DOMINANCE
                </p>
                <p style={{
                  fontSize: '1rem', fontWeight: 800,
                  color: getColor(theme.direction_color)
                }}>
                  {theme.dominance}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  ARTICLES
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {theme.article_count}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  SENTIMENT
                </p>
                <p style={{
                  fontSize: '1rem', fontWeight: 800,
                  color: getColor(theme.direction_color)
                }}>
                  {theme.avg_sentiment > 0 ? '+' : ''}{theme.avg_sentiment?.toFixed(3)}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)', paddingTop: '8px',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: '1.4'
            }}>
              {theme.top_headline}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketNarrative