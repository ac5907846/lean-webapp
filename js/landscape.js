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
    const lvl = d.level == null ? "website not read" : C.LVL[d.level];
    const bits = [G[d.group].name, [d.city, d.state].filter(Boolean).join(", ")];
    if (d.enr_rank) bits.push(`ranked ${d.enr_rank}, revenue $${C.fmt(Math.round(d.revenue_musd))} million`);
    if (d.fed_awards) bits.push(`${d.fed_awards} federal project awards`);
    if (d.commit_year) bits.push(`first observed commitment ${d.commit_year}${d.left_censored ? " (left-censored)" : ""}`);
    return `<b>${d.name}</b><span class="m">${bits.filter(Boolean).join(" · ")}</span><br>${lvl}${d.methods && d.methods.length ? "<br>" + d.methods.map((m) => M_NAMES[m] || m).join(", ") : ""}`;
  }
  let M_NAMES = {};

  function draw(ms = 300) {
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
      M.countTo(el.querySelector(".v"), n.v, { suffix: n.suffix || "", decimals: n.d || 0, raw: !!n.raw, ms: n.raw ? 0 : 450, from: same ? null : 0 });
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
    all: () => `<div class="t">One dot per firm, at its headquarters</div>${groupDots()}`,
    observed: () => `<div class="t">Archived website read</div>${groupDots()}${notRead}`,
    lean: () => `<div class="t">Highest level of lean reference found</div><div>${dot(C.LEVEL[1], "#7a3b12", 5)}general lean reference</div><div>${dot(C.LEVEL[2], "#7a3b12", 6)}names a lean practice</div><div>${dot(C.LEVEL[3], "#7a3b12", 7)}three or more practices on one page</div><div>${dot("#fff", "#888", 2.5)}read, no lean reference (color of the group)</div>${notRead}`,
    method: () => `<div class="t">Named lean practices</div><div>${dot(C.LEVEL[2], "#7a3b12", 6.5)}names a lean practice</div><div>${dot(C.LEVEL[3], "#7a3b12", 7.5)}three or more practices on one page</div><div>${dot("#fff", "#888", 2.5)}read, no practice named</div>${notRead}`,
    year: () => `<div class="t">Federal award recipients in the panel, by year</div><div>${dot("#c8553d", "#7a1f10", 8)}first observed commitment this year</div><div>${dot("#c8553d", "#7a1f10", 5)}committed in an earlier year</div><div>${dot("#fff", "#888", 2.5)}observed, no lean reference yet</div><div>${dot("#fff", "#ddd", 1.6)}not observed yet, or not in the panel</div>`,
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
    readout("The firms", [
      { v: S.organizations, l: "U.S. project-based firms: the ENR Top 400 rankings, the LCI corporate directory, and other recipients of federal project awards" },
      { v: S.by_group.lci, l: "institute members", cls: "lci" }, { v: S.by_group.enr, l: "ranked firms, not members", cls: "enr" }, { v: S.by_group.fed, l: "other federal award recipients", cls: "fed" },
    ], `${C.fmt(S.with_place)} placed by headquarters; ${S.states} states. Two publicly observable credentials: professional institute membership and the firm’s own website references to lean project delivery.`);
  }
  function stepObserved() {
    setMode("observed"); draw();
    readout("Websites read", [
      { v: S.observed, l: "firms whose archived corporate website was read" },
      { v: S.panel_pages, l: "archived pages, 2008 to 2026, federal award recipients of the panel (Internet Archive and Common Crawl)" },
      { v: S.recent_pages, l: "recent pages, 2024 to 2026, the rest of the frame (Common Crawl)" },
    ], "Pages are read with a dictionary of lean project delivery terms; the texts themselves are not published.");
  }
  function stepLean() {
    setMode("lean"); draw();
    readout("Website references", [
      { v: S.any_lean, l: `of ${S.observed} firms read refer to lean practices on their site` },
      { v: gs.lci.n ? 100 * gs.lci.any_lean / gs.lci.n : 0, suffix: "%", l: `of institute members read (${gs.lci.any_lean} of ${gs.lci.n})`, cls: "lci" },
      { v: gs.enr.n ? 100 * gs.enr.any_lean / gs.enr.n : 0, suffix: "%", l: `of ranked firms read, not members (${gs.enr.any_lean} of ${gs.enr.n})`, cls: "enr" },
      { v: gs.fed.n ? 100 * gs.fed.any_lean / gs.fed.n : 0, suffix: "%", l: `of other federal award recipients read (${gs.fed.any_lean} of ${gs.fed.n})`, cls: "fed" },
    ], "Yellow: a general lean reference; orange: a named practice; red: three or more practices on one page.");
  }
  function stepMethod() {
    setMode("method"); draw();
    readout("Named practices", [
      { v: S.named_method, l: "firms name a lean practice (Last Planner System, pull planning, target value design, takt ...)" },
      { v: S.system_level, l: "name three or more practices on one page" },
      { v: gs.lci.n ? 100 * gs.lci.named_method / gs.lci.n : 0, suffix: "%", l: "of institute members read", cls: "lci" },
      { v: gs.enr.n ? 100 * gs.enr.named_method / gs.enr.n : 0, suffix: "%", l: "of ranked firms read, not members", cls: "enr" },
    ], "Ranked firms outside the institute often refer to lean without naming a practice; members name practices.");
  }
  let yearTimer = null;
  function stepYear(animate) {
    setMode("year");
    clearInterval(yearTimer);
    const run = (y) => {
      year = y; $("hero-year").value = y; $("hero-year-val").textContent = y; draw(180);
      const dated = orgs.filter((d) => groupsOn.has(d.group) && d.panel && d.commit_year != null && d.commit_year <= y).length;
      const seen = orgs.filter((d) => groupsOn.has(d.group) && d.panel && d.first_observed != null && d.first_observed <= y).length;
      readout("First observed commitment", [
        { v: y, l: "year", raw: true }, { v: dated, l: "federal award recipients with an observed commitment by this year" }, { v: seen, l: "federal award recipients whose site is observed by this year" },
        { v: S.dated, l: `dated in all, of ${S.panel_domains} federal award recipients in the panel` },
      ], "Red: committed by this year (large: this year). White: observed, no lean reference yet. The first observed year can be the commitment year (left-censored): it does not establish when the commitment was first made.");
    };
    if (animate && !M.reduced) {
      let y = 2008; run(y);
      yearTimer = setInterval(() => { y += 1; if (y > 2026) { clearInterval(yearTimer); return; } run(y); }, 280);
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
        { ms: 2600, enter: stepAll }, { ms: 2600, enter: stepObserved }, { ms: 3000, enter: stepLean }, { ms: 3000, enter: stepMethod },
        { ms: 6400, enter: () => stepYear(true) },
      ],
      button: $("hero-play"), onPause: () => clearInterval(yearTimer), loop: true,
    });
  }

  function figGroups() {
    const SHORT = { lci: "Institute members", enr: "Ranked, not members", fed: "Other federal recipients" };
    const rows = ["lci", "enr", "fed"].map((g) => ({
      label: SHORT[g], n: gs[g].n, values: { any: gs[g].n ? gs[g].any_lean / gs[g].n : 0, method: gs[g].n ? gs[g].named_method / gs[g].n : 0 },
    }));
    C.hbars($("fig-groups"), rows, [{ key: "any", name: "Refers to lean practices on the site", fill: "#ffe08a", dark: "#a07a00" }, { key: "method", name: "Names a lean practice", fill: "#f4a259", dark: "#a9491a" }], { rowH: 14, gap: 9, left: 140 });
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
    const rowsM = enr.by_market.filter((r) => r.firms >= 10).map((r) => ({ label: C.MARKET[r.dominant_market] || r.dominant_market, n: r.firms, share: r.share_lci_ever, lo: r.lo_lci_ever, hi: r.hi_lci_ever, share2: r.share_lci_2026, lo2: r.lo_lci_2026, hi2: r.hi_lci_2026 }));
    C.dotInterval(a, rowsM, { rowH: 26 });
    const rowsS = enr.by_size.map((r) => ({ label: "Revenue " + r.revenue_quintile.toLowerCase(), n: r.firms, share: r.share_lci_ever, lo: r.lo_lci_ever, hi: r.hi_lci_ever, share2: r.share_lci_2026, lo2: r.lo_lci_2026, hi2: r.hi_lci_2026 }));
    C.dotInterval(b, rowsS, { rowH: 26 });
    b.querySelector(".legend").remove();
  }
  function figLci() {
    const a = $("fig-lci-types"), b = $("fig-lci-growth");
    const rows = lci.types.filter((t) => t.members >= 3).sort((x, y) => y.members - x.members).map((t) => ({ label: C.TYPE[t.type_name] || t.type_name, values: { m: t.members, c: t.lean_yes } }));
    C.hbars(a, rows, [{ key: "m", name: "Members", fill: "#8fd3c3", dark: "#0f6b5b" }, { key: "c", name: "Whose directory entry describes lean practice", fill: "#ffe08a", dark: "#a07a00" }], { share: false, rowH: 13, gap: 8, left: 200, labelN: false });
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
