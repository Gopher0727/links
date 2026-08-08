// links — render data/articles.json into the page.
// no framework, no build step: fetch the JSON, build the DOM, done.
//
// Layout is static HTML: each <ul class="links" data-group="..."> receives
// the entries whose `group` field matches. The index page has a menu of
// groups whose entry counts get filled here.

const lists = [...document.querySelectorAll(".links[data-group]")];
const menuCounts = [...document.querySelectorAll(".menu-count")];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function sourceOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function rowHTML(a) {
  const src = sourceOf(a.url);
  return `
    <li class="link-row">
      <a class="link-title" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a>
      <div class="link-meta">
        <span class="link-date">${esc(a.added)}</span>
        ${src ? `<span class="link-sep">·</span><span class="link-source">${esc(src)}</span>` : ""}
      </div>
      ${a.summary ? `<p class="link-summary">${esc(a.summary)}</p>` : ""}
    </li>`;
}

function byDateDesc(articles) {
  // newest first; entries without an `added` date sort to the bottom
  return [...articles].sort((a, b) => (b.added || "").localeCompare(a.added || ""));
}

fetch("data/articles.json")
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((data) => {
    const articles = Array.isArray(data) ? data : [];

    // index page: fill the per-group counts
    for (const el of menuCounts) {
      const n = articles.filter((a) => a.group === el.dataset.group).length;
      el.textContent = n ? (n === 1 ? "1 entry" : `${n} entries`) : "empty";
    }

    if (!lists.length) return; // index menu page has no lists to fill

    for (const ul of lists) {
      const group = ul.dataset.group;
      const rows = byDateDesc(articles.filter((a) => a.group === group));
      if (!rows.length) {
        ul.innerHTML = '<li class="empty">no entries here yet — add one with tools/add-link.py</li>';
        continue;
      }
      for (const a of rows) ul.insertAdjacentHTML("beforeend", rowHTML(a));
    }
  })
  .catch((err) => {
    if (lists.length) {
      lists[0].innerHTML = `<li class="empty">failed to load data/articles.json (${esc(err.message)})</li>`;
    }
  });
