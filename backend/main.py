# main.py
# ─────────────────────────────────────────────────────────────────────
# This is the ENTRY POINT of the entire ArthPulse backend.
# When you run "uvicorn main:app --reload", Python starts HERE.
# Everything — database, fetchers, API routes — connects through this file.
# ─────────────────────────────────────────────────────────────────────

# FastAPI is the web framework — it handles incoming HTTP requests
# and maps them to your Python functions automatically
from fastapi import FastAPI, Depends

# CORSMiddleware solves the browser security problem:
# React runs on localhost:3000, FastAPI on localhost:8000
# Browsers block requests between different ports by default
# This middleware tells the browser "localhost:3000 is trusted, allow it"
from fastapi.middleware.cors import CORSMiddleware

# Session is just a type hint — tells Python (and you) what type
# the "db" variable is. Doesn't add any functionality by itself.
from sqlalchemy.orm import Session

# init_db   → creates the articles table if it doesn't exist yet
# get_db    → opens a database session, yields it, then closes it
# Article   → the Python class that represents the articles table
from database import init_db, get_db, Article

# These are our two news fetchers — each returns a list of article dicts
# news_fetcher → calls NewsAPI (requires API key)
# rss_fetcher  → parses RSS feeds (no key needed, always free)
from ingestion.news_fetcher import fetch_newsapi_articles
from ingestion.rss_fetcher import fetch_rss_articles

# store_articles takes the combined list from both fetchers
# and saves each article to SQLite, skipping duplicates automatically
from ingestion.store import store_articles


# ─────────────────────────────────────────────────────────────────────
# CREATE THE FASTAPI APP INSTANCE
# Think of "app" like the main object that represents your entire server.
# Every route, every middleware, every event gets attached to this object.
# "title" and "version" appear in auto-generated docs at /docs
# ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="ArthPulse API", version="1.0.0")


# ─────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# Middleware runs on EVERY request before it reaches your route functions.
# This specific middleware adds CORS headers to every response automatically.
#
# Why "localhost:3000"?
# → That's where React dev server runs (npm start)
# → When we deploy, we'll change this to the actual frontend URL
#
# Why allow_methods=["*"]?
# → Allows GET, POST, PUT, DELETE, OPTIONS etc.
# → "*" means all methods — fine for development
#
# Why allow_headers=["*"]?
# → Allows any HTTP header the frontend might send
# → Things like Content-Type, Authorization etc.
# ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────
# STARTUP EVENT
# This function runs AUTOMATICALLY once when the server starts.
# You never need to call it manually.
#
# Execution order when you run "uvicorn main:app --reload":
# 1. Python loads this file
# 2. FastAPI sees @app.on_event("startup")
# 3. Server starts
# 4. startup() runs automatically
# 5. Database tables created (if not already)
# 6. First news fetch runs immediately
# 7. Server becomes ready to accept requests
# ─────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    print("[ArthPulse] Initializing database...")
    
    # Creates the "articles" table in SQLite if it doesn't exist yet.
    # If table already exists, this does nothing — safe to call every time.
    init_db()
    
    print("[ArthPulse] Running initial news fetch...")
    
    # Fetch articles from all sources immediately on startup
    # so the database isn't empty when the frontend first loads
    run_fetch()


# ─────────────────────────────────────────────────────────────────────
# RUN FETCH — THE ORCHESTRATOR
# This is NOT an API endpoint — it's a plain internal function.
# Its only job is to coordinate the two fetchers and the store.
#
# Why separate from startup()?
# Because we reuse it in the /api/fetch endpoint too.
# One function, two callers — no code duplication.
# ─────────────────────────────────────────────────────────────────────
def run_fetch():
    print("[Fetch] Fetching from NewsAPI...")
    
    # Returns a list of dicts — each dict is one article
    # Example: [{"title": "...", "url": "...", "source": "Reuters", ...}, ...]
    newsapi_articles = fetch_newsapi_articles()
    print(f"[Fetch] Got {len(newsapi_articles)} articles from NewsAPI")

    print("[Fetch] Fetching from RSS feeds...")
    
    # Same structure as above — list of dicts
    # Both fetchers return identical dict shapes so store can handle both
    rss_articles = fetch_rss_articles()
    print(f"[Fetch] Got {len(rss_articles)} articles from RSS")

    # Combine both lists into one using + operator
    # Simple list concatenation — [1,2,3] + [4,5,6] = [1,2,3,4,5,6]
    all_articles = newsapi_articles + rss_articles
    
    # Save everything to SQLite
    # store_articles handles duplicates — skips articles with existing URLs
    store_articles(all_articles)


# ─────────────────────────────────────────────────────────────────────
# ROUTE 1 — HEALTH CHECK
# GET http://localhost:8000/
#
# The simplest possible endpoint.
# Purpose: confirm the server is alive and running.
# Open this URL in browser — if you see the JSON, server is working.
#
# @app.get("/") means:
# → Listen for HTTP GET requests at the "/" path
# → When one arrives, call this function
# → Return value is automatically converted to JSON
# ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "ArthPulse API is running 🚀"}


# ─────────────────────────────────────────────────────────────────────
# ROUTE 2 — MANUAL FETCH TRIGGER
# GET http://localhost:8000/api/fetch
#
# Lets you manually trigger a fresh news fetch without restarting server.
# Useful during development when you want new articles immediately.
# Just open this URL in browser and it fetches fresh news on demand.
# ─────────────────────────────────────────────────────────────────────
@app.get("/api/fetch")
def manual_fetch():
    run_fetch()
    return {"message": "Fetch complete"}


# ─────────────────────────────────────────────────────────────────────
# ROUTE 3 — GET NEWS ARTICLES
# GET http://localhost:8000/api/news
# GET http://localhost:8000/api/news?limit=50
# GET http://localhost:8000/api/news?limit=10&skip=20
#
# This is the MAIN endpoint — React frontend calls this to get articles.
#
# Parameters:
# → limit : how many articles to return (default 20)
# → skip  : how many to skip from the top (used for pagination)
# → db    : database session — injected automatically by FastAPI
#           via Depends(get_db), you never pass this manually
#
# Pagination example (limit=20):
# Page 1 → skip=0,  returns articles 1-20
# Page 2 → skip=20, returns articles 21-40
# Page 3 → skip=40, returns articles 41-60
# ─────────────────────────────────────────────────────────────────────
@app.get("/api/news")
def get_news(
    limit: int = 20,           # FastAPI reads this from URL automatically
    skip: int = 0,             # FastAPI reads this from URL automatically
    db: Session = Depends(get_db)  # FastAPI opens DB session, passes it here
                                   # and closes it automatically after function ends
):
    articles = (
        db.query(Article)                       # SELECT * FROM articles
          .order_by(Article.fetched_at.desc())  # ORDER BY fetched_at DESC (newest first)
          .offset(skip)                         # SKIP first N rows
          .limit(limit)                         # RETURN only N rows
          .all()                                # execute query, return as Python list
    )
    
    # FastAPI automatically converts this list of Article objects to JSON
    # You don't need json.dumps() or jsonify() — FastAPI handles it
    return articles