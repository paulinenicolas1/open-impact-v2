# Data Science

This directory is dedicated to data science workflows. It is intentionally separate from the
backend (`src/app/`) and frontend (`frontend/`) so that experiments and pipelines remain
isolated from production code.

## Structure

- `data_acquisition/`: data collection and ingestion scripts (APIs, scraping, dumps).
- `processing/`: data cleaning, feature engineering, and dataset preparation.
- `modeling/`: experiments, training pipelines, and model evaluation artifacts.

## Notes

- Keep raw data out of version control; prefer external storage or `.gitignore` entries.
- Favor typed, reusable modules as pipelines mature.
- When a pipeline stabilizes, consider promoting shared logic into `src/app/services/`.
