// Methods view: organizations per method (by group), the pairs named together, the organizations behind a method or
// a pair (click), and the first year each method is named in the panel.
window.Methods = (function () {
  let m, orgs, G;
  const $ = (id) => document.getElementById(id);
  const groupsOn = new Set(["lci", "enr", "fed"]);
  let pick = null;   // {a, b}: a method, or a pair of methods, whose organizations are listed

  const pool = () => orgs.filter((d) => groupsOn.has(d.group) && d.methods && d.methods.length);
  const count = (rows) => { const c = {}; rows.forEach((d) => d.methods.forEach((k) => { c[k] = (c[k] || 0) + 1; })); return c; };
  const pairs = (rows) => { const p = {}; rows.forEach((d) => { const ms = [...d.methods].sort(); ms.forEach((a, i) => ms.slice(i + 1).forEach((b) => { p[`${a}|${b}`] = (p[`${a}|${b}`] || 0) + 1; })); }); return p; };

  function figMethods() {
    const rows0 = pool(), c = count(rows0);
    const rows = m.routines.map((k) => ({ label: m.names[k], key: k, values: { n: c[k] || 0 }, spec: m.specific.includes(k) })).filter((r) => r.values.n).sort((a, b) => b.values.n - a.values.n);
    const el = $("fig-methods");
    C.hbars(el, rows, [{ key: "n", name: `organizations naming the method (${C.fmt(rows0.length)} name at least one)`, fill: "#f4a259", dark: "#a9491a" }],
      { share: false, rowH: 14, gap: 6, left: 170, labelN: false, onClick: (r) => { pick = pick && pick.a === r.key && !pick.b ? null : { a: r.key }; redraw(); }, selected: (r) => pick && pick.a === r.key && !pick.b });
    el.querySelectorAll("svg text").forEach((t) => { const r = rows.find((x) => x.label === t.textContent); if (r && !r.spec) t.setAttribute("fill", "#777"); });
    const note = document.createElement("div"); note.className = "legend"; note.innerHTML = `<span style="--sw:#1c1c1c;--sb:#1c1c1c">specific routines</span><span style="--sw:#999;--sb:#999">generic tools</span>`;
    el.appendChild(note);
  }
  function figCooc() {
    const rows0 = pool(), c = count(rows0), p = pairs(rows0);
    const keys = m.routines.filter((k) => (c[k] || 0) >= 3);
    C.bubbleMatrix($("fig-cooc"), keys, m.names, c, p, { cell: 24, left: 150, highlight: pick ? pick.a : null, onClick: (a, b) => { pick = a === b ? { a } : { a, b }; redraw(); } });
  }
  function list() {
    const el = $("meth-list");
    if (!pick) { el.innerHTML = '<p class="muted">Click a method, or a pair in the matrix, to list the organizations that name it.</p>'; return; }
    const rows = pool().filter((d) => d.methods.includes(pick.a) && (!pick.b || d.methods.includes(pick.b))).sort((a, b) => a.name.localeCompare(b.name));
    const head = pick.b ? `${m.names[pick.a]} and ${m.names[pick.b]}` : m.names[pick.a];
    el.innerHTML = `<h3>${head}: ${rows.length} organization${rows.length === 1 ? "" : "s"} <a href="#" id="meth-clear" class="muted">clear</a></h3>` +
      `<table><tr><th>Organization</th><th>Group</th><th>State</th><th class="num">Methods named</th></tr>` +
      rows.map((d) => `<tr><td><a href="#organizations/${encodeURIComponent(d.id)}">${d.name}</a></td><td><span class="dot ${d.group}"></span>${G[d.group].name}</td><td>${d.state || ""}</td><td class="num">${d.methods.length}</td></tr>`).join("") + `</table>`;
    $("meth-clear").addEventListener("click", (ev) => { ev.preventDefault(); pick = null; redraw(); });
  }
  function figFirst() {
    const years = d3.range(2008, 2027);
    const items = m.routines.map((k) => ({ name: m.names[k], values: m.first_year[k] || {}, total: d3.sum(Object.values(m.first_year[k] || {})) })).filter((it) => it.total >= 3).sort((a, b) => b.total - a.total);
    const cols = window.innerWidth < 700 ? 2 : 4;
    C.smallMultiples($("fig-firstyear"), items, years, { cols, h: 100 });
  }
  function redraw() { figMethods(); figCooc(); list(); }
  function init(data) {
    m = data.methods; orgs = data.orgs; G = C.GROUP;
    document.querySelectorAll("#meth-groups .chip").forEach((c) => c.addEventListener("click", () => {
      c.classList.toggle("on"); if (c.classList.contains("on")) groupsOn.add(c.dataset.g); else groupsOn.delete(c.dataset.g); redraw();
    }));
    redraw(); figFirst();
    C.onResize(() => { figMethods(); figCooc(); figFirst(); });
  }
  return { init, show() {}, hide() {} };
})();
