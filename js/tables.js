// The article's results tables, rendered from the stored cells: estimate with stars and its interval on one line, counts,
// shares, means; panel names as group rows; the footer rows; hover for the exact p.
window.Tbl = (function () {
  const fmt = (v, d) => {
    if (v == null) return "";
    let s = Number(v).toFixed(d);
    if (parseFloat(s) === 0) s = s.replace("-", "");
    return s.replace(/^(-?)0\./, "$1.");
  };
  const fmtP = (p) => (p == null ? "" : p < .001 ? "< .001" : fmt(p, 3));
  const stars = (p) => (p == null ? "" : p < .001 ? "***" : p < .01 ? "**" : p < .05 ? "*" : "");
  const bound = (x, d) => {                       // a bound that rounds to zero keeps its sign and first digit
    if (x != null && x !== 0 && parseFloat(Number(x).toFixed(d)) === 0) for (let dd = d + 1; dd < d + 4; dd++) if (parseFloat(Number(x).toFixed(dd)) !== 0) return fmt(x, dd);
    return fmt(x, d);
  };
  function cellText(c, d) {
    if (!c) return "";
    if (c.kind === "text") return c.t;
    if (c.kind === "est") return `${fmt(c.est, d)}${stars(c.p)} [${bound(c.lo, d)}, ${bound(c.hi, d)}]`;
    if (c.kind === "count") return c.n != null ? `${c.x.toLocaleString("en-US")} of ${c.n.toLocaleString("en-US")}` : String(c.x);
    if (c.kind === "share") return fmt(c.est, 1) + "%";
    if (c.kind === "ratio") return fmt(c.est, 2) + (c.p != null ? stars(c.p) : "");
    if (c.kind === "mean") return `${fmt(c.est, d)}${c.n != null ? ` (${c.n.toLocaleString("en-US")})` : ""}`;
    if (c.kind === "range") return `${fmt(c.lo, d)} to ${fmt(c.hi, d)}`;
    return c.est != null ? fmt(c.est, d) : "";
  }
  function cellTip(c) {
    if (!c || c.kind === "text") return null;
    const bits = [];
    if (c.p != null) bits.push(`p ${c.p < .001 ? "< .001" : "= " + fmt(c.p, 3)}`);
    if (c.kind === "est") bits.push(`estimate ${fmt(c.est, 3)}; 95% CI [${fmt(c.lo, 3)}, ${fmt(c.hi, 3)}]`);
    if (c.src) bits.push(`test ${c.src}`);
    return bits.join("<br>");
  }
  // tab: {header: [[...]], panels: [{name, dec, rows: [{key, label, cells}], footer}]}; opts.keep: the stored column indexes to show
  // (1-based, in order); opts.head: replacement header for the kept columns; opts.panelNames: replacement panel titles
  function render(el, tab, { keep = null, head = null, panelNames = null, labelHead = "" } = {}) {
    const hdrRows = tab.header;
    const last = hdrRows[hdrRows.length - 1];
    const ncolAll = last.length;
    const cols = keep || d3.range(1, ncolAll);
    const t = document.createElement("table"); t.className = "res";
    const thead = document.createElement("thead");
    if (hdrRows.length > 1 && !keep) {                                   // spanners of a two-level header
      const tr = document.createElement("tr");
      const first = hdrRows[0];
      let j = 0;
      while (j < ncolAll) {
        let span = 1;
        if (first[j]) while (j + span < ncolAll && !first[j + span] && !last[j + span].startsWith("N")) span++;
        const th = document.createElement("th"); th.colSpan = span; th.textContent = first[j]; th.className = first[j] ? "span" : "";
        tr.appendChild(th); j += span;
      }
      thead.appendChild(tr);
    }
    const tr = document.createElement("tr");
    const h0 = document.createElement("th"); h0.textContent = labelHead; h0.className = "lab"; tr.appendChild(h0);
    cols.forEach((j, k) => { const th = document.createElement("th"); th.textContent = head ? head[k] : last[j].replace(/^\(\d+\)\s*/, "").replace("Planned comparison", "Main model"); tr.appendChild(th); });
    thead.appendChild(tr); t.appendChild(thead);
    const tb = document.createElement("tbody");
    tab.panels.forEach((p, pi) => {
      const name = panelNames ? panelNames[pi] : p.name;
      if (name) {
        const g = document.createElement("tr"); g.className = "group";
        const td = document.createElement("td"); td.colSpan = cols.length + 1; td.textContent = name.replace(/^Panel [A-Z]\.\s*/, ""); g.appendChild(td); tb.appendChild(g);
      }
      p.rows.forEach((r) => {
        const row = document.createElement("tr"); row.className = name ? "child" : "";
        const td0 = document.createElement("td"); td0.className = "lab"; td0.textContent = r.label; row.appendChild(td0);
        cols.forEach((j) => {
          const c = r.cells[j - 1], d = p.dec ? p.dec[j - 1] : 2;
          const td = document.createElement("td"); td.textContent = cellText(c, d);
          const tip = cellTip(c);
          if (tip) { td.classList.add("hastip"); td.addEventListener("mousemove", (ev) => C.showTip(ev, `<b>${r.label}</b>${tip}`)); td.addEventListener("mouseleave", C.hideTip); }
          if (c && c.kind === "est" && c.p != null && c.p < .05) td.classList.add("sig");
          row.appendChild(td);
        });
        tb.appendChild(row);
      });
      (p.footer || []).forEach((f) => {
        const row = document.createElement("tr"); row.className = "foot";
        const td0 = document.createElement("td"); td0.className = "lab"; td0.textContent = f.label; row.appendChild(td0);
        cols.forEach((j) => { const td = document.createElement("td"); td.textContent = f.values[j - 1] ?? ""; row.appendChild(td); });
        tb.appendChild(row);
      });
    });
    t.appendChild(tb);
    el.innerHTML = ""; el.appendChild(t);
  }
  return { render, fmt, fmtP, stars, cellText };
})();
