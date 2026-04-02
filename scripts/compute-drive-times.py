#!/usr/bin/env python3
"""
Step 3: Compute drive times → data/towns-drive-times.json
Reads towns-geocoded.json, calls Google Distance Matrix API.
Origin: Plaça Glòries (41.4036, 2.1868).
Batches 25 destinations per API call. Caches results.
Requires: GOOGLE_MAPS_API_KEY env var.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
GEOCODED_PATH = ROOT / "data/towns-geocoded.json"
CACHE_PATH = ROOT / "data/towns-drive-times.json"

DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
ORIGIN = "41.4036,2.1868"  # Plaça Glòries, Barcelona
BATCH_SIZE = 25


def fetch_drive_times(destinations, api_key):
    """
    destinations: list of (town_name, lat, lng)
    Returns dict of town_name → driveMinutes (or None on failure).
    """
    dest_coords = "|".join(f"{lat},{lng}" for _, lat, lng in destinations)
    params = urllib.parse.urlencode({
        "origins": ORIGIN,
        "destinations": dest_coords,
        "mode": "driving",
        "key": api_key,
    })
    url = f"{DISTANCE_MATRIX_URL}?{params}"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  ERROR fetching batch: {e}", file=sys.stderr)
        return {name: None for name, _, _ in destinations}

    if data["status"] != "OK":
        print(f"  WARNING: API status {data['status']}", file=sys.stderr)
        return {name: None for name, _, _ in destinations}

    results = {}
    elements = data["rows"][0]["elements"]
    for (name, _, _), elem in zip(destinations, elements):
        if elem["status"] == "OK":
            duration_secs = elem["duration"]["value"]
            results[name] = round(duration_secs / 60)
        else:
            print(f"  WARNING: no route for {name!r}: {elem['status']}", file=sys.stderr)
            results[name] = None
    return results


def main():
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY env var not set", file=sys.stderr)
        sys.exit(1)

    if not GEOCODED_PATH.exists():
        print(f"ERROR: {GEOCODED_PATH} not found. Run geocode-towns.py first.", file=sys.stderr)
        sys.exit(1)

    geocoded = json.loads(GEOCODED_PATH.read_text(encoding="utf-8"))
    print(f"Loaded {len(geocoded)} geocoded towns")

    # Load cache
    cache = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(cache)} cached drive times from {CACHE_PATH}")

    # Towns needing drive times (must have geocode data)
    needed = [(town, geo["lat"], geo["lng"])
              for town, geo in geocoded.items()
              if town not in cache]
    print(f"{len(needed)} towns need drive time computation")

    if needed:
        # Process in batches of BATCH_SIZE
        batches = [needed[i:i+BATCH_SIZE] for i in range(0, len(needed), BATCH_SIZE)]
        processed = 0
        for batch_num, batch in enumerate(batches):
            print(f"  Batch {batch_num+1}/{len(batches)}: {len(batch)} destinations")
            results = fetch_drive_times(batch, api_key)
            for name, minutes in results.items():
                if minutes is not None:
                    cache[name] = minutes
                    processed += 1
            # Small delay between batches
            if batch_num < len(batches) - 1:
                time.sleep(0.5)
        print(f"  Got drive times for {processed}/{len(needed)} towns")

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)

    print(f"Wrote {len(cache)} drive times to {CACHE_PATH}")

    # Report missing
    missing = [t for t, _, _ in needed if t not in cache]
    if missing:
        print(f"WARNING: {len(missing)} towns still missing drive times: {missing}", file=sys.stderr)


if __name__ == "__main__":
    main()
