import re
from database import SessionLocal, Article

def strip_html(text):
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', '', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

db = SessionLocal()
articles = db.query(Article).all()
fixed = 0

for article in articles:
    if article.description and '<' in article.description:
        article.description = strip_html(article.description)
        fixed += 1
    if article.content and '<' in article.content:
        article.content = strip_html(article.content)

db.commit()
db.close()
print(f"Fixed {fixed} articles")