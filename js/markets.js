// Markets: the market-share bubble matrix (Figure 4), the federal delivery mix (Figure 5), the ENR trajectories (Figure 6) and
// the RQ2 and RQ3 tables.
window.Markets = (function () {
  let Mk, S;
  const $ = (id) => document.getElementById(id);
  const COL = Wall.COL, GROUPS = ["MM", "MS", "NM", "NS"];
  const NAME = { MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned", NS: "Non-member-silent", U: "Not read" };
  const fmt = Tbl.fmt, n = (v) => (v == null ? "" : Number(v).toLocaleString("en-US"));
  let metric = "rank_med";
  const on = new Set(GROUPS);
  const METRICS = [["rank_med", "Median rank", "rank (1 at the top)"], ["rev_part", "Share of the list's revenue", "% of the Top 400 revenue"], ["cm_part", "Share of the list's CMAR revenue", "% of the Top 400 CMAR revenue"], ["cm_mean", "Mean CMAR share of revenue", "% of the group's firms' revenue"], ["firms", "Firms on the list", "firms"]];

  function shares() {
    const el = $("fig-shares"); el.innerHTML = "";
    const FAM = [["ENR Top 400, lists 2013 to 2025", "firm_lists", [["firm_lists", "Firm-lists"], ["revenue", "Revenue"], ["cm", "CMAR revenue"]]],
                 ["Federal construction awards, 2007 to 2025", "fed_firms", [["fed_firms", "Firms"], ["awards", "Awards"], ["value", "Award value"], ["db", "DB award value"], ["cm_awards", "CMAR awards"]]]];
    const w = Math.max(320, el.getBoundingClientRect().width), left = 150, ncol = 8, cw = (w - left - 8) / (ncol + .5), rh = 44, H = 44 + 5 * rh + 30;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const rows = Mk.shares;
    const vmax = d3.max(rows, (r) => d3.max(FAM.flatMap((f) => f[2]), (c) => r[c[0]]));
    const rmax = Math.min(cw, rh) / 2 - 3;
    const lift = d3.scaleDiverging().domain([-2, 0, 2]).interpolator((t) => d3.interpolateRgb(d3.interpolateRgb("#B9A7D6", "#F3F1EC")(Math.min(1, t * 2)), "#5AA06A")(Math.max(0, t * 2 - 1)));
    let xcol = left;
    const xs = {};
    FAM.forEach(([fam, base, cols], fi) => {
      const x0 = xcol;
      cols.forEach(([k, lab]) => { xs[k] = xcol + cw / 2; const parts = lab.split(" "); const lines = parts.length > 1 && cw < 110 ? [parts.slice(0, -1).join(" "), parts[parts.length - 1]] : [lab]; lines.forEach((t, li) => s.append("text").attr("x", xcol + cw / 2).attr("y", 30 + li * 11 + (lines.length === 1 ? 6 : 0)).attr("text-anchor", "middle").attr("font-size", 10.5).text(t)); xcol += cw; });
      s.append("text").attr("x", (x0 + xcol) / 2).attr("y", 14).attr("text-anchor", "middle").attr("font-weight", 600).text(fam);
      s.append("line").attr("x1", x0 + 6).attr("x2", xcol - 6).attr("y1", 20).attr("y2", 20).attr("stroke", "#1c1c1c").attr("stroke-width", .7);
      if (fi === 0) xcol += cw / 2;
    });
    rows.forEach((r, i) => {
      const y = 44 + i * rh + rh / 2;
      s.append("rect").attr("x", 4).attr("y", y - 12).attr("width", left - 14).attr("height", 24).attr("rx", 5).attr("fill", COL[r.g][1]).attr("stroke", "#1c1c1c").attr("stroke-width", .6);
      s.append("text").attr("x", (left - 6) / 2).attr("y", y + 4).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600).text(r.label);
      FAM.forEach(([fam, base, cols]) => cols.forEach(([k, lab]) => {
        const v = r[k]; if (v == null) return;
        const ratio = r[base] ? v / r[base] : 1;
        const fill = k === base ? "#F3F1EC" : lift(Math.max(-2, Math.min(2, Math.log2(ratio || 1e-6))));
        if (v >= .5) s.append("circle").attr("cx", xs[k]).attr("cy", y).attr("r", 0).attr("fill", fill).attr("stroke", "#1c1c1c").attr("stroke-width", .6)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${r.label}</b>${lab}: ${fmt(v, 1)}% of the column total${k !== base ? `<br>${fmt(ratio, 2)} times its share of the ${base === "firm_lists" ? "firm-lists" : "firms"}` : ""}${k === "cm_awards" ? `<br>${r.firms_with_cmar_award} firms hold a federal CMAR award` : ""}`)).on("mouseleave", C.hideTip)
          .transition().duration(M.reduced ? 0 : 450).attr("r", Math.max(3, rmax * Math.sqrt(v / vmax)));
        s.append("text").attr("x", xs[k]).attr("y", y + 4).attr("text-anchor", "middle").attr("font-size", 10.5).attr("pointer-events", "none").text(Math.round(v));
      }));
    });
    const ky = 44 + 5 * rh + 14;
    s.append("text").attr("x", 4).attr("y", ky).attr("font-size", 11).attr("fill", "#555").text("area and number: % of the column total; fill: the share against the group's share of the firms (green above, purple below)");
  }

  function delivery() {
    const el = $("fig-delivery"); el.innerHTML = "";
    const CATS = [["CM at risk", "CMAR", "#F6C89A"], ["design-build", "DB", "#8FD3C3"], ["design-bid-build", "DBB", "#C9C4E8"], ["negotiated, delivery unnamed", "negotiated, delivery unnamed", "#E6E3DB"], ["task order, delivery unnamed", "task order, delivery unnamed", "#F3F1EC"], ["other or mixed", "other or mixed", "#FFFFFF"]];
    const keys = [...GROUPS, "U", "All"];
    const w = Math.max(320, el.getBoundingClientRect().width), left = 150, right = 150, rh = 34, H = keys.length * rh + 40;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const x = d3.scaleLinear().domain([0, 100]).range([left, w - right]);
    keys.forEach((g, i) => {
      const d = Mk.delivery[g], y = 8 + i * rh;
      if (g === "All") s.append("line").attr("x1", 4).attr("x2", w - 4).attr("y1", y - 5).attr("y2", y - 5).attr("stroke", "#1c1c1c").attr("stroke-width", .6);
      s.append("rect").attr("x", 4).attr("y", y + 2).attr("width", left - 14).attr("height", rh - 12).attr("rx", 5).attr("fill", g === "All" ? "#fff" : COL[g][1]).attr("stroke", "#1c1c1c").attr("stroke-width", .6);
      s.append("text").attr("x", (left - 6) / 2).attr("y", y + rh / 2 + 1).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600).text(g === "All" ? "All" : NAME[g]);
      let acc = 0;
      CATS.forEach(([cat, lab, fill]) => {
        const c = d.cats[cat]; if (!c) return;
        s.append("rect").attr("x", x(acc)).attr("y", y + 2).attr("height", rh - 12).attr("width", 0).attr("fill", fill).attr("stroke", "#1c1c1c").attr("stroke-width", .5)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${g === "All" ? "All comparable firms" : NAME[g]}</b>${lab}: ${fmt(c.pct, 1)}% of the group's award value (US$${n(Math.round(c.value_musd))} million, ${n(c.awards)} awards)`)).on("mouseleave", C.hideTip)
          .transition().duration(M.reduced ? 0 : 450).attr("width", Math.max(0, x(acc + c.pct) - x(acc)));
        if (c.pct >= 7) s.append("text").attr("x", x(acc + c.pct / 2)).attr("y", y + rh / 2 + 1).attr("text-anchor", "middle").attr("font-size", 10.5).attr("pointer-events", "none").text(Math.round(c.pct) + "%");
        acc += c.pct;
      });
      s.append("text").attr("x", w - right + 8).attr("y", y + rh / 2 + 1).attr("font-size", 11).text(`US$${(d.value_musd / 1000).toFixed(1)} billion · ${Math.round(100 * d.value_musd / Mk.delivery.All.value_musd)}%`);
    });
    const l = document.createElement("div"); l.className = "legend";
    l.innerHTML = CATS.map(([c, lab, fill]) => `<span style="--sw:${fill};--sb:#1c1c1c">${lab}</span>`).join("");
    el.appendChild(l);
  }

  function traj() {
    const el = $("fig-traj"); el.innerHTML = "";
    const w = Math.max(320, el.getBoundingClientRect().width), H = 320, m = { l: 48, r: 175, t: 12, b: 28 };
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const rows = Mk.trajectories.filter((r) => on.has(r.g) && r.firms >= 5);
    const years = d3.range(2001, 2027);
    const x = d3.scaleLinear().domain([2001, 2026]).range([m.l, w - m.r]);
    const vals = rows.map((r) => r[metric]).filter((v) => v != null);
    const mem = metric === "rank_med" ? Mk.members_by_year : [];
    const allv = vals.concat(mem.map((r) => r.rank_med));
    const y = metric === "rank_med" ? d3.scaleLinear().domain([Math.max(400, d3.max(allv) || 400), 1]).range([H - m.b, m.t]) : d3.scaleLinear().domain([0, d3.max(allv) * 1.08 || 1]).nice().range([H - m.b, m.t]);
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(years.filter((v) => v % 5 === 1 || v === 2026)).tickFormat(d3.format("d")));
    s.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));
    s.append("text").attr("x", m.l).attr("y", m.t - 2).attr("font-size", 10.5).attr("fill", "#777").text(METRICS.find((k) => k[0] === metric)[2]);
    if (metric === "rank_med") s.append("rect").attr("x", x(2013)).attr("y", m.t).attr("width", x(2025) - x(2013)).attr("height", H - m.b - m.t).attr("fill", "#f6f4ee").lower();
    const line = d3.line().x((d) => x(d.y)).y((d) => y(d[metric])).curve(d3.curveMonotoneX);
    const labels = [];                                                                // placed after the lines, pushed apart
    GROUPS.filter((g) => on.has(g)).forEach((g) => {
      const pts = rows.filter((r) => r.g === g).sort((a, b) => a.y - b.y);
      s.append("path").datum(pts).attr("d", line).attr("fill", "none").attr("stroke", COL[g][0]).attr("stroke-width", 2.2);
      s.selectAll(null).data(pts).enter().append("circle").attr("cx", (d) => x(d.y)).attr("cy", (d) => y(d[metric])).attr("r", 3.2).attr("fill", COL[g][1]).attr("stroke", COL[g][0])
        .on("mousemove", (ev, d) => C.showTip(ev, `<b>${NAME[g]}, ${d.y} list</b>${d.firms} firms; median rank ${d.rank_med} (quartiles ${d.rank_q1} to ${d.rank_q3}); ${fmt(d.rev_part, 1)}% of the list's revenue; ${fmt(d.cm_part, 1)}% of its CMAR revenue; mean CMAR share ${fmt(d.cm_mean, 1)}%`)).on("mouseleave", C.hideTip);
      const last = pts[pts.length - 1];
      labels.push({ x: x(last.y) + 6, y: y(last[metric]), text: NAME[g], color: COL[g][0], bold: true });
    });
    const placeLabels = () => { labels.sort((a, b) => a.y - b.y); for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 12) labels[i].y = labels[i - 1].y + 12; labels.forEach((l) => s.append("text").attr("x", l.x).attr("y", l.y + 4).attr("font-size", l.bold ? 11 : 10.5).attr("font-weight", l.bold ? 600 : 400).attr("fill", l.color).text(l.text)); };
    if (metric !== "rank_med") placeLabels();
    if (metric === "rank_med") {
      [true, false].forEach((isM) => {
        const pts = mem.filter((r) => r.member === isM).sort((a, b) => a.y - b.y);
        s.append("path").datum(pts).attr("d", d3.line().x((d) => x(d.y)).y((d) => y(d.rank_med)).curve(d3.curveMonotoneX)).attr("fill", "none").attr("stroke", isM ? "#1c1c1c" : "#8A877F").attr("stroke-width", 1.4).attr("stroke-dasharray", "5 4");
        const last = pts[pts.length - 1];
        labels.push({ x: x(last.y) + 6, y: y(last.rank_med), text: isM ? "LCI members, all series" : "other series, all series", color: isM ? "#1c1c1c" : "#8A877F", bold: false });
        s.selectAll(null).data(pts).enter().append("circle").attr("cx", (d) => x(d.y)).attr("cy", (d) => y(d.rank_med)).attr("r", 5).attr("fill", "transparent")
          .on("mousemove", (ev, d) => C.showTip(ev, `<b>${d.y} list, ${isM ? "members at the time" : "other series"}</b>${d.firms} firms; median rank ${d.rank_med}`)).on("mouseleave", C.hideTip);
      });
      placeLabels();
    }
  }

  function init(d) {
    Mk = d.Mk; S = d.S;
    $("traj-metric").innerHTML = METRICS.map(([k, lab]) => `<button class="chip ${k === metric ? "on" : ""}" data-k="${k}">${lab}</button>`).join("");
    document.querySelectorAll("#traj-metric .chip").forEach((c) => c.addEventListener("click", () => { metric = c.dataset.k; document.querySelectorAll("#traj-metric .chip").forEach((x) => x.classList.toggle("on", x === c)); traj(); }));
    $("traj-groups").innerHTML = GROUPS.map((g) => `<button class="chip on" data-g="${g}" style="--c:${COL[g][0]}">${NAME[g]}</button>`).join("");
    document.querySelectorAll("#traj-groups .chip").forEach((c) => c.addEventListener("click", () => { c.classList.toggle("on"); if (c.classList.contains("on")) on.add(c.dataset.g); else on.delete(c.dataset.g); traj(); }));
    shares(); delivery(); traj();
    Tbl.render($("tab-rq2enr"), Mk.tables.rq2_enr, { labelHead: "Group" });
    Tbl.render($("tab-rq2cmar"), Mk.tables.rq2_cmar, { labelHead: "Group" });
    Tbl.render($("tab-rq2db"), Mk.tables.rq2_db, { labelHead: "Group" });
    Tbl.render($("tab-rq3"), Mk.tables.rq3, { keep: [5, 6, 1], head: ["Level difference", "Size-adjusted difference", "Annual trend difference"], panelNames: ["Revenue (level: %; trend: percentage points a year)", "Overall ENR rank (level: % of the rank number; trend: log points a year)", "Rank by CMAR revenue (level: % of the rank number; trend: log points a year)"], labelHead: "Outcome / contractor group" });
    C.onResize(() => { shares(); delivery(); traj(); });
  }
  return { init, show() {}, hide() {} };
})();
