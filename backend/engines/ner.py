# ner.py
# Only extracts tickers we explicitly know about.
# No more random uppercase words being treated as stocks.

import re
from database import SessionLocal, Article

COMPANY_TO_TICKER = {
    # Big Tech
    "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL",
    "alphabet": "GOOGL", "amazon": "AMZN", "meta": "META",
    "facebook": "META", "tesla": "TSLA", "nvidia": "NVDA",
    "netflix": "NFLX", "intel": "INTC", "amd": "AMD",
    "qualcomm": "QCOM", "broadcom": "AVGO", "salesforce": "CRM",
    "oracle": "ORCL", "ibm": "IBM", "cisco": "CSCO",
    # Finance
    "goldman sachs": "GS", "goldman": "GS", "jpmorgan": "JPM",
    "jp morgan": "JPM", "morgan stanley": "MS",
    "bank of america": "BAC", "citigroup": "C",
    "wells fargo": "WFC", "blackrock": "BLK", "visa": "V",
    "mastercard": "MA", "paypal": "PYPL", "american express": "AXP",
    # Healthcare
    "johnson & johnson": "JNJ", "pfizer": "PFE",
    "unitedhealth": "UNH", "abbvie": "ABBV",
    "eli lilly": "LLY", "moderna": "MRNA",
    # Energy
    "exxon": "XOM", "chevron": "CVX", "shell": "SHEL",
    # Consumer
    "walmart": "WMT", "coca cola": "KO", "pepsi": "PEP",
    "nike": "NKE", "disney": "DIS", "mcdonald": "MCD",
    "starbucks": "SBUX",
    # Indices
    "s&p 500": "SPY", "nasdaq": "QQQ", "dow jones": "DIA",
    # Crypto
    "bitcoin": "BTC", "ethereum": "ETH",
    # Indian Markets
    "reliance": "RELIANCE", "tcs": "TCS", "infosys": "INFY",
    "wipro": "WIPRO", "hdfc": "HDFCBANK", "icici": "ICICIBANK",
    "maruti": "MARUTI", "tata motors": "TATAMOTORS",
    "sun pharma": "SUNPHARMA", "lic": "LICI",
    "ntpc": "NTPC", "nifty": "NIFTY50", "sensex": "SENSEX",
}

# Only known tickers — no random uppercase words
KNOWN_TICKERS = set(COMPANY_TO_TICKER.values())
TICKER_PATTERN = re.compile(r'\b[A-Z]{2,6}\b')

def extract_tickers(text: str) -> list:
    if not text:
        return []

    found_tickers = set()
    text_lower = text.lower()

    # Layer 1 — company name dictionary lookup
    for company, ticker in COMPANY_TO_TICKER.items():
        if company in text_lower:
            found_tickers.add(ticker)

    # Layer 2 — only accept explicitly known tickers
    matches = TICKER_PATTERN.findall(text)
    for match in matches:
        if match in KNOWN_TICKERS:
            found_tickers.add(match)

    return list(found_tickers)

def run_ner_engine():
    db = SessionLocal()
    untagged = db.query(Article)\
                 .filter(Article.tickers == None)\
                 .all()

    print(f"[NER] Found {len(untagged)} untagged articles")
    tagged = 0

    for article in untagged:
        text = f"{article.title} {article.description or ''}"
        tickers = extract_tickers(text)
        article.tickers = ",".join(tickers) if tickers else ""
        tagged += 1
        db.commit()

    db.close()
    print(f"[NER] Done. Tagged {tagged} articles with tickers.")