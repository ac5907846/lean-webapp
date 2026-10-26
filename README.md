# 05_web_app: Lean Construction Atlas (lean.praiser.us), v19

Static companion site of the lean signals paper: `index.html`, `css/app.css`, `js/*.js`, `data/*.json`. No framework, no build
step, no server; D3 7 from cdnjs. The app reads only the JSON that `build_data.py` exports; `build_data.py` reads the results
files of `02_analysis` through `core.out()` and the manuscript builder's own `Numbers` object
(`04_manuscript_journal/working/build_manuscript.py`), so the app and the paper fill their numbers from one set of files.
Rebuilt 2026-10-26 around the journal paper (owner: one app, aligned with the journal, animated; conference material to be added
later if needed). The conference app of 2026-10-06 to 10-09 (v18: maps, owners, methods, projects) is archived in
`_archive/2026-10-26_conference_app/`.

Tabs (hash router):
- Findings: the rank wall, one dot per firm-list of the 26 ENR Top 400 lists 2001 to 2026 (1,005 series, 10,394 dots, canvas;
  hover shows a firm's path, click opens its profile), with a tour that loops until its Pause button is pressed or the figure is
  clicked: the lists; the four lean-signal groups; CMAR specialization (dot area = printed CMAR share); position, not trajectory
  (the groups' median rank lines); entries and exits (the lists as they came, exits in red, the pandemic retention check); project
  outcomes. A readout with count-ups beside it; the four research questions as tiles below.
- Contractors: Table 1; the Figure 1 splits (firm type, rank band, region, years ranked, CMAR band, federal value) as stacked
  shares; the Figure 2 content matrix by group, firm type or rank band; the 278 classified contractors (search, group chips, type,
  sort, CSV) with a detail panel (rank path 2001 to 2026, LCI years, CMAR band, federal awards, methods named).
  `#contractors/<id>` opens one contractor.
- Markets: Figure 4 (market-share bubble matrix), Figure 5 (federal delivery mix), Figure 6 (group trajectories by list year, with
  the full-panel membership-at-the-time series dashed), Tables 3 to 6 from the stored results (hover a cell for the exact p).
- Outcomes: Figure 7 (the 45 main comparisons on the p axis, by research question), Tables 2 and 7, Table S4 (the DBB
  change-order robustness checks as dots and intervals), Table S6 (survivorship checks).
- Data: sources, definitions, limits, downloads (classified contractors, the 45 comparisons, the rank histories of the 1,005
  series).

Rules kept: no ENR revenue of a single firm (ranks and group aggregates only; the detail panel shows the CMAR band, not the share);
no page texts; website measures labeled provisional; the group names of `group_labels.py`; stored "Planned comparison" heads print
as "Main model" (the paper's rule); no e-mail address or key. Scripts are ASCII (non-ASCII as escapes).

Data files (data/): `summary.json` (counts, headline numbers, labels, the manuscript's X numbers), `wall.json` (every series:
ranks and CMAR bands per list, group, status), `groups.json` (Table 1, profile splits, firms, content matrices), `markets.json`
(shares, delivery mix, trajectories, the RQ2 and RQ3 tables), `answers.json` (comparisons, the RQ1 and RQ4 tables, S4, S6).

Rebuild and release:
1. `python build_data.py` (after folders 18, 20, 21 and the manuscript builder are current).
2. Test locally with a threaded server (the single-threaded `http.server` refuses parallel fetches), in Chrome; the syntax of every
   script: `node -e "new Function(require('fs').readFileSync(f,'utf8'))"`.
3. Bump `?v=N` on every asset in `index.html` and `V` in `js/app.js` (GitHub Pages caches hard).
4. Copy to the public repository `ac5907846/lean-webapp` (clone at `C:\Users\achau\repos\lean-webapp`; root = this folder only;
   `CNAME` = lean.praiser.us and `.nojekyll` must stay in the repository: the v18 push without them dropped the custom domain,
   restored 2026-10-26), commit without AI attribution lines, push. Cloudflare DNS: `CNAME lean -> ac5907846.github.io`, DNS only.

Changes:
- 2026-10-06 to 10-09: the conference app (v1 to v18), archived.
- 2026-10-26 (v19): rebuilt for the journal paper as above; the manuscript links the site in its Introduction, 3.1 and Data
  availability section.
