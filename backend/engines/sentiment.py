# sentiment.py
# FinBERT is lazy loaded — only loads when first needed
# This keeps startup RAM under 512MB for Render free tier

from transformers import pipeline
from database import SessionLocal, Article

# Global variable — None until first use
_finbert = None

def get_finbert():
    # ─────────────────────────────────────────────────────────────
    # Loads FinBERT only on first call.
    # After that it stays in memory and reuses the same instance.
    # This prevents OOM on startup.
    # ─────────────────────────────────────────────────────────────
    global _finbert
    if _finbert is None:
        print("[Sentiment] Loading FinBERT model...")
        _finbert = pipeline(
            "text-classification",
    model="AdityaAI9/distilbert_finance_sentiment_analysis"
        )
        print("[Sentiment] FinBERT model loaded ✅")
    return _finbert


def score_text(text: str) -> float:
    if not text or len(text.strip()) == 0:
        return 0.0
    try:
        truncated = text[:512]
        finbert = get_finbert()
        result = finbert(truncated)[0]
        label = result["label"]
        score = result["score"]

        if label == "positive":
            return round(score, 4)
        elif label == "negative":
            return round(-score, 4)
        else:
            return 0.0
    except Exception as e:
        print(f"[Sentiment] Error scoring text: {e}")
        return 0.0


def run_sentiment_engine():
    db = SessionLocal()

    unscored = db.query(Article)\
                 .filter(Article.sentiment == None)\
                 .all()

    print(f"[Sentiment] Found {len(unscored)} unscored articles")

    for article in unscored:
        text = f"{article.title}. {article.description or ''}"
        score = score_text(text)
        article.sentiment = score
        db.commit()
        print(f"[Sentiment] '{article.title[:50]}...' → {score}")

    db.close()
    print(f"[Sentiment] Done. Scored {len(unscored)} articles.")