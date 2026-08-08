// links — render data/articles.json into the page.
// no framework, no build step: fetch the JSON, build the DOM, done.

const tagbar = document.getElementById("tagbar");
const latestList = document.getElementById("latest-list");
const byTag = document.getElementById("by-tag");

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function sourceOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function rowHTML(a, showDate) {
  const src = a.source || sourceOf(a.url);
  return `
    <li class="link-row">
      <div class="link-head">
        ${showDate ? `<span class="link-date">${esc(a.added)}</span>` : ""}
        <a class="link-title" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a>
        ${src ? `<span class="link-source">${esc(src)}</span>` : ""}
      </div>
      ${a.summary ? `<p class="link-summary">${esc(a.summary)}</p>` : ""}
      ${(a.tags || []).length
        ? `<div class="link-tags">${a.tags.map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>`
        : ""}
    </li>`;
}

function byDateDesc(articles) {
  return [...articles].sort((a, b) => b.added.localeCompare(a.added));
}

function tagCounts(articles) {
  const counts = new Map();
  for (const a of articles) for (const t of a.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
}

let activeTag = new URLSearchParams(location.search).get("tag") || "";
let all = [];

function render() {
  // tag bar
  tagbar.replaceChildren();
  for (const [tag] of [["", Infinity], ...tagCounts(all)]) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = tag || "all";
    b.setAttribute("data-tag", tag);
    b.setAttribute("aria-pressed", tag === activeTag);
    tagbar.appendChild(b);
  }
  tagbar.hidden = false;

  // latest
  const latest = byDateDesc(all).filter((a) => !activeTag || (a.tags || []).includes(activeTag));
  latestList.replaceChildren();
  if (!latest.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = activeTag
      ? `nothing under #${activeTag} yet.`
      : "no entries yet — add one with tools/add-link.py";
    latestList.appendChild(li);
  } else {
    latest.forEach((a) => latestList.insertAdjacentHTML("beforeend", rowHTML(a, true)));
  }

  // per-tag sections
  byTag.replaceChildren();
  for (const [tag] of tagCounts(all)) {
    const rows = byDateDesc(all.filter((a) => (a.tags || []).includes(tag)));
    if (activeTag && activeTag !== tag) continue;
    const section = document.createElement("section");
    section.setAttribute("data-tag", tag);
    section.innerHTML = `
      <h2 class="section-title"><span class="mark">#</span> ${esc(tag)}</h2>
      <ul class="links">${rows.map((a) => rowHTML(a, true)).join("")}</ul>`;
    byTag.appendChild(section);
  }
}

function setTag(tag) {
  activeTag = tag;
  const url = new URL(location.href);
  tag ? url.searchParams.set("tag", tag) : url.searchParams.delete("tag");
  history.replaceState(null, "", url);
  render();
}

tagbar.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) setTag(chip.getAttribute("data-tag"));
});

byTag.addEventListener("click", (e) => {
  const tag = e.target.closest(".tag");
  if (tag) setTag(tag.getAttribute("data-tag"));
});

fetch("data/articles.json")
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((data) => { all = Array.isArray(data) ? data : []; render(); })
  .catch((err) => {
    latestList.innerHTML = `<li class="empty">failed to load data/articles.json (${esc(err.message)})</li>`;
  });
