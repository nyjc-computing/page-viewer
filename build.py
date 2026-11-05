#!/usr/bin/env python3
"""Build the single-file, embeddable index.html from the modular sources.

Inlines css/styles.css and the js/*.js files (in dependency order) into
src/template.html and writes index.html at the project root.

Usage:  python build.py            (normal build)
        python build.py --release  (same, but names the output
                                    page-viewer-<date>.html too)

index.html is a generated file — edit the sources, then rebuild.
"""

import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent
TEMPLATE = ROOT / "src" / "template.html"
STYLES = ROOT / "css" / "styles.css"
SCRIPT_ORDER = [
    "data.js",      # RefG §4 checklist, element blurbs, proxies
    "articles.js",  # GENERATED bundled MDN articles (scripts/update-mdn-articles.py)
    "sample.js",    # built-in sample page
    "util.js",      # shared helpers
    "fetch.js",     # direct + CORS-proxy fetch pipeline
    "page.js",      # page loading and preview iframe wiring
    "tree.js",      # tokenised DOM tree, hover/click sync, find
    "csspanel.js",  # CSS rule model, toggles, matched rules
    "mdn.js",       # reference panel + markdown renderer
    "quest.js",     # quest tracker
    "main.js",      # boot: wiring, splitter, help dialog
]


def js_text(name):
    """Read a js module and escape '</script' so no string literal or bundled
    article content can terminate the host <script> block early
    ('<\\/script' === '</script' as a JavaScript string)."""
    return (ROOT / "js" / name).read_text(encoding="utf-8").strip().replace(
        "</script", "<\\/script")


def build():
    if not (ROOT / "js" / "articles.js").exists():
        print("warning: js/articles.js missing — run scripts/update-mdn-articles.py "
              "or the Reference panel will fall back to remote fetches")
    template = TEMPLATE.read_text(encoding="utf-8")
    css = STYLES.read_text(encoding="utf-8").strip()

    scripts = "\n".join(
        "<script>\n" + js_text(name) + "\n</script>" for name in SCRIPT_ORDER
    )

    version = time.strftime("%Y%m%d%H%M")
    html = template
    html = html.replace("<!-- {{STYLES}} -->", "<style>\n" + css + "\n</style>")
    html = html.replace("<!-- {{SCRIPTS}} -->", scripts)
    html = html.replace("{{V}}", "?v=" + version)

    banner = ("<!-- GENERATED FILE — built by build.py from src/template.html, "
              "css/styles.css and js/*.js. Edit those, then rebuild. -->\n")
    out = banner + html.strip() + "\n"
    (ROOT / "index.html").write_text(out, encoding="utf-8", newline="\n")
    print(f"built index.html ({len(out)} bytes, css + {len(SCRIPT_ORDER)} scripts inlined)")

    if "--release" in sys.argv:
        stamp = time.strftime("%Y%m%d")
        dest = ROOT / f"page-viewer-{stamp}.html"
        dest.write_text(out, encoding="utf-8", newline="\n")
        print(f"release copy: {dest.name}")


if __name__ == "__main__":
    build()
