# links

A curated-link collection site: links only, no writing.

## Adding a link

```bash
python3 tools/add-link.py <url> # fetch title/description, confirm interactively
python3 tools/add-link.py <url> --group blogs.doing --summary "one-liner"
```

The tool fetches the page title and description for confirmation, de-dupes
by URL, and appends to `data/articles.json`. The `added` date is generated
automatically. `group` decides which page the link appears on:

- `blogs.interesting` / `blogs.doing` — the two blog groups
- `resources.config` / `resources.fonts` / `resources.tools` / `resources.algorithm` — the four resource groups

Adding a new group means creating a new page by copying an existing one
and a new entry in the menu on `index.html` (and in `GROUPS` in `tools/add-link.py`).

You can also edit the JSON directly:

```json
{
  "title": "The Boring Internet",
  "url": "https://example.com/article",
  "group": "blogs.interesting",
  "summary": "one-liner (optional)",
  "added": "2026-08-08"
}
```