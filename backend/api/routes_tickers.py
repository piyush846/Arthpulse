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

    # Only get articles that have BOTH tickers AND sentiment
    # Articles without tickers can't be grouped by ticker
    # Articles without sentiment have no intelligence value yet
    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    # defaultdict creates empty structure for any new key automatically
    # Without defaultdict we'd need: if ticker not in data: data[ticker] = []
    ticker_data = defaultdict(lambda: {
        "scores": [],        # list of all sentiment scores for this ticker
        "latest_title": ""   # most recently seen article title
    })

    # Loop through every article and distribute its sentiment
    # score to each ticker it mentions
    # Example: article about "Apple and Tesla" with sentiment +0.8
    # → AAPL gets +0.8 added to its scores list
    # → TSLA gets +0.8 added to its scores list
    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()  # remove any whitespace
            if ticker:               # skip empty strings
                ticker_data[ticker]["scores"].append(article.sentiment)
                ticker_data[ticker]["latest_title"] = article.title

    # Build final response list
    result = []
    for ticker, data in ticker_data.items():
        scores = data["scores"]

        # Average sentiment = sum of all scores / number of scores
        # round(x, 4) keeps 4 decimal places e.g. 0.7234
        avg_sentiment = round(sum(scores) / len(scores), 4)

        result.append({
            "ticker":        ticker,
            "avg_sentiment": avg_sentiment,
            "article_count": len(scores),
            "latest_title":  data["latest_title"],
            # get_signal() converts number → human readable label
            "signal":        get_signal(avg_sentiment)
        })

    # Sort by article_count descending
    # Most mentioned tickers appear first on the dashboard
    result.sort(key=lambda x: x["article_count"], reverse=True)

    # Return only top 50 — more than enough for dashboard
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