// SentimentTimeline.jsx
// Shows market sentiment over time with period toggle.
// Today / 7 Days / 30 Days

import { useState, useEffect } from 'react'
import { getSentimentTimeline } from '../services/api'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '0.78rem'
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.name === 'Sentiment'
            ? (entry.value > 0 ? '+' : '') + entry.value?.toFixed(4)
            : entry.value
          }
        </p>
      ))}
    </div>
  )
}

function SentimentTimeline() {
  const [data, setData]     = useState([])
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getSentimentTimeline(period)
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  const periods = [
    { label: 'Today',   value: '1d' },
    { label: '7 Days',  value: '7d' },
    { label: '30 Days', value: '30d' },
  ]

  return (
    <div className="card" style={{ marginBottom: '32px',width:'100%' }}>

      {/* Header + period toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            📈 Market Sentiment Timeline
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            How market mood has shifted over time
          </p>
        </div>

        {/* Period buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                background: period === p.value
                  ? 'var(--accent-blue)'
                  : 'var(--bg-tertiary)',
                color: period === p.value
                  ? 'white'
                  : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : data.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px',
          color: 'var(--text-muted)', fontSize: '0.85rem'
        }}>
          No data for this period yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--bg-tertiary)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="sentiment"
              domain={[-1, 1]}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v > 0 ? `+${v}` : v}
            />
            {/* Fix Y axis for article count — always starts at 0 */}
<YAxis
    yAxisId="count"
    orientation="right"
    domain={[0, 'auto']}  // ← ADD THIS — forces 0 as minimum
    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
    axisLine={false}
    tickLine={false}
/>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                paddingTop: '8px'
              }}
            />

            {/* Article count bars */}
            <Bar
              yAxisId="count"
              dataKey="total"
              name="Articles"
              fill="var(--accent-blue)"
              opacity={0.2}
              radius={[2, 2, 0, 0]}
            />

            {/* Zero reference line */}
            <ReferenceLine
              yAxisId="sentiment"
              y={0}
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
            />

            {/* Sentiment line */}
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="avg_sentiment"
              name="Sentiment"
              stroke="var(--accent-blue)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--accent-blue)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Summary stats below chart */}
      {data.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVG SENTIMENT</p>
            <p style={{
              fontSize: '1rem', fontWeight: 700,
              color: (() => {
                const avg = data.reduce((s, d) => s + d.avg_sentiment, 0) / data.length
                return avg > 0.1
                  ? 'var(--accent-green)'
                  : avg < -0.1
                  ? 'var(--accent-red)'
                  : 'var(--accent-yellow)'
              })()
            }}>
              {(() => {
                const avg = data.reduce((s, d) => s + d.avg_sentiment, 0) / data.length
                return (avg > 0 ? '+' : '') + avg.toFixed(4)
              })()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL ARTICLES</p>
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>
              {data.reduce((s, d) => s + d.total, 0)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>POSITIVE DAYS</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {data.filter(d => d.avg_sentiment > 0.1).length}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEGATIVE DAYS</p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-red)' }}>
              {data.filter(d => d.avg_sentiment < -0.1).length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SentimentTimeline