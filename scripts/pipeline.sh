#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== Step 1: Parse CSV ==="
python3 scripts/parse-csv.py

echo ""
echo "=== Step 2: Geocode towns ==="
python3 scripts/geocode-towns.py

echo ""
echo "=== Step 3: Compute drive times ==="
python3 scripts/compute-drive-times.py

echo ""
echo "=== Step 4: Merge ==="
python3 scripts/merge.py

echo ""
echo "Pipeline complete. $(cat data/races.json | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))') events in races.json"
