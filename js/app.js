// Boot: load the data, build each view once, route by hash.
(async function () {
  const V = "22";
  const get = (f) => fetch(`data/${f}?v=${V}`).then((r) => r.json());
  const [S, orgs, topo] = await Promise.all([get("summary.json"), get("orgs.json"), get("us-states.json")]);
  const [years, methods, lci, enr] = await Promise.all([get("years.json"), get("methods.json"), get("lci.json"), get("enr.json")]);
  Object.assign(methods.names, { lci: "Lean Construction Institute named", ipd: "Integrated project delivery", huddle: "Daily huddles", six_sigma: "Lean Six Sigma" });   // flags without the "(flag)" suffix
  const data = { S, orgs, topo, years, methods, lci, enr };
  document.getElementById("foot").textContent = `What Do Management Signals Reveal? · data built ${S.built} · ${S.organizations.toLocaleString("en-US")} firms · website measures record public communication, not verified implementation`;

  const views = { landscape: Landscape, organizations: Organizations, methods: Methods, data: DataTab };
  const built = new Set();
  let current = null, firstLanding = true;

  function route() {
    const h = (location.hash || "#landscape").slice(1);
    const [name, arg] = h.split("/");
    const tab = views[name] ? name : "landscape";
    if (current && current !== tab) views[current].hide();
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== "p-" + tab; });
    document.querySelectorAll("#tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
    if (!built.has(tab)) { views[tab].init(data); built.add(tab); }
    views[tab].show(tab === "landscape" && firstLanding, arg);
    if (tab === "landscape") firstLanding = false;
    current = tab;
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", route);
  route();
})();
