// Data: sources, the definitions of the measures, limits, and the downloads.
window.DataTab = (function () {
  let S, A, G;
  const n = (v) => Number(v).toLocaleString("en-US");
  function init(d) {
    S = d.S; A = d.A; G = d.G;
    const c = S.counts;
    document.getElementById("data-body").innerHTML = `
      <h2>Sources</h2>
      <table><tr><th>Source</th><th>What is read</th><th>Coverage</th></tr>
      <tr><td>Engineering News-Record Top 400 contractors</td><td>Rank, revenue, market shares (general building, CMAR and others) of each listed firm; firms linked across years by name and website</td><td>${c.lists} annual lists, ${c.y0} to ${c.y1}; ${n(c.series)} contractor series, ${n(c.firm_lists)} firm-lists</td></tr>
      <tr><td>Lean Construction Institute corporate directory</td><td>Membership by year from the archived directories; first and last year listed</td><td>2013 to 2026 (no snapshot in 2018); ${c.members_ever} of the ENR series ever listed</td></tr>
      <tr><td>Archived corporate websites (Wayback Machine, Common Crawl)</td><td>Lean language and the lean methods named, coded with a dictionary; page texts are not published</td><td>${n(c.pages)} pages of ${c.domains} domains; ${c.lean_firms} ENR firms mention lean</td></tr>
      <tr><td>USAspending federal prime contracts, construction (NAICS 23)</td><td>Awards with corrected outcome definitions: change orders, schedule extension, value growth; delivery method from the award and its SAM.gov notice</td><td>${n(c.awards_usable)} usable awards; ${n(c.awards_comparable)} comparable awards of ${c.fed_firms_comparable} firms, started 2007 to 2025</td></tr></table>
      <h2>Definitions</h2>
      <ul>
        <li><b>Lean-signal groups</b> (read on the 2023 to 2025 lists): member-mentioned (LCI member, lean language on the website), member-silent, non-member-mentioned, non-member-silent (the reference group); website not read: the firm's site was not archived or not read.</li>
        <li><b>CMAR share of revenue</b>: the share printed by ENR; a printed zero can be a true zero or a non-response. <b>Rank by CMAR revenue</b>: the firms with a positive printed share, ranked within each list by revenue times that share.</li>
        <li><b>Federal delivery method</b>: DB when the award description, a definitive contract's notice, or a DB-only vehicle names it; DBB from the notice or a sealed-bid procedure; CMAR when named; otherwise negotiated or task order with the delivery unnamed.</li>
        <li><b>Change orders</b>: modifications recorded as change orders, log(1 + count). <b>Schedule extension ratio</b>: the change of the end date divided by the originally planned duration.</li>
        <li><b>Estimates</b>: differences against non-member-silent contractors with list-year (or agency, year, kind of work and contract terms) and region effects and firm size held fixed; errors clustered by firm; p values from a wild cluster bootstrap with 9,999 draws; * p &lt; .05, ** p &lt; .01, *** p &lt; .001.</li>
      </ul>
      <h2>Limits</h2>
      <ul>
        <li>Website measures are provisional until the dictionary is validated; they capture public communication, not verified implementation.</li>
        <li>The four groups are read on the 2023 to 2025 lists, so their earlier lists are the histories of contractors still ranked; the membership-at-the-time checks on every series ever ranked give the same level differences.</li>
        <li>Federal construction is one market, in which CMAR is rare (${c.cmar_awards} awards among the comparable firms); the outcomes are modifications recorded by the owner.</li>
        <li>ENR revenue values of single firms are not redistributed; ranks and group aggregates are shown. Page texts of the archived websites are not published.</li>
      </ul>
      <h2>Downloads</h2>
      <p><button class="pill" id="dl-firms">Classified contractors (CSV)</button> <button class="pill" id="dl-comp">The 45 main comparisons (CSV)</button> <button class="pill" id="dl-wall">Rank histories of the ${n(c.series)} series (CSV)</button></p>
      <p class="muted">The full tables, the coded measures and the analysis code are deposited in a public repository with a digital object identifier at the article's acceptance. Data built ${S.built}.</p>`;
    const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const save = (name, head, rows) => { const csv = [head.join(",")].concat(rows.map((r) => r.map(esc).join(","))).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; a.click(); };
    const NAME = { MM: "Member-mentioned", MS: "Member-silent", NM: "Non-member-mentioned", NS: "Non-member-silent", U: "Website not read", X: "Not ranked in 2023 to 2025" };
    document.getElementById("dl-firms").addEventListener("click", () => save("lean_signal_contractors.csv", ["name", "group", "state", "region", "firm_type", "enr_rank_latest", "latest_list", "years_ranked", "first_list", "cmar_share_band", "lci_first_year", "lci_last_year", "federal_awards", "federal_value_musd", "federal_cmar_award", "lean_pages", "methods_named"],
      G.firms.map((f) => [f.n, NAME[f.g], f.st, f.rg, f.type, f.rank, f.ly, f.lists, f.fl, f.cmb, f.m, f.ml, f.fa, f.fm, f.ca ? "yes" : "no", f.lp, f.meth.map((m) => G.method_names[m] || m).join("; ")])));
    document.getElementById("dl-comp").addEventListener("click", () => save("main_comparisons.csv", ["test", "question", "outcome", "group", "estimate", "ci_low", "ci_high", "p", "n", "firms", "reading"],
      A.comparisons.map((c) => [c.id, c.rq + " " + c.label, c.outcome, NAME[c.g], c.est, c.lo, c.hi, c.p, c.n, c.firms, c.words])));
    document.getElementById("dl-wall").addEventListener("click", () => save("enr_rank_histories.csv", ["name", "group", "state", "region", "first_list", "last_list", "lists", "status", "lci_first_year"].concat(d.wall.years.map((y) => "rank_" + y)),
      d.wall.firms.map((f) => [f.n, NAME[f.g], f.st, f.rg, f.fl, f.ll, f.nl, d.wall.status[f.fs], f.m].concat(f.r))));
  }
  return { init, show() {}, hide() {} };
})();
