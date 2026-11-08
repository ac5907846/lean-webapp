# 05_web_app: What Do Management Signals Reveal? (mgmt-signal.praiser.us)

Companion site of the article "What Do Management Signals Reveal? Organizational Positioning and Outcomes in Project-Based
Markets" (12_manuscript_JMS). Static: `index.html`, `css/app.css`, `js/*.js`, `data/*.json`; no framework, no build step, no
server; D3 7 and topojson-client from cdnjs. The app reads only the JSON that `build_data.py` exports from the results files of
`02_analysis` (through `core.out()`); nothing else is computed in the browser beyond counting and filtering.

Renamed and reworded on 2026-11-08 (owner: the app carries the manuscript's title, its language, and no construction words beyond
the defined names LCI and CMAR; the map and the firm search stay, the Owners and Projects views go). The previous app, the Lean
Project Delivery Atlas (v20, lean.praiser.us), is archived whole in `_archive/2026-11-08_lean_atlas_v20/`; the journal app of
2026-10-26 (v19) and the conference app (v18) are the two older archive folders.

Tabs (hash router, `#landscape` ... `#data`):
- Map: every firm of the frame at its headquarters (ENR Top 400, LCI corporate members, other recipients of federal project
  awards) with a tour that loops until its Pause button is pressed (the firms; websites read; website references to lean
  practices; named practices; first observed commitment by year), a legend under the map and a readout of counts; references by
  group; first observed commitments by year; institute membership among the ranked firms; the institute directory by member type
  and by cohort.
- Firms: filtered list (click a column header to sort, again to flip) and a detail panel (profile, membership years,
  year-by-year coverage strip, practices named, archived pages with lean references linked to the Internet Archive and to the
  live page, contract characteristics, source links). `#organizations/<id>` opens one firm (the map dots link here).
- Practices: firms per named practice and the pairs named together, counted from the firms of the chosen groups (chips); a
  click on a practice or a pair lists the firms with links; the first year each practice is named (panel).
- Data: the study in brief and the Zenodo record, sources, definitions (frame, groups, levels, named practices, first observed
  commitment, federal awards), limits.

Language (owner, 2026-11-08): firm, never contractor; institute members, ranked firms, federal award recipients for the three
frame groups; website references to lean practices and named practices, never lean language or routines; construction only in
the defined names (Lean Construction Institute, construction management at risk). The three frame groups are the frame the
article's four credential groups were read from; the article's estimates stay in the article.

Rebuild and release:
1. `python build_data.py` (after the analyses it reads: 05 a2 and a5, 06, 07, 09, 11 s1, 12 l1 and l2; federal.json,
   projects.json and contracts.json are no longer written).
2. Test locally with a threaded server (`python -m http.server` is threaded since Python 3.7), in Chrome or Playwright.
3. Bump `?v=N` on every asset in `index.html` and `V` in `js/app.js` (GitHub Pages caches hard).
4. Copy to the public repository `ac5907846/lean-webapp` (root = this folder only; `CNAME` = mgmt-signal.praiser.us,
   `.nojekyll`), commit, push. Cloudflare DNS: `CNAME mgmt-signal -> ac5907846.github.io`, DNS only; `lean` kept as a proxied
   record with a redirect rule to the new address so earlier links keep working.

Data files (data/): `summary.json` (counts, build date), `orgs.json` (one row per firm; keys with null or false are dropped),
`years.json` (panel domains by year, one character per year), `methods.json`, `lci.json`, `enr.json`, `us-states.json` (us-atlas
states-10m TopoJSON). Type and level labels are rewritten in the browser (charts.js TYPE, LVL, CODES), so the exported data are
unchanged from v20 (built 2026-10-09).

Rules kept: page texts are never exported (coded measures only); every website measure is provisional until the dictionary is
validated; no e-mail address or key in the files; scripts are kept ASCII (non-ASCII characters as \u escapes).

Changes:
- 2026-10-06: created (owner request: descriptive statistics first, maps of the organizations, the overall picture).
- 2026-10-08: layout pass, motion, zoom buttons, Data view pipeline figure (see the archived README of v20 for the details).
- 2026-10-26: journal app v19 built and then set aside; the atlas restored (v18) and renamed Lean Project Delivery Atlas (v20, 2026-10-29).
- 2026-11-08: v21.

Live since 2026-11-08 at https://mgmt-signal.praiser.us (v21 pushed; Cloudflare record `CNAME mgmt-signal -> ac5907846.github.io`, DNS only, added in the praiser.us zone, which sits in the shared Drlongw account; GitHub Pages custom domain from the CNAME file, certificate issued, Enforce HTTPS on). The old address lean.praiser.us now returns GitHub’s 404 (its DNS record is still there; remove it or redirect it on the owner’s word). Pushing: the GitHub CLI on this machine is signed in as anonymous-temporary (GITHUB_TOKEN), which cannot write here; push with the stored ac5907846 account for one command: `env -u GITHUB_TOKEN git -c "credential.https://github.com.helper=" -c "credential.https://github.com.helper=manager" push https://ac5907846@github.com/ac5907846/lean-webapp.git main`.

- 2026-11-08, v22 (owner: keep the tabs uncluttered): the Map tab keeps only the map, its tour and the readout; the Practices tab keeps the practices per firm, the firm list and the pairs matrix. The six other figures (website references by group, first observed commitments by year, institute membership among the ranked firms, the directory by member type and by cohort, the year a practice is first named) moved into a closed “More figures” section at the end of the Data tab, drawn when it is opened (datatab.js). v21 archived in `_archive/2026-11-08_v21_before_declutter/`.
