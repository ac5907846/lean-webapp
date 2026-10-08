"""Export the companion web app's data (05_web_app/data/*.json) from the results files of 02_analysis, through core.out().
Run from anywhere: python build_data.py. The app reads only these JSON files; nothing else is computed in the browser
beyond counting and filtering what is here. Page texts stay out (third-party copyright): the app gets coded measures,
method flags and the short verified quotes of the project records.

Outputs (data/)
  summary.json     headline counts and the build date
  orgs.json        one row per organization of the frame (748): identity, group, place, ENR and federal profile, LCI
                   years, the website's lean measures (panel 2008 to 2026 and recent snapshot 2024 to 2026)
  years.json       the panel domains' year-by-year status and level (2008 to 2026), for the coverage strips
  methods.json     lean methods named: firms per method, co-occurrence between methods, first year named (panel)
  lci.json         LCI directory: member types, owner sectors, cohorts by year, member map points
  enr.json         ENR Top 400: affiliation by dominant market and by revenue quintile, with Wilson intervals
  federal.json     federal construction solicitations by fiscal year and term; the solicitations naming a lean method
  projects.json    project records with a verbatim quote (voted by three local models; hand check pending)
  contracts.json   usable federal awards of the panel firms by pricing type, competition and kind of work, by year
"""
import sys as _sys; from pathlib import Path as _Path; _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "02_analysis" / "_shared"))
import json
import math
from datetime import date
import numpy as np
import pandas as pd
import core

OUT = _Path(__file__).resolve().parent / "data"
METHOD_NAMES = {"last_planner": "Last Planner System", "pull_planning": "Pull planning", "weekly_work_plan": "Weekly work plan",
                "make_ready": "Make-ready planning", "ppc": "Percent plan complete", "big_room": "Big Room",
                "target_value_design": "Target value design", "takt": "Takt planning", "choosing_by_advantages": "Choosing by advantages",
                "lookahead": "Look-ahead planning", "constraint": "Constraint log", "a3": "A3 reports", "value_stream": "Value stream mapping",
                "gemba": "Gemba walks", "kaizen": "Kaizen", "ipd": "Integrated project delivery (flag)", "huddle": "Daily huddles (flag)",
                "lci": "Lean Construction Institute (flag)", "six_sigma": "Lean Six Sigma (flag)"}
ROUTINES = [m for m in METHOD_NAMES if "(flag)" not in METHOD_NAMES[m]]
TERM_NAMES = {"design_build": "Design-build", "progressive_design_build": "Progressive design-build", "design_bid_build": "Design-bid-build",
              "cm_at_risk": "Construction manager at risk", "eci": "Early contractor involvement", "idiq_matoc": "IDIQ or MATOC",
              "ipd": "Integrated project delivery", "any_lean": "Any lean method"}


def clean(v):
    if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if isinstance(v, pd.Timestamp):
        return v.strftime("%Y-%m-%d")
    return v


def records(df, cols=None):
    df = df if cols is None else df[cols]
    return [{k: clean(v) for k, v in r.items()} for r in df.to_dict("records")]


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{name}: {(OUT / name).stat().st_size / 1024:.0f} KB")


ENR_SOURCE = "https://www.chubb.com/content/dam/chubb-sites/chubb-com/us-en/surety/enr-top-400.pdf"
PRICING = {"FIRM FIXED PRICE": "Firm fixed price", "FIXED PRICE": "Fixed price (other)", "FIXED PRICE WITH ECONOMIC PRICE ADJUSTMENT": "Fixed price (other)",
           "FIXED PRICE INCENTIVE": "Fixed price (other)", "FIXED PRICE AWARD FEE": "Fixed price (other)", "COST PLUS FIXED FEE": "Cost reimbursement",
           "COST PLUS AWARD FEE": "Cost reimbursement", "COST PLUS INCENTIVE FEE": "Cost reimbursement", "COST NO FEE": "Cost reimbursement",
           "COST SHARING": "Cost reimbursement", "TIME AND MATERIALS": "Time and materials or labor hours", "LABOR HOURS": "Time and materials or labor hours"}
COMPETE = {"FULL AND OPEN COMPETITION": "Full and open competition", "FULL AND OPEN COMPETITION AFTER EXCLUSION OF SOURCES": "Set-aside (after exclusion of sources)",
           "COMPETED UNDER SAP": "Competed (simplified acquisition)", "COMPETITIVE DELIVERY ORDER": "Competitive delivery order",
           "NOT AVAILABLE FOR COMPETITION": "Not available for competition", "NOT COMPETED": "Not competed", "NOT COMPETED UNDER SAP": "Not competed",
           "FOLLOW ON TO COMPETED ACTION": "Not competed"}


def norm_name(n):
    import re
    return re.sub(r"[^a-z0-9]+", " ", str(n).lower()).replace(" llc", "").replace(" inc", "").replace(" the ", " ").strip()


# SAM.gov has no stable public address for an entity record (2026-10-08: its entity routes return 404 outside a session), so
# a contractor links to its USAspending recipient profile, resolved from the UEI by 00_code/x16 into the raw data folder.
_RID = None


def usaspending_link(uei, name):
    global _RID
    if _RID is None:
        p = core.RAW / "usaspending" / "recipient_ids.csv"
        _RID = pd.read_csv(p, dtype=str).dropna(subset=["recipient_id"]).set_index("uei").recipient_id.to_dict() if p.exists() else {}
    if uei and uei in _RID:
        return f"https://www.usaspending.gov/recipient/{_RID[uei]}/latest"
    return f"https://www.usaspending.gov/keyword_search/{str(name).replace(' ', '%20')}" if isinstance(name, str) and name else None


def archive_link(src, ts, url, year=None):
    if src == "wayback":
        return f"https://web.archive.org/web/{ts}/{url}"
    # Common Crawl records are not browsable (index.commoncrawl.org refuses most visitors); the Wayback Machine
    # redirects to its capture closest to the middle of that year, when it has one
    return f"https://web.archive.org/web/{year}0701000000/{url}"


def evidence_pages():
    """up to 6 archived pages with lean language per domain, highest level and most recent first, with archive links"""
    pe = pd.read_parquet(core.out("lcp_page_evidence.parquet"), columns=["domain", "source", "timestamp", "year", "url", "url_norm", "level"])
    pe = pe[pe.level >= 1]
    out = {}
    if core.out("p1_frame_page_evidence.parquet").exists():
        fr = pd.read_parquet(core.out("p1_frame_page_evidence.parquet"), columns=["domain", "crawl", "year", "url", "url_norm", "level"])
        fr = fr[fr.level >= 1].rename(columns={"crawl": "timestamp"}).assign(source="commoncrawl")
        pe = pd.concat([pe, fr], ignore_index=True)
    pe = pe.sort_values(["level", "year"], ascending=False).drop_duplicates(["domain", "url_norm"])
    for d, g in pe.groupby("domain"):
        out[d] = [{"url": r.url, "year": int(r.year), "level": int(r.level), "source": "Wayback Machine" if r.source == "wayback" else "Common Crawl",
                   "link": archive_link(r.source, r.timestamp, r.url, int(r.year))} for r in g.head(6).itertuples()]
    return out


def contracts_by_domain(firm_dom):
    a = pd.read_parquet(core.out("awards_usable.parquet"), columns=["firm", "type_of_contract_pricing", "extent_competed", "psc_group", "start_year", "v0"])
    a = a[a.firm.isin(firm_dom)].copy()
    a["domain"] = a.firm.map(firm_dom)
    a["pricing"] = a.type_of_contract_pricing.map(PRICING).fillna("Other or not stated")
    a["compete"] = a.extent_competed.map(COMPETE).fillna("Other or not stated")
    a["work"] = a.psc_group.fillna("").str.startswith("Y").map({True: "New construction", False: "Maintenance, repair, alteration"})
    per = {}
    for d, g in a.groupby("domain"):
        per[d] = {"pricing": g.pricing.value_counts().to_dict(), "compete": g.compete.value_counts().to_dict(), "work": g.work.value_counts().to_dict()}
    allc = {"pricing": a.pricing.value_counts().to_dict(), "compete": a.compete.value_counts().to_dict(), "work": a.work.value_counts().to_dict(),
            "by_year": [{"year": int(y), "awards": int(len(g)), "firm_fixed": int(g.pricing.eq("Firm fixed price").sum()), "set_aside": int(g.compete.eq("Set-aside (after exclusion of sources)").sum()),
                         "full_open": int(g.compete.eq("Full and open competition").sum()), "new_construction": int(g.work.eq("New construction").sum())}
                        for y, g in a.groupby("start_year") if 2008 <= y <= 2026],
            "awards": int(len(a)), "firms": int(a.domain.nunique())}
    return per, allc


def group_of(r):
    if r.in_lci:
        return "lci"
    if r.in_enr:
        return "enr"
    return "fed"


def orgs():
    f = pd.read_csv(core.out("p1_firms.csv"))
    pl = pd.read_csv(core.out("p1_firm_places.csv")).set_index("org_id")
    enr = pd.read_csv(core.out("enr_lean_affiliation.csv"))
    enr = enr[enr.domain.notna()].drop_duplicates("domain").set_index("domain")
    lcs = pd.read_csv(core.out("lcs_firm_table.csv")).drop_duplicates("domain").set_index("domain")
    rec = pd.read_csv(core.out("p1_frame_lean.csv")).drop_duplicates("domain").set_index("domain") if core.out("p1_frame_lean.csv").exists() else None
    dates = pd.read_csv(core.out("lcp_firm_dates.csv")).sort_values("pages", ascending=False).drop_duplicates("domain").set_index("domain")
    lm = pd.read_csv(core.out("lci_member_map.csv"))
    lm["key"] = lm.name.map(norm_name)
    lci_by_name = lm.drop_duplicates("key").set_index("key")
    ev = evidence_pages()
    firm_dom = dict(zip(lcs.firm, lcs.index))
    contracts, _ = contracts_by_domain(firm_dom)
    rows = []
    for r in f.itertuples(index=False):
        d = r.domain if isinstance(r.domain, str) else None
        p = pl.loc[r.org_id] if r.org_id in pl.index else None
        e = enr.loc[d] if d and d in enr.index else None
        l = lcs.loc[d] if d and d in lcs.index else None
        w = dates.loc[d] if d and d in dates.index else None
        c = rec.loc[d] if rec is not None and d and d in rec.index else None
        methods = set()
        if w is not None and isinstance(w.routines_ever, str):
            methods |= set(w.routines_ever.split(";"))
        if c is not None and isinstance(c.recent_methods, str):
            methods |= set(c.recent_methods.split(";"))
        methods = sorted(m for m in methods if m in ROUTINES)
        panel_level = clean(w.max_level_ever) if w is not None else None
        recent_level = clean(c.recent_max_level) if c is not None else None
        level = max([x for x in (panel_level, recent_level) if x is not None], default=None)
        lk = lci_by_name.loc[norm_name(r.name)] if norm_name(r.name) in lci_by_name.index else None
        otype = clean(lk.type_name) if lk is not None else ("Owners" if r.org_type == "owner" else "Lean and management consultants" if r.org_type == "lean consultant"
                                                               else "General contractors and construction managers" if r.org_type == "contractor" else "Other LCI members")
        uei = clean(r.federal_uei) or (clean(l.firm) if l is not None and isinstance(l.firm, str) and len(l.firm) == 12 else None)
        links = {k: v for k, v in {
            "website": f"https://{d}/" if d else None,
            "lci": f"https://leanconstruction.org/sponsors/{lk.slug}/" if lk is not None else None,
            "enr": ENR_SOURCE if r.in_enr else None,
            "usaspending": usaspending_link(uei, r.name if r.in_federal else None),
        }.items() if v}
        rows.append({
            "id": r.org_id, "name": r.name, "domain": d, "group": group_of(r), "org_type": r.org_type, "type": otype, "links": links,
            "pages_evidence": ev.get(d), "contracts": contracts.get(d), "sector": clean(lk.sector) if lk is not None else None,
            "lci_type": clean(r.lci_member_type), "in_lci": bool(r.in_lci), "in_enr": bool(r.in_enr), "in_federal": bool(r.in_federal),
            "city": clean(r.hq_city), "state": clean(r.state), "country": clean(r.country),
            "lat": clean(p.lat) if p is not None else None, "lon": clean(p.lon) if p is not None else None,
            "precision": clean(p.precision) if p is not None else None,
            "enr_rank": clean(r.enr_best_rank), "revenue_musd": clean(r.enr_latest_revenue_musd),
            "pct_general_building": clean(r.pct_general_building), "pct_cm_at_risk": clean(r.pct_cm_at_risk),
            "market": clean(e.dominant_market) if e is not None else None,
            "lci_first_year": clean(e.lci_first_year) if e is not None else (clean(l.lci_first_year) if l is not None else None),
            "n_large_building": clean(r.n_large_building),
            "fed_awards": clean(l.n_usable) if l is not None else None, "fed_value_musd": clean(l.value_usable_musd) if l is not None else None,
            "fed_first_year": clean(l.first_award_year) if l is not None else None, "fed_last_year": clean(l.last_award_year) if l is not None else None,
            "share_dod": clean(l.share_dod) if l is not None else None, "entity_start_year": clean(l.entity_start_year) if l is not None else None,
            "panel": w is not None, "pages": clean(w.pages) if w is not None else None, "years_observed": clean(w.years_observed) if w is not None else None,
            "first_observed": clean(w.first_observed) if w is not None else None, "last_observed": clean(w.last_observed) if w is not None else None,
            "panel_level": panel_level, "commit_year": clean(w.commit_year) if w is not None else None,
            "routine_year": clean(w.routine_year) if w is not None else None, "system_year": clean(w.system_year) if w is not None else None,
            "left_censored": bool(w.left_censored) if w is not None else None, "persistence": clean(w.persistence) if w is not None else None,
            "stable": bool(l.stable) if l is not None else None, "gate": bool(l.gate) if l is not None else None,
            "recent_pages": clean(c.recent_pages) if c is not None else None, "recent_level": recent_level,
            "level": level, "methods": methods,
        })
    # the panel's federal builders outside the paper 1 frame (stages 2 to 4): awards and website measures, SAM place
    pp = pd.read_csv(core.out("p1_panel_places.csv")).drop_duplicates("domain").set_index("domain")
    for d, p in pp.iterrows():
        l = lcs.loc[d] if d in lcs.index else None
        w = dates.loc[d] if d in dates.index else None
        if l is None:
            continue
        methods = sorted(m for m in (w.routines_ever.split(";") if w is not None and isinstance(w.routines_ever, str) else []) if m in ROUTINES)
        panel_level = clean(w.max_level_ever) if w is not None else None
        uei = l.firm if isinstance(l.firm, str) and len(l.firm) == 12 else None
        links = {k: v for k, v in {"website": f"https://{d}/", "usaspending": usaspending_link(uei, l.firm_name)}.items() if v}
        rows.append({
            "id": d, "name": str(l.firm_name).title().replace(" Llc", " LLC").replace(" Inc", " Inc"), "domain": d, "group": "fed", "org_type": "contractor",
            "type": "General contractors and construction managers", "links": links, "pages_evidence": ev.get(d), "contracts": contracts.get(d),
            "lci_type": None, "in_lci": False, "in_enr": False, "in_federal": True,
            "city": clean(p.city) if isinstance(p.city, str) else None, "state": clean(p.state), "country": "US",
            "lat": clean(p.lat), "lon": clean(p.lon), "precision": clean(p.precision),
            "enr_rank": None, "revenue_musd": None, "pct_general_building": None, "pct_cm_at_risk": None, "market": None,
            "lci_first_year": clean(l.lci_first_year), "n_large_building": clean(l.n_large_building),
            "fed_awards": clean(l.n_usable), "fed_value_musd": clean(l.value_usable_musd),
            "fed_first_year": clean(l.first_award_year), "fed_last_year": clean(l.last_award_year),
            "share_dod": clean(l.share_dod), "entity_start_year": clean(l.entity_start_year),
            "panel": w is not None, "pages": clean(w.pages) if w is not None else None, "years_observed": clean(w.years_observed) if w is not None else None,
            "first_observed": clean(w.first_observed) if w is not None else None, "last_observed": clean(w.last_observed) if w is not None else None,
            "panel_level": panel_level, "commit_year": clean(w.commit_year) if w is not None else None,
            "routine_year": clean(w.routine_year) if w is not None else None, "system_year": clean(w.system_year) if w is not None else None,
            "left_censored": bool(w.left_censored) if w is not None else None, "persistence": clean(w.persistence) if w is not None else None,
            "stable": bool(l.stable), "gate": bool(l.gate),
            "recent_pages": None, "recent_level": None, "level": panel_level, "methods": methods, "stage": int(l.stage),
        })
    return [{k: v for k, v in r.items() if v is not None and v is not False} for r in rows]


def years():
    fy = pd.read_csv(core.out("lcp_firm_year.csv"))
    code = {"UNKNOWN": "u", "NOT_FOUND": "n", "FOUND": "f"}
    out = {}
    for d, g in fy.groupby("domain"):
        g = g.set_index("year")
        s = ""
        for y in range(2008, 2027):
            if y in g.index:
                st = code.get(g.loc[y, "status"], "u")
                lv = int(g.loc[y, "max_level"]) if st == "f" and pd.notna(g.loc[y, "max_level"]) else 0
                s += str(lv) if st == "f" else st
            else:
                s += "u"
        out[d] = s
    return {"years": list(range(2008, 2027)), "codes": {"u": "unknown (no coverage)", "n": "observed, no lean language", "1": "general lean language",
                                                      "2": "a named routine", "3": "three or more routines on one page"}, "domains": out}


def methods(org_rows):
    pe = pd.read_parquet(core.out("lcp_page_evidence.parquet"))
    lean = pe[pe.level >= 1]
    by_firm = lean.groupby("domain")[ROUTINES].any()
    firms_per = by_firm.sum().sort_values(ascending=False)
    pages_per = (lean[ROUTINES] > 0).sum()
    co = {}
    for a in ROUTINES:
        for b in ROUTINES:
            if a < b:
                n = int((by_firm[a] & by_firm[b]).sum())
                if n:
                    co[f"{a}|{b}"] = n
    first = {}
    for m in ROUTINES:
        yrs = lean[lean[m]].groupby("domain").year.min()
        first[m] = {int(k): int(v) for k, v in yrs.value_counts().sort_index().items()}
    frame_counts = {m: 0 for m in ROUTINES}
    for o in org_rows:
        for m in o.get("methods", []):
            frame_counts[m] += 1
    return {"names": METHOD_NAMES, "routines": ROUTINES, "specific": ROUTINES[:9], "generic": ROUTINES[9:],
            "panel_firms": {m: int(firms_per[m]) for m in ROUTINES}, "panel_pages": {m: int(pages_per[m]) for m in ROUTINES},
            "panel_domains_with_lean": int(by_firm.shape[0]), "frame_firms": frame_counts, "cooccurrence": co, "first_year": first,
            "levels_pages": {int(k): int(v) for k, v in pe.level.value_counts().sort_index().items()}, "pages": int(len(pe)),
            "domains": int(pe.domain.nunique())}


def lci():
    types = pd.read_csv(core.out("lci_member_type_counts.csv"))
    cohorts = pd.read_csv(core.out("lci_member_cohorts.csv"))
    m = pd.read_csv(core.out("lci_member_map.csv"))
    return {"types": records(types[types.level == "type"], ["type", "type_name", "members", "lean_yes", "share", "share_lean_claim"]),
            "sectors": records(types[types.level != "type"], ["type", "type_name", "members", "sector", "share"]),
            "cohorts": records(cohorts), "members": records(m[m.lat.notna()], ["slug", "name", "type", "type_name", "sector", "lean", "state", "city", "lat", "lon", "precision"]),
            "members_total": int(len(m)), "members_mapped": int(m.lat.notna().sum())}


def enr():
    bm = pd.read_csv(core.out("enr_affiliation_by_market.csv"))
    bs = pd.read_csv(core.out("enr_affiliation_by_size.csv"))
    e = pd.read_csv(core.out("enr_lean_affiliation.csv"))
    return {"by_market": records(bm), "by_size": records(bs), "firms": int(len(e)), "lci_2026": int(e.lci_2026.sum()), "lci_ever": int(e.lci_ever.sum())}


def federal():
    t = pd.read_csv(core.out("fed_terms_by_year.csv"))
    s = pd.read_csv(core.out("fed_lean_solicitations.csv"))
    c = pd.read_csv(core.out("fed_solicitation_counts.csv"))
    d = c[c.department.notna()]                           # rows are (fiscal year, department, sub-tier, term)
    totals = d[d.term.eq("any_lean")].groupby("department").solicitations.sum().sort_values(ascending=False)
    naming = d.groupby(["department", "term"]).naming.sum().unstack(fill_value=0)
    by_dep = [{"department": dep, "solicitations": int(totals[dep]), **{k: int(naming.loc[dep, k]) if k in naming.columns else 0 for k in TERM_NAMES}}
              for dep in totals.index[:10]]
    return {"terms": TERM_NAMES, "by_year": records(t), "total_solicitations": int(t.solicitations.sum()),
            "lean_solicitations": records(s, ["first_posted", "department", "sub_tier", "office", "title", "notice_types", "terms", "place_state", "passage", "notices"]),
            "by_department": by_dep}


def projects():
    p = pd.read_csv(core.out("p1_lean_projects.csv"))
    p = p[p.lean_used_on_project.astype(str).str.lower().eq("true")].copy()
    p = p.replace("NO_MAJORITY", "unknown")
    p["key"] = p.project_name.str.lower().str.replace(r"[^a-z0-9]+", " ", regex=True).str.strip() + "|" + p.domain
    p = p.sort_values(["quote_verified", "models"], ascending=False).drop_duplicates("key")
    firms = pd.read_csv(core.out("p1_firms.csv")).drop_duplicates("domain").set_index("domain").name
    p["firm"] = p.domain.map(firms)
    _sys.path.insert(0, str(core.ANALYSIS / core.FOLDERS["06"]))
    from f2_firm_places import gazetteer, place_key
    pl = gazetteer("2024_Gaz_place_national.zip")
    pl["key"] = pl.NAME.str.replace(r"\s+(city|town|village|CDP|borough|municipality|city and borough|urban county|"
                                    r"consolidated government|metropolitan government|unified government)(\s.*)?$", "", regex=True).map(place_key)
    pl["aland"] = pd.to_numeric(pl.ALAND, errors="coerce")
    pl = pl.sort_values("aland", ascending=False).drop_duplicates(["USPS", "key"])
    pt = {(r.USPS, r.key): (float(r.INTPTLAT), float(r.INTPTLONG)) for r in pl.itertuples()}
    p["lat"] = [pt.get((r.state, place_key(r.city)), (None, None))[0] if isinstance(r.city, str) and isinstance(r.state, str) else None for r in p.itertuples()]
    p["lon"] = [pt.get((r.state, place_key(r.city)), (None, None))[1] if isinstance(r.city, str) and isinstance(r.state, str) else None for r in p.itertuples()]
    cols = ["project_name", "firm", "domain", "city", "state", "country", "lat", "lon", "building_type", "owner_type", "owner", "designer", "delivery_method",
            "value_usd_millions", "size_sqft", "completion_year", "lean_methods", "quote", "quote_verified", "year", "url"]
    return {"records": records(p, cols), "pages_read": 279, "firms_read": 6, "note": "voted by three local language models; a hand check of the records is pending"}


def main():
    OUT.mkdir(exist_ok=True)
    o = orgs()
    dump("orgs.json", o)
    y = years()
    dump("years.json", y)
    m = methods(o)
    dump("methods.json", m)
    l = lci()
    dump("lci.json", l)
    e = enr()
    dump("enr.json", e)
    fd = federal()
    dump("federal.json", fd)
    pr = projects()
    dump("projects.json", pr)
    lcs = pd.read_csv(core.out("lcs_firm_table.csv")).drop_duplicates("domain")
    _, allc = contracts_by_domain(dict(zip(lcs.firm, lcs.domain)))
    dump("contracts.json", allc)
    observed = [r for r in o if r.get("level") is not None]
    summary = {
        "built": date.today().isoformat(),
        "organizations": len(o), "with_place": sum(1 for r in o if r.get("lat") is not None),
        "by_group": {g: sum(1 for r in o if r["group"] == g) for g in ("lci", "enr", "fed")},
        "observed": len(observed), "any_lean": sum(1 for r in observed if (r.get("level") or 0) >= 1), "named_method": sum(1 for r in observed if (r.get("level") or 0) >= 2),
        "system_level": sum(1 for r in observed if (r.get("level") or 0) >= 3),
        "dated": sum(1 for r in o if r.get("commit_year") is not None), "stable": sum(1 for r in o if r.get("stable")), "gate": sum(1 for r in o if r.get("gate")),
        "panel_domains": sum(1 for r in o if r.get("panel")), "panel_pages": m["pages"], "recent_pages": int(sum(r.get("recent_pages") or 0 for r in o)),
        "states": len({r.get("state") for r in o if r.get("state")}),
        "lci_members": l["members_total"], "enr_firms": e["firms"], "enr_lci_2026": e["lci_2026"], "enr_lci_ever": e["lci_ever"],
        "solicitations": fd["total_solicitations"], "lean_solicitations": len(fd["lean_solicitations"]),
        "projects": len(pr["records"]),
        "group_stats": {g: {"n": sum(1 for r in observed if r["group"] == g),
                            "any_lean": sum(1 for r in observed if r["group"] == g and (r.get("level") or 0) >= 1),
                            "named_method": sum(1 for r in observed if r["group"] == g and (r.get("level") or 0) >= 2),
                            "dated": sum(1 for r in o if r["group"] == g and r.get("commit_year") is not None)} for g in ("lci", "enr", "fed")},
        "commit_years": {g: {int(k): int(v) for k, v in pd.Series([r.get("commit_year") for r in o if r["group"] == g and r.get("commit_year")]).value_counts().sort_index().items()} for g in ("lci", "enr", "fed")},
    }
    dump("summary.json", summary)
    print(json.dumps({k: v for k, v in summary.items() if k not in ("group_stats", "commit_years")}, indent=1))


if __name__ == "__main__":
    main()
