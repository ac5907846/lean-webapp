// Outcomes: the 45 main comparisons on the p axis (Figure 7), Tables 2 and 7, the DBB robustness checks (Table S4) and the
// survivorship checks (Table S6).
window.Outcomes = (function () {
  let A;
  const $ = (id) => document.getElementById(id);
  const COL = Wall.COL;
  const NAME = { MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned" };
  const fmt = Tbl.fmt, n = (v) => (v == null ? "" : Number(v).toLocaleString("en-US"));
  const rqOn = new Set(["RQ1", "RQ2", "RQ3", "RQ4"]);
  const ZLIM = 4.0;
  const z = (c) => (c.est >= 0 ? 1 : -1) * Math.min(ZLIM, quantile(1 - Math.max(c.p, 1e-4) / 2));
  function quantile(p) {                                         // the standard normal quantile (Acklam's approximation)
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239], b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1],
      c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pl = .02425, ph = 1 - pl;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > ph) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const q = p - .5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const sigPrinted = (p) => p < .001 || parseFloat(p.toFixed(3)) < .05;

  function forest() {
    const el = $("fig-forest"); el.innerHTML = "";
    const rows = [];
    const byLabel = d3.group(A.comparisons.filter((c) => rqOn.has(c.rq)), (c) => c.rq + "|" + c.label);
    let lastRq = null;
    byLabel.forEach((cs, key) => { const rq = key.split("|")[0]; if (rq !== lastRq) { rows.push({ rq, head: true }); lastRq = rq; } rows.push({ rq, label: cs[0].label, cs }); });
    const w = Math.max(360, el.getBoundingClientRect().width), left = Math.min(260, w * .36), m = { r: 16, t: 10, b: 54 }, pitch = 24, headH = 14;
    const H = m.t + rows.reduce((s, r) => s + (r.head ? headH : pitch), 0) + m.b;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const x = d3.scaleLinear().domain([-ZLIM, ZLIM]).range([left, w - m.r]);
    const top = m.t, bottom = H - m.b;
    s.append("rect").attr("x", x(-1.96)).attr("y", top).attr("width", x(1.96) - x(-1.96)).attr("height", bottom - top).attr("fill", "#EFEFEF");
    s.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", top).attr("y2", bottom).attr("stroke", "#1c1c1c").attr("stroke-width", .8);
    let y = m.t;
    const DODGE = { MM: -5, MS: 0, NM: 5 };
    rows.forEach((r) => {
      if (r.head) { s.append("text").attr("x", 4).attr("y", y + 11).attr("font-weight", 700).attr("font-size", 11.5).text(r.rq + " · " + A.comparisons.find((c) => c.rq === r.rq).rq_label); y += headH; return; }
      const yc = y + pitch / 2;
      s.append("text").attr("x", left - 10).attr("y", yc + 4).attr("text-anchor", "end").text(r.label);
      s.append("line").attr("x1", left).attr("x2", w - m.r).attr("y1", yc).attr("y2", yc).attr("stroke", "#E2E2E2").attr("stroke-width", .5);
      r.cs.forEach((c) => {
        const dark = sigPrinted(c.p);
        s.append("circle").attr("cx", x(z(c))).attr("cy", yc + DODGE[c.g]).attr("r", 5.5).attr("fill", COL[c.g][dark ? 0 : 1]).attr("stroke", "#1c1c1c").attr("stroke-width", .7)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${NAME[c.g]} · ${r.label}</b>${c.words}<br>estimate ${fmt(c.est, 3)}; 95% CI [${fmt(c.lo, 3)}, ${fmt(c.hi, 3)}]; p ${c.p < .001 ? "< .001" : "= " + fmt(c.p, 3)}<br><span class="m">${c.outcome}; n = ${n(c.n)}${c.firms ? ` (${n(c.firms)} firms)` : ""}; test ${c.id}</span>`)).on("mouseleave", C.hideTip);
      });
      y += pitch;
    });
    const ya = bottom + 8;
    s.append("line").attr("x1", left).attr("x2", w - m.r).attr("y1", ya).attr("y2", ya).attr("stroke", "#1c1c1c").attr("stroke-width", .8);
    [[0, "1"], [1.96, ".05"], [2.58, ".01"], [3.29, ".001"]].forEach(([v, lab]) => [v, -v].forEach((zz) => {
      s.append("line").attr("x1", x(zz)).attr("x2", x(zz)).attr("y1", ya).attr("y2", ya + 5).attr("stroke", "#1c1c1c").attr("stroke-width", .8);
      s.append("text").attr("x", x(zz)).attr("y", ya + 17).attr("text-anchor", "middle").attr("font-size", 10.5).text(lab);
    }));
    s.append("text").attr("x", left).attr("y", ya + 32).attr("font-size", 10.5).text("negative difference");
    s.append("text").attr("x", w - m.r).attr("y", ya + 32).attr("text-anchor", "end").attr("font-size", 10.5).text("positive difference");
    s.append("text").attr("x", (left + w - m.r) / 2).attr("y", ya + 46).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "#555").text("p value of the difference against non-member-silent contractors");
    const l = document.createElement("div"); l.className = "legend";
    l.innerHTML = ["MM", "MS", "NM"].map((g) => `<span style="--sw:${COL[g][1]};--sb:${COL[g][0]}">${NAME[g]}</span>`).join("") + `<span style="--sw:${COL.MM[0]};--sb:#1c1c1c">dark: p &lt; .05</span><span style="--sw:#EFEFEF;--sb:#EFEFEF">band: p ≥ .05</span>`;
    el.appendChild(l);
    const shown = A.comparisons.filter((c) => rqOn.has(c.rq));
    $("forest-note").textContent = `${shown.length} comparisons shown, ${shown.filter((c) => sigPrinted(c.p)).length} at p < .05`;
  }

  function s4() {
    const el = $("fig-s4"); el.innerHTML = "";
    const rows = A.s4.filter((r) => r.est != null && r.lo != null);
    const w = Math.max(320, el.getBoundingClientRect().width), left = Math.min(300, w * .5), rowH = 22, H = rows.length * rowH + 34;
    const s = d3.select(el).append("svg").attr("width", w).attr("height", H).attr("viewBox", `0 0 ${w} ${H}`);
    const isPois = (r) => /Poisson/.test(r.spec);
    const lin = rows.filter((r) => !isPois(r));
    const x = d3.scaleLinear().domain([Math.min(-.1, d3.min(lin, (r) => r.lo)), Math.max(.4, d3.max(lin, (r) => r.hi))]).nice().range([left, w - 16]);
    s.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 4).attr("y2", H - 28).attr("stroke", "#1c1c1c").attr("stroke-width", .7);
    rows.forEach((r, i) => {
      const yc = 8 + i * rowH + rowH / 2, dark = r.p != null && r.p < .05;
      const lab = r.spec.replace(/\(.*?\)/g, "").trim();
      s.append("text").attr("x", left - 8).attr("y", yc + 4).attr("text-anchor", "end").attr("font-size", 11).text(lab.length > 48 ? lab.slice(0, 47) + "…" : lab)
        .append("title").text(r.spec);
      if (isPois(r)) { s.append("text").attr("x", x(0) + 6).attr("y", yc + 4).attr("font-size", 11).attr("fill", "#555").text(`rate ratio ${fmt(r.est, 2)} [${fmt(r.lo, 2)}, ${fmt(r.hi, 2)}], p ${fmt(r.p, 3)}`); return; }
      s.append("line").attr("x1", x(r.lo)).attr("x2", x(r.hi)).attr("y1", yc).attr("y2", yc).attr("stroke", "#1c1c1c").attr("stroke-width", 1);
      s.append("circle").attr("cx", x(r.est)).attr("cy", yc).attr("r", 4.5).attr("fill", dark ? "#C8553D" : "#F2C4B8").attr("stroke", "#1c1c1c").attr("stroke-width", .7)
        .on("mousemove", (ev) => C.showTip(ev, `<b>${r.check.replace(/^\d\s*/, "")}</b>${r.spec}<br>${fmt(r.est, 3)} [${fmt(r.lo, 3)}, ${fmt(r.hi, 3)}]; p ${r.p == null ? "" : r.p < .001 ? "< .001" : "= " + fmt(r.p, 3)}; ${n(r.awards)} awards, ${n(r.firms)} firms`)).on("mouseleave", C.hideTip);
    });
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 26})`).call(d3.axisBottom(x).ticks(6).tickFormat((d) => fmt(d, 1)));
    s.append("text").attr("x", (left + w) / 2).attr("y", H - 2).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "#555").text("difference in log(1 + change orders) or in the unit of the row, DBB awards");
  }

  function survivorship() {
    const rows = A.survivorship;
    const show = ["H45a", "H45at", "H45b", "H45bt", "H45c", "H45ct", "H42a", "H42b", "H42c", "H43b", "H43d"];
    const LAB = { H45a: "Revenue, level difference (%)", H45at: "Revenue, annual trend (percentage points a year)", H45b: "Overall ENR rank, level (% of the rank number)", H45bt: "Overall ENR rank, annual trend (log points a year)", H45c: "Rank by CMAR revenue, level (%)", H45ct: "Rank by CMAR revenue, annual trend (log points a year)",
                  H42a: "Present on the 2023 ranking (points)", H42b: "Present on the 2021 to 2023 rankings (points)", H42c: "Lean page dated before 2020 vs website not archived: present in 2023 (points)", H43b: "Revenue change 2020 to 2023, stayers (%)", H43d: "Rank change 2020 to 2023, stayers (% of the rank number)" };
    const DEC = { H45a: 0, H45at: 2, H45b: 0, H45bt: 3, H45c: 0, H45ct: 3, H42a: 1, H42b: 1, H42c: 1, H43b: 1, H43d: 1 };
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    const tr = (id) => { const r = by[id]; if (!r) return ""; const d = DEC[id]; return `<tr class="child"><td class="lab">${LAB[id]}</td><td>${fmt(r.est, d)}${Tbl.stars(r.p)} [${fmt(r.lo, d)}, ${fmt(r.hi, d)}]</td><td>${Tbl.fmtP(r.p)}</td><td>${n(r.n)}</td><td>${n(r.exposed)}</td></tr>`; };
    $("tab-surv").innerHTML = `<table class="res"><thead><tr><th class="lab">Comparison</th><th>Estimate [95% CI]</th><th>p</th><th>N</th><th>Exposed</th></tr></thead><tbody>
      <tr class="group"><td colspan="5">Every contractor ranked 2013 to 2025: LCI membership at the time of each ranking against the rest</td></tr>${show.slice(0, 6).map(tr).join("")}
      <tr class="group"><td colspan="5">Contractors on the 2020 ranking: membership before the pandemic against never a member</td></tr>${show.slice(6).map(tr).join("")}</tbody></table>`;
  }

  function init(d) {
    A = d.A;
    $("forest-rq").innerHTML = ["RQ1", "RQ2", "RQ3", "RQ4"].map((q) => `<button class="chip on" data-q="${q}">${q}</button>`).join("");
    document.querySelectorAll("#forest-rq .chip").forEach((c) => c.addEventListener("click", () => { c.classList.toggle("on"); if (c.classList.contains("on")) rqOn.add(c.dataset.q); else rqOn.delete(c.dataset.q); forest(); }));
    forest(); s4(); survivorship();
    Tbl.render($("tab-rq1"), A.tables.rq1, { labelHead: "Group" });
    Tbl.render($("tab-rq4"), A.tables.rq4, { keep: [1, 2, 3, 5, 6, 7], head: ["Change orders, all awards", "Change orders, DBB", "Change orders, DB", "Extension, all awards", "Extension, DBB", "Extension, DB"], panelNames: ["Adjusted differences from non-member-silent contractors (log change orders; extension ratio)", "Group means (awards in parentheses)"], labelHead: "" });
    C.onResize(() => { forest(); s4(); });
  }
  return { init, show() {}, hide() {} };
})();
