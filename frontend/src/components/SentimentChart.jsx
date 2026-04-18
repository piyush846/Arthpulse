// SentimentChart.jsx
// Dual-axis chart showing sentiment history + stock price overlay.
//
// WHY TWO Y-AXES?
// Sentiment range: -1.0 to +1.0
// Stock price range: $100 to $500 (completely different scale)
// Two axes let both lines be visible without one flattening the other.

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '0.8rem'
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.name === 'Sentiment'
            ? (entry.value > 0 ? '+' : '') + entry.value?.toFixed(4)
            : '$' + entry.value?.toFixed(2)
          }
        </p>
      ))}
    </div>
  )
}

function SentimentChart({ sentimentData, priceData, ticker }) {
  // Merge sentiment and price data by date
  // Both arrays have "date" field — we join them on that
  const merged = sentimentData?.map(s => {
    const pricePoint = priceData?.find(p => p.date === s.date)
    return {
      date:          s.date.slice(5),   // "2026-04-17" → "04-17"
      sentiment:     s.avg_sentiment,
      price:         pricePoint?.close || null,
      article_count: s.article_count
    }
  }) || []

  const hasPrice = merged.some(d => d.price !== null)

  if (!merged.length) return (
    <div style={{
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }}>
      Not enough historical data yet.
    </div>
  )

  const latest = sentimentData?.[sentimentData.length - 1]?.avg_sentiment || 0
  const sentimentColor = latest > 0.1
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
        Sentiment {hasPrice ? '& Price' : 'History'} — {ticker}
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={merged} margin={{ top: 5, right: 40, left: -20, bottom: 5 }}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--bg-tertiary)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />

          {/* Left Y axis — sentiment (-1 to +1) */}
          <YAxis
            yAxisId="sentiment"
            domain={[-1, 1]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v > 0 ? `+${v}` : v}
          />

          {/* Right Y axis — stock price (auto range) */}
          {hasPrice && (
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}`}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '8px'
            }}
          />

          {/* Zero line for sentiment */}
          <ReferenceLine
            yAxisId="sentiment"
            y={0}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Sentiment line */}
          <Line
            yAxisId="sentiment"
            type="monotone"
            dataKey="sentiment"
            name="Sentiment"
            stroke={sentimentColor}
            strokeWidth={2}
            dot={{ fill: sentimentColor, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />

          {/* Price line — only shown if price data exists */}
          {hasPrice && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              dot={{ fill: 'var(--accent-blue)', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              strokeDasharray="5 3"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SentimentChart