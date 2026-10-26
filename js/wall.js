// The rank wall: every contractor on every ENR Top 400 list, 2001 to 2026, as one dot per firm-list (x: list year, y: rank),
// on a canvas; the hover highlights a firm's path; the tour of the landing view recolors and resizes the dots by stage.
window.Wall = (function () {
  const COL = { MM: ["#2E7D32", "#82B184"], MS: ["#1F5F8B", "#799FB9"], NM: ["#A64D79", "#CA94AF"], NS: ["#6B6760", "#C9C5BB"], U: ["#A9A59B", "#E6E3DB"], X: ["#C9C5BB", "#EFEDE7"] };
  const STATUS = { r: ["#1C1C1C", "#C9C5BB"], p: ["#C8553D", "#F2C4B8"], c: ["#A07A00", "#FFE08A"] };
  let cv, ctx, svg, years, firms, W, H, m = { l: 40, r: 14, t: 10, b: 24 }, x, y, state = {}, hover = null, raf = null, onPick = null;
  const reduced = M.reduced;

  function init(canvas, svgEl, wall, { pick } = {}) {
    cv = canvas; ctx = cv.getContext("2d"); svg = d3.select(svgEl); years = wall.years; firms = wall.firms; onPick = pick;
    firms.forEach((f) => { f.cur = f.r.map(() => ({ a: 0, s: 1 })); f.tgt = f.r.map(() => ({ a: 1, s: 1 })); f.col = COL[f.g][1]; f.jx = (hash(f.id) % 1000) / 1000 - .5; });
    resize();
    window.addEventListener("resize", () => { resize(); draw(); });
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", () => { hover = null; axes(); C.hideTip(); draw(); });
    cv.addEventListener("click", () => { if (hover && onPick) onPick(hover); });
  }
  function resize() {
    const box = cv.parentElement.getBoundingClientRect();
    W = Math.max(320, box.width); H = Math.max(300, box.height);
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    x = d3.scalePoint().domain(years).range([m.l, W - m.r]);
    y = d3.scaleLinear().domain([1, 400]).range([m.t, H - m.b]);
    svg.attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);
    axes();
  }
  function axes() {
    svg.selectAll("*").remove();
    const gy = svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l - 4},0)`).call(d3.axisLeft(y).tickValues([1, 100, 200, 300, 400]).tickSize(0));
    gy.select(".domain").remove();
    const gx = svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b + 6})`).call(d3.axisBottom(x).tickValues(years.filter((v) => v % 5 === 1 || v === 2026)).tickSize(0));
    gx.select(".domain").remove();
    svg.append("text").attr("x", m.l - 4).attr("y", m.t - 1).attr("text-anchor", "end").attr("font-size", 10).attr("fill", "#777").text("rank");
    if (state.lines) {
      const line = d3.line().defined((d) => d != null).x((d, i) => x(d.y)).y((d) => y(d.v)).curve(d3.curveMonotoneX);
      state.lines.forEach((l) => {
        svg.append("path").datum(l.pts).attr("d", line).attr("fill", "none").attr("stroke", l.color).attr("stroke-width", l.dash ? 1.6 : 2.6).attr("stroke-dasharray", l.dash ? "5 4" : null).attr("opacity", .95);
        const last = l.pts[l.pts.length - 1];
        svg.append("text").attr("x", x(last.y) + 4).attr("y", y(last.v) + 4).attr("font-size", 10.5).attr("font-weight", 600).attr("fill", l.color).text(l.label);
      });
    }
    if (state.cursor != null) {
      svg.append("line").attr("x1", x(state.cursor)).attr("x2", x(state.cursor)).attr("y1", m.t - 4).attr("y2", H - m.b + 2).attr("stroke", "#1c1c1c").attr("stroke-width", 1).attr("stroke-dasharray", "3 3");
      svg.append("text").attr("x", x(state.cursor)).attr("y", m.t - 2).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600).text(state.cursor);
    }
    if (hover) {
      const f = hover;
      const pts = years.map((yr, i) => (f.r[i] == null ? null : { y: yr, v: f.r[i], px: xp(f, i) }));
      const line = d3.line().defined((d) => d != null).x((d) => d.px).y((d) => y(d.v));
      svg.append("path").datum(pts).attr("d", line).attr("fill", "none").attr("stroke", "#1c1c1c").attr("stroke-width", 1.4);
      pts.forEach((p) => { if (p) svg.append("circle").attr("cx", p.px).attr("cy", y(p.v)).attr("r", 3).attr("fill", COL[f.g][0]).attr("stroke", "#1c1c1c").attr("stroke-width", .8); });
    }
  }
  const r0 = () => Math.max(1.1, Math.min(2.2, (W - m.l - m.r) / years.length / 14));
  const jw = () => Math.min(18, x.step() * .72);                                  // the width of a year's column of dots
  const xp = (f, i) => x(years[i]) + f.jx * jw();
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const base = r0();
    for (const f of firms) {
      for (let i = 0; i < years.length; i++) {
        const r = f.r[i]; if (r == null) continue;
        const c = f.cur[i]; if (c.a <= .02) continue;
        ctx.globalAlpha = c.a;
        ctx.fillStyle = c.col || f.col;
        ctx.beginPath(); ctx.arc(xp(f, i), y(r), base * c.s, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  // animate: every dot moves from cur to tgt over ms (alpha and size; colors switch at the start)
  let animId = 0;
  function animate(ms = 600) {
    const id = ++animId;
    if (reduced || ms === 0) { firms.forEach((f) => f.cur.forEach((c, i) => { c.a = f.tgt[i].a; c.s = f.tgt[i].s; c.col = f.tgt[i].col; })); draw(); return; }
    const t0 = performance.now();
    const start = firms.map((f) => f.cur.map((c) => ({ a: c.a, s: c.s })));
    firms.forEach((f) => f.cur.forEach((c, i) => { c.col = f.tgt[i].col; }));
    function step(now) {
      if (id !== animId) return;
      const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
      firms.forEach((f, fi) => f.cur.forEach((c, i) => { const s0 = start[fi][i], g = f.tgt[i]; c.a = s0.a + (g.a - s0.a) * e; c.s = s0.s + (g.s - s0.s) * e; }));
      draw();
      if (t < 1) M.raf(step);
    }
    M.raf(step);
  }
  // stages: a function of (firm, yearIndex) -> {a, s, col}
  function stage(fn, { lines = null, cursor = null, ms = 600 } = {}) {
    firms.forEach((f) => { for (let i = 0; i < years.length; i++) { if (f.r[i] == null) continue; const o = fn(f, i); const g = f.tgt[i]; g.a = o.a; g.s = o.s; g.col = o.col; } });
    state.lines = lines; state.cursor = cursor;
    axes(); animate(ms);
  }
  function setCursor(yr) { state.cursor = yr; axes(); }
  function onMove(ev) {
    const b = cv.getBoundingClientRect(), px = ev.clientX - b.left, py = ev.clientY - b.top;
    let best = null, bd = 64;
    const yi = years.reduce((bi, yr, i) => (Math.abs(x(yr) - px) < Math.abs(x(years[bi]) - px) ? i : bi), 0);
    for (const f of firms) { const r = f.r[yi]; if (r == null || f.cur[yi].a < .15) continue; const d = (xp(f, yi) - px) ** 2 + (y(r) - py) ** 2; if (d < bd) { bd = d; best = f; } }
    if (best !== hover) { hover = best; axes(); }
    if (best) {
      const r = best.r[yi], c = best.c[yi];
      C.showTip(ev, `<b>${best.n}</b><span class="m">${COLNAME(best.g)} · ${[best.st, best.rg].filter(Boolean).join(", ")}</span><br>${years[yi]}: rank ${r}${c != null ? `, CMAR ${c}% of revenue` : ""}<br>ranked ${best.nl} of 26 lists (${best.fl} to ${best.ll}); best rank ${best.best}${best.m ? `; LCI member since ${best.m}` : ""}<br><i>click for the profile</i>`);
    } else C.hideTip();
  }
  function COLNAME(g) { return ({ MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned", NS: "Non-member-silent", U: "website not read", X: "not ranked in 2023 to 2025" })[g]; }
  return { init, stage, draw, setCursor, COL, STATUS, name: COLNAME, firms: () => firms, years: () => years, x: () => x, y: () => y };
})();
