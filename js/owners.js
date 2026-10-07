// Owners view: what federal solicitations ask for (delivery methods, lean), the lean cases, departments, LCI owners.
window.Owners = (function () {
  let f, lci, ct, log = true;
  const $ = (id) => document.getElementById(id);
  const COLORS = { design_build: "#4a3b8c", idiq_matoc: "#8a7fc4", design_bid_build: "#0f6b5b", cm_at_risk: "#4fa892", progressive_design_build: "#8fd3c3", eci: "#a9491a", ipd: "#f4a259", any_lean: "#c8553d" };

  function figFed() {
    const keys = ["design_build", "idiq_matoc", "design_bid_build", "cm_at_risk", "progressive_design_build", "eci", "ipd", "any_lean"];
    const dy = { design_build: 6, idiq_matoc: -6, cm_at_risk: 2, progressive_design_build: -10, eci: 12, ipd: -2, any_lean: 8, design_bid_build: 4 };
    const series = keys.map((k) => ({ key: k, name: f.terms[k], color: COLORS[k], big: k === "any_lean", width: k === "any_lean" ? 1.2 : 1.8, dy: dy[k],
      values: f.by_year.map((r) => ({ x: r.fy, y: r[k], of: Math.round(r.solicitations * r.with_text) })) }));
    C.lines($("fig-fed"), series, { h: 320, log, yLabel: "solicitations naming the term" });
  }
  function cases() {
    const el = $("fed-cases");
    el.innerHTML = `<p class="fine">${C.fmt(f.total_solicitations)} distinct construction solicitations; ${f.lean_solicitations.length} name a lean method.</p>` +
      f.lean_solicitations.map((s) => `<div class="case"><div class="h">${s.title}</div><div class="muted">${[s.department, s.sub_tier, s.office].filter(Boolean).join(" · ")} · ${String(s.first_posted).slice(0, 10)} · ${s.notice_types}</div><div class="p">${s.passage.trim()}</div><div class="muted">terms: ${s.terms}</div></div>`).join("");
  }
  function figDep() {
    const keys = ["design_build", "idiq_matoc", "design_bid_build", "cm_at_risk"];
    const name = (d) => d.replace(/^DEPT OF /, "").split(",")[0].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace("Of ", "of ");
    const rows = f.by_department.map((r) => ({ label: name(r.department), n: r.solicitations, values: Object.fromEntries(keys.map((k) => [k, r[k] / r.solicitations])) }));
    const xmax = Math.min(1, 1.15 * d3.max(rows, (r) => d3.max(keys, (k) => r.values[k])));
    C.hbars($("fig-dep"), rows, keys.map((k) => ({ key: k, name: f.terms[k], fill: COLORS[k], dark: COLORS[k] })), { share: true, rowH: 11, gap: 10, left: 170, xmax });
  }
  function figContracts() {
    const el = $("fig-contracts"); el.innerHTML = "";
    [["pricing", "Pricing type"], ["compete", "Extent of competition"], ["work", "Kind of work"]].forEach(([k, name]) => {
      const box = document.createElement("div"); el.appendChild(box);
      const tot = Object.values(ct[k]).reduce((a, b) => a + b, 0);
      const rows = Object.entries(ct[k]).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, values: { s: n / tot }, n }));
      C.hbars(box, rows, [{ key: "s", name: `${name} (share of ${C.fmt(tot)} awards)`, fill: "#c9c4e8", dark: "#4a3b8c" }], { share: true, rowH: 13, gap: 5, left: 200, labelN: false });
    });
    const by = ct.by_year;
    const series = [
      { key: "ff", name: "firm fixed price", color: "#4a3b8c", values: by.map((r) => ({ x: r.year, y: Math.round(100 * r.firm_fixed / r.awards), of: r.awards })) },
      { key: "sa", name: "set-aside", color: "#a9491a", values: by.map((r) => ({ x: r.year, y: Math.round(100 * r.set_aside / r.awards), of: r.awards })) },
      { key: "fo", name: "full and open", color: "#0f6b5b", values: by.map((r) => ({ x: r.year, y: Math.round(100 * r.full_open / r.awards), of: r.awards })) },
      { key: "nc", name: "new construction", color: "#f4a259", values: by.map((r) => ({ x: r.year, y: Math.round(100 * r.new_construction / r.awards), of: r.awards })) },
    ];
    const box = document.createElement("div"); el.appendChild(box);
    C.lines(box, series, { h: 220, yLabel: "share of the year's usable awards, %" });
  }
  function figOwners() {
    const rows = lci.sectors.filter((r) => r.type === "OWNER" && r.sector).sort((a, b) => b.members - a.members).map((r) => ({ label: r.sector.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), values: { n: r.members } }));
    C.hbars($("fig-owners"), rows, [{ key: "n", name: "LCI owner members, 2026", fill: "#8fd3c3", dark: "#0f6b5b" }], { share: false, rowH: 16, gap: 8, left: 120, labelN: false });
  }
  function init(data) {
    f = data.federal; lci = data.lci; ct = data.contracts;
    document.querySelectorAll("#fed-scale .chip").forEach((c) => c.addEventListener("click", () => { document.querySelectorAll("#fed-scale .chip").forEach((x) => x.classList.toggle("on", x === c)); log = c.dataset.s === "log"; figFed(); }));
    figFed(); cases(); figContracts(); figDep(); figOwners();
    C.onResize(() => { figFed(); figContracts(); figDep(); figOwners(); });
  }
  return { init, show() {}, hide() {} };
})();
