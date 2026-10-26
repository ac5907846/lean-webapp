// Boot: load the data, build each view once, route by hash.
(async function () {
  const V = "19";
  const get = (f) => fetch(`data/${f}?v=${V}`).then((r) => r.json());
  const [S, wall] = await Promise.all([get("summary.json"), get("wall.json")]);
  const data = { S, wall, G: null, Mk: null, A: null };
  const rest = Promise.all([get("groups.json"), get("markets.json"), get("answers.json")]).then(([G, Mk, A]) => { data.G = G; data.Mk = Mk; data.A = A; });
  document.getElementById("foot").textContent = `Lean Construction Atlas · data built ${S.built} · ${S.counts.series.toLocaleString("en-US")} contractor series on ${S.counts.lists} ENR Top 400 lists · ${S.counts.awards_usable.toLocaleString("en-US")} usable federal awards · website measures provisional until the dictionary is validated`;

  const views = { findings: Findings, contractors: Contractors, markets: Markets, outcomes: Outcomes, data: DataTab };
  const needsRest = new Set(["contractors", "markets", "outcomes", "data"]);
  const built = new Set();
  let current = null, firstLanding = true;

  async function route() {
    const h = (location.hash || "#findings").slice(1);
    const [name, arg] = h.split("/");
    const tab = views[name] ? name : "findings";
    if (needsRest.has(tab) || arg) await rest;
    if (current && current !== tab) views[current].hide();
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== "p-" + tab; });
    document.querySelectorAll("#tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
    if (!built.has(tab)) { views[tab].init(data); built.add(tab); }
    views[tab].show(tab === "findings" && firstLanding, arg ? decodeURIComponent(arg) : null);
    if (tab === "findings") firstLanding = false;
    current = tab;
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", route);
  await route();
  rest.then(() => { if (!built.has("findings")) return; Findings.tiles && Findings.tiles(data); });
})();
