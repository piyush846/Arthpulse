# sentiment.py
# ─────────────────────────────────────────────────────────────────────
# This engine reads articles from the database where sentiment is NULL
# and fills in a sentiment score using FinBERT — a financial NLP model.
#
# FinBERT was trained specifically on financial text so it understands
# terms like "hawkish", "bearish", "rate hike" correctly — unlike
# generic sentiment models.
#
# Sentiment score range:
#   +1.0 → extremely positive (great earnings, market rally)
#    0.0 → completely neutral
#   -1.0 → extremely negative (recession fears, market crash)
# ─────────────────────────────────────────────────────────────────────

from transformers import pipeline
from database import SessionLocal, Article

# ─────────────────────────────────────────────────────────────────────
# LOAD FINBERT MODEL
# "pipeline" is a HuggingFace helper that wraps the entire
# download → load → inference process into one simple object.
#
# "sentiment-analysis" tells it what task we want
# "ProsusAI/finbert" is the specific model — hosted on HuggingFace Hub
# It will download automatically on first run (~400MB, once only)
# After first download it's cached locally — instant load every time
# ─────────────────────────────────────────────────────────────────────
print("[Sentiment] Loading FinBERT model...")
finbert = pipeline(
    "sentiment-analysis",
    model="ProsusAI/finbert",
    tokenizer="ProsusAI/finbert"
)
print("[Sentiment] FinBERT model loaded ✅")


def score_text(text: str) -> float:
    # ─────────────────────────────────────────────────────────────────
    # Takes a string of text and returns a float between -1.0 and +1.0
    #
    # FinBERT returns something like:
    # [{"label": "positive", "score": 0.87}]
    #
    # We convert:
    #   positive → +score  (e.g. +0.87)
    #   negative → -score  (e.g. -0.91)
    #   neutral  →  0.0
    # ─────────────────────────────────────────────────────────────────
    if not text or len(text.strip()) == 0:
        return 0.0

    try:
        # FinBERT has a max token limit of 512
        # Long articles would crash it — we truncate to 512 chars safely
        truncated = text[:512]

        result = finbert(truncated)[0]  # returns list, we take first item
        label = result["label"]         # "positive", "negative", or "neutral"
        score = result["score"]         # confidence probability 0.0 to 1.0

        if label == "positive":
            return round(score, 4)       # e.g. +0.8734
        elif label == "negative":
            return round(-score, 4)      # e.g. -0.9123
        else:
            return 0.0                   # neutral

    except Exception as e:
        print(f"[Sentiment] Error scoring text: {e}")
        return 0.0


def run_sentiment_engine():
    # ─────────────────────────────────────────────────────────────────
    # Main function — queries DB for unscored articles and scores them.
    #
    # Why filter sentiment == None?
    # → We only process articles that haven't been scored yet
    # → Already scored articles are skipped — no duplicate work
    # → This makes it safe to call multiple times
    # ─────────────────────────────────────────────────────────────────
    db = SessionLocal()

    # Get all articles where sentiment hasn't been filled yet
    unscored = db.query(Article)\
                 .filter(Article.sentiment == None)\
                 .all()

    print(f"[Sentiment] Found {len(unscored)} unscored articles")

    for article in unscored:
        # Use title + description as input text
        # Title alone is often enough for FinBERT
        # Description adds more context when available
        text = f"{article.title}. {article.description or ''}"

        score = score_text(text)

        # Update the sentiment column for this article
        article.sentiment = score
        db.commit()

        print(f"[Sentiment] '{article.title[:50]}...' → {score}")

    db.close()
    print(f"[Sentiment] Done. Scored {len(unscored)} articles.")