#!/usr/bin/env python3
"""add-link.py — paste a URL, keep it in data/articles.json.

Zero-dependency (stdlib only). Fetches the page, guesses the title and
description, lets you confirm / edit them, then appends a new entry.

Usage:
    python3 tools/add-link.py <url>
    python3 tools/add-link.py <url> --tags blog,web --summary "one-liner"

No args prints this help.
"""

import json
import re
import sys
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from datetime import date

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "articles.json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TIMEOUT = 15


def usage() -> None:
    print(__doc__)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        raw = resp.read()
    charset = None
    ctype = resp.headers.get("Content-Type", "")
    m = re.search(r"charset=([\w-]+)", ctype, re.I)
    if m:
        charset = m.group(1)
    if not charset:
        m = re.search(rb'<meta[^>]+charset=["\']?([\w-]+)', raw, re.I)
        if m:
            charset = m.group(1).decode()
    try:
        return raw.decode(charset or "utf-8")
    except (LookupError, UnicodeDecodeError):
        return raw.decode("utf-8", errors="replace")


def meta_content(html: str, property_: str) -> str:
    m = re.search(r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]+content=["\'](.*?)["\']' % re.escape(property_), html, re.I | re.S)
    if not m:
        m = re.search(r'<meta[^>]+content=["\'](.*?)["\'][^>]+(?:property|name)=["\']%s["\']' % re.escape(property_), html, re.I | re.S)
    return m.group(1).strip() if m else ""


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


def title_of(html: str) -> str:
    for prop in ("og:title", "twitter:title"):
        t = meta_content(html, prop)
        if t:
            return clean(t)
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    return clean(m.group(1)) if m else ""


def desc_of(html: str) -> str:
    for prop in ("og:description", "twitter:description", "description"):
        d = meta_content(html, prop)
        if d:
            return clean(d)
    return ""


def load() -> list:
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE) as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def save(data: list) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def prompt(label: str, default: str = "") -> str:
    if default:
        answer = input(f"{label} [{default}]: ").strip()
        return answer or default
    return input(f"{label} []: ").strip()


def main() -> int:
    p = argparse.ArgumentParser(description="paste a URL, keep it in data/articles.json")
    p.add_argument("url", nargs="?", help="the article URL to add")
    p.add_argument("--tags", help="comma-separated tags, skips the prompt")
    p.add_argument("--summary", help="one-line note, skips the prompt")
    p.add_argument("--no-fetch", action="store_true", help="skip fetching; prompt everything")
    args = p.parse_args()

    if not args.url:
        usage()
        return 1

    url = args.url.strip()
    if not re.match(r"^https?://", url):
        url = "https://" + url

    try:
        host = urllib.parse.urlparse(url).hostname or ""
    except Exception:
        host = ""
    source = host.removeprefix("www.")

    # dedupe before fetching
    existing = load()
    norm = url.rstrip("/")
    if any(e.get("url", "").rstrip("/") == norm for e in existing):
        print(f"already in {DATA_FILE}: {url}")
        return 1

    title = summary = ""
    if not args.no_fetch:
        try:
            print(f"fetching {url} ...")
            html = fetch(url)
            title, summary = title_of(html), desc_of(html)
        except urllib.error.HTTPError as e:
            print(f"fetch failed: HTTP {e.code} {e.reason}")
            return 1
        except urllib.error.URLError as e:
            print(f"fetch failed: {e.reason}")
            return 1
        except Exception as e:
            print(f"fetch failed: {e}")
            return 1

    if not title:
        print(f"could not find a title on {url} — typing it manually.")
    title = prompt("title", title) or url
    if args.summary is not None:
        summary = args.summary
    else:
        summary = prompt("summary (one line, optional)", summary)
    if args.tags is None:
        tags = prompt("tags (comma separated, optional)")
    else:
        tags = args.tags
    tags = [t.strip() for t in re.split(r"[,\s]+", tags) if t.strip()]

    entry = {
        "title": title,
        "url": url,
        "source": source,
        "summary": summary,
        "tags": tags,
        "added": date.today().isoformat(),
    }
    if not entry["summary"]:
        del entry["summary"]
    if not entry["tags"]:
        del entry["tags"]

    existing.append(entry)
    save(existing)
    print(f"\nsaved {len(existing)} entries -> {DATA_FILE}")
    print(f"  {entry['added']}  {entry['title']}  ({entry['source']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
