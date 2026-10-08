// Projects view: the project records with a verified quote, on a map and as cards; type, owner and delivery counts.
window.Projects = (function () {
  let p, map;
  const $ = (id) => document.getElementById(id);
  const TYPE_FILL = "#ffe08a", TYPE_DARK = "#a07a00";

  function tip(d) { return `<b>${d.project_name}</b><span class="m">${d.firm} \u00b7 ${[d.city, d.state].filter(Boolean).join(", ")}</span><br>${d.building_type}${d.delivery_method && d.delivery_method !== "unknown" ? " \u00b7 " + d.delivery_method : ""}${d.lean_methods ? "<br>" + d.lean_methods.replace(/;/g, ", ") : ""}`; }

  function drawMap() {
    const pts = p.records.map((r, i) => ({ ...r, id: "p" + i }));
    map.update(pts, () => ({ fill: TYPE_FILL, stroke: TYPE_DARK, r: 7, opacity: .95 }), { tip, onClick: (d) => { const c = document.querySelector(`[data-p="${d.id}"]`); if (c) c.scrollIntoView({ behavior: "smooth", block: "center" }); } });
  }
  function count(key) {
    const c = {};
    p.records.forEach((r) => { const v = (r[key] || "unknown").toString(); if (v === "NO_MAJORITY") return; c[v] = (c[v] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, values: { n } }));
  }
  function figTypes() {
    const el = $("fig-projtypes"); el.innerHTML = "";
    [["building_type", "Building type"], ["owner_type", "Owner type"], ["delivery_method", "Delivery method"]].forEach(([k, name]) => {
      const box = document.createElement("div"); el.appendChild(box);
      C.hbars(box, count(k), [{ key: "n", name, fill: TYPE_FILL, dark: TYPE_DARK }], { share: false, rowH: 13, gap: 5, left: 170, labelN: false });
    });
  }
  function cards() {
    $("proj-cards").innerHTML = p.records.map((r, i) => `<div class="pcard" data-p="p${i}"><h3>${r.project_name}</h3>
      <div class="meta">${[r.firm, [r.city, r.state].filter(Boolean).join(", "), r.completion_year ? "completed " + r.completion_year : null].filter(Boolean).join(" \u00b7 ")}</div>
      <div>${[r.building_type, r.owner_type !== "unknown" ? "owner: " + (r.owner || r.owner_type) : null, r.delivery_method !== "unknown" ? r.delivery_method : null, r.designer ? "designer: " + r.designer : null, r.value_usd_millions ? "$" + r.value_usd_millions + " million" : null].filter(Boolean).join(" \u00b7 ")}</div>
      ${r.lean_methods ? `<div class="tags" style="margin-top:6px">${r.lean_methods.split(";").map((m) => `<span class="tag spec">${m.trim()}</span>`).join("")}</div>` : ""}
      ${r.quote ? `<blockquote>${r.quote}</blockquote>` : ""}
      <div class="src">${r.domain}, archived ${r.year}${r.quote_verified ? " \u00b7 quote checked against the page" : ""}</div></div>`).join("");
  }
  function init(data) {
    p = data.projects;
    map = USMap($("proj-svg"), data.topo);
    drawMap(); figTypes(); cards();
    C.onResize(figTypes);
  }
  return { init, show() {}, hide() {} };
})();
