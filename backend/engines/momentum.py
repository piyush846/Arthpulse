# momentum.py
# ─────────────────────────────────────────────────────────────────
# Calculates sentiment momentum per ticker.
# Momentum = today's avg sentiment - yesterday's avg sentiment
#
# Examples:
# Yesterday: -0.3, Today: +0.6 → momentum = +0.9 (IMPROVING)
# Yesterday: +0.8, Today: +0.2 → momentum = -0.6 (DECLINING)
#
# This is more actionable than raw sentiment because it shows
# the DIRECTION of change — is sentiment getting better or worse?
# ─────────────────────────────────────────────────────────────────

from database import SessionLocal, Article
from collections import defaultdict
from datetime import datetime, timedelta

def calculate_momentum(ticker: str, db) -> float:
    # Get all articles for this ticker with sentiment
    articles = db.query(Article)\
                 .filter(Article.tickers.like(f"%{ticker}%"))\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .all()

    if not articles:
        return 0.0

    # Group by date
    daily = defaultdict(list)
    for article in articles:
        if article.fetched_at:
            date_key = article.fetched_at.strftime("%Y-%m-%d")
            daily[date_key].append(article.sentiment)

    # Need at least 2 days for momentum
    sorted_dates = sorted(daily.keys(), reverse=True)
    if len(sorted_dates) < 2:
        # Only one day of data — use intraday momentum instead
        # Compare first half of articles vs second half
        scores = [a.sentiment for a in articles]
        if len(scores) < 2:
            return 0.0
        mid = len(scores) // 2
        recent_avg = sum(scores[:mid]) / mid
        older_avg  = sum(scores[mid:]) / (len(scores) - mid)
        return round(recent_avg - older_avg, 4)

    # Calculate daily averages
    today_scores     = daily[sorted_dates[0]]
    yesterday_scores = daily[sorted_dates[1]]

    today_avg     = sum(today_scores) / len(today_scores)
    yesterday_avg = sum(yesterday_scores) / len(yesterday_scores)

    return round(today_avg - yesterday_avg, 4)


def get_momentum_label(momentum: float) -> dict:
    # Converts momentum float to human readable signal
    if momentum >= 0.5:
        return { "label": "SURGING ↑↑",  "color": "var(--accent-green)" }
    elif momentum >= 0.2:
        return { "label": "IMPROVING ↑",  "color": "var(--accent-green)" }
    elif momentum >= 0.05:
        return { "label": "RISING →↑",    "color": "var(--accent-green)" }
    elif momentum > -0.05:
        return { "label": "STABLE →",     "color": "var(--accent-yellow)" }
    elif momentum > -0.2:
        return { "label": "SLIPPING →↓",  "color": "var(--accent-red)" }
    elif momentum > -0.5:
        return { "label": "DECLINING ↓",  "color": "var(--accent-red)" }
    else:
        return { "label": "CRASHING ↓↓",  "color": "var(--accent-red)" }