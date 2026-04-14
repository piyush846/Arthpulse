import feedparser
from datetime import datetime

RSS_FEEDS = {
    "Yahoo Finance":        "https://finance.yahoo.com/news/rssindex",
    "Google News Finance":  "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en",
    "Finviz":               "https://finviz.com/news_feed.ashx",
    "Reuters Business":     "https://feeds.reuters.com/reuters/businessNews",
}

def fetch_rss_articles():
    all_articles = []

    for source_name, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                all_articles.append({
                    "title":        entry.get("title", ""),
                    "description":  entry.get("summary", ""),
                    "content":      entry.get("summary", ""),
                    "url":          entry.get("link", ""),
                    "source":       source_name,
                    "published_at": parse_struct_time(entry.get("published_parsed"))
                })
        except Exception as e:
            print(f"[RSS] Error fetching {source_name}: {e}")

    return all_articles

def parse_struct_time(struct_time):
    if not struct_time:
        return None
    try:
        return datetime(*struct_time[:6])
    except:
        return None