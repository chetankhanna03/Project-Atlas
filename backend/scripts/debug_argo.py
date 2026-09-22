"""Compatibility entrypoint: use an explicit CSV instead of an unverified live ingestion API."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ingestion.argo import main

if __name__ == '__main__':
    main()
