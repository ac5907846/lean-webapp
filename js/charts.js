// Small chart builders on D3: grouped and stacked bars, dot-and-interval, lines, a bubble matrix. Every function
// renders into a container element, measures its width, and redraws on resize through C.onResize.
window.C = (function () {
  const GROUP = { lci: { name: "LCI members", fill: "#8fd3c3", dark: "#0f6b5b" }, enr: { name: "ENR Top 400, not LCI", fill: "#f6c89a", dark: "#a9491a" },
                  fed: { name: "Federal builders", fill: "#c9c4e8", dark: "#4a3b8c" } };
  const LEVEL = { 0: "#ffffff", 1: "#ffe08a", 2: "#f4a259", 3: "#c8553d" };
  const resizers = [];
  let rt = null;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => resizers.forEach((f) => f()), 120); });
  const onResize = (f) => { resizers.push(f); };
  const width = (el) => Math.max(260, el.getBoundingClientRect().width);
  const tip = document.getElementById("tip");
  function showTip(ev, html) { tip.innerHTML = html; tip.hidden = false; moveTip(ev); }
  function moveTip(ev) { const x = ev.clientX + 14, y = ev.clientY + 14; tip.style.left = Math.min(x, window.innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.min(y, window.innerHeight - tip.offsetHeight - 8) + "px"; }
  function hideTip() { tip.hidden = true; }
  const pct = (v, d = 0) => (100 * v).toFixed(d) + "%";
  const fmt = (v) => v.toLocaleString("en-US");

  function svg(el, h) { el.innerHTML = ""; const w = width(el); return { s: d3.select(el).append("svg").attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`), w, h }; }

  // Horizontal grouped bars: rows = [{label, values: {key: v}, n}], series = [{key, name, fill, dark}]; shares in 0..1 or counts.
  function hbars(el, rows, series, { share = true, h = null, left = 150, rowH = 22, gap = 10, labelN = true, xmax = null } = {}) {
    const H = h || rows.length * (series.length * rowH + gap) + 30;
    const { s, w } = svg(el, H);
    const x = d3.scaleLinear().domain([0, xmax || (share ? 1 : d3.max(rows, (r) => d3.max(series, (k) => r.values[k.key] || 0)) || 1)]).range([left, w - 60]);
    const g = s.append("g");
    rows.forEach((r, ri) => {
      const y0 = 8 + ri * (series.length * rowH + gap);
      g.append("text").attr("x", left - 8).attr("y", y0 + (series.length * rowH) / 2 + 4).attr("text-anchor", "end").text(r.label);
      if (labelN && r.n != null) g.append("text").attr("x", left - 8).attr("y", y0 + (series.length * rowH) / 2 + 17).attr("text-anchor", "end").attr("fill", "#777").attr("font-size", 10).text("n = " + fmt(r.n));
      series.forEach((k, ki) => {
        const v = r.values[k.key] || 0;
        g.append("rect").attr("x", left).attr("y", y0 + ki * rowH + 2).attr("height", rowH - 4).attr("width", 0).attr("fill", k.fill).attr("stroke", k.dark)
          .on("mousemove", (ev) => showTip(ev, `<b>${r.label}</b>${k.name}: ${share ? pct(v, 1) : fmt(v)}${r.n != null && share ? ` of ${fmt(r.n)}` : ""}`)).on("mouseleave", hideTip)
          .transition().duration(M.reduced ? 0 : 600).attr("width", Math.max(0, x(v) - left));
        g.append("text").attr("x", x(v) + 4).attr("y", y0 + ki * rowH + rowH / 2 + 4).attr("fill", k.dark).text(share ? pct(v) : fmt(v));
      });
    });
    const ax = d3.axisBottom(x).ticks(5).tickFormat(share ? (d) => pct(d) : fmt);
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 22})`).call(ax);
    legend(el, series);
  }

  function legend(el, series) {
    const l = document.createElement("div"); l.className = "legend";
    l.innerHTML = series.map((k) => `<span style="--sw:${k.fill};--sb:${k.dark}">${k.name}</span>`).join("");
    el.appendChild(l);
  }

  // Vertical stacked bars by year with a cumulative line: data = {year: {key: count}}, series as above.
  function stackedYears(el, data, series, { years, h = 260, cumulative = true } = {}) {
    const { s, w } = svg(el, h);
    const m = { l: 36, r: 44, t: 10, b: 28 };
    const x = d3.scaleBand().domain(years).range([m.l, w - m.r]).padding(0.2);
    const tot = years.map((y) => d3.sum(series, (k) => (data[y] && data[y][k.key]) || 0));
    const y = d3.scaleLinear().domain([0, d3.max(tot) || 1]).nice().range([h - m.b, m.t]);
    let cum = 0; const cums = years.map((yr, i) => (cum += tot[i]));
    const y2 = d3.scaleLinear().domain([0, d3.max(cums) || 1]).nice().range([h - m.b, m.t]);
    years.forEach((yr, i) => {
      let base = 0;
      series.forEach((k) => {
        const v = (data[yr] && data[yr][k.key]) || 0;
        if (!v) return;
        s.append("rect").attr("x", x(yr)).attr("width", x.bandwidth()).attr("y", y(base + v)).attr("height", y(base) - y(base + v)).attr("fill", k.fill).attr("stroke", k.dark)
          .on("mousemove", (ev) => showTip(ev, `<b>${yr}</b>${k.name}: ${v}<br>all groups: ${tot[i]}; cumulative: ${cums[i]}`)).on("mouseleave", hideTip);
        base += v;
      });
    });
    if (cumulative) {
      const line = d3.line().x((d, i) => x(years[i]) + x.bandwidth() / 2).y((d) => y2(d));
      s.append("path").datum(cums).attr("d", line).attr("fill", "none").attr("stroke", "#1c1c1c").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 3");
      s.append("g").attr("class", "axis").attr("transform", `translate(${w - m.r},0)`).call(d3.axisRight(y2).ticks(5));
      s.append("text").attr("x", w - m.r - 4).attr("y", m.t + 2).attr("text-anchor", "end").attr("font-size", 10).attr("fill", "#777").text("cumulative (dashed, right axis)");
    }
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(years.filter((v, i) => i % 2 === 0)));
    s.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
    legend(el, series);
  }

  // Dot and interval: rows = [{label, n, share, lo, hi, share2, lo2, hi2}]
  function dotInterval(el, rows, { h = null, left = 170, rowH = 24, name1 = "ever listed", name2 = "listed in 2026" } = {}) {
    const H = h || rows.length * rowH + 36;
    const { s, w } = svg(el, H);
    const x = d3.scaleLinear().domain([0, Math.min(1, (d3.max(rows, (r) => r.hi) || 0.5) * 1.1)]).range([left, w - 40]);
    rows.forEach((r, i) => {
      const y = 12 + i * rowH;
      s.append("text").attr("x", left - 8).attr("y", y + 4).attr("text-anchor", "end").text(r.label);
      s.append("text").attr("x", left - 8).attr("y", y + 15).attr("text-anchor", "end").attr("font-size", 10).attr("fill", "#777").text("n = " + r.n);
      s.append("line").attr("x1", x(r.lo)).attr("x2", x(r.hi)).attr("y1", y - 4).attr("y2", y - 4).attr("stroke", "#0f6b5b").attr("stroke-width", 2);
      s.append("circle").attr("cx", x(r.share)).attr("cy", y - 4).attr("r", 5).attr("fill", "#8fd3c3").attr("stroke", "#0f6b5b")
        .on("mousemove", (ev) => showTip(ev, `<b>${r.label}</b>${name1}: ${pct(r.share, 1)} (${pct(r.lo, 1)} to ${pct(r.hi, 1)})`)).on("mouseleave", hideTip);
      s.append("line").attr("x1", x(r.lo2)).attr("x2", x(r.hi2)).attr("y1", y + 6).attr("y2", y + 6).attr("stroke", "#a9491a").attr("stroke-width", 2);
      s.append("circle").attr("cx", x(r.share2)).attr("cy", y + 6).attr("r", 5).attr("fill", "#f6c89a").attr("stroke", "#a9491a")
        .on("mousemove", (ev) => showTip(ev, `<b>${r.label}</b>${name2}: ${pct(r.share2, 1)} (${pct(r.lo2, 1)} to ${pct(r.hi2, 1)})`)).on("mouseleave", hideTip);
    });
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 24})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => pct(d)));
    legend(el, [{ name: name1, fill: "#8fd3c3", dark: "#0f6b5b" }, { name: name2, fill: "#f6c89a", dark: "#a9491a" }]);
  }

  // Multi-line chart by year: series = [{key, name, color, values: [{x, y}]}]
  function lines(el, series, { h = 300, log = false, yLabel = "" } = {}) {
    const { s, w } = svg(el, h);
    const m = { l: 48, r: 150, t: 12, b: 28 };
    const xs = series.flatMap((k) => k.values.map((v) => v.x));
    const x = d3.scaleLinear().domain(d3.extent(xs)).range([m.l, w - m.r]);
    const ymax = d3.max(series, (k) => d3.max(k.values, (v) => v.y)) || 1;
    const y = log ? d3.scaleSymlog().constant(1).domain([0, ymax]).range([h - m.b, m.t]) : d3.scaleLinear().domain([0, ymax]).nice().range([h - m.b, m.t]);
    const line = d3.line().x((v) => x(v.x)).y((v) => y(v.y));
    series.forEach((k) => {
      s.append("path").datum(k.values).attr("d", line).attr("fill", "none").attr("stroke", k.color).attr("stroke-width", k.width || 1.8);
      s.selectAll(null).data(k.values).enter().append("circle").attr("cx", (v) => x(v.x)).attr("cy", (v) => y(v.y)).attr("r", (v) => (k.big && v.y > 0 ? 6 : 3)).attr("fill", k.color).attr("stroke", "#fff")
        .on("mousemove", (ev, v) => showTip(ev, `<b>FY${v.x}</b>${k.name}: ${fmt(v.y)}${v.of ? ` of ${fmt(v.of)} solicitations` : ""}`)).on("mouseleave", hideTip);
      const last = k.values[k.values.length - 1];
      s.append("text").attr("x", x(last.x) + 8).attr("y", y(last.y) + 4 + (k.dy || 0)).attr("fill", k.color).attr("font-size", 11).text(k.name);
    });
    s.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(9).tickFormat((d) => d));
    s.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(log ? d3.axisLeft(y).tickValues([0, 1, 3, 10, 30, 100, 300, 1000, 3000]).tickFormat(fmt) : d3.axisLeft(y).ticks(6).tickFormat(fmt));
    if (yLabel) s.append("text").attr("x", m.l).attr("y", 10).attr("font-size", 10).attr("fill", "#777").text(yLabel);
  }

  // Bubble matrix: keys (ordered), names, diag counts, pair counts {"a|b": n}
  function bubbleMatrix(el, keys, names, diag, pairs, { cell = 26, left = 160 } = {}) {
    const n = keys.length, H = left + n * cell + 10;
    const W = Math.max(width(el), left + n * cell + 10);
    el.innerHTML = "";
    const s = d3.select(el).append("svg").attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);
    const r = d3.scaleSqrt().domain([0, d3.max(Object.values(diag)) || 1]).range([0, cell / 2 - 1]);
    keys.forEach((a, i) => {
      s.append("text").attr("x", left - 6).attr("y", left + i * cell + cell / 2 + 4).attr("text-anchor", "end").text(names[a]);
      s.append("text").attr("transform", `translate(${left + i * cell + cell / 2 + 4},${left - 6}) rotate(-60)`).text(names[a]);
      keys.forEach((b, j) => {
        const v = i === j ? diag[a] : pairs[a < b ? `${a}|${b}` : `${b}|${a}`] || 0;
        const cx = left + j * cell + cell / 2, cy = left + i * cell + cell / 2;
        s.append("rect").attr("x", left + j * cell).attr("y", left + i * cell).attr("width", cell).attr("height", cell).attr("fill", (i + j) % 2 ? "#faf9f4" : "#fff").attr("stroke", "#eee");
        if (v) s.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r(v)).attr("fill", i === j ? "#f4a259" : "#8fd3c3").attr("stroke", i === j ? "#a9491a" : "#0f6b5b")
          .on("mousemove", (ev) => showTip(ev, i === j ? `<b>${names[a]}</b>${v} organizations` : `<b>${names[a]} and ${names[b]}</b>${v} organizations name both`)).on("mouseleave", hideTip);
      });
    });
  }

  // Small multiples: bars of counts by year for several keys
  function smallMultiples(el, items, years, { cols = 4, h = 90, w0 = null } = {}) {
    el.innerHTML = "";
    const W = w0 || width(el), cw = Math.floor(W / cols) - 8;
    const wrap = d3.select(el).append("div").style("display", "grid").style("grid-template-columns", `repeat(${cols}, 1fr)`).style("gap", "8px");
    const ymax = d3.max(items, (it) => d3.max(years, (y) => it.values[y] || 0)) || 1;
    items.forEach((it) => {
      const s = wrap.append("svg").attr("width", cw).attr("height", h).attr("viewBox", `0 0 ${cw} ${h}`);
      const x = d3.scaleBand().domain(years).range([4, cw - 4]).padding(0.15);
      const y = d3.scaleLinear().domain([0, ymax]).range([h - 18, 16]);
      s.append("text").attr("x", 4).attr("y", 11).attr("font-size", 11).attr("font-weight", 600).text(`${it.name} (${it.total})`);
      years.forEach((yr) => {
        const v = it.values[yr] || 0;
        s.append("rect").attr("x", x(yr)).attr("width", x.bandwidth()).attr("y", y(v)).attr("height", y(0) - y(v)).attr("fill", v ? "#f4a259" : "#eee").attr("stroke", v ? "#a9491a" : "none")
          .on("mousemove", (ev) => showTip(ev, `<b>${it.name}</b>${yr}: ${v} organizations first name it`)).on("mouseleave", hideTip);
      });
      [years[0], years[Math.floor(years.length / 2)], years[years.length - 1]].forEach((yr) => s.append("text").attr("x", x(yr) + x.bandwidth() / 2).attr("y", h - 5).attr("text-anchor", "middle").attr("font-size", 9).attr("fill", "#777").text(yr));
    });
  }

  function wilson(k, n, z = 1.96) {
    if (!n) return [0, 0];
    const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), s = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [(c - s) / d, (c + s) / d];
  }

  return { GROUP, LEVEL, hbars, stackedYears, dotInterval, lines, bubbleMatrix, smallMultiples, wilson, legend, showTip, moveTip, hideTip, onResize, pct, fmt };
})();
