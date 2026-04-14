# ner.py
# ─────────────────────────────────────────────────────────────────────
# This engine extracts company names from article titles and maps them
# to stock ticker symbols.
#
# Approach:
# We use a two-layer approach:
# Layer 1 → Direct ticker mention detection (e.g. "AAPL", "TSLA")
# Layer 2 → Company name → ticker mapping dictionary
#
# Why not use a full NER model?
# Full NER models (like spaCy) are accurate but heavy (~500MB).
# For our use case, a well-built dictionary covers 95% of financial
# news since the same ~200 companies appear repeatedly.
# ─────────────────────────────────────────────────────────────────────

import re
from database import SessionLocal, Article

# ─────────────────────────────────────────────────────────────────────
# COMPANY → TICKER MAPPING
# Maps common company name variations to their ticker symbol.
# We cover the most frequently mentioned companies in financial news.
# ─────────────────────────────────────────────────────────────────────
COMPANY_TO_TICKER = {
    # Big Tech
    "apple": "AAPL",
    "microsoft": "MSFT",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "amazon": "AMZN",
    "meta": "META",
    "facebook": "META",
    "tesla": "TSLA",
    "nvidia": "NVDA",
    "netflix": "NFLX",
    "intel": "INTC",
    "amd": "AMD",
    "qualcomm": "QCOM",
    "broadcom": "AVGO",
    "salesforce": "CRM",
    "oracle": "ORCL",
    "ibm": "IBM",
    "cisco": "CSCO",

    # Finance
    "goldman sachs": "GS",
    "goldman": "GS",
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "morgan stanley": "MS",
    "bank of america": "BAC",
    "citigroup": "C",
    "wells fargo": "WFC",
    "blackrock": "BLK",
    "visa": "V",
    "mastercard": "MA",
    "paypal": "PYPL",
    "american express": "AXP",

    # Healthcare
    "johnson & johnson": "JNJ",
    "pfizer": "PFE",
    "unitedhealth": "UNH",
    "abbvie": "ABBV",
    "eli lilly": "LLY",
    "moderna": "MRNA",

    # Energy
    "exxon": "XOM",
    "chevron": "CVX",
    "shell": "SHEL",

    # Consumer
    "walmart": "WMT",
    "coca cola": "KO",
    "pepsi": "PEP",
    "nike": "NKE",
    "disney": "DIS",
    "mcdonald": "MCD",
    "starbucks": "SBUX",

    # Indices / ETFs
    "s&p 500": "SPY",
    "nasdaq": "QQQ",
    "dow jones": "DIA",

    # Crypto
    "bitcoin": "BTC",
    "ethereum": "ETH",

    # Indian Markets
    "reliance": "RELIANCE",
    "tcs": "TCS",
    "infosys": "INFY",
    "wipro": "WIPRO",
    "hdfc": "HDFCBANK",
    "icici": "ICICIBANK",
    "maruti": "MARUTI",
    "tata": "TATAMOTORS",
    "sun pharma": "SUNPHARMA",
    "lic": "LICI",
    "ntpc": "NTPC",
    "nifty": "NIFTY50",
    "sensex": "SENSEX",
}

# Pre-compile regex for direct ticker detection
# Matches 2-5 uppercase letters that look like tickers
# e.g. AAPL, TSLA, GS, AMZN
TICKER_PATTERN = re.compile(r'\b[A-Z]{2,5}\b')

# Words to ignore — common uppercase words that aren't tickers
IGNORE_WORDS = {
    "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL",
    "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET",
    "HAS", "HIM", "HIS", "HOW", "ITS", "NEW", "NOW", "OLD",
    "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "SAY", "SHE",
    "USE", "WAR", "CEO", "IPO", "GDP", "IMF", "FED", "SEC",
    "ETF", "USD", "EUR", "OIL", "GAS", "USA", "INC", "LLC",
    "AI", "IT", "US", "UK", "EU", "UN"
}


def extract_tickers(text: str) -> list:
    # ─────────────────────────────────────────────────────────────────
    # Takes a text string and returns a list of ticker symbols found.
    # Uses two layers:
    # 1. Dictionary lookup — company name → ticker
    # 2. Direct uppercase pattern — catches explicit ticker mentions
    # ─────────────────────────────────────────────────────────────────
    if not text:
        return []

    found_tickers = set()  # use set to avoid duplicates
    text_lower = text.lower()

    # Layer 1 — dictionary lookup
    # Check if any known company name appears in the text
    for company, ticker in COMPANY_TO_TICKER.items():
        if company in text_lower:
            found_tickers.add(ticker)

    # Layer 2 — direct ticker pattern matching
    # Find all 2-5 uppercase letter sequences
    matches = TICKER_PATTERN.findall(text)
    for match in matches:
        if match not in IGNORE_WORDS:
            found_tickers.add(match)

    return list(found_tickers)


def run_ner_engine():
    # ─────────────────────────────────────────────────────────────────
    # Queries DB for articles where tickers is NULL
    # Extracts tickers from title + description
    # Saves as comma-separated string e.g. "AAPL,TSLA,GOOGL"
    # ─────────────────────────────────────────────────────────────────
    db = SessionLocal()

    untagged = db.query(Article)\
                 .filter(Article.tickers == None)\
                 .all()

    print(f"[NER] Found {len(untagged)} untagged articles")

    tagged = 0
    for article in untagged:
        text = f"{article.title} {article.description or ''}"
        tickers = extract_tickers(text)

        if tickers:
            # Store as comma separated string in DB
            article.tickers = ",".join(tickers)
            tagged += 1
        else:
            # Store empty string so we don't reprocess it
            article.tickers = ""

        db.commit()

    db.close()
    print(f"[NER] Done. Tagged {tagged} articles with tickers.")