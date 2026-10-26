// Landing view: the rank wall with its tour and readout, then the four research questions as tiles.
window.Findings = (function () {
  let S, wall, data, tour, yearTimer = null;
  const $ = (id) => document.getElementById(id);
  const COL = Wall.COL;
  const GROUPS = ["MM", "MS", "NM", "NS"];
  const NAME = { MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned", NS: "Non-member-silent", U: "Website not read" };
  const fmt = Tbl.fmt;
  const peq = (p) => (p < .001 ? "p < .001" : "p = " + fmt(p, 3));

  function readout(step, nums, note) {
    $("hero-step").textContent = step;
    const box = $("hero-nums");
    nums.forEach((n, i) => {
      let el = box.children[i];
      if (!el) { el = document.createElement("div"); el.className = "bignum"; el.innerHTML = '<div class="v"></div><div class="l"></div>'; box.appendChild(el); }
      el.className = "bignum " + (n.cls || "");
      const lab = el.querySelector(".l"), same = lab.textContent === n.l;
      if (n.text != null) el.querySelector(".v").textContent = n.text;
      else M.countTo(el.querySelector(".v"), n.v, { suffix: n.suffix || "", decimals: n.d || 0, raw: !!n.raw, ms: n.raw ? 0 : 500, from: same ? null : 0 });
      lab.textContent = n.l;
    });
    while (box.children.length > nums.length) box.removeChild(box.lastChild);
    $("hero-note").textContent = note || "";
  }
  const dot = (fill, r = 4) => `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="${r}" fill="${fill}"/></svg>`;
  const groupDots = (dark) => GROUPS.map((g) => `<div>${dot(COL[g][dark ? 0 : 1])}${NAME[g]}</div>`).join("") + `<div>${dot(COL.U[1], 3)}website not read</div><div>${dot(COL.X[1], 2.5)}not ranked in 2023 to 2025</div>`;
  const LEGEND = {
    all: () => `<div class="t">One dot per contractor and list: its rank (1 at the top) on each ENR Top 400 list</div>`,
    groups: () => `<div class="t">Lean-signal group, read on the 2023 to 2025 lists</div>${groupDots(true)}`,
    cmar: () => `<div class="t">Dot area: the printed CMAR share of revenue</div>${groupDots(true)}`,
    position: () => `<div class="t">Lines: the median rank of each group on each list</div>${GROUPS.map((g) => `<div>${dot(COL[g][0])}${NAME[g]}</div>`).join("")}`,
    exits: () => `<div class="t">The lists as they came</div><div>${dot("#C8553D")}last list of a contractor that left the Top 400 for good</div><div>${dot(COL.NS[1])}ranked</div>`,
    outcomes: () => `<div class="t">Federal construction awards of the classified contractors</div>${groupDots(true)}`,
  };
  function setMode(m) {
    document.querySelectorAll("#hero-mode .chip").forEach((c) => c.classList.toggle("on", c.dataset.m === m));
    $("wall-legend").innerHTML = LEGEND[m]();
    clearInterval(yearTimer);
  }

  function stepAll() {
    setMode("all");
    Wall.stage(() => ({ a: .85, s: 1, col: "#8A877F" }));
    const c = S.counts;
    readout("The ENR Top 400, 2001 to 2026", [
      { v: c.series, l: "contractor series on the 26 annual lists" }, { v: c.firm_lists, l: "firm-lists (one dot each)" },
      { v: c.exits, l: "series that left the Top 400 for good", cls: "red" }, { v: c.returns, l: "series with a gap in their years ranked" },
    ], "Rank is the vertical position; a contractor's path appears on hover. Revenue values of single firms are not shown.");
  }
  function stepGroups() {
    setMode("groups");
    Wall.stage((f) => (GROUPS.includes(f.g) ? { a: .95, s: 1.15, col: COL[f.g][0] } : f.g === "U" ? { a: .5, s: .9, col: COL.U[1] } : { a: .25, s: .8, col: COL.X[1] }));
    const g = S.counts.groups;
    readout("Four lean-signal groups", [
      { v: g.MM, l: "member-mentioned: LCI member, lean language on the website", cls: "mm" }, { v: g.MS, l: "member-silent", cls: "ms" },
      { v: g.NM, l: "non-member-mentioned", cls: "nm" }, { v: g.NS, l: "non-member-silent (the reference group)", cls: "ns" },
    ], `${S.counts.classified} classified contractors on the 2023 to 2025 lists (${g.U} more whose website was not read); their earlier lists are the histories of these groups.`);
  }
  function stepCmar() {
    setMode("cmar");
    Wall.stage((f, i) => { const c = f.c[i]; const known = c != null && c > 0; return GROUPS.includes(f.g) ? { a: known ? .95 : .35, s: known ? 1 + 1.9 * Math.sqrt(c / 100) : .7, col: COL[f.g][0] } : { a: .15, s: .7, col: COL.X[1] }; });
    const h = S.headline;
    readout("CMAR specialization", [
      { v: h.cmar_points.est, d: 1, l: `percentage points more revenue from CMAR, member-mentioned against non-member-silent at equal size, market and region (95% CI [${fmt(h.cmar_points.lo, 1)}, ${fmt(h.cmar_points.hi, 1)}]; ${peq(h.cmar_points.p)})`, cls: "mm" },
      { v: h.cmar_part_mm, suffix: "%", l: "of the Top 400's CMAR revenue held by member-mentioned contractors", cls: "mm" },
      { text: `${h.cmar_award_mm.x} of ${h.cmar_award_mm.n}`, l: `member-mentioned contractors hold a federal CMAR award, against ${h.cmar_award_ns.x} of ${h.cmar_award_ns.n} non-member-silent`, cls: "mm" },
    ], "The signals mark the contractors of CMAR above all; the gap was already there on the lists of 2001 to 2012.");
  }
  function stepPosition() {
    setMode("position");
    const lines = data.Mk ? GROUPS.map((g) => ({ label: NAME[g], color: COL[g][0], pts: data.Mk.trajectories.filter((r) => r.g === g && r.y >= 2001 && r.firms >= 5).sort((a, b) => a.y - b.y).map((r) => ({ y: r.y, v: r.rank_med })) })) : null;
    Wall.stage((f) => (GROUPS.includes(f.g) ? { a: .22, s: 1, col: COL[f.g][0] } : { a: .08, s: .8, col: COL.X[1] }), { lines });
    const h = S.headline;
    readout("Position, not trajectory", [
      { v: h.rev_level_mm.est, suffix: "%", l: `higher revenue, member-mentioned against non-member-silent on the same list and in the same region (${peq(h.rev_level_mm.p)})`, cls: "mm" },
      { v: -h.rank_level_mm.est, suffix: "%", l: `lower rank number (${peq(h.rank_level_mm.p)}); ${fmt(h.rev_level_mm_size.est, 0)}% higher revenue at equal end-period size`, cls: "mm" },
      { v: h.rev_trend_mm.est, d: 2, l: `percentage points a year: the change of the revenue gap over 2013 to 2025 (95% CI [${fmt(h.rev_trend_mm.lo, 2)}, ${fmt(h.rev_trend_mm.hi, 2)}]; ${peq(h.rev_trend_mm.p)})` },
    ], "Stronger positions throughout, no faster climb: the same on every contractor ever ranked since 2013, with LCI membership at the time of each list.");
  }
  function stepExits(animate) {
    setMode("exits");
    const years = Wall.years(), firms = Wall.firms();
    const run = (idx) => {
      const yr = years[idx];
      Wall.stage((f, i) => (i > idx ? { a: 0, s: 1, col: COL.NS[1] } : f.fs === "p" && f.ll === years[i] ? { a: 1, s: 1.7, col: "#C8553D" } : { a: .8, s: 1, col: f.fs === "p" && f.ll < yr ? "#E9CFC8" : COL.NS[1] }), { cursor: yr, ms: 140 });
      const seen = firms.filter((f) => f.fl <= yr).length, gone = firms.filter((f) => f.fs === "p" && f.ll < yr).length;
      const h = S.headline.pandemic;
      readout("Entries and exits", [
        { v: yr, l: "list year", raw: true }, { v: seen, l: "contractors ranked so far" }, { v: gone, l: "left the Top 400 for good so far", cls: "red" },
        { v: h.estimate, d: 1, l: `percentage points: pre-pandemic LCI members on the 2020 list remained on the 2023 list more often than comparable contractors (95% CI [${fmt(h.ci_low, 1)}, ${fmt(h.ci_high, 1)}]; ${peq(h.p)})` },
      ], "Exits come from the bottom of the list in every year; members sit at the top. No signal observed before 2008 exists for the Great Recession.");
    };
    clearInterval(yearTimer);
    if (animate && !M.reduced) {
      let i = 0; run(i);
      yearTimer = setInterval(() => { i += 1; if (i >= years.length) { clearInterval(yearTimer); return; } run(i); }, 230);
    } else run(years.length - 1);
  }
  function stepOutcomes() {
    setMode("outcomes");
    Wall.stage((f) => (GROUPS.includes(f.g) ? { a: .5, s: 1, col: COL[f.g][0] } : { a: .1, s: .8, col: COL.X[1] }));
    const h = S.headline;
    readout("Project outcomes", [
      { v: h.dbb_change_signal.est, d: 2, l: `log change orders: contractors with any lean signal record more change orders on DBB awards in the main model (95% CI [${fmt(h.dbb_change_signal.lo, 2)}, ${fmt(h.dbb_change_signal.hi, 2)}]; ${peq(h.dbb_change_signal.p)}), a difference that depends on the specification` },
      { v: h.ext_ms_all.est, d: 2, l: `extension ratio: member-silent contractors' shorter schedule extensions across all awards (${peq(h.ext_ms_all.p)}), sensitive to single firms`, cls: "ms" },
      { text: "none", l: "consistent difference in recorded change orders or schedule extensions for member-mentioned contractors, on all awards, DBB or DB" },
    ], `${S.counts.awards_comparable.toLocaleString("en-US")} comparable federal awards of ${S.counts.fed_firms_comparable} firms, 2007 to 2025; ${S.counts.cmar_awards} CMAR awards, too few to compare.`);
  }
  const STEPS = [["all", "The lists", stepAll, 3200], ["groups", "Four groups", stepGroups, 3400], ["cmar", "CMAR specialization", stepCmar, 4200],
                 ["position", "Position, not trajectory", stepPosition, 4200], ["exits", "Entries and exits", () => stepExits(true), 7800], ["outcomes", "Project outcomes", stepOutcomes, 4200]];

  function tiles(d) {
    if (!$("rq-tiles") || !d.A) return;
    const T = [
      ["RQ1", "Do contractors displaying lean signals win more federal work?", "Not detectably at comparable size: the raw advantage of member-mentioned contractors shrinks once firm size is held fixed, and no group wins awards more often.", "#outcomes"],
      ["RQ2", "More CMAR, and DB rather than DBB?", "Yes for CMAR: a larger share of revenue, half of the Top 400's CMAR revenue, federal CMAR awards more often. DB over DBB for the three signal groups together, partly the procurement mode.", "#markets"],
      ["RQ3", "Stronger positions and faster climbs in the ENR rankings?", "Stronger positions, above all in CMAR, and the same on every contractor ever ranked; no group's revenue or rank gap trends over 2013 to 2025.", "#markets"],
      ["RQ4", "Fewer change orders and shorter extensions on federal awards?", "No consistent difference: the two shorter extensions of member-silent contractors rest on single firms; more change orders on DBB awards for the signal groups together depend on the specification.", "#outcomes"],
    ];
    $("rq-tiles").innerHTML = T.map(([q, h, a, href]) => `<a class="tile" href="${href}"><div class="q">${q}</div><div class="h">${h}</div><div class="a">${a}</div><div class="go">${href === "#markets" ? "Markets" : "Outcomes"} →</div></a>`).join("");
  }

  function init(d) {
    data = d; S = d.S; wall = d.wall;
    Wall.init($("wall"), $("wall-svg"), wall, { pick: (f) => { location.hash = "#contractors/" + encodeURIComponent(f.id); } });
    $("hero-mode").innerHTML = STEPS.map(([m, lab]) => `<button class="chip" data-m="${m}">${lab}</button>`).join("");
    document.querySelectorAll("#hero-mode .chip").forEach((c) => c.addEventListener("click", () => { const i = STEPS.findIndex((s) => s[0] === c.dataset.m); if (tour.playing) tour.go(i); else STEPS[i][2](); }));
    tour = M.tour({ steps: STEPS.map(([m, lab, fn, ms]) => ({ ms, enter: fn })), button: $("wall-play"), onPause: () => clearInterval(yearTimer), loop: true });
    $("wall").addEventListener("click", () => { if (tour.playing) tour.pause(); });           // a click inside the figure pauses; nothing else does
    tiles(d);
  }
  let resumeOnShow = true;
  function show(first) { if (tour && resumeOnShow && !tour.playing) tour.play(); else if (tour && tour.index < 0) stepAll(); }
  function hide() { if (tour) { resumeOnShow = tour.playing; tour.pause(); } clearInterval(yearTimer); }
  return { init, show, hide, tiles };
})();
