// Methods view: organizations per method, co-occurrence between methods, and the first year each method is named.
window.Methods = (function () {
  let m, scope = "frame";
  const $ = (id) => document.getElementById(id);

  function figMethods() {
    const counts = scope === "frame" ? m.frame_firms : m.panel_firms;
    const rows = m.routines.map((k) => ({ label: m.names[k], values: { n: counts[k] || 0 }, spec: m.specific.includes(k) })).sort((a, b) => b.values.n - a.values.n);
    const el = $("fig-methods");
    C.hbars(el, rows, [{ key: "n", name: scope === "frame" ? "organizations naming the method (any archived page)" : "panel organizations naming the method", fill: "#f4a259", dark: "#a9491a" }], { share: false, rowH: 14, gap: 6, left: 170, labelN: false });
    // mark generic tools
    el.querySelectorAll("svg text").forEach((t) => { const r = rows.find((x) => x.label === t.textContent); if (r && !r.spec) t.setAttribute("fill", "#777"); });
    const note = document.createElement("div"); note.className = "legend"; note.innerHTML = `<span style="--sw:#1c1c1c;--sb:#1c1c1c">specific routines</span><span style="--sw:#999;--sb:#999">generic tools</span>`;
    el.appendChild(note);
  }
  function figCooc() {
    const keys = m.routines.filter((k) => (m.panel_firms[k] || 0) >= 2);
    C.bubbleMatrix($("fig-cooc"), keys, m.names, m.panel_firms, m.cooccurrence, { cell: 24, left: 150 });
  }
  function figFirst() {
    const years = d3.range(2008, 2027);
    const items = m.routines.map((k) => ({ name: m.names[k], values: m.first_year[k] || {}, total: d3.sum(Object.values(m.first_year[k] || {})) })).filter((it) => it.total >= 3).sort((a, b) => b.total - a.total);
    const cols = window.innerWidth < 700 ? 2 : 4;
    C.smallMultiples($("fig-firstyear"), items, years, { cols, h: 100 });
  }
  function init(data) {
    m = data.methods;
    document.querySelectorAll("#meth-scope .chip").forEach((c) => c.addEventListener("click", () => {
      document.querySelectorAll("#meth-scope .chip").forEach((x) => x.classList.toggle("on", x === c)); scope = c.dataset.s; figMethods();
    }));
    figMethods(); figCooc(); figFirst();
    C.onResize(() => { figMethods(); figCooc(); figFirst(); });
  }
  return { init, show() {}, hide() {} };
})();
