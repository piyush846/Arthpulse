# routes_tickers.py
# ═══════════════════════════════════════════════════════════════════
# PURPOSE: Handles ticker/stock aggregation endpoints.
#
# WHAT THIS FILE DOES DIFFERENTLY FROM routes_news.py:
# routes_news.py returns raw articles — one row per article.
# This file AGGREGATES data — it groups articles by ticker and
# calculates statistics across all articles for each ticker.
#
# REAL WORLD ANALOGY:
# routes_news.py = showing every individual customer review
# routes_tickers.py = showing the average star rating per product
# ═══════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Article
from collections import defaultdict
from engines.momentum import calculate_momentum, get_momentum_label
# Maps ticker symbols to full company information
# This powers the company header on the TickerPage
COMPANY_INFO = {
    # Big Tech
    "AAPL":   { "name": "Apple Inc.",              "sector": "Technology",        "description": "Consumer electronics, software and services" },
    "MSFT":   { "name": "Microsoft Corporation",   "sector": "Technology",        "description": "Cloud computing, software and hardware" },
    "GOOGL":  { "name": "Alphabet Inc.",           "sector": "Technology",        "description": "Search, advertising and cloud services" },
    "AMZN":   { "name": "Amazon.com Inc.",         "sector": "Consumer Cyclical", "description": "E-commerce, cloud computing and streaming" },
    "META":   { "name": "Meta Platforms Inc.",     "sector": "Technology",        "description": "Social media and virtual reality" },
    "TSLA":   { "name": "Tesla Inc.",              "sector": "Automotive",        "description": "Electric vehicles and clean energy" },
    "NVDA":   { "name": "NVIDIA Corporation",      "sector": "Technology",        "description": "Graphics processing units and AI chips" },
    "NFLX":   { "name": "Netflix Inc.",            "sector": "Communication",     "description": "Streaming entertainment service" },
    "INTC":   { "name": "Intel Corporation",       "sector": "Technology",        "description": "Semiconductor chips and computing" },
    "AMD":    { "name": "Advanced Micro Devices",  "sector": "Technology",        "description": "Semiconductors and graphics processors" },
    "ORCL":   { "name": "Oracle Corporation",      "sector": "Technology",        "description": "Database software and cloud services" },
    "IBM":    { "name": "IBM Corporation",         "sector": "Technology",        "description": "Cloud, AI and enterprise software" },
    "CSCO":   { "name": "Cisco Systems",           "sector": "Technology",        "description": "Networking hardware and software" },
    "CRM":    { "name": "Salesforce Inc.",         "sector": "Technology",        "description": "Cloud-based CRM software" },
    "AVGO":   { "name": "Broadcom Inc.",           "sector": "Technology",        "description": "Semiconductors and infrastructure software" },
    "QCOM":   { "name": "Qualcomm Inc.",           "sector": "Technology",        "description": "Wireless technology and semiconductors" },

    # Finance
    "GS":     { "name": "Goldman Sachs",           "sector": "Finance",           "description": "Investment banking and financial services" },
    "JPM":    { "name": "JPMorgan Chase",          "sector": "Finance",           "description": "Banking, investment and financial services" },
    "MS":     { "name": "Morgan Stanley",          "sector": "Finance",           "description": "Investment banking and wealth management" },
    "BAC":    { "name": "Bank of America",         "sector": "Finance",           "description": "Banking and financial services" },
    "BLK":    { "name": "BlackRock Inc.",          "sector": "Finance",           "description": "Investment management and risk advisory" },
    "V":      { "name": "Visa Inc.",               "sector": "Finance",           "description": "Digital payments and transaction processing" },
    "MA":     { "name": "Mastercard Inc.",         "sector": "Finance",           "description": "Payment technology and financial services" },
    "PYPL":   { "name": "PayPal Holdings",         "sector": "Finance",           "description": "Digital payments and fintech" },
    "AXP":    { "name": "American Express",        "sector": "Finance",           "description": "Credit cards and financial services" },

    # Healthcare
    "JNJ":    { "name": "Johnson & Johnson",       "sector": "Healthcare",        "description": "Pharmaceuticals, medical devices and consumer health" },
    "PFE":    { "name": "Pfizer Inc.",             "sector": "Healthcare",        "description": "Pharmaceuticals and biotechnology" },
    "UNH":    { "name": "UnitedHealth Group",      "sector": "Healthcare",        "description": "Health insurance and healthcare services" },
    "MRNA":   { "name": "Moderna Inc.",            "sector": "Healthcare",        "description": "mRNA therapeutics and vaccines" },
    "LLY":    { "name": "Eli Lilly",               "sector": "Healthcare",        "description": "Pharmaceuticals and biotechnology" },

    # Energy
    "XOM":    { "name": "ExxonMobil",              "sector": "Energy",            "description": "Oil, gas and petrochemicals" },
    "CVX":    { "name": "Chevron Corporation",     "sector": "Energy",            "description": "Integrated energy and chemicals" },

    # Consumer
    "WMT":    { "name": "Walmart Inc.",            "sector": "Consumer",          "description": "Retail, e-commerce and grocery" },
    "KO":     { "name": "Coca-Cola Company",       "sector": "Consumer",          "description": "Beverages and consumer goods" },
    "PEP":    { "name": "PepsiCo Inc.",            "sector": "Consumer",          "description": "Beverages, snacks and food products" },
    "NKE":    { "name": "Nike Inc.",               "sector": "Consumer",          "description": "Athletic footwear, apparel and equipment" },
    "DIS":    { "name": "Walt Disney Company",     "sector": "Entertainment",     "description": "Media, entertainment and theme parks" },
    "MCD":    { "name": "McDonald's Corporation",  "sector": "Consumer",          "description": "Fast food restaurants worldwide" },
    "SBUX":   { "name": "Starbucks Corporation",   "sector": "Consumer",          "description": "Coffee and specialty beverages" },

    # Crypto
    "BTC":    { "name": "Bitcoin",                 "sector": "Cryptocurrency",    "description": "Decentralized digital currency" },
    "ETH":    { "name": "Ethereum",                "sector": "Cryptocurrency",    "description": "Decentralized blockchain platform" },

    # Indices
    "SPY":    { "name": "S&P 500 ETF",             "sector": "Index",             "description": "Tracks the S&P 500 index" },
    "QQQ":    { "name": "Nasdaq 100 ETF",          "sector": "Index",             "description": "Tracks the Nasdaq 100 index" },
    "DIA":    { "name": "Dow Jones ETF",           "sector": "Index",             "description": "Tracks the Dow Jones Industrial Average" },

    # Indian Markets
    "RELIANCE":  { "name": "Reliance Industries",  "sector": "Conglomerate",      "description": "Energy, retail, telecom and entertainment" },
    "TCS":       { "name": "Tata Consultancy",     "sector": "Technology",        "description": "IT services and consulting" },
    "INFY":      { "name": "Infosys Limited",      "sector": "Technology",        "description": "IT services and consulting" },
    "HDFCBANK":  { "name": "HDFC Bank",            "sector": "Finance",           "description": "Banking and financial services" },
    "ICICIBANK": { "name": "ICICI Bank",           "sector": "Finance",           "description": "Banking and financial services" },
    "NIFTY50":   { "name": "Nifty 50 Index",       "sector": "Index",             "description": "Top 50 companies on NSE India" },
    "SENSEX":    { "name": "BSE Sensex",           "sector": "Index",             "description": "Top 30 companies on BSE India" },
}

router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# ENDPOINT: GET /api/tickers
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Returns all tickers with aggregated sentiment data.
# Powers the ticker cards grid on the dashboard.
#
# WHAT THE RESPONSE LOOKS LIKE:
# [
#   {
#     "ticker": "AAPL",
#     "avg_sentiment": 0.72,      ← average across all Apple articles
#     "article_count": 8,         ← how many articles mention Apple
#     "latest_title": "Apple beats earnings...",
#     "signal": "BULLISH"         ← human readable label
#   },
#   ...
# ]
#
# WHY defaultdict?
# defaultdict(lambda: {"scores": [], ...}) automatically creates
# a fresh dictionary for any new ticker key.
# Regular dict would crash with KeyError on first new ticker.
# ───────────────────────────────────────────────────────────────────
@router.get("/tickers")
def get_tickers(db: Session = Depends(get_db)):
    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    ticker_data = defaultdict(lambda: {
        "scores": [],
        "latest_title": ""
    })

    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()
            if ticker:
                ticker_data[ticker]["scores"].append(article.sentiment)
                ticker_data[ticker]["latest_title"] = article.title

    result = []
    for ticker, data in ticker_data.items():
        scores = data["scores"]
        avg_sentiment = round(sum(scores) / len(scores), 4)
        momentum = calculate_momentum(ticker, db)
        momentum_info = get_momentum_label(momentum)

        result.append({
            "ticker":         ticker,
            "avg_sentiment":  avg_sentiment,
            "article_count":  len(scores),
            "latest_title":   data["latest_title"],
            "signal":         get_signal(avg_sentiment),
            "momentum":       momentum,
            "momentum_label": momentum_info["label"],
            "momentum_color": momentum_info["color"],
        })

    result.sort(key=lambda x: x["article_count"], reverse=True)
    return result[:50]

# ───────────────────────────────────────────────────────────────────
# HELPER: get_signal()
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Converts a raw sentiment float → human readable signal.
#
# WHY THESE THRESHOLDS?
# FinBERT scores are rarely exactly 0 or 1.
# A score of 0.05 is essentially neutral — not meaningfully bullish.
# These thresholds create meaningful buckets:
#   >= 0.5  → strong positive news    → BULLISH
#   >= 0.1  → mildly positive news    → SLIGHTLY BULLISH
#   > -0.1  → no clear direction      → NEUTRAL
#   > -0.5  → mildly negative news    → SLIGHTLY BEARISH
#   else    → strong negative news    → BEARISH
# ───────────────────────────────────────────────────────────────────
def get_signal(score: float) -> str:
    if score >= 0.5:
        return "BULLISH"
    elif score >= 0.1:
        return "SLIGHTLY BULLISH"
    elif score > -0.1:
        return "NEUTRAL"
    elif score > -0.5:
        return "SLIGHTLY BEARISH"
    else:
        return "BEARISH"
    
@router.get("/ticker/{ticker}/info")
def get_ticker_info(ticker: str, db: Session = Depends(get_db)):
    # Returns company info + live sentiment stats for one ticker
    ticker = ticker.upper()

    # Get company info from dictionary — fallback if unknown
    info = COMPANY_INFO.get(ticker, {
        "name":        ticker,
        "sector":      "Unknown",
        "description": "No description available"
    })

    # Get all articles for this ticker
    articles = db.query(Article)\
                 .filter(Article.tickers.like(f"%{ticker}%"))\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .all()

    if not articles:
        return {
            **info,
            "ticker":          ticker,
            "avg_sentiment":   0,
            "article_count":   0,
            "signal":          "NEUTRAL",
            "positive_count":  0,
            "negative_count":  0,
            "neutral_count":   0,
            "recent_articles": []
        }

    scores = [a.sentiment for a in articles]
    avg    = round(sum(scores) / len(scores), 4)

    return {
        **info,                          # name, sector, description
        "ticker":         ticker,
        "avg_sentiment":  avg,
        "article_count":  len(articles),
        "signal":         get_signal(avg),
        "positive_count": sum(1 for s in scores if s > 0.1),
        "negative_count": sum(1 for s in scores if s < -0.1),
        "neutral_count":  sum(1 for s in scores if -0.1 <= s <= 0.1),
    }
@router.get("/ticker/{ticker}/history")
def get_ticker_history(ticker: str, db: Session = Depends(get_db)):
    # Returns daily average sentiment for the last 7 days
    # Powers the sentiment history chart on TickerPage
    from sqlalchemy import func, cast, Date

    ticker = ticker.upper()

    articles = db.query(Article)\
                 .filter(Article.tickers.like(f"%{ticker}%"))\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.asc())\
                 .all()

    if not articles:
        return []

    # Group articles by date manually
    from collections import defaultdict
    daily = defaultdict(list)

    for article in articles:
        if article.fetched_at:
            date_key = article.fetched_at.strftime("%Y-%m-%d")
            daily[date_key].append(article.sentiment)

    # Build chart data — one point per day
    result = []
    for date, scores in sorted(daily.items()):
        result.append({
            "date":          date,
            "avg_sentiment": round(sum(scores) / len(scores), 4),
            "article_count": len(scores)
        })

    return result
@router.get("/ticker/{ticker}/prices")
def get_ticker_prices(ticker: str):
    # ─────────────────────────────────────────────────────────────
    # Fetches last 7 days of stock price data using yfinance.
    # yfinance scrapes Yahoo Finance — free, no API key needed.
    #
    # Returns daily OHLCV data:
    # Open, High, Low, Close, Volume for each day
    # We use "Close" price for the chart overlay.
    # ─────────────────────────────────────────────────────────────
    import yfinance as yf

    ticker = ticker.upper()

    # Skip non-stock tickers — indices and crypto use different symbols
    skip_tickers = {"NIFTY50", "SENSEX", "SPY", "QQQ", "DIA", "BTC", "ETH"}
    if ticker in skip_tickers:
        return []

    try:
        stock = yf.Ticker(ticker)

        # period="7d" → last 7 days
        # interval="1d" → daily candles
        hist = stock.history(period="7d", interval="1d")

        if hist.empty:
            return []

        result = []
        for date, row in hist.iterrows():
            result.append({
                "date":   date.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]), 2),
                "high":   round(float(row["High"]), 2),
                "low":    round(float(row["Low"]), 2),
                "close":  round(float(row["Close"]), 2),
                "volume": int(row["Volume"])
            })

        return result

    except Exception as e:
        print(f"[Prices] Error fetching {ticker}: {e}")
        return []
@router.get("/market/breadth")
def get_market_breadth():
    # ─────────────────────────────────────────────────────────────
    # Returns live prices for major market indicators.
    # Powers the always-visible breadth bar below navbar.
    # Uses yfinance — free, no API key needed.
    # ─────────────────────────────────────────────────────────────
    import yfinance as yf

    SYMBOLS = {
        "S&P 500":  "^GSPC",
        "NASDAQ":   "^IXIC",
        "DOW":      "^DJI",
        "VIX":      "^VIX",
        "OIL":      "CL=F",
        "GOLD":     "GC=F",
        "BTC":      "BTC-USD",
    }

    result = []
    for name, symbol in SYMBOLS.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d", interval="1d")

            if hist.empty or len(hist) < 1:
                continue

            current = float(hist["Close"].iloc[-1])

            # Calculate change
            if len(hist) >= 2:
                prev = float(hist["Close"].iloc[-2])
                change = current - prev
                change_pct = (change / prev) * 100
            else:
                change = 0
                change_pct = 0

            result.append({
                "name":       name,
                "symbol":     symbol,
                "price":      round(current, 2),
                "change":     round(change, 2),
                "change_pct": round(change_pct, 2),
                "positive":   change >= 0
            })

        except Exception as e:
            print(f"[Breadth] Error fetching {symbol}: {e}")
            continue

    return result    