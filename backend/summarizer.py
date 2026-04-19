from engines.summarizer import run_summarizer_engine

# Run in batches of 50 until all articles are summarized
for i in range(20):
    run_summarizer_engine(limit=50)
    print(f"Batch {i+1} done")