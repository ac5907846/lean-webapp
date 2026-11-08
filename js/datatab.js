// Data view: what the site shows and how it relates to the article, the sources, the definitions and the limits.
window.DataTab = (function () {
  let S, m;
  const $ = (id) => document.getElementById(id);
  const f = (v) => C.fmt(v);
  const a = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t || u.replace(/^https?:\/\//, "")}</a>`;


  // The four background figures (moved from the Map tab on 2026-11-08, owner: keep the map uncluttered), drawn when opened.
  let enr, lci;
  const G = C.GROUP;
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
    const years = [...new Set(lci.cohorts.map((r) => r.year))].sort();
    const periods = [...new Set(lci.cohorts.map((r) => r.period))];
    const pal = ["#0f6b5b", "#4fa892", "#8fd3c3", "#c6ebe1", "#ffe08a"];
    const cohorts = {}; years.forEach((y) => { cohorts[y] = {}; });
    lci.cohorts.forEach((r) => { cohorts[r.year][r.period] = r.organizations; });
    C.stackedYears(b, cohorts, periods.map((p, i) => ({ key: p, name: "first listed " + p, fill: pal[i], dark: "#0f6b5b" })), { years, h: 220, cumulative: false });
  }
  function figGroups() {
    const gs = S.group_stats, SHORT = { lci: "Institute members", enr: "Ranked, not members", fed: "Other federal recipients" };
    const rows = ["lci", "enr", "fed"].map((g) => ({
      label: SHORT[g], n: gs[g].n, values: { any: gs[g].n ? gs[g].any_lean / gs[g].n : 0, method: gs[g].n ? gs[g].named_method / gs[g].n : 0 },
    }));
    C.hbars($("fig-groups"), rows, [{ key: "any", name: "Refers to lean practices on the site", fill: "#ffe08a", dark: "#a07a00" }, { key: "method", name: "Names a lean practice", fill: "#f4a259", dark: "#a9491a" }], { rowH: 14, gap: 9, left: 140 });
  }
  function figFirst() {
    const years = d3.range(2008, 2027);
    const items = m.routines.map((k) => ({ name: m.names[k], values: m.first_year[k] || {}, total: d3.sum(Object.values(m.first_year[k] || {})) })).filter((it) => it.total >= 3).sort((a, b) => b.total - a.total);
    C.smallMultiples($("fig-firstyear"), items, years, { cols: window.innerWidth < 700 ? 2 : 4, h: 100 });
  }
  function drawMore() { figGroups(); figCommit(); figEnr(); figLci(); figFirst(); }

  function init(data) {
    S = data.S; m = data.methods;
    enr = data.enr; lci = data.lci;
    const det = $("more-figs");
    det.addEventListener("toggle", () => { if (det.open) drawMore(); });
    C.onResize(() => { if (det.open) drawMore(); });
    const gs = S.group_stats;
    $("data-body").innerHTML = `
<h2>The study</h2>
<p>Buyers of complex services often rely on management credentials to assess firms whose capabilities they cannot directly observe. The article examines two publicly observable credentials associated with lean project delivery: membership in the Lean Construction Institute (LCI), a professional organization that maintains a public directory of its members, and the firm’s own references to lean practices on its corporate website. Membership provides a third-party record of professional affiliation; website references indicate how firms publicly present their management approaches. Neither constitutes an independent assessment of implementation or performance.</p>
<p>This site shows the firms behind the study: the U.S. project-based firms in the frame, the archived websites that were read, the practices the firms name and since when, and the sources of every record. The adjusted comparisons across the four organizational attributes (market specialization, competitive standing and growth, success in securing work, and project outcomes) are reported in the article and its supporting information. The linked records and the code are archived at ${a("https://doi.org/10.5281/zenodo.23667297", "doi.org/10.5281/zenodo.23667297")}.</p>

<h2>Sources</h2>
<table><tr><th>Source</th><th>What is used</th><th>Where</th><th>Period</th><th>Count</th></tr>
<tr><td>Engineering News-Record (ENR) Top 400 rankings</td><td>rank, headquarters, revenue, market shares, including the share of revenue from construction management at risk (CMAR)</td><td>${a("https://www.enr.com/toplists", "enr.com")}</td><td>2023 to 2025 for the frame</td><td>${S.enr_firms} firms (2025)</td></tr>
<tr><td>LCI corporate directory</td><td>member name, type, description and website; archived directories for the first and last year listed</td><td>${a("https://leanconstruction.org/member-directory/")}, ${a("https://web.archive.org/", "Internet Archive")}</td><td>2013 to 2026 (no archive for 2018)</td><td>${S.lci_members} members (2026)</td></tr>
<tr><td>USAspending award archive</td><td>federal prime awards in the building sector (NAICS 23), rebuilt with corrected definitions; the usable awards of each firm</td><td>${a("https://files.usaspending.gov/award_data_archive/")}</td><td>Fiscal years 2008 to 2026</td><td>${f(S.awards_usable)} usable awards</td></tr>
<tr><td>USAspending recipient profiles</td><td>the public profile of each recipient, linked from its page here</td><td>${a("https://www.usaspending.gov/", "usaspending.gov")}</td><td>October 2026</td><td></td></tr>
<tr><td>SAM.gov entity extract</td><td>website, city, state and business start date of each registered firm</td><td>${a("https://open.gsa.gov/api/sam-entity-extracts-api/", "SAM entity extracts")}</td><td>October 2026</td><td></td></tr>
<tr><td>Internet Archive and Common Crawl</td><td>archived pages of the panel firms’ websites (2008 to 2026) and recent pages of every firm in the frame (2024 to 2026)</td><td>${a("https://web.archive.org/", "web.archive.org")}, ${a("https://commoncrawl.org/", "commoncrawl.org")}</td><td>2008 to 2026; 2024 to 2026</td><td>${f(S.panel_pages)} and ${f(S.recent_pages)} pages</td></tr>
<tr><td>Census gazetteer</td><td>ZIP code and place centroids for the map</td><td>${a("https://www2.census.gov/geo/", "census.gov")}</td><td>2024</td><td>${f(S.with_place)} firms placed</td></tr></table>

<h2>Definitions</h2>
<ul>
<li><b>Frame.</b> ${f(S.organizations)} firms: the ENR Top 400 (2025 ranking), the LCI corporate directory (2026), and other recipients of federal project awards with usable awards and a website registered in SAM (the top 100 by large building awards, then firms with five or more large building awards). One row per website domain; firms sharing a domain are pooled. Organization types follow the LCI directory for its members; ranked firms and federal award recipients outside the directory are builders and project managers.</li>
<li><b>Groups.</b> Institute members: listed in the 2026 LCI directory (${f(S.by_group.lci)}). Ranked firms, not members: on the 2025 ENR ranking and not in the directory (${f(S.by_group.enr)}). Other federal award recipients: neither, with usable federal project awards (${f(S.by_group.fed)}). The article classifies firms by the two credentials together (member-mentioned, member-silent, non-member-mentioned, non-member-silent); the site shows the frame these classifications were read from.</li>
<li><b>Website references, levels.</b> 0: the pages carry no lean reference. 1: a general lean reference (lean construction, lean principles, lean project delivery, lean certification). 2: a named practice. 3: three or more named practices on one page. Named practices: Last Planner System, pull planning, weekly work plans, make-ready planning, percent plan complete, Big Room, target value design, takt, choosing by advantages. General planning and improvement tools count only when they appear alongside a general lean reference or a named practice on the same page: look-ahead planning, constraint analysis, A3, value stream mapping, gemba, kaizen. Matching is case-insensitive, uses word boundaries and excludes ambiguous abbreviations. The measures record public communication, not verified implementation.</li>
<li><b>First observed commitment.</b> For the ${S.panel_domains} federal award recipients of the panel, the first observed year with a level 1 page confirmed by a second page with a different address in the same year or by a page in the next observed year. A domain-year is observed when pages were parsed and the archive listed enough addresses; otherwise it is unknown, never treated as absence. Left-censored: the commitment year is the first observed year. The first observed appearance of a credential does not establish when it was initially acquired or communicated.</li>
<li><b>Recent snapshot.</b> For the rest of the frame, Common Crawl pages of 2024 to 2026 give the highest level found and the practices named, without dates.</li>
<li><b>Federal project awards.</b> Usable prime awards of the building sector (NAICS 23) rebuilt from the transaction archive with corrected definitions of value, obligation and period of performance; the firm pages summarize pricing type, extent of competition and kind of work (new facilities; maintenance, repair and alteration).</li>
</ul>

<h2>Limits</h2>
<ul>
<li>Website measures capture observable commitments rather than verified implementation; they are provisional until the dictionary is validated on a frozen sample of coded pages.</li>
<li>Archive coverage is uneven: Common Crawl starts in 2013 and large sites are sampled; a first year is an upper bound on when a commitment was first communicated. Years without coverage are unknown, not zero.</li>
<li>Websites of two very large firms (Skanska, AECOM) were read from Common Crawl only.</li>
<li>Institute membership is affiliation, not implementation; the first year listed is the first archived directory that lists the organization, and 2013 is the first directory.</li>
<li>Page texts are third-party copyright: the site shows coded measures and links to the archived pages, never the texts. Revenue values of single firms are shown as ENR publishes them in its ranking.</li>
<li>${f(m.pages)} panel pages read: level 0 ${f(m.levels_pages[0])}, level 1 ${f(m.levels_pages[1])}, level 2 ${f(m.levels_pages[2])}, level 3 ${f(m.levels_pages[3])}. ${f(S.observed)} firms read; ${f(S.any_lean)} refer to lean practices (institute members ${gs.lci.any_lean} of ${gs.lci.n}; ranked firms, not members ${gs.enr.any_lean} of ${gs.enr.n}; other federal award recipients ${gs.fed.any_lean} of ${gs.fed.n}).</li>
</ul>
<p class="fine">Data built ${S.built}.</p>`;
  }
  return { init, show() {}, hide() {} };
})();
