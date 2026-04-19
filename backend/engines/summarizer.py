# summarizer.py
# ─────────────────────────────────────────────────────────────────
# Extractive summarization — picks the most important sentence
# directly from article text. No API, no cost, works offline.
#
# HOW IT WORKS:
# LSA (Latent Semantic Analysis) algorithm scores each sentence
# by how much information it contains relative to the whole text.
# The top scoring sentence becomes the summary.
# ─────────────────────────────────────────────────────────────────

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from database import SessionLocal, Article
import nltk

# Download required NLTK data on first run
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)

def summarize_text(title: str, description: str) -> str:
    # ─────────────────────────────────────────────────────────────
    # Combines title + description and extracts the best sentence.
    # Falls back to first 150 chars of description if text too short.
    # ─────────────────────────────────────────────────────────────
    text = f"{title}. {description or ''}".strip()

    if len(text) < 50:
        return description[:150] if description else ""

    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summary = summarizer(parser.document, sentences_count=1)

        if summary:
            return str(summary[0])
        return description[:150] if description else ""

    except Exception as e:
        print(f"[Summarizer] Error: {e}")
        return description[:150] if description else ""


def run_summarizer_engine(limit: int = 50):
    db = SessionLocal()

    unsummarized = db.query(Article)\
                     .filter(Article.summary == None)\
                     .filter(Article.sentiment != None)\
                     .filter(Article.tickers != None)\
                     .filter(Article.tickers != "")\
                     .limit(limit)\
                     .all()

    print(f"[Summarizer] Found {len(unsummarized)} articles to summarize")

    summarized = 0
    for article in unsummarized:
        summary = summarize_text(article.title, article.description)
        if summary:
            article.summary = summary
            summarized += 1

    db.commit()
    db.close()
    print(f"[Summarizer] Done. Summarized {summarized} articles.")