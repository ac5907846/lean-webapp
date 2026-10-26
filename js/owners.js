// Owners view: what federal owners ask for in construction solicitations (pick the terms), the two notices that name
// lean, how the panel firms\u2019 awards are written (pick a dimension), and the owners that joined LCI (pick a sector).
window.Owners = (function () {
  let f, lci, ct, orgs;
  const $ = (id) => document.getElementById(id);
  const COLORS = { design_build: "#4a3b8c", idiq_matoc: "#8a7fc4", design_bid_build: "#0f6b5b", cm_at_risk: "#4fa892", progressive_design_build: "#8fd3c3", eci: "#a9491a", ipd: "#f4a259", any_lean: "#c8553d" };
  const TERMS = ["design_build", "idiq_matoc", "design_bid_build", "cm_at_risk", "progressive_design_build", "eci", "ipd", "any_lean"];
  const termsOn = new Set(["design_build", "idiq_matoc", "design_bid_build", "cm_at_risk", "any_lean"]);
  let asShare = true, dim = "compete", sector = null;
  const depName = (d) => d.replace(/^DEPT OF /, "").replace(/^DEPARTMENT OF /, "").split(",")[0].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace("Of ", "of ");
  const title = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const SECTOR = { PRIVATE: "Private industry", HEALTH: "Health care", EDUCATION: "Education", ENERGY: "Energy", GOVERNMENT: "Government", OTHER: "Other" };
  const sectorName = (s) => SECTOR[s] || title(s);

  // A. headline numbers of the solicitations
  function headline() {
    const tot = d3.sum(f.by_year, (r) => Math.round(r.solicitations * r.with_text));
    const sum = (k) => d3.sum(f.by_year, (r) => r[k]);
    const nums = [
      { v: f.total_solicitations, l: "federal construction solicitations, FY2008 to FY2026 (SAM.gov)" },
      { v: 100 * sum("design_build") / tot, suffix: "%", d: 1, l: "name design-build" },
      { v: 100 * sum("idiq_matoc") / tot, suffix: "%", d: 1, l: "name an IDIQ or MATOC vehicle" },
      { v: 100 * sum("cm_at_risk") / tot, suffix: "%", d: 2, l: "name construction manager at risk" },
      { v: f.lean_solicitations.length, l: "name a lean method, of all solicitations with a full text", cls: "red" },
    ];
    const box = $("own-nums"); box.innerHTML = "";
    nums.forEach((n) => {
      const el = document.createElement("div"); el.className = "bignum " + (n.cls || ""); el.innerHTML = '<div class="v"></div><div class="l"></div>'; box.appendChild(el);
      M.countTo(el.querySelector(".v"), n.v, { suffix: n.suffix || "", decimals: n.d || 0, ms: 600 });
      el.querySelector(".l").textContent = n.l;
    });
  }

  // B. the chosen terms by fiscal year and by department
  function figTerms() {
    const keys = TERMS.filter((k) => termsOn.has(k));
    const series = keys.map((k) => ({ key: k, name: f.terms[k], color: COLORS[k], width: k === "any_lean" ? 1.4 : 1.8, big: k === "any_lean",
      values: f.by_year.map((r) => { const of = Math.round(r.solicitations * r.with_text); return { x: r.fy, y: asShare ? 100 * r[k] / of : r[k], n: r[k], of }; }) }));
    C.lines($("fig-fed"), series, { h: 300, yLabel: asShare ? "share of the year\u2019s solicitations with a full text, %" : "solicitations naming the term",
      yFmt: asShare ? (v) => v.toFixed(v < 1 && v > 0 ? 1 : 0) + "%" : C.fmt,
      tip: (k, v) => `<b>FY${v.x}</b>${k.name}: ${C.fmt(v.n)} of ${C.fmt(v.of)} solicitations (${(100 * v.n / v.of).toFixed(v.n && v.n < v.of / 100 ? 2 : 1)}%)` });
    const rows = f.by_department.map((r) => ({ label: depName(r.department), n: r.solicitations, values: Object.fromEntries(keys.map((k) => [k, r[k] / r.solicitations])), counts: Object.fromEntries(keys.map((k) => [k, r[k]])) }));
    const SHORT = { design_build: "Design-build", idiq_matoc: "IDIQ / MATOC", design_bid_build: "Design-bid-build", cm_at_risk: "CM at risk", progressive_design_build: "Progressive DB", eci: "ECI", ipd: "IPD", any_lean: "Lean" };
    C.heatTable($("fig-dep"), rows, keys.map((k) => ({ key: k, name: f.terms[k], short: SHORT[k], color: COLORS[k] })));
  }

  // C. the two notices that name lean
  function cases() {
    const el = $("fed-cases");
    el.innerHTML = f.lean_solicitations.map((s) => `<div class="case"><div class="h">${s.title}</div><div class="muted">${[s.department ? title(s.department) : null, s.sub_tier ? title(s.sub_tier) : null, s.office ? title(s.office) : null].filter(Boolean).join(" \u00b7 ")} \u00b7 ${String(s.first_posted).slice(0, 10)} \u00b7 ${s.notice_types}</div><div class="p">${s.passage.trim()}</div><div class="muted">terms found: ${s.terms.split(";").map((t) => t.trim().replace(/_/g, " ")).join(", ")}</div></div>`).join("");
  }

  // D. contract types of the panel firms\u2019 awards: one dimension at a time, and its share by year
  const DIMS = { pricing: "Pricing type", compete: "Extent of competition", work: "Kind of work" };
  const YEAR_SERIES = { pricing: [["firm_fixed", "Firm fixed price", "#4a3b8c"]], compete: [["set_aside", "Set-aside", "#a9491a"], ["full_open", "Full and open competition", "#0f6b5b"]], work: [["new_construction", "New construction", "#f4a259"]] };
  function figContracts() {
    document.querySelectorAll("#ct-dim .chip").forEach((c) => c.classList.toggle("on", c.dataset.d === dim));
    const tot = Object.values(ct[dim]).reduce((a, b) => a + b, 0);
    const rows = Object.entries(ct[dim]).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, values: { s: n / tot }, n }));
    C.hbars($("fig-contracts"), rows, [{ key: "s", name: `${DIMS[dim]}, share of ${C.fmt(tot)} usable awards of the panel firms`, fill: "#c9c4e8", dark: "#4a3b8c" }], { share: true, rowH: 16, gap: 8, left: 230, labelN: false, tipN: true });
    const by = ct.by_year.filter((r) => r.awards >= 30);
    const series = YEAR_SERIES[dim].map(([k, name, color]) => ({ key: k, name, color, values: by.map((r) => ({ x: r.year, y: 100 * r[k] / r.awards, n: r[k], of: r.awards })) }));
    C.lines($("fig-ct-year"), series, { h: 200, yLabel: "share of the year\u2019s usable awards, %", yFmt: (v) => v.toFixed(0) + "%", ymax: 100,
      tip: (k, v) => `<b>FY${v.x}</b>${k.name}: ${C.fmt(v.n)} of ${C.fmt(v.of)} awards (${(100 * v.n / v.of).toFixed(0)}%)` });
  }

  // E. owners in the LCI directory: bars by sector, click one to list its members
  function figOwners() {
    const owners = lci.members.filter((m) => m.type === "OWNER");
    const bySector = d3.rollup(owners, (v) => v.length, (m) => m.sector || "OTHER");
    const rows = [...bySector].sort((a, b) => b[1] - a[1]).map(([s, n]) => ({ label: sectorName(s), key: s, values: { n }, sel: s === sector }));
    C.hbars($("fig-owners"), rows, [{ key: "n", name: "LCI owner members, 2026", fill: "#8fd3c3", dark: "#0f6b5b" }], { share: false, rowH: 16, gap: 8, left: 130, labelN: false,
      onClick: (r) => { sector = sector === r.key ? null : r.key; figOwners(); }, selected: (r) => r.sel });
    const list = owners.filter((m) => !sector || (m.sector || "OTHER") === sector).sort((a, b) => a.name.localeCompare(b.name));
    const byName = new Map(orgs.filter((o) => o.group === "lci").map((o) => [o.name.toLowerCase(), o]));
    $("own-list").innerHTML = `<p class="fine">${sector ? `${sectorName(sector)}: ` : ""}${list.length} owner member${list.length === 1 ? "" : "s"}${sector ? ' <a href="#" id="own-all">show all</a>' : ""}</p>` +
      `<table><tr><th>Owner</th><th>Sector</th><th>State</th><th>Lean claimed</th><th></th></tr>` + list.map((m) => {
        const o = byName.get(m.name.toLowerCase());
        return `<tr><td>${o ? `<a href="#organizations/${encodeURIComponent(o.id)}">${m.name}</a>` : m.name}</td><td class="muted">${sectorName(m.sector || "OTHER")}</td><td>${m.state || ""}</td><td>${m.lean === "YES" ? "yes" : ""}</td><td><a class="muted" href="https://leanconstruction.org/sponsors/${m.slug}/" target="_blank" rel="noopener">LCI</a></td></tr>`;
      }).join("") + `</table>`;
    const all = $("own-all"); if (all) all.addEventListener("click", (ev) => { ev.preventDefault(); sector = null; figOwners(); });
    // the owner members on the map; the chosen sector is drawn larger, the others faded
    const pts = owners.filter((m) => m.lat != null).map((m) => ({ ...m, id: m.slug }));
    const SC = { HEALTH: "#c8553d", PRIVATE: "#4a3b8c", EDUCATION: "#0f6b5b", ENERGY: "#a9491a", GOVERNMENT: "#a07a00" };
    ownMap.update(pts, (m) => { const on = !sector || (m.sector || "OTHER") === sector; return { fill: SC[m.sector] || "#888", stroke: "#fff", r: on ? 7 : 4, opacity: on ? .95 : .35 }; },
      { ms: 300, tip: (m) => `<b>${m.name}</b><span class="m">${sectorName(m.sector || "OTHER")} \u00b7 ${[m.city, m.state].filter(Boolean).join(", ")}</span>`,
        onClick: (m) => { const o = byName.get(m.name.toLowerCase()); if (o) location.hash = "#organizations/" + encodeURIComponent(o.id); } });
  }
  let ownMap = null;

  function init(data) {
    f = data.federal; lci = data.lci; ct = data.contracts; orgs = data.orgs;
    ownMap = USMap($("own-svg"), data.topo);
    const chips = $("fed-terms");
    chips.innerHTML = TERMS.map((k) => `<button class="chip ${termsOn.has(k) ? "on" : ""}" data-t="${k}" style="--c:${COLORS[k]}">${f.terms[k]}</button>`).join("");
    chips.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      if (termsOn.has(c.dataset.t) && termsOn.size === 1) return;
      c.classList.toggle("on"); if (c.classList.contains("on")) termsOn.add(c.dataset.t); else termsOn.delete(c.dataset.t); figTerms();
    }));
    document.querySelectorAll("#fed-scale .chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll("#fed-scale .chip").forEach((x) => x.classList.toggle("on", x === c)); asShare = c.dataset.s === "share"; figTerms(); }));
    document.querySelectorAll("#ct-dim .chip").forEach((c) => c.addEventListener("click", () => { dim = c.dataset.d; figContracts(); }));
    headline(); figTerms(); cases(); figContracts(); figOwners();
    C.onResize(() => { figTerms(); figContracts(); figOwners(); });
  }
  return { init, show() {}, hide() {} };
})();
