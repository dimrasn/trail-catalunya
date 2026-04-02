#!/usr/bin/env python3
"""
Step 2: Geocode towns → data/towns-geocoded.json
Reads races-raw.json, geocodes new towns via Google Geocoding API.
Only calls API for towns not already in the cache.
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
RACES_RAW_PATH = ROOT / "data/races-raw.json"
CACHE_PATH = ROOT / "data/towns-geocoded.json"

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
RATE_LIMIT_DELAY = 0.1  # 10 req/sec


def geocode_town(town, api_key):
    query = f"{town}, Catalunya, Spain"
    params = urllib.parse.urlencode({"address": query, "key": api_key})
    url = f"{GEOCODING_URL}?{params}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        if data["status"] == "OK":
            loc = data["results"][0]["geometry"]["location"]
            return {"lat": round(loc["lat"], 4), "lng": round(loc["lng"], 4)}
        else:
            print(f"  WARNING: geocode status {data['status']} for {town!r}", file=sys.stderr)
            return None
    except Exception as e:
        print(f"  ERROR geocoding {town!r}: {e}", file=sys.stderr)
        return None


def main():
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY env var not set", file=sys.stderr)
        sys.exit(1)

    races = json.loads(RACES_RAW_PATH.read_text(encoding="utf-8"))
    towns_needed = sorted(set(r["town"] for r in races))
    print(f"Found {len(towns_needed)} unique towns in races-raw.json")

    # Load cache
    cache = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(cache)} cached towns from {CACHE_PATH}")

    new_towns = [t for t in towns_needed if t not in cache]
    print(f"{len(new_towns)} towns need geocoding")

    for i, town in enumerate(new_towns):
        print(f"  [{i+1}/{len(new_towns)}] Geocoding: {town}")
        result = geocode_town(town, api_key)
        if result:
            cache[town] = result
            print(f"    → lat={result['lat']}, lng={result['lng']}")
        else:
            print(f"    → FAILED (skipping)")
        time.sleep(RATE_LIMIT_DELAY)

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)

    print(f"Wrote {len(cache)} towns to {CACHE_PATH}")

    # Report any towns still missing
    missing = [t for t in towns_needed if t not in cache]
    if missing:
        print(f"WARNING: {len(missing)} towns still not geocoded: {missing}", file=sys.stderr)


if __name__ == "__main__":
    main()
