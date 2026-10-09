// Data view: the pipeline as a figure (stages left to right, one plate per artifact, numbers from the data; hover a
// plate for its meaning, click a stage for the full explanation), the sources with their sizes and links, then the
// definitions and limits folded away.
window.DataTab = (function () {
  let S, m, O, picked = 0;
  const $ = (id) => document.getElementById(id);
  const f = (v) => C.fmt(v);
  const bytes = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : b >= 1e6 ? Math.round(b / 1e6) + " MB" : Math.round(b / 1e3) + " KB");
  const a = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t || u.replace(/^https?:\/\//, "")}</a>`;
  const PAL = { source: "#ebe9e2", frame: "#d9ead3", text: "#fff0c2", record: "#d4ebf2", site: "#ead1dc" };
  const EDGE = "#8a877f";

  // small vector marks, about 12 px, drawn from primitives (d is relative to the plate's left edge)
  const GLYPH = {
    doc: (g) => { g.append("path").attr("d", "M1 0h7l4 4v10H1z").attr("fill", "#fff").attr("stroke", EDGE); g.append("path").attr("d", "M8 0v4h4").attr("fill", "none").attr("stroke", EDGE); [6, 8.5, 11].forEach((y) => g.append("line").attr("x1", 3).attr("x2", 10).attr("y1", y).attr("y2", y).attr("stroke", EDGE)); },
    stack: (g) => { [0, 4, 8].forEach((y) => g.append("rect").attr("x", 1).attr("y", y).attr("width", 11).attr("height", 5).attr("fill", "#fff").attr("stroke", EDGE)); },
    globe: (g) => { g.append("circle").attr("cx", 7).attr("cy", 7).attr("r", 6).attr("fill", "#fff").attr("stroke", EDGE); g.append("ellipse").attr("cx", 7).attr("cy", 7).attr("rx", 2.5).attr("ry", 6).attr("fill", "none").attr("stroke", EDGE); g.append("line").attr("x1", 1).attr("x2", 13).attr("y1", 7).attr("y2", 7).attr("stroke", EDGE); },
    table: (g) => { g.append("rect").attr("x", 1).attr("y", 1).attr("width", 12).attr("height", 12).attr("fill", "#fff").attr("stroke", EDGE); [5, 9].forEach((y) => g.append("line").attr("x1", 1).attr("x2", 13).attr("y1", y).attr("y2", y).attr("stroke", EDGE)); g.append("line").attr("x1", 6).attr("x2", 6).attr("y1", 1).attr("y2", 13).attr("stroke", EDGE); },
    bubble: (g) => { g.append("path").attr("d", "M1 1h12v8H6l-3 3v-3H1z").attr("fill", "#fff").attr("stroke", EDGE); [4, 6.5].forEach((y) => g.append("line").attr("x1", 3.5).attr("x2", 10.5).attr("y1", y).attr("y2", y).attr("stroke", EDGE)); },
    model: (g) => { g.append("circle").attr("cx", 7).attr("cy", 7).attr("r", 6).attr("fill", "#fff").attr("stroke", EDGE); [[4, 5], [10, 5], [7, 10]].forEach(([x, y]) => g.append("circle").attr("cx", x).attr("cy", y).attr("r", 1.3).attr("fill", EDGE)); g.append("path").attr("d", "M4 5L10 5L7 10z").attr("fill", "none").attr("stroke", EDGE); },
    pin: (g) => { g.append("path").attr("d", "M7 14L3 7a4 4 0 1 1 8 0z").attr("fill", "#fff").attr("stroke", EDGE); g.append("circle").attr("cx", 7).attr("cy", 6).attr("r", 1.5).attr("fill", EDGE); },
    site: (g) => { g.append("rect").attr("x", 1).attr("y", 1).attr("width", 12).attr("height", 12).attr("rx", 1).attr("fill", "#fff").attr("stroke", EDGE); g.append("line").attr("x1", 1).attr("x2", 13).attr("y1", 4).attr("y2", 4).attr("stroke", EDGE); g.append("rect").attr("x", 3).attr("y", 6).attr("width", 4).attr("height", 5).attr("fill", EDGE); },
    bars: (g) => { [[1, 8, 6], [5, 4, 10], [9, 10, 4]].forEach(([x, y, h]) => g.append("rect").attr("x", x).attr("y", y).attr("width", 3).attr("height", h).attr("fill", EDGE)); },
    dict: (g) => { g.append("rect").attr("x", 1).attr("y", 1).attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", "#fff").attr("stroke", EDGE); g.append("text").attr("x", 7).attr("y", 11).attr("text-anchor", "middle").attr("font-size", 9).attr("font-weight", 700).attr("fill", EDGE).text("A"); },
  };

  // the organizations of the frame by type, largest first; the project records close the list
  const TYPE_SHORT = { "General contractors and construction managers": "General contractors, CMs", "Specialty trade contractors": "Specialty trade contractors",
    "Lean and management consultants": "Lean and management consultants", "Architects and engineers": "Architects and engineers", "Owners": "Owners",
    "Technology firms": "Technology firms", "Manufacturers and suppliers": "Manufacturers and suppliers", "Associations and others": "Associations and others" };
  const TYPE_GLYPH = { "Owners": "pin", "Architects and engineers": "doc", "Lean and management consultants": "bubble", "Technology firms": "site" };
  function typePlates() {
    const c = {};
    O.forEach((o) => { const t = o.type || "Other"; c[t] = (c[t] || 0) + 1; });
    const rows = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const read = (t) => O.filter((o) => (o.type || "Other") === t && o.level != null).length, lean = (t) => O.filter((o) => (o.type || "Other") === t && (o.level || 0) >= 1).length;
    return rows.map(([t, n]) => ({ g: TYPE_GLYPH[t] || "table", l: TYPE_SHORT[t] || t, v: f(n), tip: `${f(n)} ${t.toLowerCase()} in the frame; ${f(read(t))} with a website read, ${f(lean(t))} with lean language.` }))
      .concat([{ g: "doc", l: "Project records", v: f(S.projects), tip: `${f(S.projects)} projects described as lean on contractor websites, read from ${f(S.project_pages)} pages by three local language models (two of three must agree; quotes verified).` }]);
  }
  function stages() {
    const z = S.sizes || {}, sz = (k) => (z[k] ? bytes(z[k].bytes) : ""), total = Object.values(z).reduce((t, v) => t + v.bytes, 0);
    const wa = z.web_archive ? z.web_archive.sub : {};
    return [
      { title: "Collect", sub: `${bytes(total)} as received`, kind: "source", plates: [
          { g: "doc", l: "ENR Top 400 lists", v: sz("enr"), tip: "Annual lists of the largest U.S. contractors (2015 to 2026; the frame uses 2023 to 2025): rank, headquarters, revenue, market shares." },
          { g: "doc", l: "LCI directory", v: sz("lci"), tip: `Live corporate directory (${f(S.lci_members)} members) and archived directories 2013 to 2026.` },
          { g: "stack", l: "USAspending awards", v: sz("usaspending"), tip: "Every federal prime contract transaction, FY2008 to FY2026, one archive per fiscal year." },
          { g: "table", l: "SAM.gov entities", v: sz("sam_entity"), tip: "Monthly public extract of registered entities: UEI, address, website, business start." },
          { g: "doc", l: "SAM.gov notices", v: sz("sam_opportunities"), tip: `Contract Opportunities archives with full notice text, FY2008 to FY2026.` },
          { g: "globe", l: "Web archives", v: `${sz("web_archive")}, ${f(z.web_archive ? z.web_archive.files : 0)} files`, tip: `Archived pages of contractor websites: Wayback Machine captures and Common Crawl records (${Object.entries(wa).map(([k, v]) => `${k.replace("commoncrawl_", "Common Crawl ")}: ${bytes(v.bytes)}`).join("; ")}).` },
          { g: "pin", l: "Census gazetteer", v: sz("census_geography"), tip: "ZIP code and place centroids, state boundaries, for the maps." },
        ], text: "Each source is downloaded once, kept exactly as received (zips stay zipped, pages as WARC records), and fingerprinted with SHA-256, so a later run can tell whether an input changed. Request rates follow each provider\u2019s limits; no text of a third party is republished." },
      { title: "Build the frame", sub: `${f(S.organizations)} organizations`, kind: "frame", plates: [
          { g: "table", l: "One row per domain", v: f(S.organizations), tip: `ENR Top 400 (2025), LCI directory (2026) and federal builders with usable awards and a SAM website, joined by website domain: LCI ${f(S.by_group.lci)}, ENR not LCI ${f(S.by_group.enr)}, federal ${f(S.by_group.fed)}.` },
          { g: "pin", l: "Headquarters placed", v: f(S.with_place), tip: "SAM registration, LCI address or ENR headquarters, matched to a gazetteer centroid (ZIP, place or state)." },
          { g: "stack", l: "Website panel", v: `${f(S.panel_domains)} domains`, tip: "Federal builders read year by year 2008 to 2026, in four stages (top 100 by large building awards, then ENR or LCI firms, then 10+ awards, then the rest with a website)." },
        ], text: "The ENR list, the LCI directory and the federal contractors with usable awards are joined into one table of organizations by website domain; firms sharing a domain are pooled. Headquarters are placed with the Census gazetteer. The federal builders form the panel that is read year by year." },
      { title: "Read the websites", sub: `${f(S.panel_pages + S.recent_pages)} pages coded`, kind: "text", plates: [
          { g: "doc", l: "Panel pages, 2008 to 2026", v: f(S.panel_pages), tip: "Wayback Machine and Common Crawl pages of the panel domains (home, lean, practice, project and news pages), parsed to visible text." },
          { g: "doc", l: "Recent pages, 2024 to 2026", v: f(S.recent_pages), tip: "Common Crawl pages of every frame organization, the recent snapshot." },
          { g: "dict", l: "Lean dictionary", v: "4 levels", tip: "Word-boundary patterns: general lean construction language (level 1), named routines (level 2), three or more routines on a page (level 3); generic tools count only next to lean language. Validation on a frozen sample at the end." },
          { g: "bars", l: "Sites read, with lean", v: `${f(S.observed)}, ${f(S.any_lean)}`, tip: `${f(S.observed)} organizations read; ${f(S.any_lean)} with lean language; ${f(S.named_method)} naming a routine; ${f(S.dated)} with a dated first commitment.` },
        ], text: "Archived pages are parsed to text and coded with the lean dictionary; for the panel firms year by year, for the rest of the frame on the recent pages. A domain-year counts as observed only when pages were parsed and the archive listed enough addresses; otherwise it is unknown, never absence. Commitment years, routines named and persistence follow from the coded pages." },
      { title: "Read notices and awards", sub: "owner side", kind: "record", plates: [
          { g: "bubble", l: "Solicitations searched", v: f(S.solicitations), tip: `Distinct construction solicitations with a text, FY2008 to FY2026, searched for delivery-method and lean terms; ${S.lean_solicitations} name a lean method.` },
          { g: "table", l: "Awards rebuilt", v: f(S.awards_usable), tip: "Prime contract awards (NAICS 23) rebuilt from transactions with corrected definitions and nine restrictions; the defective growth columns of the archive are not used." },
          { g: "bars", l: "Panel firms\u2019 awards", v: f(S.awards_panel), tip: "Usable awards of the panel firms, summarized by pricing type, extent of competition and kind of work." },
        ], text: "Solicitation texts are searched for delivery-method and lean terms (a term counts when the notice names it). The award records are rebuilt from the transaction archive with corrected definitions of value, obligation and period of performance, nine restrictions keep the usable sample, and the awards are summarized by pricing type, competition and kind of work." },
      { title: "What was covered", sub: `${f(S.organizations)} organizations, ${f(S.projects)} projects`, kind: "frame", plates: typePlates(), text: "The frame by organization type: contractors and construction managers, specialty trades, lean and management consultants, architects and engineers, owners, technology firms, suppliers and associations (types follow the LCI directory for its members; ENR and federal firms outside it are contractors). The last plate counts the project records read from the contractor websites. Page texts are not reproduced; the site shows coded measures, links and short verified quotes." },
    ];
  }

  function figure() {
    const st = stages(), el = $("pipe-fig"); el.innerHTML = "";
    const W = Math.max(1000, el.getBoundingClientRect().width), n = st.length, gap = 28, pad = 10, ph = 34, pg = 6, head = 34;
    const sw = (W - gap * (n - 1)) / n, H = head + pad + 7 * (ph + pg) + 6;
    const s = d3.select(el).append("svg").attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);
    s.append("defs").append("marker").attr("id", "arr").attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto").append("path").attr("d", "M0 0L10 5L0 10z").attr("fill", EDGE);
    st.forEach((stg, i) => {
      const x0 = i * (sw + gap), hgt = head + pad + stg.plates.length * (ph + pg);
      const g = s.append("g").attr("transform", `translate(${x0},0)`).style("cursor", "pointer").on("click", () => { picked = i; figure(); detail(); });
      g.append("rect").attr("x", .5).attr("y", .5).attr("width", sw - 1).attr("height", hgt).attr("rx", 8).attr("fill", picked === i ? "#fbfaf4" : "#fff").attr("stroke", picked === i ? "#1c1c1c" : "#9a978f").attr("stroke-width", picked === i ? 1.4 : 1).attr("stroke-dasharray", picked === i ? null : "5 3");
      g.append("text").attr("x", 10).attr("y", 17).attr("font-size", 12.5).attr("font-weight", 700).text(`${i + 1}  ${stg.title}`);
      g.append("text").attr("x", 10).attr("y", 30).attr("font-size", 10.5).attr("fill", "#5d5d5d").text(stg.sub);
      stg.plates.forEach((p, j) => {
        const y = head + pad + j * (ph + pg);
        const pl = g.append("g").attr("transform", `translate(${pad},${y})`)
          .on("mousemove", (ev) => C.showTip(ev, `<b>${p.l}</b>${p.tip}`)).on("mouseleave", C.hideTip);
        pl.append("rect").attr("width", sw - 2 * pad).attr("height", ph).attr("rx", 5).attr("fill", PAL[stg.kind]).attr("stroke", "#c9c6bb");
        const gl = pl.append("g").attr("transform", `translate(7,${(ph - 14) / 2})`); GLYPH[p.g](gl);
        pl.append("text").attr("x", 27).attr("y", 13.5).attr("font-size", 10.5).text(p.l);
        pl.append("text").attr("x", 27).attr("y", 28).attr("font-size", 10.5).attr("font-weight", 700).text(p.v);
      });
      if (i < n - 1) s.append("line").attr("x1", x0 + sw + 2).attr("x2", x0 + sw + gap - 2).attr("y1", head + 30).attr("y2", head + 30).attr("stroke", EDGE).attr("stroke-width", 1.3).attr("marker-end", "url(#arr)");
    });
  }

  function detail() {
    const stg = stages()[picked];
    $("pipe-detail").innerHTML = `<h3>${picked + 1}. ${stg.title}</h3><p>${stg.text}</p>`;
  }

  function init(data) {
    S = data.S; m = data.methods; O = data.orgs;
    const z = S.sizes || {}, sz = (k) => (z[k] ? `${bytes(z[k].bytes)} (${f(z[k].files)} file${z[k].files === 1 ? "" : "s"})` : "");
    $("data-body").innerHTML = `
<h2>How the numbers are made</h2>
<p class="fine">Left to right: what is collected, how the frame is built, how websites, notices, awards and project pages are read, and what was covered. Hover a plate for its meaning; click a stage for the full explanation.</p>
<div class="pipe-wrap"><div id="pipe-fig"></div></div>
<div class="pipe-detail" id="pipe-detail"></div>

<h2>Sources</h2>
<table><tr><th>Source</th><th>What is used</th><th>Where</th><th>Period</th><th>Count</th><th>Size as received</th></tr>
<tr><td>ENR Top 400 contractors</td><td>rank, headquarters, revenue, market shares, CM-at-risk share</td><td>${a("https://www.chubb.com/content/dam/chubb-sites/chubb-com/us-en/surety/enr-top-400.pdf", "2025 list (PDF)")}, 2024 and 2023 editions</td><td>2023 to 2025</td><td>${S.enr_firms} firms (2025)</td><td>${sz("enr")}</td></tr>
<tr><td>Lean Construction Institute directory</td><td>member name, type, description, website; archived directories for the first and last year listed</td><td>${a("https://leanconstruction.org/member-directory/")}, ${a("https://web.archive.org/", "Wayback Machine")}</td><td>2013 to 2026 (no archive for 2018)</td><td>${S.lci_members} members (2026)</td><td>${sz("lci")}</td></tr>
<tr><td>USAspending award data archive</td><td>every federal prime contract transaction, NAICS 23; awards rebuilt with corrected definitions; ${f(S.awards_usable)} usable awards</td><td>${a("https://files.usaspending.gov/award_data_archive/")}</td><td>FY2008 to FY2026</td><td>${S.panel_domains} contractor websites in the panel</td><td>${sz("usaspending")}</td></tr>
<tr><td>USAspending recipient profiles</td><td>the public profile of each contractor, linked from its page here</td><td>${a("https://www.usaspending.gov/", "usaspending.gov")}</td><td>October 2026</td><td></td><td></td></tr>
<tr><td>SAM.gov entity extract</td><td>website, city, state and business start date of each registered contractor</td><td>${a("https://open.gsa.gov/api/sam-entity-extracts-api/", "SAM entity extracts")}</td><td>October 2026</td><td></td><td>${sz("sam_entity")}</td></tr>
<tr><td>SAM.gov Contract Opportunities</td><td>construction notices with full text; delivery-method and lean terms</td><td>${a("https://sam.gov/data-services/Contract%20Opportunities?privacy=Public", "public extract")}</td><td>FY2008 to FY2026</td><td>${f(S.solicitations)} solicitations</td><td>${sz("sam_opportunities")}</td></tr>
<tr><td>Wayback Machine and Common Crawl</td><td>archived pages of the panel firms\u2019 websites (year index, lean and practice pages, home pages; one Common Crawl crawl a year) and recent pages of every frame organization</td><td>${a("https://web.archive.org/", "web.archive.org")}, ${a("https://commoncrawl.org/", "commoncrawl.org")}</td><td>2008 to 2026; 2024 to 2026</td><td>${f(S.panel_pages)} and ${f(S.recent_pages)} pages</td><td>${sz("web_archive")}</td></tr>
<tr><td>Census gazetteer</td><td>ZIP code and place centroids for the maps</td><td>${a("https://www2.census.gov/geo/", "census.gov")}</td><td>2024</td><td>${f(S.with_place)} organizations placed</td><td>${sz("census_geography")}</td></tr></table>

<details><summary>Definitions</summary><ul>
<li><b>Frame.</b> ${f(S.organizations)} organizations: the ENR Top 400 (2025 list), the LCI corporate directory (2026), and federal construction contractors with usable awards and a website in SAM (the top 100 by large building awards, then firms with 5 or more large building awards). One row per website domain; firms sharing a domain are pooled. Organization types follow the LCI directory for its members (general contractors and construction managers, specialty trade contractors, lean and management consultants, architects and engineers, owners, technology firms, suppliers, associations); ENR and federal firms outside the directory are general contractors or construction managers.</li>
<li><b>Groups.</b> LCI members: listed in the 2026 directory. ENR Top 400, not LCI: on the 2025 list and not in the directory. Federal builders: neither, with usable federal construction awards.</li>
<li><b>Lean language, levels.</b> 0: the page has no lean construction language. 1: general lean construction language (lean construction, lean principles, lean process, Lean Construction Institute ...). 2: a named lean routine. 3: three or more named routines on one page. Specific routines: Last Planner System, pull planning, weekly work plan, make-ready planning, percent plan complete, Big Room, target value design, takt, choosing by advantages. Generic tools count only next to lean language or a specific routine: look-ahead planning, constraint log, A3, value stream mapping, gemba, kaizen. Integrated project delivery, daily huddles and Lean Six Sigma are flags that never set a level. Every term is matched at a word boundary.</li>
<li><b>First documented public lean commitment.</b> For the ${S.panel_domains} federal builders of the panel, the first observed year with a level 1 page confirmed by a second page with a different address in the same year or by a page in the next observed year. A domain-year is observed when pages were parsed and the archive listed enough addresses; otherwise it is unknown, never treated as absence. Left-censored: the commitment year is the first observed year. Stable: not left-censored, 2 or more observed years before, and lean language in at least half the observed years after. The variable is a documented commitment, not adoption or use on projects.</li>
<li><b>Recent snapshot.</b> For the rest of the frame, Common Crawl pages of 2024 to 2026 give the highest level found and the methods named, without dates.</li>
<li><b>Contract types.</b> From the usable awards: pricing type (firm fixed price, other fixed price, cost reimbursement, time and materials), extent of competition (full and open; after exclusion of sources, which is the set-aside programs; not available for competition; not competed) and kind of work (product service codes Y, new construction; Z, maintenance, repair and alteration). Delivery methods (design-build, design-bid-build, CM at risk, progressive design-build, early contractor involvement, IDIQ or MATOC, integrated project delivery) are read from the text of the solicitations and of the project pages.</li>
<li><b>Project records.</b> Pages with lean language were read by three local language models with fixed categories; a field is kept when two of three agree, a method only when its own term appears on the page, and the quote is checked against the page text.</li>
</ul></details>
<details><summary>Status and limits</summary><ul>
<li>Every website measure is provisional until the dictionary is validated on a frozen sample of coded pages (171 pages, at the end of the project).</li>
<li>Archive coverage is uneven: Common Crawl starts in 2013 and large sites are sampled; a first year is an upper bound on when lean was first documented. Years without coverage are unknown, not zero.</li>
<li>Websites of two very large firms (Skanska, AECOM) were read from Common Crawl only.</li>
<li>LCI membership is affiliation, not implementation; the first year listed is the first archived directory that lists the organization, and 2013 is the first directory.</li>
<li>Page texts are third-party copyright: this site shows coded measures, links to the archived pages, and short verified quotes only. Page links open the Wayback Machine (for pages read from Common Crawl, whose records are not browsable, the Wayback capture closest to that year, when one exists) and the current page.</li>
<li>${f(m.pages)} panel pages coded: level 0 ${f(m.levels_pages[0])}, level 1 ${f(m.levels_pages[1])}, level 2 ${f(m.levels_pages[2])}, level 3 ${f(m.levels_pages[3])}.</li>
</ul></details>
<p class="fine">Data built ${S.built}.</p>`;
    figure(); detail();
    C.onResize(figure);
  }
  return { init, show() {}, hide() {} };
})();
