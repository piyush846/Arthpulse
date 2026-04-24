# sentiment.py
# Uses Groq API (free tier) for financial sentiment analysis.
# Scores only latest 20 articles per run to stay under 1,000/day limit.

import os
import time
import requests
from database import SessionLocal, Article

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def score_text(text: str) -> float:
    if not text or len(text.strip()) == 0:
        return 0.0

    if not GROQ_API_KEY:
        print("[Sentiment] No GROQ_API_KEY found")
        return 0.0

    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a financial sentiment analyzer. "
                        "Analyze the sentiment of financial news text. "
                        "Reply with ONLY this exact format: sentiment|confidence "
                        "where sentiment is exactly one of: positive, negative, neutral "
                        "and confidence is a decimal between 0.5 and 1.0. "
                        "Examples: positive|0.85  negative|0.92  neutral|0.60 "
                        "No other text. No explanation."
                    )
                },
                {
                    "role": "user",
                    "content": text[:400]
                }
            ],
            "max_tokens": 15,
            "temperature": 0
        }

        response = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )

        if response.status_code == 429:
            print("[Sentiment] Rate limit hit — waiting 60 seconds")
            time.sleep(60)
            return 0.0

        if response.status_code != 200:
            print(f"[Sentiment] Groq error: {response.status_code}")
            return 0.0

        result = response.json()
        raw = result["choices"][0]["message"]["content"].strip().lower()

        if "|" in raw:
            parts = raw.split("|")
            label = parts[0].strip()
            confidence = float(parts[1].strip())
        else:
            label = raw
            confidence = 0.7

        if "positive" in label:
            return round(confidence, 4)
        elif "negative" in label:
            return round(-confidence, 4)
        else:
            return 0.0

    except Exception as e:
        print(f"[Sentiment] Error: {e}")
        return 0.0


def run_sentiment_engine(limit=20):
    # ─────────────────────────────────────────────────────────────
    # Scores latest unscored articles using Groq API.
    # limit=20 keeps us under 1,000 requests/day free tier.
    # 20 articles × 48 fetches = 960 requests/day ✅
    # Newest articles are prioritized — dashboard always fresh.
    # ─────────────────────────────────────────────────────────────
    db = SessionLocal()

    unscored = db.query(Article)\
                 .filter(Article.sentiment == None)\
                 .order_by(Article.fetched_at.desc())\
                 .limit(limit)\
                 .all()

    print(f"[Sentiment] Scoring {len(unscored)} latest articles")

    for i, article in enumerate(unscored):
        text = f"{article.title}. {article.description or ''}"
        score = score_text(text)
        article.sentiment = score
        db.commit()
        print(f"[Sentiment] '{article.title[:50]}...' → {score}")

        # 2 second delay between requests — stays under 30 req/min
        if i < len(unscored) - 1:
            time.sleep(2)

    db.close()
    print(f"[Sentiment] Done. Scored {len(unscored)} articles.")