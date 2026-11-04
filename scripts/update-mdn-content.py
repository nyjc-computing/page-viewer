#!/usr/bin/env python3
"""Refresh the bundled MDN articles in content/ for Page Viewer.

The app loads these files same-origin, so the reference panel works even on
networks that block jsDelivr, raw.githubusercontent and public CORS proxies.

Usage:  python scripts/update-mdn-content.py
Source: mdn/content repo (via cdn.jsdelivr.net). Files are the raw Markdown
        pages (files/en-us/<slug>/index.md), flattened into content/<slug>.md
        with '/' replaced by '--'.
"""

import re
import sys
import urllib.request

DATA_JS = "js/data.js"
UA = {"User-Agent": "Mozilla/5.0 (Page Viewer content updater)"}
BASES = [
    "https://cdn.jsdelivr.net/gh/mdn/content@main/files/en-us/",
    "https://raw.githubusercontent.com/mdn/content/main/files/en-us/",
]


def element_keys():
    src = open(DATA_JS, encoding="utf-8").read()
    block = re.search(r"const ELEMENT_INFO = \{([\s\S]*?)\n\};", src).group(1)
    keys = re.findall(r"^  ([a-z0-9]+):", block, re.M)
    keys = {k.lower() for k in keys if k != "doctype"}
    keys.add("heading_elements")            # h1-h6 share one page
    return sorted(keys)


def slug_for(key):
    if re.fullmatch(r"h[1-6]", key):
        return "web/html/reference/elements/heading_elements"
    return "web/html/reference/elements/" + key


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    slugs = list(dict.fromkeys(slug_for(k) for k in sorted(element_keys())))
    slugs += ["glossary/doctype", "glossary/character_reference"]
    ok = missing = 0
    for slug in slugs:
        dest = "content/" + slug.replace("/", "--") + ".md"
        dest = "content/" + slug.replace("/", "--") + ".md"
        last = None
        for base in BASES:
            try:
                open(dest, "wb").write(fetch(base + slug + "/index.md"))
                ok += 1
                last = None
                break
            except Exception as exc:
                last = exc
        if last:
            missing += 1
            print(f"skip {slug}: {last}")
    print(f"done: {ok} articles written, {missing} unavailable")


if __name__ == "__main__":
    sys.exit(main())
