# routes_news.py
# ═══════════════════════════════════════════════════════════════════
# PURPOSE: Handles all news article related endpoints.
#
# WHY A SEPARATE FILE?
# Instead of putting all endpoints in main.py (which gets messy),
# we group related endpoints into "routers" by feature.
# This file = everything related to news articles.
#
# HOW IT CONNECTS TO MAIN.PY:
# In main.py we write:
#   app.include_router(news_router, prefix="/api")
# This means every route here automatically gets /api prepended:
#   "/news"              → "/api/news"
#   "/news/ticker/AAPL"  → "/api/news/ticker/AAPL"
# ═══════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db, Article

# APIRouter = a mini FastAPI app that holds a group of related routes
# Think of it as a department inside a company
# main.py is the company, routers are the departments
router = APIRouter()


# ───────────────────────────────────────────────────────────────────
# ENDPOINT 1: GET /api/news
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Returns a paginated list of latest financial news articles.
# This is the MAIN endpoint — React frontend calls this on page load
# to populate the news feed on the dashboard.
#
# URL EXAMPLES:
#   /api/news              → first 20 articles (default)
#   /api/news?limit=50     → first 50 articles
#   /api/news?limit=20&skip=20 → articles 21-40 (page 2)
#
# WHY ONLY SCORED ARTICLES?
# We filter sentiment != None so frontend always gets enriched data.
# Raw unscored articles have no value for the dashboard.
#
# WHY ORDER BY fetched_at DESC?
# Newest articles first — standard for any news feed.
# ───────────────────────────────────────────────────────────────────
@router.get("/news")
def get_news(
    # Query() adds validation on top of the parameter:
    # ge=1  → must be >= 1 (can't request 0 articles)
    # le=100 → must be <= 100 (prevents server overload)
    # Default is 20 — enough for one page of the dashboard
    limit: int = Query(20, ge=1, le=100),

    # skip is used for pagination:
    # Page 1: skip=0  → articles 1-20
    # Page 2: skip=20 → articles 21-40
    # Page 3: skip=40 → articles 41-60
    skip: int = Query(0, ge=0),

    # Depends(get_db) tells FastAPI:
    # "before calling this function, run get_db()
    #  and inject the database session as db"
    # FastAPI also closes the session automatically after the response
    db: Session = Depends(get_db)
):
    articles = db.query(Article)\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .offset(skip)\
                 .limit(limit)\
                 .all()

    # We don't return SQLAlchemy objects directly — they can't be
    # serialized to JSON. format_article() converts each object
    # into a plain Python dictionary that FastAPI can jsonify.
    return [format_article(a) for a in articles]


# ───────────────────────────────────────────────────────────────────
# ENDPOINT 2: GET /api/news/ticker/{ticker}
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Returns articles mentioning a specific stock ticker.
# Powers the "TickerPage" — when user clicks on AAPL on dashboard,
# they see all recent news specifically about Apple.
#
# URL EXAMPLES:
#   /api/news/ticker/AAPL   → Apple news
#   /api/news/ticker/TSLA   → Tesla news
#   /api/news/ticker/GS     → Goldman Sachs news
#
# HOW {ticker} WORKS:
# {ticker} in the path is a "path parameter" — FastAPI automatically
# extracts it from the URL and passes it to the function.
# So /api/news/ticker/AAPL → ticker = "AAPL"
#
# WHY .like(f"%{ticker}%")?
# Tickers are stored as comma-separated strings: "AAPL,TSLA,GOOGL"
# SQL LIKE with % wildcards searches INSIDE that string:
#   WHERE tickers LIKE '%AAPL%'
# This matches "AAPL", "AAPL,TSLA", "GOOGL,AAPL,MSFT" etc.
# ───────────────────────────────────────────────────────────────────
@router.get("/news/ticker/{ticker}")
def get_news_by_ticker(
    ticker: str,                          # extracted from URL path
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    articles = db.query(Article)\
                 .filter(Article.tickers.like(f"%{ticker.upper()}%"))\
                 .order_by(Article.fetched_at.desc())\
                 .limit(limit)\
                 .all()

    return [format_article(a) for a in articles]


# ───────────────────────────────────────────────────────────────────
# HELPER FUNCTION: format_article()
# ───────────────────────────────────────────────────────────────────
# PURPOSE: Converts a SQLAlchemy Article object → clean Python dict.
#
# WHY WE NEED THIS:
# SQLAlchemy objects have internal database state attached to them.
# FastAPI cannot convert them to JSON directly — it would crash.
# We manually extract only the fields the frontend needs.
#
# IMPORTANT TRANSFORMATION — tickers:
# Database stores:  "AAPL,TSLA,GOOGL"  (string)
# We return:        ["AAPL","TSLA","GOOGL"]  (list)
# A list is much easier for React to work with than a raw string.
#
# published_at is converted to string because datetime objects
# also can't be JSON serialized directly.
# ───────────────────────────────────────────────────────────────────
def format_article(article) -> dict:
    return {
        "id":           article.id,
        "title":        article.title,
        "description":  article.description,
        "url":          article.url,
        "source":       article.source,
        "published_at": str(article.published_at),
        "sentiment":    article.sentiment,
        # split(",") converts "AAPL,TSLA" → ["AAPL","TSLA"]
        # if tickers is empty string or None, return empty list
        "tickers":      article.tickers.split(",") if article.tickers else [],
        "summary":      article.summary,
    }