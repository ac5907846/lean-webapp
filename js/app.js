// Boot: load the data, build each view once, route by hash.
(async function () {
  const V = "17";
  const get = (f) => fetch(`data/${f}?v=${V}`).then((r) => r.json());
  const [S, orgs, topo] = await Promise.all([get("summary.json"), get("orgs.json"), get("us-states.json")]);
  const [years, methods, lci, enr, federal, projects, contracts] = await Promise.all([get("years.json"), get("methods.json"), get("lci.json"), get("enr.json"), get("federal.json"), get("projects.json"), get("contracts.json")]);
  const data = { S, orgs, topo, years, methods, lci, enr, federal, projects, contracts };
  document.getElementById("foot").textContent = `Lean Construction Atlas \u00b7 data built ${S.built} \u00b7 ${S.organizations.toLocaleString("en-US")} organizations \u00b7 provisional until the dictionary is validated`;

  const views = { landscape: Landscape, organizations: Organizations, methods: Methods, owners: Owners, projects: Projects, data: DataTab };
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
