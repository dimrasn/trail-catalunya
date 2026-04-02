#!/usr/bin/env python3
"""
Step 1: Parse CSV → data/races-raw.json
Groups rows by (url, town), collects distances, parses dates.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data/raw/trail_catalunya_2026.csv"
OUTPUT_PATH = ROOT / "data/races-raw.json"


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[àáâãäå]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[·'·']", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def parse_date(date_str):
    """Returns (date_iso, date_end_iso). Both may be None."""
    if not date_str or not date_str.strip():
        return None, None
    s = date_str.strip()

    # Cross-month: 29/8-05/09/2026
    m = re.match(r"^(\d{1,2})/(\d{1,2})-(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        d1, mo1, d2, mo2, y = m.groups()
        return f"{y}-{int(mo1):02d}-{int(d1):02d}", f"{y}-{int(mo2):02d}-{int(d2):02d}"

    # Multi-day same month: 21-22/03/2026
    m = re.match(r"^(\d{1,2})-(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        d1, d2, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d1):02d}", f"{y}-{int(mo):02d}-{int(d2):02d}"

    # Single day: 01/03/2026
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}", None

    print(f"  WARNING: unrecognized date format: {date_str!r}", file=sys.stderr)
    return None, None


def parse_price(price_str):
    """Returns (price_float_or_None, sold_out_bool)."""
    if not price_str or not price_str.strip():
        return None, False
    s = price_str.strip().upper()
    if "SOLD OUT" in s:
        return None, True
    # Strip € and parse
    s = re.sub(r"[€\s]", "", price_str)
    try:
        return float(s), False
    except ValueError:
        return None, False


def main():
    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8")))
    print(f"Read {len(rows)} CSV rows from {CSV_PATH}")

    # Filter out Cancelled
    rows = [r for r in rows if r["status"] != "Cancelled"]
    print(f"After removing Cancelled: {len(rows)} rows")

    # Group by (url, town) — preserving CSV order for first-row naming
    groups = {}  # (url, town) → list of rows
    group_order = []  # preserves insertion order
    for row in rows:
        key = (row["url"].strip(), row["town"].strip())
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

        # Event name from first row
        event_name = group_rows[0]["race_name"].strip()
        province = group_rows[0]["province"].strip()
        status = group_rows[0]["status"].strip()

        # Date: use first row that has a date value
        date_iso = None
        date_end_iso = None
        for row in group_rows:
            if row["date"].strip():
                date_iso, date_end_iso = parse_date(row["date"].strip())
                break

        # soldOut: any row with SOLD OUT price
        sold_out = False

        # Build distances
        distances = []
        for row in group_rows:
            km_str = row["distance_km"].strip()
            if not km_str:
                # No distance data for this row — skip adding a distance entry
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

            row_name = row["race_name"].strip()
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
            # Deduplicate with town slug
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

        events.append(event)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(events)} events to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
