from database import SessionLocal, Article

db = SessionLocal()

total = db.query(Article).count()
with_sentiment = db.query(Article).filter(Article.sentiment != None).count()
with_tickers = db.query(Article).filter(Article.tickers != None).filter(Article.tickers != "").count()
with_both = db.query(Article)\
              .filter(Article.sentiment != None)\
              .filter(Article.tickers != None)\
              .filter(Article.tickers != "")\
              .count()
with_summary = db.query(Article).filter(Article.summary != None).count()

print(f"Total articles:        {total}")
print(f"With sentiment:        {with_sentiment}")
print(f"With tickers:          {with_tickers}")
print(f"With both:             {with_both}")
print(f"Already summarized:    {with_summary}")

db.close()