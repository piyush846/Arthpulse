from database import SessionLocal,Article
from sqlalchemy.exc import IntegrityError


def store_articles(articles:list):
    db=SessionLocal()
    saved =0
    skipped =0

    for article in articles:
        if not article.get("url") or not article.get("title"):
            skipped +=1
            continue

        db_article=Article(**article)
        try:
            db.add(db_article)
            db.commit()
            saved +=1

        except IntegrityError:
            db.rollback()
            skipped+=1
        except Exception as e:
             db.rollback()
             print(f"[Store] Error saving article : {e}")
             skipped +=1

    db.close()
    print(f'[Store] Saved:{saved} | Skipped(duplicates):{skipped}')