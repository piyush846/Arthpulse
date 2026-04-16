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
    # ─────────────────────────────────────────────────────────────
    # Registers the fetch function as a recurring job.
    # "interval" trigger = run every N minutes forever.
    #
    # We pass fetch_function as argument instead of importing
    # directly — avoids circular imports between main.py and here.
    # ─────────────────────────────────────────────────────────────
    scheduler.add_job(
        fetch_function,           # function to call
        trigger="interval",       # run on a fixed interval
        minutes=FETCH_INTERVAL_MINUTES,  # every 30 mins (from .env)
        id="news_fetch_job",      # unique ID — prevents duplicate jobs
        replace_existing=True     # if job exists, replace it
    )
    scheduler.start()
    print(f"[Scheduler] Started — fetching every {FETCH_INTERVAL_MINUTES} mins")