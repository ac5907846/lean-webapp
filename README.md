# 05_web_app: Lean construction landscape (lean.praiser.us)

Static companion site: `index.html`, `css/app.css`, `js/*.js`, `data/*.json`. No framework, no build step, no server;
D3 7 and topojson-client from cdnjs. The app reads only the JSON that `build_data.py` exports from the results files
of `02_analysis` (through `core.out()`); nothing else is computed in the browser beyond counting and filtering.

Tabs (hash router, `#landscape` ... `#data`):
- Landscape: the hero map of every organization in the frame (1,076: ENR Top 400, LCI corporate members, federal
  builders of the panel) with a tour (frame, websites read, lean language, named methods, first commitments by year)
  that loops until its Pause button is pressed (owner request 2026-10-07), a legend of the dots under the map, and a
  readout of counts; lean language by group; first commitments by year; LCI affiliation in the ENR Top 400;
  LCI member types and growth.
- Organizations: filtered list (click a column header to sort, again to flip) and a detail panel (profile, LCI years,
  year-by-year coverage strip, methods named, archived pages with lean language linked to the Wayback Machine and to
  the live page, contract types, source links).
  `#organizations/<id>` opens one organization (the map dots link here).
- Methods: organizations per method and the pairs named together, counted from the organizations of the chosen
  groups (chips); a click on a method or a pair lists the organizations with links; first year each method is named
  (panel).
- Owners (rewritten 2026-10-08 after the owner found it hard to read): a question (do owners ask for lean?), headline
  counts, the solicitation terms by fiscal year with term chips and share or count, the same terms by department, the
  two lean notices, the contract types of the panel awards (one dimension at a time with its share by year), and the
  LCI owner members by sector (click a sector to list them).
  Links: an organization with a UEI links to its USAspending recipient profile (00_code/x16 resolves the UEI; SAM.gov
  entity pages have no stable public address, their routes return 404 outside a session).
  Scripts are kept ASCII (non-ASCII characters as \u escapes) so a server without a charset header cannot garble them.
- Projects: project records on a map and as cards with the verified quote.
- Data: sources, definitions, status and limits.

Rebuild and release:
1. `python build_data.py` (after the analyses it reads: 05 a2 and a5, 06, 07, 08, 09, 10, 11 s1, 12 l1 and l2).
2. Test locally with a threaded server (single-threaded `http.server` refuses parallel fetches), in Chrome.
3. Bump `?v=N` on every asset in `index.html` and `V` in `js/app.js` (GitHub Pages caches hard).
4. Copy to the public repository `ac5907846/lean-webapp` (root = this folder only; `CNAME` = lean.praiser.us,
   `.nojekyll`), commit, push. Cloudflare DNS: `CNAME lean -> ac5907846.github.io`, DNS only.

Data files (data/): `summary.json` (counts, build date), `orgs.json` (one row per organization; keys with null or
false are dropped), `years.json` (panel domains by year, one character per year), `methods.json`, `lci.json`,
`enr.json`, `federal.json`, `projects.json`, `us-states.json` (us-atlas states-10m TopoJSON).

Rules kept: page texts are never exported (coded measures and the short verified project quotes only); every website
measure is labeled provisional until the dictionary is validated; no e-mail address or key in the files.

Changes:
- 2026-10-06: created (owner request: descriptive statistics first, maps of the organizations, the overall picture).

Layout pass (owner 2026-10-08, "too many empty boxes"; three checks per view at 1568 px): landing view = map with a side
column (readout with the step list and Pause, then the lean-by-group card; the map fills the card height), then four
figures in a two-column masonry (`columns: 2`, cards hug their content); Organizations preselects the first row so the
detail panel is never empty; Methods = left column (bars, then the organization list, scrolling past 520 px) and the
matrix on the right, starting on the most named method; Owners = the departments as a heat table (same height as the
lean notices), the contract types with their year lines side by side, the LCI owners as bars plus a small map beside
the member list; Projects = map 1.3 : 1 bars with integer ticks. Motion sped up the same day (tour steps 2.6 to 3 s,
year step 280 ms, count-ups 450 ms, bar transitions 350 ms).

2026-10-08, later: the tooltip element lives in the body (it sat inside the landing section, so no other view had
hover); the Data view opens with a pipeline figure (six stages left to right, one pastel plate per artifact with its
count or size, hover for the meaning, click for the explanation; drawn from summary.json, which build_data.py now
fills with the size of every raw source folder and of the exported JSON), the sources table carries a size column,
definitions and limits are folded, and the files table is gone. Second address: https://lean.sexsi.us redirects
(301, path kept) to lean.praiser.us through a proxied placeholder record (A 192.0.2.1) and a Redirect Rule in the
sexsi.us zone; lean.praiser.us is the canonical site.

2026-10-08: the site is named Lean Construction Atlas (owner); subtitle "current status and a research agenda"; the paper cites it by that name.
