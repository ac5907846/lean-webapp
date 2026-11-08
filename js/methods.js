// Practices view (v22): the practices named together by the same firm, and the firms behind a practice or a pair (click a
// circle). The firms-per-practice bars and the first year named are in the Data tab’s More figures.
window.Methods = (function () {
  let m, orgs, G;
  const $ = (id) => document.getElementById(id);
  const groupsOn = new Set(["lci", "enr", "fed"]);
  let pick = null;   // {a, b}: a practice, or a pair of practices, whose firms are listed
  const SHORTG = { lci: "Member", enr: "Ranked, not member", fed: "Federal" };

  const pool = () => orgs.filter((d) => groupsOn.has(d.group) && d.methods && d.methods.length);
  const count = (rows) => { const c = {}; rows.forEach((d) => d.methods.forEach((k) => { c[k] = (c[k] || 0) + 1; })); return c; };
  const pairs = (rows) => { const p = {}; rows.forEach((d) => { const ms = [...d.methods].sort(); ms.forEach((a, i) => ms.slice(i + 1).forEach((b) => { p[`${a}|${b}`] = (p[`${a}|${b}`] || 0) + 1; })); }); return p; };

  function figCooc() {
    const rows0 = pool(), c = count(rows0), p = pairs(rows0);
    const keys = m.routines.filter((k) => (c[k] || 0) >= 3);
    C.bubbleMatrix($("fig-cooc"), keys, m.names, c, p, { cell: 24, left: 150, highlight: pick ? pick.a : null, onClick: (a, b) => { pick = a === b ? { a } : { a, b }; redraw(); } });
  }
  function list() {
    const el = $("meth-list");
    if (!pick) { el.innerHTML = '<p class="muted">Click a circle in the matrix to list the firms that name that practice, or both practices of a pair.</p>'; return; }
    const rows = pool().filter((d) => d.methods.includes(pick.a) && (!pick.b || d.methods.includes(pick.b))).sort((a, b) => a.name.localeCompare(b.name));
    const head = pick.b ? `${m.names[pick.a]} and ${m.names[pick.b]}` : m.names[pick.a];
    el.innerHTML = `<h3>${head}: ${rows.length} firm${rows.length === 1 ? "" : "s"} <a href="#" id="meth-clear" class="muted">clear</a></h3>` +
      `<table><tr><th>Firm</th><th>Group</th><th>State</th><th class="num">Practices</th></tr>` +
      rows.map((d) => `<tr><td><a href="#organizations/${encodeURIComponent(d.id)}">${d.name}</a></td><td><span class="dot ${d.group}"></span>${SHORTG[d.group]}</td><td>${d.state || ""}</td><td class="num">${d.methods.length}</td></tr>`).join("") + `</table>`;
    $("meth-clear").addEventListener("click", (ev) => { ev.preventDefault(); pick = null; redraw(); });
  }
  function redraw() { figCooc(); list(); }
  function init(data) {
    m = data.methods; orgs = data.orgs; G = C.GROUP;
    document.querySelectorAll("#meth-groups .chip").forEach((c) => c.addEventListener("click", () => {
      c.classList.toggle("on"); if (c.classList.contains("on")) groupsOn.add(c.dataset.g); else groupsOn.delete(c.dataset.g); redraw();
    }));
    const c0 = count(pool());
    pick = { a: m.routines.slice().sort((x, y) => (c0[y] || 0) - (c0[x] || 0))[0] };   // start on the most named practice
    redraw();
    C.onResize(() => { figCooc(); });
  }
  return { init, show() {}, hide() {} };
})();
