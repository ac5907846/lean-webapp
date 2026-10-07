// Organizations view: a filtered, sorted list with a detail panel (profile, LCI years, year-by-year coverage strip,
// methods named).
window.Organizations = (function () {
  let orgs, years, names, selected = null, shown = 150;
  const $ = (id) => document.getElementById(id);
  const G = C.GROUP;
  const groupsOn = new Set(["lci", "enr", "fed"]);
  const LVL = ["read, no lean language", "general lean language", "names a lean routine", "three or more routines on one page"];
  const SHORT = { "General contractors and construction managers": "GC / CM", "Specialty trade contractors": "Trade", "Lean and management consultants": "Consultant",
                  "Architects and engineers": "A/E", "Owners": "Owner", "Technology firms": "Technology", "Associations and others": "Association", "Manufacturers and suppliers": "Supplier", "Not classified": "" };
  const LINKS = { website: "website", lci: "LCI directory entry", enr: "ENR Top 400 list (2025 PDF)", sam: "SAM.gov entity record", usaspending: "USAspending search" };

  function csv(rows) {
    const cols = ["name", "domain", "type", "group", "city", "state", "enr_rank", "revenue_musd", "market", "lci_first_year", "fed_awards", "fed_value_musd", "pages", "recent_pages", "level", "commit_year", "routine_year", "methods"];
    const esc = (v) => (v == null ? "" : `"${String(Array.isArray(v) ? v.join(";") : v).replace(/"/g, '""')}"`);
    const lines = [cols.join(",")].concat(rows.map((d) => cols.map((c) => esc(c === "group" ? G[d.group].name : d[c])).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "lean_construction_organizations.csv"; a.click();
  }

  function shares(obj) {
    const tot = Object.values(obj).reduce((a, b) => a + b, 0);
    return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="share"><span class="k">${k}</span><span class="bar"><span style="width:${Math.round(100 * v / tot)}%"></span></span><span class="v">${Math.round(100 * v / tot)}%</span></div>`).join("");
  }

  function filtered() {
    const q = $("org-search").value.trim().toLowerCase();
    const lv = $("org-level").value, st = $("org-state").value, sort = $("org-sort").value, ty = $("org-type").value;
    let rows = orgs.filter((d) => groupsOn.has(d.group));
    if (ty) rows = rows.filter((d) => d.type === ty);
    if (q) rows = rows.filter((d) => [d.name, d.domain, d.city, d.state].filter(Boolean).join(" ").toLowerCase().includes(q));
    if (st) rows = rows.filter((d) => d.state === st);
    if (lv === "observed") rows = rows.filter((d) => d.level != null);
    if (lv === "lean") rows = rows.filter((d) => d.level >= 1);
    if (lv === "method") rows = rows.filter((d) => d.level >= 2);
    if (lv === "dated") rows = rows.filter((d) => d.commit_year != null);
    if (lv === "none") rows = rows.filter((d) => d.level === 0);
    const key = { name: (d) => d.name.toLowerCase(), revenue: (d) => -(d.revenue_musd || 0), awards: (d) => -(d.fed_awards || 0), pages: (d) => -((d.pages || 0) + (d.recent_pages || 0)),
                  commit: (d) => d.commit_year || 9999, level: (d) => -(d.level ?? -1) }[sort];
    rows.sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : a.name.localeCompare(b.name)));
    return rows;
  }

  function lvlTag(d) { return d.level == null ? '<span class="lvl" style="color:#aaa">not read</span>' : `<span class="lvl l${d.level}" title="${LVL[d.level]}">${d.level}</span>`; }

  function renderList() {
    const rows = filtered();
    $("org-count").textContent = `${C.fmt(rows.length)} organizations`;
    const el = $("org-list");
    const head = `<tr><th>Organization</th><th>Type</th><th>State</th><th class="num">ENR rank</th><th class="num">Revenue $M</th><th class="num">Federal awards</th><th class="num">Pages read</th><th>Lean</th><th class="num">Committed</th><th class="num">Methods</th></tr>`;
    const body = rows.slice(0, shown).map((d) => `<tr data-id="${d.id}" class="${selected && selected.id === d.id ? "sel" : ""}">
      <td><span class="dot ${d.group}"></span>${d.name}</td><td class="muted">${SHORT[d.type] || d.type}</td><td>${d.state || ""}</td><td class="num">${d.enr_rank || ""}</td><td class="num">${d.revenue_musd ? C.fmt(Math.round(d.revenue_musd)) : ""}</td>
      <td class="num">${d.fed_awards || ""}</td><td class="num">${(d.pages || 0) + (d.recent_pages || 0) || ""}</td><td>${lvlTag(d)}</td><td class="num">${d.commit_year || ""}</td><td class="num">${d.methods && d.methods.length ? d.methods.length : ""}</td></tr>`).join("");
    el.innerHTML = `<table>${head}${body}</table>` + (rows.length > shown ? `<div class="more"><button class="pill" id="org-more">Show ${Math.min(150, rows.length - shown)} more</button></div>` : "");
    el.querySelectorAll("tr[data-id]").forEach((tr) => tr.addEventListener("click", () => select(tr.dataset.id)));
    const more = $("org-more"); if (more) more.addEventListener("click", () => { shown += 150; renderList(); });
  }

  function select(id, scroll = false) {
    selected = orgs.find((d) => d.id === id) || null;
    document.querySelectorAll("#org-list tr[data-id]").forEach((tr) => tr.classList.toggle("sel", tr.dataset.id === id));
    renderDetail();
    if (scroll) $("org-detail").scrollIntoView({ block: "nearest" });
  }

  function renderDetail() {
    const d = selected, el = $("org-detail");
    if (!d) { el.innerHTML = '<p class="muted">Select an organization.</p>'; return; }
    const row = (k, v) => (v == null || v === "" ? "" : `<dt>${k}</dt><dd>${v}</dd>`);
    const pct = (v) => (v == null ? null : Math.round(100 * v) + "%");
    let h = `<h2>${d.name}</h2><div class="dom">${d.domain || ""}${d.domain ? " · " : ""}<span class="dot ${d.group}"></span>${G[d.group].name}${d.lci_type ? " · " + d.lci_type.toLowerCase() : ""}</div>`;
    h += `<dl>${row("Headquarters", [d.city, d.state, d.country !== "US" ? d.country : null].filter(Boolean).join(", "))}${row("Organization type", d.org_type)}`;
    h += `${row("ENR Top 400 rank", d.enr_rank ? `${d.enr_rank} (revenue $${C.fmt(Math.round(d.revenue_musd))} million)` : null)}${row("Dominant market", d.market)}`;
    h += `${row("General building", pct(d.pct_general_building != null ? d.pct_general_building / 100 : null))}${row("CM at risk", pct(d.pct_cm_at_risk != null ? d.pct_cm_at_risk / 100 : null))}`;
    h += `${row("In an LCI list", d.lci_first_year ? `since ${d.lci_first_year}${d.in_lci ? ", listed in 2026" : ", not listed in 2026"}` : d.in_lci ? "listed in 2026" : null)}`;
    h += `${row("Usable federal awards", d.fed_awards ? `${d.fed_awards} (${d.fed_first_year} to ${d.fed_last_year}, $${C.fmt(Math.round(d.fed_value_musd))} million; DoD ${pct(d.share_dod)})` : null)}`;
    h += `${row("Business start (SAM)", d.entity_start_year)}</dl>`;
    h += `<h3>Website, lean construction</h3>`;
    if (d.level == null) h += `<p class="muted">Website not read (no archived pages, or no domain).</p>`;
    else {
      h += `<dl>${row("Highest level found", `<span class="lvl l${d.level}">${d.level}</span> ${LVL[d.level]}`)}`;
      if (d.panel) h += `${row("Archived pages, 2008 to 2026", `${C.fmt(d.pages)} (${d.years_observed} years observed, ${d.first_observed} to ${d.last_observed})`)}`;
      if (d.recent_pages) h += `${row("Recent pages, 2024 to 2026", C.fmt(d.recent_pages))}`;
      if (d.commit_year) h += `${row("First documented commitment", `${d.commit_year}${d.left_censored ? " (first observed year: left-censored)" : ""}`)}${row("First named routine", d.routine_year)}${row("Three or more routines", d.system_year)}${row("Persistence", pct(d.persistence))}${row("Stable, 5+ awards each side", d.gate ? "yes (gate passed)" : d.stable ? "stable, too few awards on a side" : "no")}`;
      h += `</dl>`;
      if (d.panel && years.domains[d.domain]) {
        const s = years.domains[d.domain];
        h += `<div class="strip">${[...s].map((c, i) => `<div class="y ${c === "u" ? "u" : c === "n" ? "n" : "l" + c}" title="${years.years[i]}: ${years.codes[c]}"></div>`).join("")}</div>`;
        h += `<div class="striplab">${years.years.map((y) => (y % 3 === 2 ? `<span>${y}</span>` : "<span></span>")).join("")}</div>`;
        h += `<p class="fine">Each cell is a year: hatched = no archive coverage (unknown), white = observed without lean language, yellow to red = highest level found that year.</p>`;
      }
      if (d.methods && d.methods.length) h += `<h3>Methods named</h3><div class="tags">${d.methods.map((m) => `<span class="tag">${names[m] || m}</span>`).join("")}</div>`;
      if (d.pages_evidence) h += `<h3>Archived pages with lean language</h3><ul class="pages">${d.pages_evidence.map((p) => `<li><a href="${p.link}" target="_blank" rel="noopener">${p.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 70)}</a> <span class="muted">${p.year}, ${p.source}, level ${p.level}</span></li>`).join("")}</ul><p class="fine">Links open the archived copy (Wayback Machine) or the Common Crawl index record of the page.</p>`;
    }
    if (d.contracts) {
      h += `<h3>Usable federal awards: contract types</h3>${shares(d.contracts.pricing)}<div class="gap"></div>${shares(d.contracts.compete)}<div class="gap"></div>${shares(d.contracts.work)}`;
    }
    if (d.links) h += `<h3>Sources</h3><div class="tags">${Object.entries(d.links).map(([k, u]) => `<a class="tag" href="${u}" target="_blank" rel="noopener">${LINKS[k] || k}</a>`).join("")}</div>`;
    el.innerHTML = h;
  }

  function init(data) {
    orgs = data.orgs; years = data.years; names = data.methods.names;
    const states = [...new Set(orgs.map((d) => d.state).filter(Boolean))].sort();
    $("org-state").innerHTML = '<option value="">All states</option>' + states.map((s) => `<option>${s}</option>`).join("");
    const types = [...new Set(orgs.map((d) => d.type).filter(Boolean))].sort();
    $("org-type").innerHTML = '<option value="">All organization types</option>' + types.map((s) => `<option>${s}</option>`).join("");
    ["org-search", "org-level", "org-state", "org-sort", "org-type"].forEach((id) => $(id).addEventListener("input", () => { shown = 150; renderList(); }));
    $("org-download").addEventListener("click", () => csv(filtered()));
    document.querySelectorAll("#org-groups .chip").forEach((c) => c.addEventListener("click", () => {
      c.classList.toggle("on"); if (c.classList.contains("on")) groupsOn.add(c.dataset.g); else groupsOn.delete(c.dataset.g); shown = 150; renderList();
    }));
    renderList();
  }
  function show(first, arg) { if (arg) { select(decodeURIComponent(arg), true); } }
  return { init, show, hide() {} };
})();
