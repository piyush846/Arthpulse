import feedparser
import re
from datetime import datetime

RSS_FEEDS = {
    # Global sources
    "Yahoo Finance":        "https://finance.yahoo.com/news/rssindex",
    "Google News Finance":  "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en",
    "Finviz":               "https://finviz.com/news_feed.ashx",
    "Reuters Business":     "https://feeds.reuters.com/reuters/businessNews",

    # Indian sources
    "Economic Times Markets":    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "Economic Times Finance":    "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",
    "Moneycontrol":              "https://www.moneycontrol.com/rss/marketsindia.xml",
    "Business Standard Markets": "https://www.business-standard.com/rss/markets-106.rss",
    "Business Standard Finance": "https://www.business-standard.com/rss/finance-119.rss",
    "Mint Markets":              "https://www.livemint.com/rss/markets",
    "Mint Companies":            "https://www.livemint.com/rss/companies",
    "Financial Express Markets": "https://www.financialexpress.com/market/feed/",
    "NDTV Profit":               "https://feeds.feedburner.com/ndtvprofit-latest",
    "Google News India Finance":  "https://news.google.com/rss/search?q=india+stock+market+nifty+sensex&hl=en-IN&gl=IN&ceid=IN:en",
    "Google News NSE":           "https://news.google.com/rss/search?q=NSE+BSE+nifty+sensex&hl=en-IN&gl=IN&ceid=IN:en",
    "Google News RBI":           "https://news.google.com/rss/search?q=RBI+india+economy+rupee&hl=en-IN&gl=IN&ceid=IN:en",
}


def strip_html(text: str) -> str:
    # ─────────────────────────────────────────────────────────────
    # Removes all HTML tags from text.
    # RSS feeds sometimes return HTML like:
    # <a href="...">article title</a> or <p>description</p>
    # We strip all tags and clean up extra whitespace.
    # ─────────────────────────────────────────────────────────────
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', '', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def fetch_rss_articles():
    all_articles = []

    for source_name, url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                all_articles.append({
                    "title":        strip_html(entry.get("title", "")),
                    "description":  strip_html(entry.get("summary", "")),
                    "content":      strip_html(entry.get("summary", "")),
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