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
- Methods: organizations per method, co-occurrence bubble matrix, first year each method is named.
- Owners: federal solicitations by fiscal year and term (log or linear), the two lean solicitations, departments,
  LCI owner members by sector.
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
