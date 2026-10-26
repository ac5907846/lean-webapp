// Contractors: Table 1, the profile splits (Figure 1), the lean website content (Figure 2), the list of the 278 classified
// contractors with a detail panel (rank path, LCI years, methods named, federal awards).
window.Contractors = (function () {
  let G, S, wall, byId = {}, sel = null, split = "firm_type", seg = "group";
  const $ = (id) => document.getElementById(id);
  const COL = Wall.COL, GROUPS = ["MM", "MS", "NM", "NS"];
  const NAME = { MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned", NS: "Non-member-silent", U: "Not read" };
  const fmt = Tbl.fmt, n = (v) => (v == null ? "" : Number(v).toLocaleString("en-US"));
  const groupsOn = new Set(GROUPS);
  const SPLITS = [["firm_type", "Firm type"], ["rank_band", "ENR rank"], ["region", "Region"], ["lists_band", "Years ranked"], ["cmar_band", "CMAR share of revenue"], ["federal_band", "Federal award value"]];
  const SEGS = [["group", "By group"], ["firm_type", "By firm type"], ["rank_band", "By ENR rank"]];

  function table1() {
    const t = G.table1;
    $("fig-table1").innerHTML = `<table class="t1"><thead><tr><th class="l"></th><th class="span" colspan="2">Lean classification</th><th class="span" colspan="3">ENR Top 400</th><th class="span" colspan="3">Federal construction awards</th></tr>
      <tr><th class="l">Group</th><th>LCI member</th><th>Lean website reference</th><th>Firms</th><th>Firm-list share</th><th>Revenue share</th><th>Firms</th><th>Awards</th><th>Award value share</th></tr></thead><tbody>
      ${t.map((r) => `<tr><td class="l"><span class="sw" style="background:${COL[r.g][1]};border-color:${COL[r.g][0]}"></span>${r.label}</td><td>${r.g === "U" ? "" : r.member ? "yes" : "no"}</td><td>${r.g === "U" ? "" : r.mention ? "yes" : "no"}</td><td>${n(r.enr_firms)}</td><td>${fmt(r.firm_lists_pct, 1)}%</td><td>${fmt(r.revenue_part_pct, 1)}%</td><td>${n(r.fed_firms)}</td><td>${n(r.awards)}</td><td>${fmt(r.value_part_pct, 1)}%</td></tr>`).join("")}
      </tbody></table>`;
  }

  function profile() {
    const el = $("fig-profile"); el.innerHTML = "";
    const rows = G.profile.filter((r) => r.split === split && r.category != null);
    const w = Math.max(280, el.getBoundingClientRect().width), left = 150, rowH = 26, H = rows.length * rowH + 34;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const x = d3.scaleLinear().domain([0, 100]).range([left, w - 56]);
    rows.forEach((r, i) => {
      const y0 = 6 + i * rowH;
      s.append("text").attr("x", left - 8).attr("y", y0 + 15).attr("text-anchor", "end").text(r.category);
      let acc = 0;
      GROUPS.forEach((g) => {
        const v = r["pct_" + g] || 0, cnt = r["n_" + g] || 0;
        s.append("rect").attr("x", x(acc)).attr("y", y0 + 3).attr("height", rowH - 8).attr("width", 0).attr("fill", COL[g][1]).attr("stroke", COL[g][0]).attr("stroke-width", .8)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${r.category}</b>${NAME[g]}: ${cnt} of ${r.firms} firms (${fmt(v, 1)}%)`)).on("mouseleave", C.hideTip)
          .transition().duration(M.reduced ? 0 : 400).attr("width", Math.max(0, x(acc + v) - x(acc)));
        if (v >= 9) s.append("text").attr("x", x(acc + v / 2)).attr("y", y0 + 16).attr("text-anchor", "middle").attr("font-size", 10.5).text(Math.round(v) + "%");
        acc += v;
      });
      s.append("text").attr("x", w - 50).attr("y", y0 + 15).attr("font-size", 11).attr("fill", "#777").text("n = " + r.firms);
    });
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 24})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => d + "%"));
    const l = document.createElement("div"); l.className = "legend";
    l.innerHTML = GROUPS.map((g) => `<span style="--sw:${COL[g][1]};--sb:${COL[g][0]}">${NAME[g]}</span>`).join("");
    el.appendChild(l);
  }

  function content() {
    const el = $("fig-content"); el.innerHTML = "";
    const cols = G.segments[seg];
    const rows = G.methods_matrix.filter((r) => r.family !== "kind");
    const w = Math.max(320, el.getBoundingClientRect().width), left = 190, cw = Math.min(170, (w - left - 10) / (cols.length + 1)), rh = 24;
    const fams = [...new Set(rows.map((r) => r.family))];
    const H = rows.length * rh + fams.length * 18 + 40;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const allCols = [...cols, "All"];
    allCols.forEach((c, j) => { const parts = c.length > 14 && cw < 130 ? c.split("-").map((p, k, a) => (k < a.length - 1 ? p + "-" : p)) : [c]; parts.forEach((p, k) => s.append("text").attr("x", left + cw * (j + .5)).attr("y", 14 + k * 12 - (parts.length - 1) * 6).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", c === "All" ? 600 : 500).text(p)); });
    const rmax = Math.min(rh, cw) / 2 - 2;
    let y = 24, fam = null;
    const FAM = { depth: "Depth of lean content", planning: "Planning routines", method: "Lean methods named", design: "Design and delivery", improvement: "Improvement routines", references: "References", total: "All lean-mentioning firms", flag: "Other" };
    rows.forEach((r) => {
      if (r.family !== fam) { fam = r.family; y += 6; s.append("text").attr("x", 4).attr("y", y + 10).attr("font-size", 11).attr("font-weight", 600).attr("fill", "#444").text(FAM[fam] || fam.charAt(0).toUpperCase() + fam.slice(1)); y += 16; }
      s.append("text").attr("x", left - 8).attr("y", y + rh / 2 + 4).attr("text-anchor", "end").text(r.label.length > 30 ? r.label.slice(0, 29) + "…" : r.label);
      allCols.forEach((c, j) => {
        const v = r[c]; if (v == null) return;
        const cx = left + cw * (j + .5), cy = y + rh / 2;
        const share = v / 100;
        s.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 0).attr("fill", c === "All" ? "#ddd" : d3.interpolateRgb("#fff3cc", "#c8553d")(share)).attr("stroke", "#1c1c1c").attr("stroke-width", .5)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${r.label}</b>${c}: ${fmt(v, 0)}% of the segment's lean-mentioning firms${c === "All" ? ` (${r.firms} of 118)` : ""}`)).on("mouseleave", C.hideTip)
          .transition().duration(M.reduced ? 0 : 400).attr("r", Math.max(2, rmax * Math.sqrt(share)));
        s.append("text").attr("x", cx).attr("y", cy + 3.5).attr("text-anchor", "middle").attr("font-size", 9.5).attr("pointer-events", "none").text(Math.round(v));
      });
      y += rh;
    });
    s.attr("height", y + 10).attr("viewBox", `0 0 ${w} ${y + 10}`);
  }

  // ---- the firm list
  function filtered() {
    const q = ($("firm-search").value || "").trim().toLowerCase(), type = $("firm-type").value, sort = $("firm-sort").value;
    let rows = G.firms.filter((f) => groupsOn.has(f.g) && (!type || f.type === type) && (!q || f.n.toLowerCase().includes(q) || (f.st || "").toLowerCase() === q));
    const key = { rank: (f) => f.rank, name: (f) => f.n.toLowerCase(), lists: (f) => -f.lists, fa: (f) => -f.fa, meth: (f) => -f.meth.length }[sort];
    rows.sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0));
    return rows;
  }
  function list() {
    const rows = filtered();
    $("firm-count").textContent = `${rows.length} of ${G.firms.length} contractors`;
    const el = $("firm-list");
    el.innerHTML = `<table><thead><tr><th>Contractor</th><th>Group</th><th>State</th><th>Firm type</th><th class="num">ENR rank</th><th class="num">Years ranked</th><th class="num">Federal awards</th><th class="num">Methods named</th></tr></thead><tbody>
      ${rows.slice(0, 300).map((f) => `<tr data-id="${f.id}" class="${sel && sel.id === f.id ? "sel" : ""}"><td>${f.n}</td><td><span class="dot" style="background:${COL[f.g][1]};border-color:${COL[f.g][0]}"></span>${NAME[f.g]}</td><td>${f.st || ""}</td><td>${f.type}</td><td class="num">${f.rank}</td><td class="num">${f.lists}</td><td class="num">${n(f.fa)}</td><td class="num">${f.meth.length || ""}</td></tr>`).join("")}
      </tbody></table>${rows.length > 300 ? `<div class="more muted">${rows.length - 300} more: narrow the search</div>` : ""}`;
    el.querySelectorAll("tr[data-id]").forEach((tr) => tr.addEventListener("click", () => { location.hash = "#contractors/" + encodeURIComponent(tr.dataset.id); }));
  }
  function spark(f) {
    const w = wall[f.id]; if (!w) return "";
    const W = 360, H = 110, years = S.years || d3.range(2001, 2027);
    const x = d3.scaleLinear().domain([2001, 2026]).range([30, W - 8]), y = d3.scaleLinear().domain([1, 400]).range([8, H - 20]);
    const pts = years.map((yr, i) => (w.r[i] == null ? null : [x(yr), y(w.r[i]), yr, w.r[i]]));
    const line = d3.line().defined((d) => d != null).x((d) => d[0]).y((d) => d[1]);
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g class="axis">${[1, 100, 200, 300, 400].map((v) => `<text x="26" y="${y(v) + 4}" text-anchor="end" font-size="9.5" fill="#777">${v}</text><line x1="30" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="#eee"/>`).join("")}
      ${[2001, 2006, 2011, 2016, 2021, 2026].map((v) => `<text x="${x(v)}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="#777">${v}</text>`).join("")}</g>
      <path d="${line(pts)}" fill="none" stroke="${COL[f.g][0]}" stroke-width="1.8"/>${pts.filter(Boolean).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3" fill="${COL[f.g][1]}" stroke="${COL[f.g][0]}"><title>${p[2]}: rank ${p[3]}</title></circle>`).join("")}</svg>`;
  }
  function detail(f) {
    sel = f;
    const w = wall[f.id];
    const status = w ? ({ r: "ranked in 2026", p: "left the Top 400", c: "absent since 2024 or 2025" })[w.fs] : "";
    $("firm-detail").innerHTML = `<h2>${f.n}</h2><div class="dom">${[f.st, f.rg].filter(Boolean).join(", ")} · ${f.type} · <span class="dot" style="background:${COL[f.g][1]};border-color:${COL[f.g][0]}"></span>${NAME[f.g]}</div>
      <h3>ENR Top 400 rank, 2001 to 2026</h3>${spark(f)}
      <dl><dt>Latest ranking</dt><dd>rank ${f.rank} (${f.ly})</dd><dt>Years ranked</dt><dd>${f.lists} of 26 lists since ${f.fl}${w ? `; best rank ${w.best}; ${status}` : ""}</dd>
      <dt>CMAR share of revenue</dt><dd>${f.cmb || "none printed"}</dd><dt>LCI membership</dt><dd>${f.m ? `listed ${f.m} to ${f.ml}` : "not in the directories 2013 to 2026"}</dd>
      <dt>Federal awards</dt><dd>${f.fa ? `${n(f.fa)} usable awards, US$${n(Math.round(f.fm))} million${f.ca ? "; holds a federal CMAR award" : ""}` : "none linked"}</dd></dl>
      <h3>Lean website content</h3>${f.g === "MM" || f.g === "NM" ? `<p class="muted" style="font-size:12.5px;margin:0 0 6px">${f.lp} pages with lean language${f.depth ? `; ${({ "3": "three or more methods named", "1_2": "one or two methods named", general: "general terms only" })[f.depth]}` : ""}${f.kinds.length ? `; on ${f.kinds.join(", ")} pages` : ""}</p>
      <div class="tags">${f.meth.map((m) => `<span class="tag spec">${G.method_names[m] || m}</span>`).join("") || "<span class='muted'>no method named</span>"}</div>` : "<p class='muted' style='font-size:12.5px'>no lean language on the archived pages read</p>"}
      <p class="fine">Website measures are provisional until the dictionary is validated. Revenue values of single firms are not shown (ENR's data).</p>`;
    document.querySelectorAll("#firm-list tr[data-id]").forEach((tr) => tr.classList.toggle("sel", tr.dataset.id === f.id));
  }
  function download() {
    const rows = filtered();
    const head = ["name", "group", "state", "region", "firm_type", "enr_rank_latest", "latest_list", "years_ranked", "first_list", "cmar_share_band", "lci_first_year", "lci_last_year", "federal_awards", "federal_value_musd", "federal_cmar_award", "lean_pages", "methods_named"];
    const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const csv = [head.join(",")].concat(rows.map((f) => [f.n, NAME[f.g], f.st, f.rg, f.type, f.rank, f.ly, f.lists, f.fl, f.cmb, f.m, f.ml, f.fa, f.fm, f.ca ? "yes" : "no", f.lp, f.meth.map((m) => G.method_names[m] || m).join("; ")].map(esc).join(","))).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "lean_signal_contractors.csv"; a.click();
  }

  function init(d) {
    G = d.G; S = d.S; d.wall.firms.forEach((f) => { byId[f.id] = f; }); wall = byId; S.years = d.wall.years;
    table1();
    $("prof-split").innerHTML = SPLITS.map(([k, lab]) => `<button class="chip ${k === split ? "on" : ""}" data-s="${k}">${lab}</button>`).join("");
    document.querySelectorAll("#prof-split .chip").forEach((c) => c.addEventListener("click", () => { split = c.dataset.s; document.querySelectorAll("#prof-split .chip").forEach((x) => x.classList.toggle("on", x === c)); profile(); }));
    $("content-seg").innerHTML = SEGS.map(([k, lab]) => `<button class="chip ${k === seg ? "on" : ""}" data-s="${k}">${lab}</button>`).join("");
    document.querySelectorAll("#content-seg .chip").forEach((c) => c.addEventListener("click", () => { seg = c.dataset.s; document.querySelectorAll("#content-seg .chip").forEach((x) => x.classList.toggle("on", x === c)); content(); }));
    $("firm-groups").innerHTML = GROUPS.map((g) => `<button class="chip on" data-g="${g}" style="--c:${COL[g][0]}">${NAME[g]}</button>`).join("");
    document.querySelectorAll("#firm-groups .chip").forEach((c) => c.addEventListener("click", () => { c.classList.toggle("on"); if (c.classList.contains("on")) groupsOn.add(c.dataset.g); else groupsOn.delete(c.dataset.g); list(); }));
    [...new Set(G.firms.map((f) => f.type))].sort().forEach((t) => { const o = document.createElement("option"); o.value = t; o.textContent = t; $("firm-type").appendChild(o); });
    ["firm-search", "firm-type", "firm-sort"].forEach((id) => $(id).addEventListener("input", list));
    $("firm-download").addEventListener("click", download);
    profile(); content(); list();
    C.onResize(() => { profile(); content(); });
  }
  function show(first, arg) {
    const f = arg ? G.firms.find((x) => x.id === arg) : null;
    if (f) { detail(f); const tr = document.querySelector(`#firm-list tr[data-id="${CSS.escape(f.id)}"]`); if (tr) tr.scrollIntoView({ block: "nearest" }); }
    else if (!sel) detail(filtered()[0]);
  }
  function hide() {}
  return { init, show, hide };
})();
