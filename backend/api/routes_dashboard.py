# routes_dashboard.py
# ═══════════════════════════════════════════════════════════════════
# PURPOSE: Returns high-level market summary stats for the dashboard.
#
# WHAT THIS POWERS:
# The top section of the ArthPulse dashboard — the "header stats"
# that give a bird's eye view of the current market sentiment:
#
#   ┌─────────────────────────────────────────────┐
#   │  ArthPulse         Overall Market: BEARISH  │
#   │  89 articles    😊 23  😐 31  😟 35         │
#   │  Most Bullish: "Goldman Sachs profits..."   │
#   │  Most Bearish: "West Asia war drives..."    │
#   └─────────────────────────────────────────────┘
#
# WHY A SEPARATE ENDPOINT FOR THIS?
# The frontend could calculate this itself from /api/news data,
# but that would mean downloading ALL articles just to count them.
# Doing it on the backend is faster — one small response, no waste.
# ═══════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Article

router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# ENDPOINT: GET /api/dashboard
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Returns overall market intelligence summary.
#
# RESPONSE SHAPE:
# {
#   "total_articles": 89,
#   "overall_sentiment": -0.23,   ← negative = market fear today
#   "positive_count": 23,
#   "negative_count": 35,
#   "neutral_count": 31,
#   "most_bullish": {
#     "title": "Goldman Sachs profits rise...",
#     "sentiment": 0.89,
#     "url": "https://..."
#   },
#   "most_bearish": {
#     "title": "West Asia war drives markets down...",
#     "sentiment": -0.96,
#     "url": "https://..."
#   },
#   "signal": "SLIGHTLY BEARISH"
# }
# ───────────────────────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):

    # Total count — includes unscored articles too
    # Shows how much data ArthPulse has collected overall
    total = db.query(Article).count()

    # Only scored articles are useful for sentiment analysis
    scored = db.query(Article)\
               .filter(Article.sentiment != None)\
               .all()

    # Guard clause — if no scored articles yet, return safe defaults
    # This prevents division by zero and missing data errors
    # Happens only on very first startup before engines run
    if not scored:
        return {
            "total_articles":    total,
            "overall_sentiment": 0,
            "positive_count":    0,
            "negative_count":    0,
            "neutral_count":     0,
            "most_bullish":      None,
            "most_bearish":      None,
            "signal":            "NEUTRAL"
        }

    # Extract just the scores into a plain list for easy math
    # [0.89, -0.72, 0.0, -0.95, 0.63, ...]
    scores = [a.sentiment for a in scored]

    # Overall market sentiment = average of all article scores
    # If most articles are negative → overall goes negative
    # This is your "market mood" number
    overall = round(sum(scores) / len(scores), 4)

    # Count how many articles fall into each category
    # Thresholds: > 0.1 = positive, < -0.1 = negative, else neutral
    # We use 0.1 not 0 because scores near 0 are essentially neutral
    positive = sum(1 for s in scores if s > 0.1)
    negative = sum(1 for s in scores if s < -0.1)
    neutral  = sum(1 for s in scores if -0.1 <= s <= 0.1)

    # max() with key=lambda finds the article with highest sentiment
    # min() with key=lambda finds the article with lowest sentiment
    # These are the headline stories to feature on the dashboard
    most_bullish = max(scored, key=lambda a: a.sentiment)
    most_bearish = min(scored, key=lambda a: a.sentiment)

    return {
        "total_articles":    total,
        "overall_sentiment": overall,
        "positive_count":    positive,
        "negative_count":    negative,
        "neutral_count":     neutral,
        "most_bullish": {
            "title":     most_bullish.title,
            "sentiment": most_bullish.sentiment,
            "url":       most_bullish.url
        },
        "most_bearish": {
            "title":     most_bearish.title,
            "sentiment": most_bearish.sentiment,
            "url":       most_bearish.url
        },
        "signal": get_market_signal(overall)
    }


# ───────────────────────────────────────────────────────────────────
# HELPER: get_market_signal()
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Converts overall market sentiment float → readable label.
#
# WHY DIFFERENT THRESHOLDS FROM routes_tickers.py?
# Individual ticker signals use ±0.5/±0.1 thresholds.
# Market-wide signal uses ±0.3/±0.1 — tighter range.
# Why? Because averaging hundreds of articles naturally compresses
# the range — overall market rarely hits ±0.5 even in crisis.
# Tighter thresholds give more meaningful market-wide signals.
# ───────────────────────────────────────────────────────────────────
def get_market_signal(score: float) -> str:
    if score >= 0.3:
        return "BULLISH"
    elif score >= 0.1:
        return "SLIGHTLY BULLISH"
    elif score > -0.1:
        return "NEUTRAL"
    elif score > -0.3:
        return "SLIGHTLY BEARISH"
    else:
        return "BEARISH"