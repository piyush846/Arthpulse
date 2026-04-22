// AlertsPanel.jsx
// Lets users set sentiment alerts for tickers.
// "Alert me when AAPL sentiment drops below -0.5"

import { useState,  } from 'react'
import { getAlerts, addAlert, removeAlert } from '../services/watchlist'

function AlertsPanel({  triggeredAlerts }) {
  const [alerts, setAlerts] = useState(() => getAlerts())
  const [showForm, setShowForm]   = useState(false)
  const [ticker, setTicker]       = useState('')
  const [condition, setCondition] = useState('below')
  const [value, setValue]         = useState(-0.5)
  

  
  function handleAdd() {
    if (!ticker) return
    addAlert({ ticker: ticker.toUpperCase(), type: 'sentiment', condition, value: parseFloat(value) })
    setAlerts(getAlerts())
    setShowForm(false)
    setTicker('')
  }

  function handleRemove(id) {
    removeAlert(id)
    setAlerts(getAlerts())
  }

  return (
    <div className="card" style={{ marginBottom: '24px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          🔔 Sentiment Alerts
          {triggeredAlerts?.length > 0 && (
            <span style={{
              background: 'var(--accent-red)',
              color: 'white',
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '10px',
              marginLeft: '8px'
            }}>
              {triggeredAlerts.length} triggered
            </span>
          )}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--accent-blue)',
            color: 'white', border: 'none',
            borderRadius: '6px', padding: '5px 12px',
            cursor: 'pointer', fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          + Add Alert
        </button>
      </div>

      {/* Triggered alerts */}
      {triggeredAlerts?.map(alert => (
        <div key={alert.id} style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid var(--accent-red)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--accent-red)',
              fontWeight: 700
            }}>
              🚨 ALERT TRIGGERED — {alert.ticker}
            </span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sentiment {alert.condition} {alert.value} →
              Current: {alert.currentValue?.toFixed(3)}
            </p>
          </div>
        </div>
      ))}

      {/* Add alert form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '12px'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '10px'
          }}>
            Alert me when:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Ticker (e.g. AAPL)"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px', padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem', width: '120px',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              sentiment goes
            </span>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px', padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem', outline: 'none'
              }}
            >
              <option value="above">above</option>
              <option value="below">below</option>
            </select>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px', padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem', width: '80px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: 'var(--accent-green)',
                color: 'white', border: 'none',
                borderRadius: '6px', padding: '6px 14px',
                cursor: 'pointer', fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              Set Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)', border: 'none',
                borderRadius: '6px', padding: '6px 10px',
                cursor: 'pointer', fontSize: '0.82rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing alerts list */}
      {alerts.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          No alerts set. Add one to get notified when sentiment crosses a threshold.
        </p>
      ) : (
        alerts.map(alert => (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              opacity: alert.triggered ? 0.5 : 1
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {alert.ticker}
              </span>
              <span style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginLeft: '8px'
              }}>
                sentiment {alert.condition} {alert.value}
              </span>
              {alert.triggered && (
                <span style={{
                  fontSize: '0.68rem',
                  color: 'var(--accent-red)',
                  marginLeft: '8px'
                }}>
                  ✓ triggered
                </span>
              )}
            </div>
            <button
              onClick={() => handleRemove(alert.id)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.82rem'
              }}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default AlertsPanel