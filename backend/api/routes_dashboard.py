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
    from datetime import datetime, timedelta

    # Total ALL articles ever
    total = db.query(Article).count()

    # For sentiment — use last 24 hours
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    scored = db.query(Article)\
               .filter(Article.sentiment != None)\
               .filter(Article.fetched_at >= cutoff_24h)\
               .all()

    # If less than 10 articles in last 24h, use last 7 days
    if len(scored) < 10:
        cutoff_7d = datetime.utcnow() - timedelta(days=7)
        scored = db.query(Article)\
                   .filter(Article.sentiment != None)\
                   .filter(Article.fetched_at >= cutoff_7d)\
                   .all()

    # If still empty use ALL articles
    if len(scored) == 0:
        scored = db.query(Article)\
                   .filter(Article.sentiment != None)\
                   .all()

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

    scores = [a.sentiment for a in scored]
    overall = round(sum(scores) / len(scores), 4)
    positive = sum(1 for s in scores if s > 0.1)
    negative = sum(1 for s in scores if s < -0.1)
    neutral  = sum(1 for s in scores if -0.1 <= s <= 0.1)
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
        "can", "get", "got", "set", "stock", "stocks", "market", "markets",
        # Add to STOPWORDS set:
"here", "these", "more", "best", "target", "strait",
"partnership", "tobacco", "retirees", "highest", "yahoo",
"price", "week", "april", "growth", "iran", "hormuz",
"above", "below", "over", "under", "between", "within",
"being", "having", "doing", "making", "taking", "going",
"coming", "looking", "showing", "saying", "telling",
"where", "there", "their", "every", "other", "another",
"after", "before", "again", "against", "both", "each",
"much", "many", "such", "very", "just", "than", "too",
"most", "next", "last", "long", "little", "own", "right",
"big", "high", "open", "seem", "put", "well", "also",
"back", "any", "good", "same", "tell", "does", "off",
"even", "never", "know", "take", "place", "three", "came"
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
        if len(scores) >= 4:  # only words appearing 2+ times
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
@router.get("/dashboard/narrative")
def get_market_narrative(db: Session = Depends(get_db)):
    # ─────────────────────────────────────────────────────────────
    # Synthesizes all news into 3-4 driving themes for today.
    # This answers: "What's actually moving the market today?"
    #
    # Algorithm:
    # 1. Get trending keywords grouped by theme
    # 2. Find articles matching each theme
    # 3. Calculate theme dominance (% of total articles)
    # 4. Find most impacted sectors per theme
    # ─────────────────────────────────────────────────────────────
    import re
    from collections import defaultdict

    # Theme definitions — keyword clusters that represent market themes
    THEMES = {
        "Geopolitical Risk": {
            "keywords": ["war", "iran", "conflict", "sanctions", "military",
                        "hormuz", "strait", "tensions", "attack", "nuclear",
                        "israel", "russia", "ukraine", "china", "tariff", "trade"],
            "icon": "🌍",
            "type": "risk"
        },
        "Fed & Monetary Policy": {
            "keywords": ["federal", "reserve", "rates", "inflation", "interest",
                        "hawkish", "dovish", "cuts", "hike", "powell", "fomc",
                        "monetary", "policy", "cpi", "gdp"],
            "icon": "🏦",
            "type": "macro"
        },
        "Earnings & Revenue": {
            "keywords": ["earnings", "revenue", "profit", "quarterly", "beat",
                        "miss", "guidance", "forecast", "results", "eps",
                        "outlook", "estimates", "sales", "income"],
            "icon": "📊",
            "type": "earnings"
        },
        "Tech & AI": {
            "keywords": ["artificial", "intelligence", "chip", "semiconductor",
                        "nvidia", "microsoft", "apple", "google", "cloud",
                        "technology", "software", "hardware", "data", "model"],
            "icon": "💻",
            "type": "sector"
        },
        "Energy & Oil": {
            "keywords": ["oil", "energy", "crude", "opec", "gas", "barrel",
                        "petroleum", "renewable", "solar", "pipeline"],
            "icon": "⚡",
            "type": "sector"
        },
        "Banking & Finance": {
            "keywords": ["bank", "banking", "credit", "loan", "debt", "bond",
                        "yield", "treasury", "goldman", "jpmorgan", "morgan",
                        "hedge", "fund", "capital", "assets"],
            "icon": "💰",
            "type": "sector"
        },
        "Market Volatility": {
            "keywords": ["crash", "volatile", "selloff", "rally", "rebound",
                        "correction", "bubble", "panic", "fear", "uncertainty",
                        "risk", "volatility", "vix"],
            "icon": "📉",
            "type": "risk"
        },
    }

    # Get recent articles
    articles = db.query(Article)\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .limit(100)\
                 .all()

    total = len(articles)
    if total == 0:
        return []

    # Match articles to themes
    theme_data = defaultdict(lambda: {
        "articles": [],
        "scores": []
    })

    for article in articles:
        text = f"{article.title} {article.description or ''}".lower()
        for theme_name, theme_info in THEMES.items():
            # Check if any theme keyword appears in article
            matches = sum(1 for kw in theme_info["keywords"] if kw in text)
            if matches >= 1:
                theme_data[theme_name]["articles"].append(article)
                theme_data[theme_name]["scores"].append(article.sentiment)

    # Build narrative
    narrative = []
    for theme_name, data in theme_data.items():
        if len(data["articles"]) < 2:
            continue

        scores = data["scores"]
        avg_sentiment = round(sum(scores) / len(scores), 4)
        dominance = round(len(data["articles"]) / total * 100, 1)
        theme_info = THEMES[theme_name]

        # Direction label
        if avg_sentiment >= 0.3:
            direction = "BULLISH"
            direction_color = "green"
        elif avg_sentiment >= 0.1:
            direction = "SLIGHTLY BULLISH"
            direction_color = "green"
        elif avg_sentiment > -0.1:
            direction = "NEUTRAL"
            direction_color = "yellow"
        elif avg_sentiment > -0.3:
            direction = "SLIGHTLY BEARISH"
            direction_color = "red"
        else:
            direction = "BEARISH"
            direction_color = "red"

        narrative.append({
            "theme":           theme_name,
            "icon":            theme_info["icon"],
            "type":            theme_info["type"],
            "article_count":   len(data["articles"]),
            "dominance":       dominance,
            "avg_sentiment":   avg_sentiment,
            "direction":       direction,
            "direction_color": direction_color,
            "top_headline":    data["articles"][0].title if data["articles"] else ""
        })

    # Sort by dominance — most discussed theme first
    narrative.sort(key=lambda x: x["dominance"], reverse=True)
    return narrative[:4]  # top 4 theme
@router.get("/dashboard/timeline")
def get_sentiment_timeline(
    period: str = "7d",  # "1d", "7d", "30d"
    db: Session = Depends(get_db)
):
    # ─────────────────────────────────────────────────────────────
    # Returns overall market sentiment grouped by date.
    # period param controls how far back to look:
    #   1d  → today only (hourly breakdown)
    #   7d  → last 7 days (daily breakdown)
    #   30d → last 30 days (daily breakdown)
    #
    # Powers the timeline sentiment chart on dashboard.
    # ─────────────────────────────────────────────────────────────
    from datetime import datetime, timedelta
    from collections import defaultdict

    # Calculate cutoff date based on period
    now = datetime.utcnow()
    if period == "1d":
         cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7d":
        cutoff = now - timedelta(days=7)
    elif period == "30d":
        cutoff = now - timedelta(days=30)
    else:
        cutoff = now - timedelta(days=7)

    articles = db.query(Article)\
                 .filter(Article.sentiment != None)\
                 .filter(Article.fetched_at >= cutoff)\
                 .order_by(Article.fetched_at.asc())\
                 .all()

    if not articles:
        return []

    # Group by date
    daily = defaultdict(list)
    for article in articles:
        if article.fetched_at:
            if period == "1d":
                # Hourly breakdown for today
                key = article.fetched_at.strftime("%H:00")
            else:
                # Daily breakdown for 7d/30d
                key = article.fetched_at.strftime("%Y-%m-%d")
            daily[key].append(article.sentiment)

    result = []
    for date, scores in sorted(daily.items()):
        positive = sum(1 for s in scores if s > 0.1)
        negative = sum(1 for s in scores if s < -0.1)
        neutral  = sum(1 for s in scores if -0.1 <= s <= 0.1)
        avg      = round(sum(scores) / len(scores), 4)

        result.append({
            "date":          date,
            "avg_sentiment": avg,
            "positive":      positive,
            "negative":      negative,
            "neutral":       neutral,
            "total":         len(scores)
        })

    return result
@router.get("/ticker/{ticker}/correlation")
def get_ticker_correlation(ticker: str, db: Session = Depends(get_db)):
    # ─────────────────────────────────────────────────────────────
    # Calculates how well sentiment predicts next-day price movement.
    #
    # Method:
    # For each day we have both sentiment and price data:
    # - Check if sentiment direction matches next day price direction
    # - e.g. positive sentiment → price went up next day = match ✅
    #
    # Returns correlation score 0-100:
    # 80-100 = strong predictor
    # 60-80  = moderate predictor
    # below 60 = weak predictor
    # ─────────────────────────────────────────────────────────────
    import yfinance as yf
    from collections import defaultdict

    ticker = ticker.upper()

    # Skip non-stock tickers
    skip = {"NIFTY50", "SENSEX", "SPY", "QQQ", "DIA"}
    if ticker in skip:
        return {"correlation": None, "message": "Not applicable for indices"}

    # Get sentiment history
    articles = db.query(Article)\
                 .filter(Article.tickers.like(f"%{ticker}%"))\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.asc())\
                 .all()

    if not articles:
        return {"correlation": None, "message": "No data"}

    # Group sentiment by date
    daily_sentiment = defaultdict(list)
    for article in articles:
        if article.fetched_at:
            key = article.fetched_at.strftime("%Y-%m-%d")
            daily_sentiment[key].append(article.sentiment)

    daily_avg = {
        date: sum(scores) / len(scores)
        for date, scores in daily_sentiment.items()
    }

    # Get price history
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="30d", interval="1d")
        if hist.empty:
            return {"correlation": None, "message": "No price data"}

        price_changes = {}
        dates = list(hist.index)
        for i in range(len(dates) - 1):
            date_str = dates[i].strftime("%Y-%m-%d")
            next_close = float(hist["Close"].iloc[i + 1])
            curr_close = float(hist["Close"].iloc[i])
            price_changes[date_str] = next_close - curr_close

    except Exception as e:
        return {"correlation": None, "message": str(e)}

    # Calculate correlation
    matches = 0
    total   = 0

    for date, sentiment in daily_avg.items():
        if date in price_changes:
            price_change = price_changes[date]
            # Check if direction matches
            sentiment_up = sentiment > 0.05
            price_up     = price_change > 0
            if sentiment_up == price_up:
                matches += 1
            total += 1

    if total < 2:
        return {
            "correlation": None,
            "message": "Not enough overlapping data yet"
        }

    score = round((matches / total) * 100, 1)

    # Label
    if score >= 75:
        label = "Strong Predictor"
        color = "green"
    elif score >= 60:
        label = "Moderate Predictor"
        color = "yellow"
    else:
        label = "Weak Predictor"
        color = "red"

    return {
        "correlation":  score,
        "matches":      matches,
        "total":        total,
        "label":        label,
        "color":        color,
        "message":      f"Sentiment correctly predicted price direction {matches}/{total} days"
    }