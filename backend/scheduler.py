# scheduler.py
# ─────────────────────────────────────────────────────────────────
# PURPOSE: Automatically fetches fresh news every 30 minutes.
#
# WITHOUT scheduler:
# Data only updates when server restarts — stale after 30 mins.
#
# WITH scheduler:
# APScheduler runs a background job every 30 mins silently.
# Server keeps running, users always see fresh data.
#
# WHY BACKGROUND SCHEDULER?
# It runs in a separate thread — doesn't block API requests.
# While a fetch is happening, /api/news still responds normally.
# ─────────────────────────────────────────────────────────────────

from apscheduler.schedulers.background import BackgroundScheduler
from config import FETCH_INTERVAL_MINUTES

# BackgroundScheduler runs jobs in a separate thread
# so it never blocks your API endpoints
scheduler = BackgroundScheduler()

def start_scheduler(fetch_function):
    scheduler.add_job(
        fetch_function,
        trigger="interval",
        minutes=FETCH_INTERVAL_MINUTES,
        id="news_fetch_job",
        replace_existing=True,
        # Wait 5 minutes before first run — gives server time to stabilize
        next_run_time=None
    )
    scheduler.start()
    print(f"[Scheduler] Started — fetching every {FETCH_INTERVAL_MINUTES} mins")