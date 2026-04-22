from dotenv import load_dotenv
import os

load_dotenv()

NEWSAPI_KEY              = os.getenv("NEWSAPI_KEY")
DB_PATH                  = os.getenv("DB_PATH", "arthpulse.db")
FETCH_INTERVAL_MINUTES   = int(os.getenv("FETCH_INTERVAL_MINUTES", 30))
ANTHROPIC_API_KEY        = os.getenv("ANTHROPIC_API_KEY", "")

# CORS — allow both local dev and deployed frontend
ALLOWED_ORIGINS = os.getenv(
    "https://arthpulse-z3gm.vercel.app/",
    "http://localhost:3000,http://localhost:5173"
).split(",")