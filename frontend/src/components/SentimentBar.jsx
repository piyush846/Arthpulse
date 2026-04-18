// SentimentBar.jsx
// Visual bar that shows sentiment score from -1.0 to +1.0
// Used inside NewsCard and TickerCard components.
//
// HOW IT WORKS:
// Score range is -1.0 to +1.0 (total width = 2.0)
// We convert score to a percentage position on the bar:
//   -1.0 → 0%   (far left, red)
//    0.0 → 50%  (center, yellow)
//   +1.0 → 100% (far right, green)

function SentimentBar({ score }) {
  if (score === null || score === undefined) return null

  // Convert -1 to +1 range → 0% to 100%
  const percentage = ((score + 1) / 2) * 100

  // Color based on score
  const color = score > 0.1
    ? 'var(--accent-green)'
    : score < -0.1
    ? 'var(--accent-red)'
    : 'var(--accent-yellow)'

  return (
    <div style={{ marginTop: '8px' }}>

      {/* Score label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Sentiment
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>
          {score > 0 ? '+' : ''}{score?.toFixed(2)}
        </span>
      </div>

      {/* Background track */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'var(--bg-tertiary)',
        borderRadius: '2px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Center marker — shows where 0 is */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '1px',
          height: '100%',
          background: 'var(--text-muted)',
          zIndex: 1
        }} />

        {/* Filled portion — moves based on score */}
        <div style={{
          position: 'absolute',
          left: score >= 0 ? '50%' : `${percentage}%`,
          width: `${Math.abs(score) * 50}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Min/Max labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '2px'
      }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bearish</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bullish</span>
      </div>
    </div>
  )
}

export default SentimentBar