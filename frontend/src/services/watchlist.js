// watchlist.js
// ─────────────────────────────────────────────────────────────────
// Manages watchlist and price alerts using localStorage.
// No backend needed — data persists in browser.
//
// Watchlist: array of ticker strings ["AAPL", "TSLA", "TCS"]
// Alerts: array of alert objects
// ─────────────────────────────────────────────────────────────────

// ── WATCHLIST ─────────────────────────────────────────────────────

export function getWatchlist() {
    try {
        const data = localStorage.getItem('arthpulse_watchlist')
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addToWatchlist(ticker) {
    const list = getWatchlist()
    if (!list.includes(ticker)) {
        list.push(ticker)
        localStorage.setItem('arthpulse_watchlist', JSON.stringify(list))
    }
}

export function removeFromWatchlist(ticker) {
    const list = getWatchlist().filter(t => t !== ticker)
    localStorage.setItem('arthpulse_watchlist', JSON.stringify(list))
}

export function isInWatchlist(ticker) {
    return getWatchlist().includes(ticker)
}

// ── PRICE ALERTS ──────────────────────────────────────────────────

export function getAlerts() {
    try {
        const data = localStorage.getItem('arthpulse_alerts')
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addAlert(alert) {
    // alert = {
    //   id: timestamp,
    //   ticker: "AAPL",
    //   type: "sentiment" | "price",
    //   condition: "above" | "below",
    //   value: 0.5,
    //   triggered: false,
    //   createdAt: date string
    // }
    const alerts = getAlerts()
    alerts.push({
        ...alert,
        id: Date.now(),
        triggered: false,
        createdAt: new Date().toLocaleDateString()
    })
    localStorage.setItem('arthpulse_alerts', JSON.stringify(alerts))
}

export function removeAlert(id) {
    const alerts = getAlerts().filter(a => a.id !== id)
    localStorage.setItem('arthpulse_alerts', JSON.stringify(alerts))
}

export function checkAlerts(tickers) {
    // tickers = array of ticker objects from /api/tickers
    // Returns list of triggered alerts
    const alerts = getAlerts()
    const triggered = []

    alerts.forEach(alert => {
        if (alert.triggered) return

        const ticker = tickers.find(t => t.ticker === alert.ticker)
        if (!ticker) return

        const value = alert.type === 'sentiment'
            ? ticker.avg_sentiment
            : null  // price alerts handled separately

        if (value === null) return

        const isTriggered = alert.condition === 'above'
            ? value > alert.value
            : value < alert.value

        if (isTriggered) {
            triggered.push({ ...alert, currentValue: value })
            // Mark as triggered
            alert.triggered = true
        }
    })

    if (triggered.length > 0) {
        localStorage.setItem('arthpulse_alerts', JSON.stringify(alerts))
    }

    return triggered
}