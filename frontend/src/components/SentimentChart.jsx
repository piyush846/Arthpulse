// SentimentChart.jsx
// Line chart showing sentiment history for a ticker over time.
// Uses Recharts — already installed.

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'

// Custom tooltip — shows when hovering over a data point
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const score = payload[0].value
  const color = score > 0.1
    ? 'var(--accent-green)'
    : score < -0.1
    ? 'var(--accent-red)'
    : 'var(--accent-yellow)'

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color, fontWeight: 700, fontSize: '1rem' }}>
        {score > 0 ? '+' : ''}{score?.toFixed(4)}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
        {payload[0].payload.article_count} articles
      </p>
    </div>
  )
}

function SentimentChart({ data, ticker }) {
  if (!data || data.length === 0) return (
    <div style={{
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }}>
      Not enough historical data yet.
      Check back after a few fetch cycles.
    </div>
  )

  // Color the line based on latest sentiment
  const latest = data[data.length - 1]?.avg_sentiment || 0
  const lineColor = latest > 0.1
    ? 'var(--accent-green)'
    : latest < -0.1
    ? 'var(--accent-red)'
    : 'var(--accent-yellow)'

  return (
    <div>
      <h3 style={{
        fontSize: '0.85rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '16px'
      }}>
        Sentiment History — {ticker}
      </h3>

      {/* ResponsiveContainer makes chart fill its parent width */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>

          {/* Grid lines */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--bg-tertiary)"
            vertical={false}
          />

          {/* X axis — dates */}
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            // Show only last 4 chars of date (e.g. "4-17" from "2026-04-17")
            tickFormatter={d => d.slice(5)}
          />

          {/* Y axis — sentiment score */}
          <YAxis
            domain={[-1, 1]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v > 0 ? `+${v}` : v}
          />

          {/* Custom tooltip on hover */}
          <Tooltip content={<CustomTooltip />} />

          {/* Zero line — visual reference for neutral */}
          <ReferenceLine
            y={0}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* The actual sentiment line */}
          <Line
            type="monotone"
            dataKey="avg_sentiment"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SentimentChart