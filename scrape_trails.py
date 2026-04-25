#!/usr/bin/env python3
"""
scrape_trails.py — Canonical parser for ultrescatalunya.com trail calendar.

This file is the DIAGNOSTIC REFERENCE, not production code. The production
scraper is the Supabase Edge Function at supabase/functions/scrape-trails/,
which ports this exact logic to Deno/TypeScript. Keep the two in sync.

Usage:
    python scrape_trails.py                       # Full scrape + upsert
    python scrape_trails.py --csv-only            # Export CSV only, no Supabase
    python scrape_trails.py --diff-only           # Show changes without writing
    python scrape_trails.py --html-file FILE      # Parse local HTML file (testing)

Env vars required for Supabase mode:
    SUPABASE_URL, SUPABASE_KEY
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from io import StringIO

import requests
from bs4 import BeautifulSoup

# ── Config ────────────────────────────────────────────────────────────────────

CALENDAR_URL = "https://ultrescatalunya.com/calendari-trail-catalunya-2026"
USER_AGENT = "UltresCalendarScraper/1.0 (trail-calendar-project; weekly-update)"
REQUEST_TIMEOUT = 30

# Month name → number mapping (Catalan)
MONTH_MAP = {
    "gener": 1, "febrer": 2, "març": 3, "abril": 4,
    "maig": 5, "juny": 6, "juliol": 7, "agost": 8,
    "setembre": 9, "octubre": 10, "novembre": 11, "desembre": 12,
}

# ── Parsing helpers ───────────────────────────────────────────────────────────

def extract_month_year(header_text: str) -> tuple[str, int, int] | None:
    """Extract month name, month number, and year from a section header.
    Returns (month_name, month_num, year) or None."""
    text = header_text.strip().upper()
    for cat_name, num in MONTH_MAP.items():
        if cat_name.upper() in text:
            year_match = re.search(r"20\d{2}", text)
            year = int(year_match.group()) if year_match else 2026
            return (cat_name.capitalize(), num, year)
    return None


def is_recomanades(header_text: str) -> bool:
    """Check if a header is a RECOMANADES (recommended) section — skip these."""
    return "RECOMANADES" in header_text.upper() or "⭐" in header_text


def parse_distance_elevation(raw: str) -> tuple[str | None, str | None, str | None]:
    """Parse '17,3km D+520m' into (distance_km, elevation_m, raw_string).
    Handles variants: '10km', '21km D+1395m', '1km D+388m', '+190m', etc."""
    if not raw or not raw.strip():
        return (None, None, None)

    raw = raw.strip()

    # Distance: look for number followed by 'km'
    dist_match = re.search(r"([\d,.]+)\s*km", raw, re.IGNORECASE)
    distance_km = dist_match.group(1).replace(".", "").replace(",", ".") if dist_match else None

    # Elevation: look for D+ or just + followed by number and 'm'
    elev_match = re.search(r"D?\+\s*([\d,.]+)\s*m", raw, re.IGNORECASE)
    elevation_m = elev_match.group(1).replace(".", "").replace(",", ".") if elev_match else None

    return (distance_km, elevation_m, raw)


def parse_date_field(raw: str, month_num: int, year: int) -> tuple[str | None, str]:
    """Parse date field. Returns (iso_date_or_none, display_date).
    Handles: '11/04/2026', '17-19/04/2026', 'SUSPESA', empty."""
    if not raw or not raw.strip():
        return (None, "TBD")

    raw = raw.strip()

    if raw.upper() == "SUSPESA":
        return (None, "SUSPESA")

    # Multi-day: '11-12/04/2026', '17-19/04/2026', '29/8-05/09/2026'
    # Check multi-day FIRST (before single-day) to capture the first day
    multi_match = re.match(r"(\d{1,2})[-–]\d{1,2}/(\d{1,2})/(\d{4})", raw)
    if multi_match:
        day, month, yr = int(multi_match.group(1)), int(multi_match.group(2)), int(multi_match.group(3))
        try:
            dt = datetime(yr, month, day)
            return (dt.strftime("%Y-%m-%d"), raw)
        except ValueError:
            return (None, raw)

    # Cross-month multi-day: '29/8-05/09/2026'
    cross_match = re.match(r"(\d{1,2})/(\d{1,2})[-–]\d{1,2}/(\d{1,2})/(\d{4})", raw)
    if cross_match:
        day, month = int(cross_match.group(1)), int(cross_match.group(2))
        yr = int(cross_match.group(4))
        try:
            dt = datetime(yr, month, day)
            return (dt.strftime("%Y-%m-%d"), raw)
        except ValueError:
            return (None, raw)

    # Single day: '11/04/2026'
    date_match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", raw)
    if date_match:
        day, month, yr = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
        try:
            dt = datetime(yr, month, day)
            return (dt.strftime("%Y-%m-%d"), raw)
        except ValueError:
            return (None, raw)

    return (None, raw)


def compute_race_hash(race: dict) -> str:
    """Deterministic hash for deduplication. Based on immutable race identity."""
    key = f"{race['race_name']}|{race['distance_km']}|{race['town']}|{race['month']}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


# ── Main scraper ──────────────────────────────────────────────────────────────

def fetch_page() -> str:
    """Fetch the calendar page HTML."""
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(CALENDAR_URL, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.text


# Default column positions if the header row is missing or unreadable.
# Format: {logical_name: default_index}
DEFAULT_COL_INDEX = {
    "date": 0,
    "name": 1,
    "dist_elev": 2,
    "price": 3,
    "town": 4,
    "province": 5,
}

# Header-text aliases (uppercase, accent-stripped match) used to auto-detect
# column positions from a table's first row.
HEADER_ALIASES = {
    "date": ("DATA",),
    "name": ("CURSA", "NOM", "RACE"),
    "dist_elev": ("DISTANCIA", "DISTANCIA-DESNIVELL", "DISTANCIA DESNIVELL", "KM"),
    "price": ("PREU", "PRICE"),
    "town": ("POBLACIO", "POBLACIÓ", "TOWN"),
    "province": ("PROVINCIA", "PROVÍNCIA", "PROVINCE"),
}


def _strip_accents(s: str) -> str:
    replacements = (
        ("À", "A"), ("Á", "A"), ("Â", "A"), ("Ã", "A"), ("Ä", "A"),
        ("È", "E"), ("É", "E"), ("Ê", "E"), ("Ë", "E"),
        ("Ì", "I"), ("Í", "I"), ("Î", "I"), ("Ï", "I"),
        ("Ò", "O"), ("Ó", "O"), ("Ô", "O"), ("Ö", "O"),
        ("Ù", "U"), ("Ú", "U"), ("Û", "U"), ("Ü", "U"),
        ("Ç", "C"), ("Ñ", "N"),
    )
    out = s
    for a, b in replacements:
        out = out.replace(a, b)
    return out


def resolve_column_indices(header_cells: list) -> dict:
    """Return {logical_name: col_index}, falling back to defaults for any
    column that can't be matched from the header row."""
    indices = dict(DEFAULT_COL_INDEX)
    if not header_cells:
        return indices

    for i, cell in enumerate(header_cells):
        text = _strip_accents(cell.get_text(strip=True).upper())
        if not text:
            continue
        for logical, aliases in HEADER_ALIASES.items():
            for alias in aliases:
                if alias in text:
                    indices[logical] = i
                    break
    return indices


def parse_calendar(html: str) -> list[dict]:
    """Parse all race data from the calendar HTML.
    Skips RECOMANADES sections, extracts from main month tables only."""
    soup = BeautifulSoup(html, "html.parser")
    races = []

    # Find the main content area
    content = soup.find("div", class_="entry-content") or soup.find("article") or soup

    # Strategy: iterate through all elements, track current month context,
    # and parse tables that follow non-RECOMANADES month headers.
    current_month = None
    current_month_num = None
    current_year = None
    skip_next_table = False

    for element in content.descendants:
        if element.name in ("h3", "h2", "h4", "p"):
            text = element.get_text(strip=True)
            month_info = extract_month_year(text)
            if month_info:
                if is_recomanades(text):
                    skip_next_table = True
                else:
                    current_month = month_info[0]
                    current_month_num = month_info[1]
                    current_year = month_info[2]
                    skip_next_table = False

        elif element.name == "table":
            if skip_next_table:
                skip_next_table = False
                continue

            if not current_month:
                continue

            rows = element.find_all("tr")
            if not rows:
                continue

            # First row may be a header — detect and extract column indices.
            header_cells = rows[0].find_all(["th", "td"])
            header_has_th = any(c.name == "th" for c in header_cells)
            header_text_upper = "".join(
                c.get_text(" ", strip=True).upper() for c in header_cells
            )
            looks_like_header = header_has_th or "DATA" in header_text_upper and "CURSA" in header_text_upper

            if looks_like_header:
                col_idx = resolve_column_indices(header_cells)
                data_rows = rows[1:]
            else:
                col_idx = dict(DEFAULT_COL_INDEX)
                data_rows = rows

            for row in data_rows:
                cells = row.find_all("td")
                if len(cells) < 5:
                    continue

                def cell_text(idx):
                    return cells[idx].get_text(strip=True) if idx < len(cells) else ""

                date_raw = cell_text(col_idx["date"])
                race_name_tag = cells[col_idx["name"]] if col_idx["name"] < len(cells) else None
                dist_raw = cell_text(col_idx["dist_elev"])
                price = cell_text(col_idx["price"])
                town = cell_text(col_idx["town"])
                province = cell_text(col_idx["province"])

                if race_name_tag is None:
                    continue

                # Extract race name and URL
                link = race_name_tag.find("a")
                race_name = " ".join(race_name_tag.get_text(separator=" ").split())
                race_url = link["href"] if link and link.has_attr("href") else ""

                # Parse date
                iso_date, display_date = parse_date_field(date_raw, current_month_num, current_year)

                # Determine status. Priority: SUSPESA > SOLD_OUT > ACTIVA.
                # ESGOTADES in the price column → race sold out; still has a
                # date, still listed on the page, but registration closed.
                if display_date == "SUSPESA" or "SUSPESA" in date_raw.upper():
                    status = "SUSPESA"
                elif "ESGOTADES" in price.upper() or "ESGOTAT" in price.upper():
                    status = "SOLD_OUT"
                else:
                    status = "ACTIVA"

                # Parse distance / elevation
                distance_km, elevation_m, dist_raw_clean = parse_distance_elevation(dist_raw)

                race = {
                    "race_hash": "",  # computed after full dict
                    "month": f"{current_month} {current_year}",
                    "month_num": current_month_num,
                    "year": current_year,
                    "date": iso_date,
                    "date_display": display_date,
                    "race_name": race_name,
                    "race_url": race_url,
                    "distance_km": distance_km,
                    "elevation_m": elevation_m,
                    "distance_elevation_raw": dist_raw_clean or dist_raw,
                    "price": price,
                    "town": town,
                    "province": province.upper() if province else "",
                    "status": status,
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                }
                race["race_hash"] = compute_race_hash(race)
                races.append(race)

    return races


# ── Change detection ──────────────────────────────────────────────────────────

def detect_changes(new_races: list[dict], old_races: list[dict]) -> dict:
    """Compare new scrape against old. Returns {added, removed, changed} lists."""
    old_by_hash = {r["race_hash"]: r for r in old_races}
    new_by_hash = {r["race_hash"]: r for r in new_races}

    added = [r for h, r in new_by_hash.items() if h not in old_by_hash]
    removed = [r for h, r in old_by_hash.items() if h not in new_by_hash]

    changed = []
    compare_fields = ["date", "price", "status", "race_url", "distance_elevation_raw"]
    for h, new_r in new_by_hash.items():
        if h in old_by_hash:
            old_r = old_by_hash[h]
            diffs = {f: (old_r.get(f), new_r.get(f))
                     for f in compare_fields if old_r.get(f) != new_r.get(f)}
            if diffs:
                changed.append({"race": new_r, "changes": diffs})

    return {"added": added, "removed": removed, "changed": changed}


def format_diff_report(diff: dict) -> str:
    """Human-readable diff report for Telegram notification."""
    lines = [f"🏔 Trail Calendar Update — {datetime.now().strftime('%Y-%m-%d')}"]

    if not diff["added"] and not diff["removed"] and not diff["changed"]:
        lines.append("No changes detected.")
        return "\n".join(lines)

    if diff["added"]:
        lines.append(f"\n✅ {len(diff['added'])} NEW races:")
        for r in diff["added"][:15]:  # cap to avoid Telegram message limits
            lines.append(f"  • {r['race_name']} — {r['distance_elevation_raw'] or '?'} ({r['town']})")
        if len(diff["added"]) > 15:
            lines.append(f"  ... and {len(diff['added']) - 15} more")

    if diff["removed"]:
        lines.append(f"\n❌ {len(diff['removed'])} REMOVED races:")
        for r in diff["removed"][:10]:
            lines.append(f"  • {r['race_name']} — {r['town']}")

    if diff["changed"]:
        lines.append(f"\n🔄 {len(diff['changed'])} CHANGED races:")
        for c in diff["changed"][:10]:
            r = c["race"]
            changes_str = ", ".join(f"{k}: {v[0]}→{v[1]}" for k, v in c["changes"].items())
            lines.append(f"  • {r['race_name']}: {changes_str}")

    total = sum(len(diff[k]) for k in ["added", "removed", "changed"])
    lines.append(f"\nTotal races in calendar: {len(diff.get('_total', []))}")
    return "\n".join(lines)


# ── Output: CSV ───────────────────────────────────────────────────────────────

CSV_COLUMNS = [
    "race_hash", "month", "date", "date_display", "race_name", "race_url",
    "distance_km", "elevation_m", "distance_elevation_raw",
    "price", "town", "province", "status", "scraped_at",
]

def races_to_csv(races: list[dict], filepath: str | None = None) -> str:
    """Export races to CSV. Returns CSV string. Optionally writes to file."""
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(races)
    csv_str = output.getvalue()

    if filepath:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(csv_str)
        print(f"CSV written: {filepath} ({len(races)} races)")

    return csv_str


# ── Output: Supabase ──────────────────────────────────────────────────────────

def upsert_to_supabase(races: list[dict]) -> dict:
    """Upsert races to Supabase. Returns {upserted: int, errors: list}."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_KEY must be set")

    from supabase import create_client
    client = create_client(url, key)

    # Fetch existing races for diff
    existing = client.table("races").select("*").execute()
    old_races = existing.data if existing.data else []

    # Detect changes
    diff = detect_changes(races, old_races)
    diff["_total"] = races

    # Upsert all current races
    # We do batch upsert (Supabase supports it)
    batch_size = 100
    errors = []
    upserted = 0

    for i in range(0, len(races), batch_size):
        batch = races[i:i + batch_size]
        # Prepare for upsert: only include Supabase columns
        rows = [{k: r.get(k) for k in CSV_COLUMNS} for r in batch]
        try:
            result = client.table("races").upsert(
                rows, on_conflict="race_hash"
            ).execute()
            upserted += len(batch)
        except Exception as e:
            errors.append(f"Batch {i//batch_size}: {str(e)}")

    # Mark removed races (set status to REMOVED instead of deleting)
    for removed in diff["removed"]:
        try:
            client.table("races").update(
                {"status": "REMOVED", "scraped_at": datetime.now(timezone.utc).isoformat()}
            ).eq("race_hash", removed["race_hash"]).execute()
        except Exception as e:
            errors.append(f"Mark removed {removed['race_hash']}: {str(e)}")

    return {"upserted": upserted, "errors": errors, "diff": diff}


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape ultrescatalunya.com trail calendar")
    parser.add_argument("--csv-only", action="store_true", help="Export CSV only, skip Supabase")
    parser.add_argument("--csv-path", default="ultres_calendar.csv", help="CSV output path")
    parser.add_argument("--diff-only", action="store_true", help="Show diff without writing")
    parser.add_argument("--json", action="store_true", help="Output JSON to stdout")
    parser.add_argument("--html-file", help="Parse from local HTML file instead of fetching (for testing)")
    args = parser.parse_args()

    # 1. Fetch (or read from disk for testing)
    if args.html_file:
        print(f"Reading HTML from {args.html_file}...")
        with open(args.html_file, "r", encoding="utf-8") as f:
            html = f.read()
        print(f"Read {len(html):,} bytes from fixture")
    else:
        print(f"Fetching {CALENDAR_URL}...")
        html = fetch_page()
        print(f"Fetched {len(html):,} bytes")

    # 2. Parse
    races = parse_calendar(html)
    print(f"Parsed {len(races)} race entries")

    # Quick stats
    months = set(r["month"] for r in races)
    print(f"Months covered: {', '.join(sorted(months))}")
    print(f"Active: {sum(1 for r in races if r['status'] == 'ACTIVA')}, "
          f"Suspesa: {sum(1 for r in races if r['status'] == 'SUSPESA')}, "
          f"Sold out: {sum(1 for r in races if r['status'] == 'SOLD_OUT')}, "
          f"TBD dates: {sum(1 for r in races if r['date'] is None and r['status'] == 'ACTIVA')}")

    # 3. Output
    if args.json:
        print(json.dumps(races, ensure_ascii=False, indent=2))
        return

    # Always export CSV
    races_to_csv(races, args.csv_path)

    if args.csv_only:
        return

    if args.diff_only:
        # Load previous CSV if exists for local diff
        old_path = args.csv_path.replace(".csv", "_previous.csv")
        if os.path.exists(old_path):
            with open(old_path) as f:
                reader = csv.DictReader(f)
                old_races = list(reader)
            diff = detect_changes(races, old_races)
            diff["_total"] = races
            print("\n" + format_diff_report(diff))
        else:
            print(f"No previous CSV at {old_path} — cannot diff")
        return

    # 4. Supabase upsert
    try:
        result = upsert_to_supabase(races)
        print(f"\nSupabase: {result['upserted']} upserted")
        if result["errors"]:
            print(f"Errors: {result['errors']}")

        # Print diff report
        report = format_diff_report(result["diff"])
        print(f"\n{report}")

        # Write report to file for Telegram pickup
        with open("diff_report.txt", "w") as f:
            f.write(report)

    except EnvironmentError as e:
        print(f"Supabase skipped: {e}")
        print("Run with --csv-only or set SUPABASE_URL + SUPABASE_KEY")


if __name__ == "__main__":
    main()
