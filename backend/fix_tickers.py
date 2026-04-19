from database import SessionLocal, Article
from engines.ner import extract_tickers

db = SessionLocal()
articles = db.query(Article).all()
fixed = 0

for article in articles:
    text = f"{article.title} {article.description or ''}"
    tickers = extract_tickers(text)
    article.tickers = ','.join(tickers) if tickers else ''
    fixed += 1

db.commit()
db.close()
print(f'Fixed {fixed} articles')