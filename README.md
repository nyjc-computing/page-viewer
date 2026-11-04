# Page Viewer

A DevTools-like **DOM inspector for learning HTML and CSS** — a single-page HTML5 app in
one dependency-free file (`index.html`).

Students load a web page and see it rendered in a preview pane next to the inspector,
which is a 2×2 arrangement: **HTML** and **CSS** side by side on top, **Checklist** and
**Reference** side by side below.

- **Preview** — the page, with page scripts stripped and links/buttons made inert
  (clicking never navigates — it selects the element). Hovering a row in the tree paints
  a DevTools-style translucent overlay over the element on the page; hovering the page
  highlights its row in the tree. **Drag the divider** between the preview and the panels
  to give more room to either side (the choice is remembered).
- **HTML** (top left) — the DOM tree with DevTools-style syntax colouring, collapsible
  nodes, attributes, text nodes and comments, plus a find box (`Enter` cycles matches)
  and a breadcrumb for the selected element.
- **CSS** (top right) — every stylesheet with every rule as
  `selector { declarations }` and a checkbox. Untick a rule, an `@media` group, or a
  whole stylesheet and the preview updates live. When an element is selected, the
  top of the panel lists the rules that match it, most specific first. Property names
  that appear in the H2 Computing Reference Guide §6 are shown in blue.
- **Checklist** (bottom left) — the exact element list from the H2 Computing syllabus
  Reference Guide §4 (doctype, html/head/title/body, link, h1–h3, p, div, span, hr, b,
  i, a, img, table/tr/th/td, form/input/textarea, and the four character references) as
  compact tag pills. Selecting an element in the tree or on the page ticks it off;
  presence badges (`×4`) show how many of each the current page contains; progress is
  saved in the browser.
- **Reference** (bottom right) — a local summary for the selected element plus the full
  MDN article, rendered from the MDN content repo via jsDelivr (a direct, CORS-friendly
  source that needs no proxy); if that fails it falls back to fetching the rendered MDN
  page through the proxy chain, and finally to the built-in summary with an MDN link
  (MDN itself cannot be framed, so the article is always extracted or re-rendered by the
  tool).

## Running it

Any static server works — there is no build step:

```
python -m http.server 8000
# then open http://127.0.0.1:8000/
```

Serving over http is recommended (double-clicking the file mostly works, but some
browsers restrict iframe access from `file:` pages). It can also be embedded in Google
Sites like any other single-page HTML app.

## Loading pages

**The sample page loads automatically at startup and on refresh.** To inspect another page,
type its address in the URL bar and click **Load page from URL**:

| Method | Notes |
| --- | --- |
| **URL** | Fetched directly when the site allows cross-origin reads (the school website does — it is pre-filled in the URL bar), otherwise through public CORS proxies (allorigins, codetabs, corsproxy.io), which are often slow or down. Pages are read-only: links and buttons in the preview are inert. |

## Classroom ideas

- **The cascade, made visible** — load the sample or any page, untick a whole
  stylesheet, then re-enable rules one at a time. The matched-rules panel shows *why* a
  rule wins (specificity chips, order).
- **Checklist hunt** — "open the school website and tick off every RefG §4 element by
  finding and clicking it". The `×n` badges hint at what to look for.

## How it works / limitations

- Cross-origin iframes cannot be inspected, so the tool fetches the page's HTML
  (directly or via proxy), sanitises it (scripts, inline handlers and navigation are
  stripped; links and buttons are inert; page scripts can never run), inlines the
  stylesheets it can fetch, and renders it into a same-origin `srcdoc` iframe. The DOM
  tree and the preview are then the same document, which makes hover/click sync exact.
- Stylesheets the tool cannot fetch stay browser-managed: they still style the preview
  but appear in the CSS panel as unmanaged (no toggles).
- The preview disables all JavaScript — in scope for a HTML+CSS course and safer.
- URLs you inspect are sent to the selected public proxy service; don't inspect pages
  that need a login. Checklist progress and the proxy setting are the only things
  stored locally (localStorage).
- MDN full-page extraction needs the network and one of the fetch paths to work; the
  local summary is always available offline.

## Source references

- Checklist source: [H2 Computing Reference Guide (9569), §4](https://isomer-user-content.by.gov.sg/334/fbf2f4ef-108a-4331-8597-a8c71427cc8d/9569_y27_sp_2_RefG.pdf)
  — elements, attributes and character references for Paper 2 (for use from 2027).
  The CSS panel also highlights the §6 property list.
- Element documentation: [MDN HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements)
