// Data view: sources with their addresses and scripts, the pipeline, definitions, status and limits.
window.DataTab = (function () {
  function init(data) {
    const S = data.S, m = data.methods;
    const f = C.fmt;
    const a = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t || u.replace(/^https?:\/\//, "")}</a>`;
    document.getElementById("data-body").innerHTML = `
<h2>Sources</h2>
<p>Every number on this site is computed from public data by scripts, in the order below; the exported JSON files behind each view are listed at the end. The code will be released with the papers.</p>
<table><tr><th>Source</th><th>What is used</th><th>Where</th><th>Period</th><th>Count</th><th>Script</th></tr>
<tr><td>ENR Top 400 contractors</td><td>rank, headquarters, revenue, market shares, CM-at-risk share</td><td>${a("https://www.chubb.com/content/dam/chubb-sites/chubb-com/us-en/surety/enr-top-400.pdf", "2025 list (PDF)")}, 2024 and 2023 editions</td><td>2023 to 2025</td><td>${S.enr_firms} firms (2025)</td><td>x06</td></tr>
<tr><td>Lean Construction Institute directory</td><td>member name, type, description, website; archived directories for the first and last year listed</td><td>${a("https://leanconstruction.org/member-directory/")}, ${a("https://web.archive.org/", "Wayback Machine")}</td><td>2013 to 2026 (no archive for 2018)</td><td>${S.lci_members} members (2026)</td><td>x05</td></tr>
<tr><td>USAspending award data archive</td><td>every federal prime contract transaction, NAICS 23; awards rebuilt with corrected definitions; 153,355 usable awards</td><td>${a("https://files.usaspending.gov/award_data_archive/")}</td><td>FY2008 to FY2026</td><td>${S.panel_domains} contractor websites in the panel</td><td>x07; 01, 04, 05 a1</td></tr>
<tr><td>SAM.gov entity extract</td><td>website, city, state and business start date per UEI</td><td>${a("https://open.gsa.gov/api/sam-entity-extracts-api/", "SAM entity extracts API")}</td><td>October 2026</td><td></td><td>x09</td></tr>
<tr><td>SAM.gov Contract Opportunities</td><td>construction notices with full text; delivery-method and lean terms</td><td>${a("https://sam.gov/data-services/Contract%20Opportunities?privacy=Public", "public extract")}</td><td>FY2008 to FY2026</td><td>${f(S.solicitations)} solicitations</td><td>x13; 08</td></tr>
<tr><td>Wayback Machine</td><td>archived pages of the panel firms' websites (year index, lean and practice pages, home pages)</td><td>${a("https://web.archive.org/", "web.archive.org")} (CDX API)</td><td>2008 to 2026</td><td>8,137 pages</td><td>x10; 05 a2</td></tr>
<tr><td>Common Crawl</td><td>archived pages of the panel firms (one crawl a year) and recent pages of every frame organization</td><td>${a("https://commoncrawl.org/", "commoncrawl.org")} (cluster indexes and WARC ranges)</td><td>2013 to 2026; 2024 to 2026</td><td>${f(S.panel_pages - 8137)} and ${f(S.recent_pages)} pages</td><td>x11, x12; 05 a2, 12 l1</td></tr>
<tr><td>Census gazetteer</td><td>ZIP code and place centroids for the maps</td><td>${a("https://www2.census.gov/geo/", "census.gov")}</td><td>2024</td><td>${f(S.with_place)} organizations placed</td><td>x15; 06 f2, 12 l2</td></tr></table>

<h2>Pipeline</h2>
<ul>
<li><b>Fetch</b> (00_code): x05 LCI directory, x06 ENR lists, x07 USAspending, x09 SAM entities, x10 Wayback, x11 and x12 Common Crawl, x13 Contract Opportunities, x15 Census geography. Raw files are kept as received, with SHA-256 manifests.</li>
<li><b>Analyses</b> (02_analysis): 01 construction extract; 02 LCI membership panel; 03 LCI to federal contractor matches; 04 corrected award sample; 05 lean capability panel (targets a1 to a1d, dictionary pass a2, gate a5); 06 landscape firm frame and places; 07 LCI member landscape; 08 federal notices; 09 ENR affiliation; 10 project records (three local language models, voted); 11 firm table for the selection and diffusion tests; 12 lean language across the frame.</li>
<li><b>This site</b>: <code>build_data.py</code> reads the results of those folders and writes the JSON files below; the browser only counts, filters and draws.</li>
</ul>

<h2>Definitions</h2>
<ul>
<li><b>Frame.</b> ${f(S.organizations)} organizations: the ENR Top 400 (2025 list), the LCI corporate directory (2026), and federal construction contractors with usable awards and a website in SAM (the top 100 by large building awards, then firms with 5 or more large building awards). One row per website domain; firms sharing a domain are pooled. Organization types follow the LCI directory for its members (general contractors and construction managers, specialty trade contractors, lean and management consultants, architects and engineers, owners, technology firms, suppliers, associations); ENR and federal firms outside the directory are general contractors or construction managers.</li>
<li><b>Groups.</b> LCI members: listed in the 2026 directory. ENR Top 400, not LCI: on the 2025 list and not in the directory. Federal builders: neither, with usable federal construction awards.</li>
<li><b>Lean language, levels.</b> 0: the page has no lean construction language. 1: general lean construction language (lean construction, lean principles, lean process, Lean Construction Institute ...). 2: a named lean routine. 3: three or more named routines on one page. Specific routines: Last Planner System, pull planning, weekly work plan, make-ready planning, percent plan complete, Big Room, target value design, takt, choosing by advantages. Generic tools count only next to lean language or a specific routine: look-ahead planning, constraint log, A3, value stream mapping, gemba, kaizen. Integrated project delivery, daily huddles and Lean Six Sigma are flags that never set a level. Every term is matched at a word boundary.</li>
<li><b>First documented public lean commitment.</b> For the ${S.panel_domains} federal builders of the panel, the first observed year with a level 1 page confirmed by a second page with a different address in the same year or by a page in the next observed year. A domain-year is observed when pages were parsed and the archive listed enough addresses; otherwise it is unknown, never treated as absence. Left-censored: the commitment year is the first observed year. Stable: not left-censored, 2 or more observed years before, and lean language in at least half the observed years after. The variable is a documented commitment, not adoption or use on projects.</li>
<li><b>Recent snapshot.</b> For the rest of the frame, Common Crawl pages of 2024 to 2026 give the highest level found and the methods named, without dates.</li>
<li><b>Contract types.</b> From the usable awards: pricing type (firm fixed price, other fixed price, cost reimbursement, time and materials), extent of competition (full and open; after exclusion of sources, which is the set-aside programs; not available for competition; not competed) and kind of work (product service codes Y, new construction; Z, maintenance, repair and alteration). Delivery methods (design-build, design-bid-build, CM at risk, progressive design-build, early contractor involvement, IDIQ or MATOC, integrated project delivery) are read from the text of the solicitations and of the project pages.</li>
<li><b>Project records.</b> Pages with lean language were read by three local language models with fixed categories; a field is kept when two of three agree, a method only when its own term appears on the page, and the quote is checked against the page text.</li>
</ul>

<h2>Status and limits</h2>
<ul>
<li>Every website measure is provisional until the dictionary is validated on a frozen sample of coded pages (171 pages, at the end of the project).</li>
<li>Archive coverage is uneven: Common Crawl starts in 2013 and large sites are sampled; a first year is an upper bound on when lean was first documented. Years without coverage are unknown, not zero.</li>
<li>Websites of two very large firms (Skanska, AECOM) were read from Common Crawl only.</li>
<li>LCI membership is affiliation, not implementation; the first year listed is the first archived directory that lists the organization, and 2013 is the first directory.</li>
<li>Page texts are third-party copyright: this site shows coded measures, links to the archived pages, and short verified quotes only. Page links open the Wayback Machine (for pages read from Common Crawl, whose records are not browsable, the Wayback capture closest to that year, when one exists) and the current page.</li>
<li>${f(m.pages)} panel pages coded: level 0 ${f(m.levels_pages[0])}, level 1 ${f(m.levels_pages[1])}, level 2 ${f(m.levels_pages[2])}, level 3 ${f(m.levels_pages[3])}.</li>
</ul>

<h2>Files behind this site</h2>
<table><tr><th>File</th><th>Content</th></tr>
<tr><td>${a("data/summary.json")}</td><td>headline counts and the build date</td></tr>
<tr><td>${a("data/orgs.json")}</td><td>one row per organization: identity, type, group, place, ENR and federal profile, LCI years, website measures, methods, archived pages with lean language, contract types, source links</td></tr>
<tr><td>${a("data/years.json")}</td><td>panel domains by year, one character per year (unknown, observed without lean, level 1 to 3)</td></tr>
<tr><td>${a("data/methods.json")}</td><td>organizations per method, co-occurrence, first year named</td></tr>
<tr><td>${a("data/lci.json")}</td><td>LCI member types, owner sectors, cohorts by year, member map points</td></tr>
<tr><td>${a("data/enr.json")}</td><td>ENR Top 400 affiliation by market and by size, with Wilson intervals</td></tr>
<tr><td>${a("data/federal.json")}</td><td>solicitations by fiscal year and term, the lean solicitations, departments</td></tr>
<tr><td>${a("data/contracts.json")}</td><td>usable awards of the panel firms by pricing type, competition and kind of work, by year</td></tr>
<tr><td>${a("data/projects.json")}</td><td>project records with the verified quote</td></tr></table>
<p class="fine">Data built ${S.built}. Companion site to two papers in preparation (a conference paper on the landscape; a journal paper on selection and diffusion). Lean construction research project, Florida Gulf Coast University.</p>`;
  }
  return { init, show() {}, hide() {} };
})();
