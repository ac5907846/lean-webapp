// Landing view: the hero map with its tour and readout, then four descriptive figures.
window.Landscape = (function () {
  let map, orgs, S, lci, enr, tour;
  const groupsOn = new Set(["lci", "enr", "fed"]);
  let mode = "all", year = 2026;
  const $ = (id) => document.getElementById(id);
  const G = C.GROUP;

  function style(d) {
    const on = groupsOn.has(d.group);
    const base = { fill: G[d.group].fill, stroke: G[d.group].dark, r: 3.2, opacity: .9, z: 1 };
    if (!on) return { ...base, hidden: true };
    const observed = d.level != null;
    const lvl = d.level || 0;
    if (mode === "all") return base;
    if (mode === "observed") return observed ? { ...base, r: 3.4, z: 2 } : { ...base, fill: "#fff", stroke: "#bbb", r: 2, opacity: .7, z: 0 };
    if (mode === "lean") return lvl >= 1 ? { fill: C.LEVEL[lvl], stroke: "#7a3b12", r: 4.5 + lvl, opacity: 1, z: 3 } : observed ? { ...base, fill: "#fff", r: 2.2, opacity: .8, z: 0 } : { ...base, fill: "#fff", stroke: "#ccc", r: 1.6, opacity: .5, z: 0 };
    if (mode === "method") return lvl >= 2 ? { fill: C.LEVEL[lvl], stroke: "#7a3b12", r: 5 + lvl, opacity: 1, z: 3 } : observed ? { ...base, fill: "#fff", r: 2.2, opacity: .8, z: 0 } : { ...base, fill: "#fff", stroke: "#ccc", r: 1.6, opacity: .5, z: 0 };
    if (mode === "year") {
      if (!d.panel) return { ...base, fill: "#fff", stroke: "#ddd", r: 1.4, opacity: .4, z: 0 };
      if (d.commit_year != null && d.commit_year <= year) return { fill: "#c8553d", stroke: "#7a1f10", r: d.commit_year === year ? 9 : 5.5, opacity: 1, z: 3 };
      const seen = d.first_observed != null && d.first_observed <= year;
      return seen ? { ...base, fill: "#fff", r: 2.4, opacity: .85, z: 1 } : { ...base, fill: "#fff", stroke: "#ddd", r: 1.6, opacity: .5, z: 0 };
    }
    return base;
  }

  function tipHtml(d) {
    const lvl = d.level == null ? "website not read" : ["read, no lean language", "general lean language", "names a lean routine", "names three or more routines"][d.level];
    const bits = [G[d.group].name, [d.city, d.state].filter(Boolean).join(", ")];
    if (d.enr_rank) bits.push(`ENR rank ${d.enr_rank}, $${C.fmt(Math.round(d.revenue_musd))} million`);
    if (d.fed_awards) bits.push(`${d.fed_awards} usable federal awards`);
    if (d.commit_year) bits.push(`first documented commitment ${d.commit_year}${d.left_censored ? " (left-censored)" : ""}`);
    return `<b>${d.name}</b><span class="m">${bits.filter(Boolean).join(" · ")}</span><br>${lvl}${d.methods && d.methods.length ? "<br>" + d.methods.map((m) => M_NAMES[m] || m).join(", ") : ""}`;
  }
  let M_NAMES = {};

  function draw(ms = 500) {
    map.update(orgs, style, { ms, tip: tipHtml, onClick: (d) => { location.hash = "#organizations/" + encodeURIComponent(d.id); } });
  }

  function readout(step, nums, note) {
    $("hero-step").textContent = step;
    const box = $("hero-nums");
    nums.forEach((n, i) => {
      let el = box.children[i];
      if (!el) { el = document.createElement("div"); el.className = "bignum"; el.innerHTML = '<div class="v"></div><div class="l"></div>'; box.appendChild(el); }
      el.className = "bignum " + (n.cls || "");
      const lab = el.querySelector(".l"), same = lab.textContent === n.l;   // a new quantity counts from 0, the same one carries
      M.countTo(el.querySelector(".v"), n.v, { suffix: n.suffix || "", decimals: n.d || 0, raw: !!n.raw, ms: n.raw ? 0 : 700, from: same ? null : 0 });
      lab.textContent = n.l;
    });
    while (box.children.length > nums.length) box.removeChild(box.lastChild);
    $("hero-note").textContent = note || "";
  }

  // Legend of the dots, one per mode; the symbols repeat the styles of style() above.
  const dot = (fill, stroke, r) => `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/></svg>`;
  const groupDots = () => ["lci", "enr", "fed"].map((g) => `<div>${dot(G[g].fill, G[g].dark, 3.5)}${G[g].name}</div>`).join("");
  const notRead = `<div>${dot("#fff", "#ccc", 2)}website not read</div>`;
  const LEGEND = {
    all: () => `<div class="t">One dot per organization, at its headquarters</div>${groupDots()}`,
    observed: () => `<div class="t">Archived website read</div>${groupDots()}${notRead}`,
    lean: () => `<div class="t">Highest level of lean language found</div><div>${dot(C.LEVEL[1], "#7a3b12", 5)}general lean language</div><div>${dot(C.LEVEL[2], "#7a3b12", 6)}names a lean routine</div><div>${dot(C.LEVEL[3], "#7a3b12", 7)}three or more routines on one page</div><div>${dot("#fff", "#888", 2.5)}read, no lean language (color of the group)</div>${notRead}`,
    method: () => `<div class="t">Named lean routines</div><div>${dot(C.LEVEL[2], "#7a3b12", 6.5)}names a lean routine</div><div>${dot(C.LEVEL[3], "#7a3b12", 7.5)}three or more routines on one page</div><div>${dot("#fff", "#888", 2.5)}read, no routine named</div>${notRead}`,
    year: () => `<div class="t">Federal builders in the panel, by year</div><div>${dot("#c8553d", "#7a1f10", 8)}first documented commitment this year</div><div>${dot("#c8553d", "#7a1f10", 5)}committed in an earlier year</div><div>${dot("#fff", "#888", 2.5)}observed, no lean language yet</div><div>${dot("#fff", "#ddd", 1.6)}not observed yet, or not in the panel</div>`,
  };
  function setMode(m) {
    mode = m;
    document.querySelectorAll("#hero-mode .chip").forEach((c) => c.classList.toggle("on", c.dataset.m === m));
    $("hero-yearbar").hidden = m !== "year";
    $("hero-legend").innerHTML = LEGEND[m]();
  }

  let gs;

  function stepAll() {
    setMode("all"); draw();
    readout("The frame", [
      { v: S.organizations, l: "organizations: ENR Top 400 contractors, LCI corporate members, and federal construction contractors with usable awards" },
      { v: S.by_group.lci, l: "LCI members", cls: "lci" }, { v: S.by_group.enr, l: "ENR Top 400, not LCI", cls: "enr" }, { v: S.by_group.fed, l: "federal builders, neither", cls: "fed" },
    ], `${C.fmt(S.with_place)} placed by headquarters; ${S.states} states.`);
  }
  function stepObserved() {
    setMode("observed"); draw();
    readout("Websites read", [
      { v: S.observed, l: "organizations whose archived website was read" },
      { v: S.panel_pages, l: "archived pages, 2008 to 2026, federal builders (Wayback Machine and Common Crawl)" },
      { v: S.recent_pages, l: "recent pages, 2024 to 2026, the rest of the frame (Common Crawl)" },
    ], "Pages are coded with a dictionary of lean construction terms; the texts themselves are not published.");
  }
  function stepLean() {
    setMode("lean"); draw();
    readout("Lean language", [
      { v: S.any_lean, l: `of ${S.observed} organizations read say lean construction on their site` },
      { v: gs.lci.n ? 100 * gs.lci.any_lean / gs.lci.n : 0, suffix: "%", l: `of LCI members read (${gs.lci.any_lean} of ${gs.lci.n})`, cls: "lci" },
      { v: gs.enr.n ? 100 * gs.enr.any_lean / gs.enr.n : 0, suffix: "%", l: `of ENR Top 400 firms read, not LCI (${gs.enr.any_lean} of ${gs.enr.n})`, cls: "enr" },
      { v: gs.fed.n ? 100 * gs.fed.any_lean / gs.fed.n : 0, suffix: "%", l: `of other federal builders read (${gs.fed.any_lean} of ${gs.fed.n})`, cls: "fed" },
    ], "Yellow: general lean language; orange: a named routine; red: three or more routines on one page.");
  }
  function stepMethod() {
    setMode("method"); draw();
    readout("Named methods", [
      { v: S.named_method, l: "organizations name a lean routine (Last Planner, pull planning, target value design, takt ...)" },
      { v: S.system_level, l: "name three or more routines on one page" },
      { v: gs.lci.n ? 100 * gs.lci.named_method / gs.lci.n : 0, suffix: "%", l: "of LCI members read", cls: "lci" },
      { v: gs.enr.n ? 100 * gs.enr.named_method / gs.enr.n : 0, suffix: "%", l: "of ENR Top 400 firms read, not LCI", cls: "enr" },
    ], "ENR firms outside LCI often use lean language without naming a method; LCI members name methods.");
  }
  let yearTimer = null;
  function stepYear(animate) {
    setMode("year");
    clearInterval(yearTimer);
    const run = (y) => {
      year = y; $("hero-year").value = y; $("hero-year-val").textContent = y; draw(250);
      const dated = orgs.filter((d) => groupsOn.has(d.group) && d.panel && d.commit_year != null && d.commit_year <= y).length;
      const seen = orgs.filter((d) => groupsOn.has(d.group) && d.panel && d.first_observed != null && d.first_observed <= y).length;
      readout("First documented commitment", [
        { v: y, l: "year", raw: true }, { v: dated, l: "federal builders with a documented commitment by this year" }, { v: seen, l: "federal builders whose site is observed by this year" },
        { v: S.dated, l: "dated in all, of 444 federal builders in the panel" },
      ], "Red: committed by this year (large: this year). White: observed, no lean language yet. The first observed year can be the commitment year (left-censored).");
    };
    if (animate && !M.reduced) {
      let y = 2008; run(y);
      yearTimer = setInterval(() => { y += 1; if (y > 2026) { clearInterval(yearTimer); return; } run(y); }, 650);
    } else run(year);
  }

  function initHero(topo) {
    map = USMap($("hero-svg"), topo);
    document.querySelectorAll("#hero-groups .chip").forEach((c) => c.addEventListener("click", () => {
      c.classList.toggle("on"); if (c.classList.contains("on")) groupsOn.add(c.dataset.g); else groupsOn.delete(c.dataset.g); draw(300);
    }));
    document.querySelectorAll("#hero-mode .chip").forEach((c) => c.addEventListener("click", () => {
      clearInterval(yearTimer);
      ({ all: stepAll, observed: stepObserved, lean: stepLean, method: stepMethod, year: () => stepYear(false) })[c.dataset.m]();
    }));
    $("hero-year").addEventListener("input", (ev) => { clearInterval(yearTimer); year = +ev.target.value; stepYear(false); });
    tour = M.tour({
      steps: [
        { ms: 5000, enter: stepAll }, { ms: 5000, enter: stepObserved }, { ms: 6000, enter: stepLean }, { ms: 6000, enter: stepMethod },
        { ms: 14500, enter: () => stepYear(true) },
      ],
      button: $("hero-play"), onPause: () => clearInterval(yearTimer), loop: true,
    });
  }

  function figGroups() {
    const rows = [["lci", "LCI members"], ["enr", "ENR Top 400, not LCI"], ["fed", "Federal builders"]].map(([g, label]) => ({
      label, n: gs[g].n, values: { any: gs[g].n ? gs[g].any_lean / gs[g].n : 0, method: gs[g].n ? gs[g].named_method / gs[g].n : 0 },
    }));
    C.hbars($("fig-groups"), rows, [{ key: "any", name: "Lean language on the site", fill: "#ffe08a", dark: "#a07a00" }, { key: "method", name: "Names a lean routine", fill: "#f4a259", dark: "#a9491a" }], { rowH: 20, gap: 14 });
  }
  function figCommit() {
    const years = d3.range(2008, 2027);
    const data = {};
    years.forEach((y) => { data[y] = {}; ["lci", "enr", "fed"].forEach((g) => { data[y][g] = (S.commit_years[g] || {})[y] || 0; }); });
    C.stackedYears($("fig-commit"), data, ["lci", "enr", "fed"].map((g) => ({ key: g, ...G[g] })), { years, h: 240 });
  }
  function figEnr() {
    const el = $("fig-enr"); el.innerHTML = "";
    const a = document.createElement("div"), b = document.createElement("div");
    el.appendChild(a); el.appendChild(b);
    const rowsM = enr.by_market.filter((r) => r.firms >= 10).map((r) => ({ label: r.dominant_market, n: r.firms, share: r.share_lci_ever, lo: r.lo_lci_ever, hi: r.hi_lci_ever, share2: r.share_lci_2026, lo2: r.lo_lci_2026, hi2: r.hi_lci_2026 }));
    C.dotInterval(a, rowsM, { rowH: 26 });
    const rowsS = enr.by_size.map((r) => ({ label: "Revenue " + r.revenue_quintile.toLowerCase(), n: r.firms, share: r.share_lci_ever, lo: r.lo_lci_ever, hi: r.hi_lci_ever, share2: r.share_lci_2026, lo2: r.lo_lci_2026, hi2: r.hi_lci_2026 }));
    C.dotInterval(b, rowsS, { rowH: 26 });
    b.querySelector(".legend").remove();
  }
  function figLci() {
    const el = $("fig-lci"); el.innerHTML = "";
    const a = document.createElement("div"), b = document.createElement("div");
    el.appendChild(a); el.appendChild(b);
    const rows = lci.types.filter((t) => t.members >= 3).sort((x, y) => y.members - x.members).map((t) => ({ label: t.type_name, values: { m: t.members, c: t.lean_yes } }));
    C.hbars(a, rows, [{ key: "m", name: "Members", fill: "#8fd3c3", dark: "#0f6b5b" }, { key: "c", name: "Whose directory entry claims lean practice", fill: "#ffe08a", dark: "#a07a00" }], { share: false, rowH: 13, gap: 8, left: 250, labelN: false });
    // cohort area: organizations listed each year by the year first listed
    const years = [...new Set(lci.cohorts.map((r) => r.year))].sort();
    const periods = [...new Set(lci.cohorts.map((r) => r.period))];
    const pal = ["#0f6b5b", "#4fa892", "#8fd3c3", "#c6ebe1", "#ffe08a"];
    const data = {}; years.forEach((y) => { data[y] = {}; });
    lci.cohorts.forEach((r) => { data[r.year][r.period] = r.organizations; });
    C.stackedYears(b, data, periods.map((p, i) => ({ key: p, name: "first listed " + p, fill: pal[i], dark: "#0f6b5b" })), { years, h: 220, cumulative: false });
  }

  async function init(data) {
    ({ orgs, S, lci, enr } = data);
    gs = S.group_stats;
    M_NAMES = data.methods.names;
    initHero(data.topo);
    figGroups(); figCommit(); figEnr(); figLci();
    C.onResize(() => { figGroups(); figCommit(); figEnr(); figLci(); });
  }
  // The tour runs until its Pause button is pressed; leaving the tab only suspends it and coming back resumes it.
  let resumeOnShow = true;
  function show() { if (tour && resumeOnShow && !tour.playing) tour.play(); else if (tour && tour.index < 0) stepAll(); }
  function hide() { if (tour) { resumeOnShow = tour.playing; tour.pause(); } clearInterval(yearTimer); }
  return { init, show, hide };
})();
