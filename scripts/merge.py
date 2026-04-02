#!/usr/bin/env python3
"""
Step 4: Merge geo data into races → data/races.json
Combines races-raw.json + towns-geocoded.json + towns-drive-times.json.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
RACES_RAW_PATH = ROOT / "data/races-raw.json"
GEOCODED_PATH = ROOT / "data/towns-geocoded.json"
DRIVE_TIMES_PATH = ROOT / "data/towns-drive-times.json"
OUTPUT_PATH = ROOT / "data/races.json"


def main():
    races = json.loads(RACES_RAW_PATH.read_text(encoding="utf-8"))
    print(f"Loaded {len(races)} events from races-raw.json")

    geocoded = {}
    if GEOCODED_PATH.exists():
        geocoded = json.loads(GEOCODED_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(geocoded)} geocoded towns")
    else:
        print("WARNING: towns-geocoded.json not found — no lat/lng will be added", file=sys.stderr)

    drive_times = {}
    if DRIVE_TIMES_PATH.exists():
        drive_times = json.loads(DRIVE_TIMES_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(drive_times)} drive times")
    else:
        print("WARNING: towns-drive-times.json not found — no driveMinutes will be added", file=sys.stderr)

    missing_geo = 0
    missing_drive = 0

    for race in races:
        town = race["town"]
        geo = geocoded.get(town)
        if geo:
            race["lat"] = geo["lat"]
            race["lng"] = geo["lng"]
        else:
            missing_geo += 1

        drive = drive_times.get(town)
        if drive is not None:
            race["driveMinutes"] = drive
        else:
            missing_drive += 1

    if missing_geo:
        print(f"WARNING: {missing_geo} events have no lat/lng", file=sys.stderr)
    if missing_drive:
        print(f"WARNING: {missing_drive} events have no driveMinutes", file=sys.stderr)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(races, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(races)} events to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
