ArthPulse 📊
### Real-Time Financial Intelligence Platform

> **Arth** (अर्थ) = Finance/Meaning in Sanskrit | **Pulse** = Real-time heartbeat of markets

ArthPulse is a full-stack financial intelligence platform that analyzes 1500+ financial news articles daily using FinBERT AI to deliver real-time market sentiment intelligence across Global and Indian markets.

🔗 **Live Demo:** https://arthpulse-z3gm.vercel.app
📦 **Backend API:** https://arthpulse-backend.onrender.com/docs

---

## 🚀 Features

### Intelligence Layer
- **FinBERT Sentiment Analysis** — Domain-specific financial NLP model scores every article from -1.0 (bearish) to +1.0 (bullish)
- **Market Narrative** — Synthesizes hundreds of articles into 3-4 driving themes (Geopolitical Risk, Tech & AI, Fed Policy etc.)
- **Momentum Engine** — Detects if sentiment is SURGING ↑↑, IMPROVING ↑, STABLE →, DECLINING ↓ or CRASHING ↓↓
- **Ticker Extraction (NER)** — Automatically tags articles with relevant stock symbols
- **Sentiment History** — Track how market mood shifted over Today / 7 Days / 30 Days
- **Price Correlation** — Shows how well sentiment predicted actual price movement

### Dashboard Features
- **Live Market Breadth Bar** — Real-time S&P 500, NASDAQ, DOW, NIFTY 50, SENSEX, VIX, Gold, Silver, BTC
- **Fear/Greed Meter** — Overall market mood on a 0-100 scale
- **Top Movers** — Most bullish and bearish tickers right now
- **Sector Breakdown** — Sentiment chart across Technology, Finance, Healthcare, Energy etc.
- **Trending Topics** — Keywords dominating financial news with sentiment color coding
- **Watchlist** — Star any ticker to pin it at the top
- **Sentiment Alerts** — Get notified when a ticker's sentiment crosses your threshold

### India Dashboard 🇮🇳
- Dedicated India tab with NIFTY 50, SENSEX, BANKNIFTY breadth bar
- 50+ Indian stocks tracked (TCS, Infosys, Reliance, HDFC, ICICI etc.)
- India-specific Market Narrative (RBI Policy, IT Sector, Banking & NBFC etc.)
- Indian news sources (Economic Times, Moneycontrol, Business Standard, Mint)

### News Feed
- 1500+ articles from 15+ sources updated every 30 minutes
- Search articles by keyword
- Filter by Positive / Neutral / Negative sentiment
- Article images, ticker tags, sentiment bars

---

## 🛠️ Tech Stack

### Backend
FastAPI          — REST API framework
SQLAlchemy       — ORM + SQLite database
FinBERT          — Financial sentiment analysis (ProsusAI/finbert)
HuggingFace      — Transformers pipeline
APScheduler      — Auto-fetch every 30 minutes
yfinance         — Stock price data
feedparser       — RSS feed parsing
sumy             — Extractive text summarization

### Frontend
React            — UI framework
Recharts         — Charts and data visualization
React Router     — Client-side routing
Axios            — HTTP client

### Data Sources
NewsAPI          — 150,000+ news sources
Yahoo Finance RSS
Google News RSS  — India + Global
Economic Times
Moneycontrol
Business Standard
Mint
Reuters Business
Finviz

### Deployment
Backend  → Render.com (Docker)
Frontend → Vercel

---

## 📸 Screenshots

### Global Dashboard
- Market breadth bar with live prices
- Market Narrative showing driving themes
- Sentiment timeline chart
- Fear/Greed meter + top movers

### India Dashboard
- NIFTY, SENSEX, BANKNIFTY live prices
- Indian stock sentiment grid
- India-specific market narrative

### Ticker Page
- Company info + sector
- Sentiment history chart
- Price overlay chart
- Sentiment vs price correlation score

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────┐
│                    ArthPulse                         │
├─────────────────┬───────────────────────────────────┤
│   Data Pipeline │         Intelligence Layer         │
│                 │                                     │
│  NewsAPI        │  FinBERT Sentiment (-1.0 to +1.0)  │
│  RSS Feeds      │  NER Ticker Extraction              │
│  15+ Sources    │  Momentum Detection                 │
│       ↓         │  Market Narrative Engine            │
│  APScheduler    │  Sector Aggregation                 │
│  (every 30min)  │  Fear/Greed Calculation             │
│       ↓         │                                     │
│  SQLite DB      │  Price Correlation (yfinance)       │
├─────────────────┴───────────────────────────────────┤
│                   FastAPI Backend                     │
│  /api/dashboard  /api/tickers  /api/news             │
│  /api/india/*    /api/market/breadth                 │
├─────────────────────────────────────────────────────┤
│                   React Frontend                      │
│  Global Dashboard  │  India Dashboard  │  Ticker Page │
└─────────────────────────────────────────────────────┘

---

## 🚦 Getting Started

### Prerequisites
Python 3.11+
Node.js 20+
NewsAPI key (free at newsapi.org)

### Backend Setup
```bash
git clone https://github.com/piyush846/Arthpulse
cd arthpulse/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo NEWSAPI_KEY=your_key_here > .env
echo DB_PATH=arthpulse.db >> .env
echo FETCH_INTERVAL_MINUTES=30 >> .env

# Run backend
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd arthpulse/frontend

# Install dependencies
npm install

# Create .env file
echo VITE_API_URL=http://localhost:8000 > .env

# Run frontend
npm run dev
```

Open `http://localhost:5173` 🚀

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Overall market stats + signal |
| `GET /api/dashboard/narrative` | Market narrative themes |
| `GET /api/dashboard/timeline` | Sentiment over time |
| `GET /api/dashboard/sectors` | Sector sentiment breakdown |
| `GET /api/dashboard/movers` | Top bullish/bearish tickers |
| `GET /api/news` | Paginated news feed |
| `GET /api/news/ticker/{ticker}` | News by ticker |
| `GET /api/tickers` | All tickers with sentiment |
| `GET /api/ticker/{ticker}/info` | Company info + stats |
| `GET /api/ticker/{ticker}/history` | Sentiment history |
| `GET /api/ticker/{ticker}/prices` | Price history |
| `GET /api/ticker/{ticker}/correlation` | Sentiment-price correlation |
| `GET /api/market/breadth` | Live market indicators |
| `GET /api/india/*` | India-specific endpoints |

Full interactive API docs at `/docs`

---

## 🧠 How FinBERT Works

FinBERT is a BERT model fine-tuned specifically on financial text. Unlike generic sentiment models, it understands financial jargon:
"Fed signals hawkish stance"     → -0.81 (bearish — rate hike signal)
"Revenue beat estimates by 3%"   → +0.89 (bullish — strong earnings)
"Markets rally on strong jobs"   → +0.94 (bullish — economic strength)
"Recession fears mount"          → -0.97 (bearish — economic concern)

Scores range from -1.0 (extremely bearish) to +1.0 (extremely bullish).

---

## 📈 What Makes ArthPulse Different

| Feature | Bloomberg | Moneycontrol | ArthPulse |
|---------|-----------|--------------|-----------|
| Real-time sentiment | ✅ ($2000/mo) | ❌ | ✅ Free |
| Market Narrative | ✅ | ❌ | ✅ |
| India + Global | ✅ | India only | ✅ |
| Price correlation | ✅ | ❌ | ✅ |
| Open source | ❌ | ❌ | ✅ |

---

## 🔮 Roadmap

- [ ] Watchlist sync across devices
- [ ] Email/push notifications for alerts
- [ ] More Indian news sources
- [ ] Portfolio tracker integration
- [ ] Earnings calendar with sentiment preview
- [ ] WhatsApp/Telegram bot integration

---

## 👨‍💻 Built By

**Piyush** — Final year B.Tech (AI & Data Science)

Built as a portfolio project to demonstrate full-stack development with real AI/NLP integration.

- GitHub: [@piyush846](https://github.com/piyush846)
- Live: [arthpulse-z3gm.vercel.app](https://arthpulse-z3gm.vercel.app)

---

## 📄 License

MIT License — free to use, modify and distribute.

---

*ArthPulse — Because every market move has a story behind it.*