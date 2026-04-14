import requests
from datetime import datetime
from config import NEWSAPI_KEY

NEWSAPI_URL = "https://newsapi.org/v2/everything"

FINANCE_QUERIES = [
    "stock market",
    "finance",
    "economy",
    "Federal Reserve",
    "inflation",
    "earnings"
]

def fetch_newsapi_articles():
    all_articles = []

    for query in FINANCE_QUERIES:
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "apiKey": NEWSAPI_KEY
        }
        try:
            response = requests.get(NEWSAPI_URL, params=params, timeout=10)
            data = response.json()

            if data.get("status") != "ok":
                print(f"[NewsAPI] Error for query '{query}': {data.get('message')}")
                continue

            for item in data.get("articles", []):
                all_articles.append({
                    "title":        item.get("title", ""),
                    "description":  item.get("description", ""),
                    "content":      item.get("content", ""),
                    "url":          item.get("url", ""),
                    "source":       item.get("source", {}).get("name", ""),
                    "published_at": parse_date(item.get("publishedAt"))
                })

        except Exception as e:
            print(f"[NewsAPI] Exception for query '{query}': {e}")

    return all_articles

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
    except:
        return None