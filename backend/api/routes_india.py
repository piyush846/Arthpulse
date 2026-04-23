# routes_india.py
# ─────────────────────────────────────────────────────────────────
# All India-specific endpoints.
# Powers the India tab on the ArthPulse dashboard.
# ─────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Article
from collections import defaultdict

router = APIRouter()

# ─────────────────────────────────────────────────────────────────
# Indian ticker definitions
# ─────────────────────────────────────────────────────────────────
INDIA_TICKERS = {
    # IT
    "TCS":        { "name": "Tata Consultancy Services", "sector": "IT",          "yf": "TCS.NS" },
    "INFY":       { "name": "Infosys Limited",           "sector": "IT",          "yf": "INFY.NS" },
    "WIPRO":      { "name": "Wipro Limited",             "sector": "IT",          "yf": "WIPRO.NS" },
    "HCLTECH":    { "name": "HCL Technologies",          "sector": "IT",          "yf": "HCLTECH.NS" },
    "TECHM":      { "name": "Tech Mahindra",             "sector": "IT",          "yf": "TECHM.NS" },

    # Banking & Finance
    "HDFCBANK":   { "name": "HDFC Bank",                 "sector": "Banking",     "yf": "HDFCBANK.NS" },
    "ICICIBANK":  { "name": "ICICI Bank",                "sector": "Banking",     "yf": "ICICIBANK.NS" },
    "SBIN":       { "name": "State Bank of India",       "sector": "Banking",     "yf": "SBIN.NS" },
    "KOTAKBANK":  { "name": "Kotak Mahindra Bank",       "sector": "Banking",     "yf": "KOTAKBANK.NS" },
    "AXISBANK":   { "name": "Axis Bank",                 "sector": "Banking",     "yf": "AXISBANK.NS" },
    "BAJFINANCE": { "name": "Bajaj Finance",             "sector": "Finance",     "yf": "BAJFINANCE.NS" },
    "LICI":       { "name": "LIC of India",              "sector": "Insurance",   "yf": "LICI.NS" },

    # Energy & Oil
    "RELIANCE":   { "name": "Reliance Industries",       "sector": "Energy",      "yf": "RELIANCE.NS" },
    "ONGC":       { "name": "Oil & Natural Gas Corp",    "sector": "Energy",      "yf": "ONGC.NS" },
    "NTPC":       { "name": "NTPC Limited",              "sector": "Energy",      "yf": "NTPC.NS" },
    "POWERGRID":  { "name": "Power Grid Corp",           "sector": "Energy",      "yf": "POWERGRID.NS" },
    "ADANIGREEN": { "name": "Adani Green Energy",        "sector": "Energy",      "yf": "ADANIGREEN.NS" },

    # Auto
    "MARUTI":     { "name": "Maruti Suzuki",             "sector": "Auto",        "yf": "MARUTI.NS" },
    "TATAMOTORS": { "name": "Tata Motors",               "sector": "Auto",        "yf": "TATAMOTORS.NS" },
    "M&M":        { "name": "Mahindra & Mahindra",       "sector": "Auto",        "yf": "M&M.NS" },
    "BAJAJ-AUTO": { "name": "Bajaj Auto",                "sector": "Auto",        "yf": "BAJAJ-AUTO.NS" },

    # Healthcare
    "SUNPHARMA":  { "name": "Sun Pharmaceutical",        "sector": "Healthcare",  "yf": "SUNPHARMA.NS" },
    "DRREDDY":    { "name": "Dr Reddy's Laboratories",   "sector": "Healthcare",  "yf": "DRREDDY.NS" },
    "CIPLA":      { "name": "Cipla Limited",             "sector": "Healthcare",  "yf": "CIPLA.NS" },

    # Consumer
    "HINDUNILVR": { "name": "Hindustan Unilever",        "sector": "Consumer",    "yf": "HINDUNILVR.NS" },
    "ITC":        { "name": "ITC Limited",               "sector": "Consumer",    "yf": "ITC.NS" },
    "NESTLEIND":  { "name": "Nestle India",              "sector": "Consumer",    "yf": "NESTLEIND.NS" },

    # Metals & Mining
    "TATASTEEL":  { "name": "Tata Steel",                "sector": "Metals",      "yf": "TATASTEEL.NS" },
    "JSWSTEEL":   { "name": "JSW Steel",                 "sector": "Metals",      "yf": "JSWSTEEL.NS" },
    "HINDALCO":   { "name": "Hindalco Industries",       "sector": "Metals",      "yf": "HINDALCO.NS" },

    # Indices
    "NIFTY50":    { "name": "Nifty 50",                  "sector": "Index",       "yf": "^NSEI" },
    "SENSEX":     { "name": "BSE Sensex",                "sector": "Index",       "yf": "^BSESN" },
    "BANKNIFTY":  { "name": "Bank Nifty",                "sector": "Index",       "yf": "^NSEBANK" },
   # Add to INDIA_TICKERS:

# More IT
"MPHASIS":    { "name": "Mphasis Limited",           "sector": "IT",          "yf": "MPHASIS.NS" },
"LTIM":       { "name": "LTIMindtree",               "sector": "IT",          "yf": "LTIM.NS" },
"PERSISTENT": { "name": "Persistent Systems",        "sector": "IT",          "yf": "PERSISTENT.NS" },
"COFORGE":    { "name": "Coforge Limited",           "sector": "IT",          "yf": "COFORGE.NS" },

# More Banking
"INDUSINDBK": { "name": "IndusInd Bank",             "sector": "Banking",     "yf": "INDUSINDBK.NS" },
"FEDERALBNK": { "name": "Federal Bank",              "sector": "Banking",     "yf": "FEDERALBNK.NS" },
"BANDHANBNK": { "name": "Bandhan Bank",              "sector": "Banking",     "yf": "BANDHANBNK.NS" },
"PNB":        { "name": "Punjab National Bank",      "sector": "Banking",     "yf": "PNB.NS" },
"BANKBARODA": { "name": "Bank of Baroda",            "sector": "Banking",     "yf": "BANKBARODA.NS" },

# More Finance
"BAJAJFINSV": { "name": "Bajaj Finserv",             "sector": "Finance",     "yf": "BAJAJFINSV.NS" },
"HDFCLIFE":   { "name": "HDFC Life Insurance",       "sector": "Insurance",   "yf": "HDFCLIFE.NS" },
"SBILIFE":    { "name": "SBI Life Insurance",        "sector": "Insurance",   "yf": "SBILIFE.NS" },
"ICICIGI":    { "name": "ICICI General Insurance",   "sector": "Insurance",   "yf": "ICICIGI.NS" },
"MUTHOOTFIN": { "name": "Muthoot Finance",           "sector": "Finance",     "yf": "MUTHOOTFIN.NS" },

# More Energy
"ADANIPORTS": { "name": "Adani Ports & SEZ",         "sector": "Infrastructure", "yf": "ADANIPORTS.NS" },
"ADANIENT":   { "name": "Adani Enterprises",         "sector": "Conglomerate","yf": "ADANIENT.NS" },
"TATAPOWER":  { "name": "Tata Power",                "sector": "Energy",      "yf": "TATAPOWER.NS" },
"COALINDIA":  { "name": "Coal India",                "sector": "Energy",      "yf": "COALINDIA.NS" },
"BPCL":       { "name": "Bharat Petroleum",          "sector": "Energy",      "yf": "BPCL.NS" },
"IOC":        { "name": "Indian Oil Corporation",    "sector": "Energy",      "yf": "IOC.NS" },
"GAIL":       { "name": "GAIL India",                "sector": "Energy",      "yf": "GAIL.NS" },

# More Auto
"HEROMOTOCO": { "name": "Hero MotoCorp",             "sector": "Auto",        "yf": "HEROMOTOCO.NS" },
"EICHERMOT":  { "name": "Eicher Motors",             "sector": "Auto",        "yf": "EICHERMOT.NS" },
"ASHOKLEY":   { "name": "Ashok Leyland",             "sector": "Auto",        "yf": "ASHOKLEY.NS" },
"BOSCHLTD":   { "name": "Bosch India",               "sector": "Auto",        "yf": "BOSCHLTD.NS" },

# More Healthcare
"AUROPHARMA": { "name": "Aurobindo Pharma",          "sector": "Healthcare",  "yf": "AUROPHARMA.NS" },
"DIVISLAB":   { "name": "Divi's Laboratories",       "sector": "Healthcare",  "yf": "DIVISLAB.NS" },
"BIOCON":     { "name": "Biocon Limited",            "sector": "Healthcare",  "yf": "BIOCON.NS" },
"APOLLOHOSP": { "name": "Apollo Hospitals",          "sector": "Healthcare",  "yf": "APOLLOHOSP.NS" },
"MAXHEALTH":  { "name": "Max Healthcare",            "sector": "Healthcare",  "yf": "MAXHEALTH.NS" },

# More Consumer
"DABUR":      { "name": "Dabur India",               "sector": "Consumer",    "yf": "DABUR.NS" },
"MARICO":     { "name": "Marico Limited",            "sector": "Consumer",    "yf": "MARICO.NS" },
"GODREJCP":   { "name": "Godrej Consumer Products", "sector": "Consumer",    "yf": "GODREJCP.NS" },
"BRITANNIA":  { "name": "Britannia Industries",      "sector": "Consumer",    "yf": "BRITANNIA.NS" },
"TATACONSUM": { "name": "Tata Consumer Products",   "sector": "Consumer",    "yf": "TATACONSUM.NS" },
"VBL":        { "name": "Varun Beverages",           "sector": "Consumer",    "yf": "VBL.NS" },

# More Metals
"SAIL":       { "name": "Steel Authority of India",  "sector": "Metals",      "yf": "SAIL.NS" },
"NMDC":       { "name": "NMDC Limited",              "sector": "Metals",      "yf": "NMDC.NS" },
"VEDL":       { "name": "Vedanta Limited",           "sector": "Metals",      "yf": "VEDL.NS" },

# Telecom
"BHARTIARTL": { "name": "Bharti Airtel",             "sector": "Telecom",     "yf": "BHARTIARTL.NS" },
"IDEA":       { "name": "Vodafone Idea",             "sector": "Telecom",     "yf": "IDEA.NS" },

# Infrastructure & Real Estate
"DLF":        { "name": "DLF Limited",               "sector": "Real Estate", "yf": "DLF.NS" },
"GODREJPROP": { "name": "Godrej Properties",         "sector": "Real Estate", "yf": "GODREJPROP.NS" },
"OBEROIRLTY": { "name": "Oberoi Realty",             "sector": "Real Estate", "yf": "OBEROIRLTY.NS" },
"ULTRACEMCO": { "name": "UltraTech Cement",          "sector": "Infrastructure", "yf": "ULTRACEMCO.NS" },
"GRASIM":     { "name": "Grasim Industries",         "sector": "Infrastructure", "yf": "GRASIM.NS" },
"LT":         { "name": "Larsen & Toubro",           "sector": "Infrastructure", "yf": "LT.NS" },

# New Age Tech
"ZOMATO":     { "name": "Zomato Limited",            "sector": "Tech",        "yf": "ZOMATO.NS" },
"PAYTM":      { "name": "One 97 Communications",     "sector": "Fintech",     "yf": "PAYTM.NS" },
"NYKAA":      { "name": "FSN E-Commerce (Nykaa)",    "sector": "E-Commerce",  "yf": "NYKAA.NS" },
"POLICYBZR":  { "name": "PB Fintech (PolicyBazaar)", "sector": "Fintech",     "yf": "POLICYBZR.NS" },
"DELHIVERY":  { "name": "Delhivery Limited",         "sector": "Logistics",   "yf": "DELHIVERY.NS" },

# More Indices
"MIDCAP":     { "name": "Nifty Midcap 100",          "sector": "Index",       "yf": "^NSEMDCP50" },
"NIFTYIT":    { "name": "Nifty IT Index",            "sector": "Index",       "yf": "^CNXIT" },
"NIFTYPHARMA":{ "name": "Nifty Pharma Index",        "sector": "Index",       "yf": "^CNXPHARMA" },
}

INDIA_TICKER_SYMBOLS = set(INDIA_TICKERS.keys())

# Keywords that indicate Indian market news
INDIA_KEYWORDS = [
    "zomato", "paytm", "nykaa", "delhivery", "airtel", "bharti",
    "dlf", "larsen", "toubro", "ultratech", "cement", "vedanta",
    "coal india", "bpcl", "ioc", "gail", "tata power", "adani",
    "bajaj finserv", "muthoot", "apollo", "biocon", "aurobindo",
    "hero motocorp", "eicher", "ashok leyland", "dabur", "marico",
    "britannia", "godrej", "sebi", "ipo", "fii", "dii", "nse", "bse",
    "india", "indian", "nifty", "sensex", "rupee", "inr", "mumbai",
    "rbi", "reserve bank", "repo rate", "inflation", "budget", "modi",
    "reliance", "tcs", "infosys", "wipro", "hdfc", "icici", "sbi",
    "bajaj", "maruti", "tata", "mahindra", "finance minister"
]


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 1: GET /api/india/breadth
# ─────────────────────────────────────────────────────────────────
@router.get("/india/breadth")
def get_india_breadth():
    import requests

    INDIA_SYMBOLS = {
        "NIFTY 50":   "%5ENSEI",
        "SENSEX":     "%5EBSESN",
        "BANK NIFTY": "%5ENSEBANK",
        "USD/INR":    "INR%3DX",
        "GOLD":       "GC%3DF",
        "SILVER":     "SI%3DF",
        "CRUDE OIL":  "USO",
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    result = []
    for name, symbol in INDIA_SYMBOLS.items():
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2d"
            res = requests.get(url, headers=headers, timeout=10)
            data = res.json()

            closes = data['chart']['result'][0]['indicators']['quote'][0]['close']
            closes = [c for c in closes if c is not None]

            if len(closes) < 1:
                continue

            current = closes[-1]
            prev = closes[-2] if len(closes) >= 2 else current
            change = current - prev
            change_pct = (change / prev) * 100 if prev else 0

            result.append({
                "name":       name,
                "symbol":     symbol,
                "price":      round(current, 2),
                "change":     round(change, 2),
                "change_pct": round(change_pct, 2),
                "positive":   change >= 0
            })

        except Exception as e:
            print(f"[India Breadth] Error {name}: {e}")
            continue

    return result


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 2: GET /api/india/tickers
# ─────────────────────────────────────────────────────────────────
@router.get("/india/tickers")
def get_india_tickers(db: Session = Depends(get_db)):
    # Returns only Indian tickers with sentiment data
    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    ticker_data = defaultdict(lambda: {
        "scores": [],
        "latest_title": ""
    })

    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()
            # Only include Indian tickers
            if ticker in INDIA_TICKER_SYMBOLS:
                ticker_data[ticker]["scores"].append(article.sentiment)
                ticker_data[ticker]["latest_title"] = article.title

    result = []
    for ticker, data in ticker_data.items():
        scores = data["scores"]
        avg = round(sum(scores) / len(scores), 4)
        info = INDIA_TICKERS.get(ticker, {})

        result.append({
            "ticker":        ticker,
            "name":          info.get("name", ticker),
            "sector":        info.get("sector", "Unknown"),
            "avg_sentiment": avg,
            "article_count": len(scores),
            "latest_title":  data["latest_title"],
            "signal":        get_india_signal(avg)
        })

    result.sort(key=lambda x: x["article_count"], reverse=True)
    return result


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 3: GET /api/india/news
# ─────────────────────────────────────────────────────────────────
@router.get("/india/news")
def get_india_news(
    limit: int = 30,
    skip: int = 0,
    q: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Article)\
              .filter(Article.sentiment != None)

    if q:
        query = query.filter(
            Article.title.ilike(f"%{q}%") |
            Article.description.ilike(f"%{q}%")
        )
    else:
        # Simple keyword filter — check title for India-related terms
        # Using simple LIKE instead of massive OR chain
        india_filter = (
            Article.title.ilike("%india%") |
            Article.title.ilike("%nifty%") |
            Article.title.ilike("%sensex%") |
            Article.title.ilike("%rupee%") |
            Article.title.ilike("%rbi%") |
            Article.title.ilike("%sebi%") |
            Article.title.ilike("%tcs%") |
            Article.title.ilike("%infosys%") |
            Article.title.ilike("%reliance%") |
            Article.title.ilike("%wipro%") |
            Article.title.ilike("%hdfc%") |
            Article.title.ilike("%icici%") |
            Article.title.ilike("%adani%") |
            Article.title.ilike("%tata%") |
            Article.title.ilike("%bajaj%") |
            Article.title.ilike("%maruti%") |
            Article.title.ilike("%zomato%") |
            Article.title.ilike("%paytm%") |
            Article.title.ilike("%airtel%") |
            Article.title.ilike("%bse%") |
            Article.title.ilike("%nse%") |
            Article.tickers.ilike("%TCS%") |
            Article.tickers.ilike("%INFY%") |
            Article.tickers.ilike("%RELIANCE%") |
            Article.tickers.ilike("%HDFCBANK%") |
            Article.tickers.ilike("%ICICIBANK%") |
            Article.tickers.ilike("%NIFTY50%") |
            Article.tickers.ilike("%SENSEX%")
        )
        query = query.filter(india_filter)

    articles = query\
        .order_by(Article.fetched_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

    return [format_india_article(a) for a in articles]


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 4: GET /api/india/movers
# ─────────────────────────────────────────────────────────────────
@router.get("/india/movers")
def get_india_movers(db: Session = Depends(get_db)):
    articles = db.query(Article)\
                 .filter(Article.tickers != None)\
                 .filter(Article.tickers != "")\
                 .filter(Article.sentiment != None)\
                 .all()

    ticker_scores = defaultdict(list)
    ticker_titles = {}

    for article in articles:
        tickers = article.tickers.split(",")
        for ticker in tickers:
            ticker = ticker.strip()
            if ticker in INDIA_TICKER_SYMBOLS:
                ticker_scores[ticker].append(article.sentiment)
                ticker_titles[ticker] = article.title

    all_tickers = []
    for ticker, scores in ticker_scores.items():
        avg = round(sum(scores) / len(scores), 4)
        info = INDIA_TICKERS.get(ticker, {})
        all_tickers.append({
            "ticker":        ticker,
            "name":          info.get("name", ticker),
            "avg_sentiment": avg,
            "article_count": len(scores),
            "latest_title":  ticker_titles[ticker],
            "signal":        get_india_signal(avg)
        })

    all_tickers.sort(key=lambda x: x["avg_sentiment"], reverse=True)
    return {
        "bullish": all_tickers[:5],
        "bearish": all_tickers[-5:][::-1] if len(all_tickers) >= 5 else []
    }


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 5: GET /api/india/narrative
# ─────────────────────────────────────────────────────────────────
@router.get("/india/narrative")
def get_india_narrative(db: Session = Depends(get_db)):
    from collections import defaultdict

    INDIA_THEMES = {
        "RBI & Monetary Policy": {
            "keywords": ["rbi", "reserve bank", "repo rate", "inflation",
                        "monetary", "interest rate", "governor", "shaktikanta"],
            "icon": "🏦"
        },
        "IT & Tech Sector": {
            "keywords": ["tcs", "infosys", "wipro", "hcl", "tech mahindra",
                        "it sector", "software", "outsourcing", "attrition",
                        "deal win", "revenue guidance"],
            "icon": "💻"
        },
        "Indian Economy": {
            "keywords": ["gdp", "india economy", "budget", "fiscal",
                        "government", "modi", "finance minister", "nirmala",
                        "growth", "manufacturing", "pli scheme"],
            "icon": "🇮🇳"
        },
        "Banking & NBFC": {
            "keywords": ["hdfc", "icici", "sbi", "kotak", "axis bank",
                        "npa", "credit growth", "loan", "deposit",
                        "bajaj finance", "nbfc"],
            "icon": "🏛️"
        },
        "Markets & FII": {
            "keywords": ["nifty", "sensex", "fii", "dii", "foreign",
                        "institutional", "rally", "selloff", "ipo",
                        "sebi", "derivatives"],
            "icon": "📈"
        },
        "Energy & Commodities": {
            "keywords": ["reliance", "ongc", "oil", "gas", "adani",
                        "power", "electricity", "coal", "renewable",
                        "solar", "ntpc"],
            "icon": "⚡"
        },
    }

    articles = db.query(Article)\
                 .filter(Article.sentiment != None)\
                 .order_by(Article.fetched_at.desc())\
                 .limit(100)\
                 .all()

    total = len(articles)
    if total == 0:
        return []

    theme_data = defaultdict(lambda: {"articles": [], "scores": []})

    for article in articles:
        text = f"{article.title} {article.description or ''}".lower()
        for theme_name, theme_info in INDIA_THEMES.items():
            matches = sum(1 for kw in theme_info["keywords"] if kw in text)
            if matches >= 1:
                theme_data[theme_name]["articles"].append(article)
                theme_data[theme_name]["scores"].append(article.sentiment)

    narrative = []
    for theme_name, data in theme_data.items():
        if len(data["articles"]) < 2:
            continue

        scores = data["scores"]
        avg = round(sum(scores) / len(scores), 4)
        dominance = round(len(data["articles"]) / total * 100, 1)

        if avg >= 0.3:     direction, color = "BULLISH", "green"
        elif avg >= 0.1:   direction, color = "SLIGHTLY BULLISH", "green"
        elif avg > -0.1:   direction, color = "NEUTRAL", "yellow"
        elif avg > -0.3:   direction, color = "SLIGHTLY BEARISH", "red"
        else:              direction, color = "BEARISH", "red"

        narrative.append({
            "theme":           theme_name,
            "icon":            INDIA_THEMES[theme_name]["icon"],
            "article_count":   len(data["articles"]),
            "dominance":       dominance,
            "avg_sentiment":   avg,
            "direction":       direction,
            "direction_color": color,
            "top_headline":    data["articles"][0].title
        })

    narrative.sort(key=lambda x: x["dominance"], reverse=True)
    return narrative[:4]


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────
def get_india_signal(score: float) -> str:
    if score >= 0.5:   return "BULLISH"
    elif score >= 0.1: return "SLIGHTLY BULLISH"
    elif score > -0.1: return "NEUTRAL"
    elif score > -0.5: return "SLIGHTLY BEARISH"
    else:              return "BEARISH"

def format_india_article(article) -> dict:
    return {
        "id":           article.id,
        "title":        article.title,
        "description":  article.description,
        "url":          article.url,
        "source":       article.source,
        "published_at": str(article.published_at),
        "sentiment":    article.sentiment,
        "tickers":      article.tickers.split(",") if article.tickers else [],
        "summary":      article.summary,
        "image_url":    article.image_url,
    }