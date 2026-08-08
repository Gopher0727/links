// links — render data/articles.json into the page.
// no framework, no build step: fetch the JSON, build the DOM, done.

const latestList = document.getElementById("latest-list");

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
      <div class="link-head">
        <span class="link-date">${esc(a.added)}</span>
        <a class="link-title" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a>
        ${src ? `<span class="link-source">${esc(src)}</span>` : ""}
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
    if (!articles.length) {
      latestList.innerHTML = '<li class="empty">no entries yet — add one with tools/add-link.py</li>';
      return;
    }
    for (const a of byDateDesc(articles)) {
      latestList.insertAdjacentHTML("beforeend", rowHTML(a));
    }
  })
  .catch((err) => {
    latestList.innerHTML = `<li class="empty">failed to load data/articles.json (${esc(err.message)})</li>`;
  });
