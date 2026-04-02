#!/usr/bin/env python3
"""
Step 1: Parse CSV → data/races-raw.json
Groups rows by (race_url, town), collects distances, parses dates.
Supports the new ultres_calendar.csv format.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data/raw/ultres_calendar.csv"
OUTPUT_PATH = ROOT / "data/races-raw.json"

KIDS_KEYWORDS = [
    'cadet', 'juvenil', 'junior', 'jove', 'nens', 'mini',
    'infant', 'kids', 'escolar', 'benjamí', 'aleví', 'prebenjamí',
]


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[àáâãäå]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[·''·]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def parse_date_end(date_display, date_iso):
    """
    Extract dateEnd from date_display for multi-day events.
    date_iso is the already-parsed start date (YYYY-MM-DD).
    Returns dateEnd ISO string or None.
    """
    if not date_display or not date_iso:
        return None
    s = date_display.strip()
    year = date_iso[:4]

    # Cross-month: 29/8-05/09/2026
    m = re.match(r"^(\d{1,2})/(\d{1,2})-(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        _, _, d2, mo2, y = m.groups()
        return f"{y}-{int(mo2):02d}-{int(d2):02d}"

    # Same-month: 11-12/04/2026
    m = re.match(r"^(\d{1,2})-(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        _, d2, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d2):02d}"

    return None


def parse_price(price_str):
    """Returns (price_float_or_None, sold_out_bool)."""
    if not price_str or not price_str.strip():
        return None, False
    s = price_str.strip().upper()
    if "SOLD OUT" in s:
        return None, True
    s = re.sub(r"[€\s]", "", price_str)
    try:
        return float(s), False
    except ValueError:
        return None, False


def is_kids_name(name):
    nl = name.lower()
    return any(k in nl for k in KIDS_KEYWORDS)


def main():
    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8")))
    print(f"Read {len(rows)} CSV rows from {CSV_PATH}")

    # Filter out suspended/cancelled
    rows = [r for r in rows if r["status"] not in ("SUSPESA", "Cancelled", "CANCEL·LADA")]
    print(f"After removing suspended/cancelled: {len(rows)} rows")

    # Group by (race_url, town)
    groups = {}
    group_order = []
    for row in rows:
        key = (row["race_url"].strip(), row["town"].strip())
        if key not in groups:
            groups[key] = []
            group_order.append(key)
        groups[key].append(row)

    print(f"Grouped into {len(group_order)} events")

    events = []
    seen_ids = {}

    for key in group_order:
        group_rows = groups[key]
        url, town = key

        # Event name: use the non-kids row name if available, else first row
        main_rows = [r for r in group_rows if not is_kids_name(r["race_name"])]
        event_name = (main_rows[0] if main_rows else group_rows[0])["race_name"].strip()
        province = group_rows[0]["province"].strip()
        status = group_rows[0]["status"].strip()

        # Date: use first row with a date (already ISO)
        date_iso = None
        date_end_iso = None
        for row in group_rows:
            if row["date"].strip():
                date_iso = row["date"].strip()
                date_end_iso = parse_date_end(row.get("date_display", ""), date_iso)
                break

        sold_out = False
        kids_run = False

        # Build distances
        distances = []
        for row in group_rows:
            km_str = row["distance_km"].strip()
            row_name = row["race_name"].strip()

            if is_kids_name(row_name):
                kids_run = True

            if not km_str:
                continue

            try:
                km = float(km_str)
            except ValueError:
                print(f"  WARNING: bad km value {km_str!r} for {event_name}", file=sys.stderr)
                continue

            elev_str = row["elevation_m"].strip()
            elev = None
            if elev_str:
                try:
                    elev = int(float(elev_str))
                except ValueError:
                    pass

            price, row_sold_out = parse_price(row["price"])
            if row_sold_out:
                sold_out = True

            dist = {"km": km}
            if elev is not None:
                dist["elevationGain"] = elev
            if price is not None:
                dist["price"] = price
            if row_name != event_name:
                dist["variantName"] = row_name

            distances.append(dist)

        # Sort distances descending by km
        distances.sort(key=lambda d: d["km"], reverse=True)

        # Generate ID
        base_id = slugify(event_name)
        if base_id not in seen_ids:
            seen_ids[base_id] = town
            event_id = base_id
        else:
            event_id = f"{base_id}-{slugify(town)}"
            seen_ids[event_id] = town

        event = {
            "id": event_id,
            "name": event_name,
            "url": url,
            "date": date_iso,
            "town": town,
            "province": province,
            "status": status,
            "distances": distances,
        }

        if date_end_iso:
            event["dateEnd"] = date_end_iso
        if sold_out:
            event["soldOut"] = True
        if kids_run:
            event["kidsRun"] = True

        events.append(event)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    kids_count = sum(1 for e in events if e.get("kidsRun"))
    print(f"Wrote {len(events)} events to {OUTPUT_PATH} ({kids_count} with kidsRun)")


if __name__ == "__main__":
    main()
