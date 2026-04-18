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
@router.get("/dashboard/sectors")
def get_sector_sentiment(db: Session = Depends(get_db)):
    # ─────────────────────────────────────────────────────────────
    # Returns average sentiment grouped by sector.
    # Powers the sector breakdown bar chart on dashboard.
    # ─────────────────────────────────────────────────────────────

    # Ticker → sector mapping
    TICKER_SECTORS = {
        "AAPL": "Technology",  "MSFT": "Technology",  "GOOGL": "Technology",
        "NVDA": "Technology",  "AMD":  "Technology",   "INTC":  "Technology",
        "TSLA": "Automotive",  "AMZN": "Consumer",     "META":  "Technology",
        "NFLX": "Entertainment","ORCL": "Technology",  "IBM":   "Technology",
        "GS":   "Finance",     "JPM":  "Finance",      "MS":    "Finance",
        "BAC":  "Finance",     "V":    "Finance",      "MA":    "Finance",
        "PYPL": "Finance",     "BLK":  "Finance",      "AXP":   "Finance",
        "JNJ":  "Healthcare",  "PFE":  "Healthcare",   "MRNA":  "Healthcare",
        "UNH":  "Healthcare",  "LLY":  "Healthcare",
        "XOM":  "Energy",      "CVX":  "Energy",
        "WMT":  "Consumer",    "KO":   "Consumer",     "PEP":   "Consumer",
        "NKE":  "Consumer",    "MCD":  "Consumer",     "SBUX":  "Consumer",
        "DIS":  "Entertainment",
        "BTC":  "Crypto",      "ETH":  "Crypto",
        "SPY":  "Index",       "QQQ":  "Index",        "DIA":   "Index",
        "TCS":  "Technology",  "INFY": "Technology",   "WIPRO": "Technology",
        "RELIANCE": "Energy",  "HDFCBANK": "Finance",  "ICICIBANK": "Finance",
    }

    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    from collections import defaultdict
    sector_data = defaultdict(list)

    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()
            sector = TICKER_SECTORS.get(ticker)
            if sector:
                sector_data[sector].append(article.sentiment)

    result = []
    for sector, scores in sector_data.items():
        avg = round(sum(scores) / len(scores), 4)
        result.append({
            "sector":        sector,
            "avg_sentiment": avg,
            "article_count": len(scores),
            "signal":        get_market_signal(avg)
        })

    result.sort(key=lambda x: x["avg_sentiment"], reverse=True)
    return result


@router.get("/dashboard/trending")
def get_trending_keywords(db: Session = Depends(get_db)):
    # ─────────────────────────────────────────────────────────────
    # Extracts most frequently mentioned keywords from titles.
    # Powers the trending topics section on dashboard.
    # ─────────────────────────────────────────────────────────────
    import re
    from collections import Counter,defaultdict

    # Words to ignore — too common to be meaningful
    STOPWORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "is", "are", "was", "were",
        "be", "been", "has", "have", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "its", "it", "this",
        "that", "as", "up", "out", "about", "after", "before", "into",
        "what", "how", "why", "when", "who", "which", "your", "their",
        "our", "his", "her", "not", "no", "new", "says", "said", "say",
        "can", "get", "got", "set", "stock", "stocks", "market", "markets"
    }

    # Get recent articles — last 50
    articles = db.query(Article)\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .limit(50)\
                 .all()

    word_sentiments = defaultdict(list)

    for article in articles:
        if not article.title:
            continue
        # Extract words from title
        words = re.findall(r'\b[a-zA-Z]{4,}\b', article.title.lower())
        for word in words:
            if word not in STOPWORDS:
                word_sentiments[word].append(article.sentiment or 0)

    result = []
    for word, scores in word_sentiments.items():
        if len(scores) >= 2:  # only words appearing 2+ times
            avg = round(sum(scores) / len(scores), 4)
            result.append({
                "keyword":       word,
                "count":         len(scores),
                "avg_sentiment": avg,
                "signal":        get_market_signal(avg)
            })

    result.sort(key=lambda x: x["count"], reverse=True)
    return result[:20]  # top 20 trending keywords


@router.get("/dashboard/movers")
def get_top_movers(db: Session = Depends(get_db)):
    # ─────────────────────────────────────────────────────────────
    # Returns top 5 bullish and top 5 bearish tickers.
    # Powers the "Top Movers" section on dashboard.
    # ─────────────────────────────────────────────────────────────
    from collections import defaultdict

    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    ticker_scores = defaultdict(list)
    ticker_titles = {}

    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()
            if ticker and len(ticker) <= 6:
                ticker_scores[ticker].append(article.sentiment)
                ticker_titles[ticker] = article.title

    all_tickers = []
    for ticker, scores in ticker_scores.items():
        if len(scores) >= 1:
            avg = round(sum(scores) / len(scores), 4)
            all_tickers.append({
                "ticker":        ticker,
                "avg_sentiment": avg,
                "article_count": len(scores),
                "latest_title":  ticker_titles[ticker],
                "signal":        get_market_signal(avg)
            })

    # Sort by sentiment — top bullish and bearish
    all_tickers.sort(key=lambda x: x["avg_sentiment"], reverse=True)

    return {
        "bullish": all_tickers[:5],   # top 5 most positive
        "bearish": all_tickers[-5:][::-1]  # top 5 most negative
    }