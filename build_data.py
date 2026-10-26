"""Export the web app's data (05_web_app/data/*.json) for the lean signals paper, from the results files of 02_analysis through
core.out() and from the manuscript builder's own number sources (04_manuscript_journal/working/build_manuscript.py: the same
Numbers object fills the manuscript, so the app and the paper read one set of files). Rewritten 2026-10-26 (owner: one app,
aligned with the journal paper; the conference app of 2026-10-06 to 10-09 is archived in _archive/2026-10-26_conference_app/).
Run from anywhere: python build_data.py.

Outputs (data/)
  summary.json    counts, the headline numbers of the four research questions, the group names, the build date
  wall.json       every series of the 26 ENR lists 2001 to 2026 (1,005): its rank on each list (a public fact), its printed CMAR
                  share band, its group, state, region, first LCI year, final status (the hero and the firm detail)
  groups.json     Table 1, the firm profile splits (Figure 1), the 278 classified firms, their lean website content (Figure 2)
  markets.json    market shares (Figure 4), the federal delivery mix (Figure 5), ENR trajectories by group and list year (Figure 6),
                  the stored results tables of RQ2 and RQ3
  answers.json    the 45 main comparisons on the p axis (Figure 7), the RQ1 and RQ4 tables, the DBB robustness checks (Table S4),
                  the survivorship checks (Table S6)
Rules kept: no ENR revenue of a single firm (ENR's values are not redistributed; ranks and group aggregates are facts), no page
texts, every website measure provisional until the dictionary is validated, no e-mail address or key.
"""
import sys as _sys
from pathlib import Path as _Path
HERE = _Path(__file__).resolve().parent
_sys.path.insert(0, str(HERE.parents[0] / "02_analysis" / "_shared"))
_sys.path.insert(0, str(HERE.parents[0] / "04_manuscript_journal" / "working"))
import json
import math
from datetime import date
import numpy as np
import pandas as pd
import core
from group_labels import LABEL
_sys.argv = [_sys.argv[0]]
import build_manuscript as bm                                   # noqa: E402  the manuscript's Numbers: one source for the app and the paper

OUT = HERE / "data"
CODES = ["MM", "MS", "NM", "NS"]
GROUP_KEY = {"MM": "MM member, mentions lean", "MS": "MS member, silent", "NM": "NM non-member, mentions lean", "NS": "NS non-member, silent", "U": "U website not read"}
METHOD_NAMES = {"last_planner": "Last Planner System", "pull_planning": "Pull planning", "weekly_work_plan": "Weekly work plan",
                "make_ready": "Make-ready planning", "ppc": "Percent plan complete", "big_room": "Big Room",
                "target_value_design": "Target value design", "takt": "Takt planning", "choosing_by_advantages": "Choosing by advantages",
                "lookahead": "Look-ahead planning", "constraint": "Constraint log", "a3": "A3 reports", "value_stream": "Value stream mapping",
                "gemba": "Gemba walks", "kaizen": "Kaizen", "ipd": "Integrated project delivery", "lci": "Lean Construction Institute named",
                "huddle": "Daily huddles"}
# Figure 7: the main comparisons by research question (the layout of p3_answers_forest.py)
QUESTIONS = [("RQ1", "federal awards", [("H38", "federal award value", "abc")]),
             ("RQ2", "collaborative delivery", [("H35", "CMAR share of revenue (ENR)", "abc"), ("H35", "part of the CMAR market (ENR)", "def"),
                                                ("H39", "holds a federal CMAR award", "abc"), ("H39", "DB among DB and DBB awards", "def"),
                                                ("H36", "DB among all federal awards", "abc")]),
             ("RQ3", "market position and trajectories", [("H37", "revenue gap, trend", "abc"), ("H37", "rank gap, trend", "def"), ("H40", "CMAR rank gap, trend", "abc")]),
             ("RQ4", "project outcomes", [("H41", "change orders, all awards", "abc"), ("H41", "change orders, DBB", "def"), ("H41", "change orders, DB", "ghi"),
                                          ("H41", "extension, all awards", "jkl"), ("H41", "extension, DBB", "mno"), ("H41", "extension, DB", "pqr")])]
YEARS = list(range(2001, 2027))


def clean(v):
    if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    return v


def rnd(v, d=2):
    v = clean(v)
    return None if v is None or isinstance(v, str) else round(float(v), d)


def records(df, cols=None):
    df = df if cols is None else df[cols]
    return [{k: clean(v) for k, v in r.items()} for r in df.to_dict("records")]


def dump(name, obj):
    OUT.mkdir(exist_ok=True)
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{name}: {(OUT / name).stat().st_size / 1024:.0f} KB")


def cell(c, d=2):
    """a stored table cell, compact: est, lo, hi, p (6 significant), x, n, kind, src"""
    if not isinstance(c, dict):
        return {"kind": "text", "t": str(c)}
    o = {"kind": c.get("kind")}
    for k in ("est", "lo", "hi"):
        if c.get(k) is not None:
            o[k] = rnd(c[k], 4)
    for k in ("p",):
        if c.get(k) is not None:
            o[k] = float(f"{float(c[k]):.4g}")
    for k in ("x", "n"):
        if c.get(k) is not None:
            o[k] = clean(c[k])
    if c.get("src"):
        o["src"] = c["src"]
    if c.get("primary"):
        o["primary"] = True
    return o


def table(tab):
    return {"header": [[h.replace("\n", " ") for h in hdr] for hdr in tab["header"]],
            "panels": [{"name": (p.get("name") or "").replace("CM at risk", "CMAR"), "dec": p.get("dec"),
                        "rows": [{"key": r["key"], "label": LABEL.get(r["key"], r["label"]), "cells": [cell(c) for c in r["cells"]]} for r in p["rows"]],
                        "footer": [{"label": f["label"], "values": f["values"]} for f in p.get("footer", [])]} for p in tab["panels"]]}


def main():
    N = bm.Numbers()
    tests = {**{t["test_id"]: t for t in json.loads(core.out("ms_tests.json").read_text(encoding="utf-8"))["tests"]},
             **{t["test_id"]: t for t in json.loads(core.out("ms_rq_tests.json").read_text(encoding="utf-8"))["tests"]}}
    main_ids = set(pd.read_csv(core.out("ms_verdicts.csv")).test_id)
    m = pd.read_csv(core.out("ms_tables.csv"))
    panel = pd.read_csv(core.out("tg_panel.csv"), low_memory=False)
    firms18 = pd.read_csv(core.out("tg_firms.csv"), low_memory=False).set_index("org_id")
    rt = pd.read_csv(core.out("rt_firms.csv")).set_index("org_id")
    prof = pd.read_csv(core.out("ms_firm_profile.csv"))
    prof_sum = pd.read_csv(core.out("ms_firm_profile_summary.csv"))
    content = pd.read_csv(core.out("ms_lean_content_firms.csv"))
    methods_matrix = pd.read_csv(core.out("ms_lean_methods_matrix.csv"))
    content_matrix = pd.read_csv(core.out("ms_lean_content_matrix.csv"))
    s4 = pd.read_csv(core.out("ms_rq4_dbb_robustness.csv"))
    rtt = {t["test_id"]: t for t in json.loads(core.out("rt_tests.json").read_text(encoding="utf-8"))["tests"]}
    T = N.tables

    # ---------------------------------------------------------------- wall.json: every series of the 26 lists
    panel["cmc"] = panel.pct_cm_at_risk.clip(upper=100)
    wall = []
    for org, g in panel.sort_values("list_year").groupby("org_id"):
        by = g.set_index("list_year")
        f = firms18.loc[org]
        r = rt.loc[org]
        grp = f.group4 if bool(f.cohort_2325) and f.group4 in CODES else ("U" if bool(f.cohort_2325) else "X")
        wall.append({"id": org, "n": r.name_last, "g": grp, "st": clean(f.hq_state), "rg": clean(f.region),
                     "r": [int(by["rank"][y]) if y in by.index else None for y in YEARS],
                     "c": [None if (y not in by.index or pd.isna(by.cmc[y])) else int(round(by.cmc[y])) for y in YEARS],
                     "m": clean(f.lci_first_year) and int(f.lci_first_year), "ml": clean(f.lci_last_year) and int(f.lci_last_year),
                     "fs": {"ranked in 2026": "r", "permanent": "p", "censored": "c"}[r.final_status],
                     "fl": int(r.first_list), "ll": int(r.last_list), "nl": int(r.n_lists), "ret": int(r.returns), "best": int(r.best_rank)})
    dump("wall.json", {"years": YEARS, "firms": wall,
                       "status": {"r": "ranked in 2026", "p": "left the Top 400 (not back within three lists)", "c": "absent since 2024 or 2025"},
                       "groups": {"X": "not ranked in 2023 to 2025", "U": "website not read", **{k: LABEL[k] for k in CODES}}})

    # ---------------------------------------------------------------- groups.json
    t1 = []
    for g in CODES + ["U"]:
        e, fd = N.enr.loc[GROUP_KEY[g]], N.fed.loc[GROUP_KEY[g]]
        t1.append({"g": g, "label": LABEL[g], "member": g in ("MM", "MS"), "mention": g in ("MM", "NM"), "enr_firms": int(e.firms), "firm_lists_pct": rnd(e.firm_lists_pct, 1),
                   "revenue_part_pct": rnd(e.revenue_part_pct, 1), "cm_market_part_pct": rnd(e.cm_market_part_pct, 1), "cm_share_mean_pct": rnd(e.cm_share_mean_pct, 1),
                   "fed_firms": int(fd.firms), "awards": int(fd.awards), "value_part_pct": rnd(fd.value_part_pct, 1), "db_share_of_value_pct": rnd(fd.db_share_of_value_pct, 1),
                   "db_market_part_pct": rnd(fd.db_market_part_pct, 1)})
    cont = content.set_index("org_id")
    meth_cols = [c for c in METHOD_NAMES if c in content.columns]
    firms = []
    for r in prof.itertuples():
        w = rt.loc[r.org_id] if r.org_id in rt.index else None
        c = cont.loc[r.org_id] if r.org_id in cont.index else None
        firms.append({"id": r.org_id, "n": r.firm_name, "g": r.group, "st": clean(r.hq_state), "rg": clean(r.region), "type": r.firm_type, "rank": int(r.rank), "ly": int(r.list_year),
                      "rb": r.rank_band, "lists": int(r.lists), "fl": int(r.first_list), "cmb": clean(r.cmar_band), "fa": int(r.federal_awards), "fm": rnd(r.federal_musd, 1),
                      "fb": clean(r.federal_band), "ca": bool(r.cmar_award), "m": clean(firms18.loc[r.org_id].lci_first_year) and int(firms18.loc[r.org_id].lci_first_year),
                      "ml": clean(firms18.loc[r.org_id].lci_last_year) and int(firms18.loc[r.org_id].lci_last_year),
                      "fs": None if w is None else {"ranked in 2026": "r", "permanent": "p", "censored": "c"}[w.final_status],
                      "meth": [] if c is None else [k for k in meth_cols if bool(c[k])], "lp": None if c is None else int(c.lean_pages),
                      "depth": None if c is None else ("3" if c.depth_3 else "1_2" if c.depth_1_2 else "general"),
                      "kinds": [] if c is None else [k[5:] for k in ("kind_project", "kind_news", "kind_practice", "kind_other") if bool(c[k])]})
    dump("groups.json", {"table1": t1, "profile": records(prof_sum), "firms": firms, "method_names": METHOD_NAMES,
                         "methods_matrix": records(methods_matrix), "content_matrix": records(content_matrix),
                         "segments": {"group": ["Member-mentioned", "Non-member-mentioned"], "firm_type": ["Building", "Industrial", "Heavy civil or mixed"],
                                      "rank_band": ["1 to 100", "101 to 200", "201 to 300", "301 to 400"]}})

    # ---------------------------------------------------------------- markets.json
    enr = m[m.table.str.startswith("ENR pooled") & (m.lists == "2013 to 2025")].set_index("group")
    fed = m[m.table.str.startswith("Federal awards of the comparable firms") & m.coding.astype(str).str.startswith("design-build (folder 19")].set_index("group")
    cm = m[m.table.str.startswith("The groups’ part of the federal awards") | m.table.str.startswith("The groups' part of the federal awards")].set_index("group")
    fedfirms = fed.firms.astype(float)
    shares = []
    for g in CODES + ["U"]:
        k = GROUP_KEY[g]
        shares.append({"g": g, "label": LABEL[g], "firm_lists": rnd(enr.firm_lists_pct[k], 1), "revenue": rnd(enr.revenue_part_pct[k], 1), "cm": rnd(enr.cm_market_part_pct[k], 1),
                       "fed_firms": rnd(100 * fedfirms[k] / fedfirms.sum(), 1), "awards": rnd(cm.awards_part_pct[k], 1), "value": rnd(fed.value_part_pct[k], 1),
                       "db": rnd(fed.db_market_part_pct[k], 1), "cm_awards": rnd(cm.cmar_award_part_pct[k], 1), "firms_with_cmar_award": int(cm.firms_with_cmar_award[k])})
    dm = m[m.table.str.startswith("Federal award value of each group by delivery method")]
    delivery = {}
    for g in CODES + ["U"]:
        s = dm[dm.group == GROUP_KEY[g]]
        delivery[g] = {"value_musd": rnd(s.value_musd.sum(), 1), "awards": int(s.awards.sum()),
                       "cats": {r.cat: {"pct": rnd(r.value_pct_of_group, 2), "value_musd": rnd(r.value_musd, 1), "awards": int(r.awards)} for r in s.itertuples()}}
    tot = float(dm.value_musd.sum())
    delivery["All"] = {"value_musd": rnd(tot, 1), "awards": int(dm.awards.sum()),
                       "cats": {c: {"pct": rnd(100 * v / tot, 2), "value_musd": rnd(v, 1), "awards": int(dm[dm.cat == c].awards.sum())} for c, v in dm.groupby("cat").value_musd.sum().items()}}
    route = m[m.table.str.startswith("The route to federal design-build")]
    by_year = m[m.table.str.startswith("ENR by list year and group")]
    traj = [{"y": int(r.list_year), "g": next(k for k, v in GROUP_KEY.items() if v == r.group), "firms": int(r.firms), "rev_part": rnd(r.revenue_part_pct, 2),
             "rank_med": rnd(r.rank_median, 1), "rank_q1": rnd(r.rank_q1, 1), "rank_q3": rnd(r.rank_q3, 1), "top100": clean(r.firms_in_top_100),
             "cm_mean": rnd(r.cm_share_mean_pct, 1), "cm_part": rnd(r.cm_market_part_pct, 2)} for r in by_year.itertuples()]
    mem = panel[panel.list_year >= 2013].groupby(["list_year", "member_at_time"]).agg(firms=("rank", "size"), rank_med=("rank", "median")).reset_index()
    members_by_year = [{"y": int(r.list_year), "member": bool(r.member_at_time), "firms": int(r.firms), "rank_med": rnd(r.rank_med, 1)} for r in mem.itertuples()]
    dump("markets.json", {"shares": shares, "delivery": delivery, "delivery_cats": ["CM at risk", "design-build", "design-bid-build", "negotiated, delivery unnamed", "task order, delivery unnamed", "other or mixed"],
                          "route": records(route, ["group", "db_awards", "definitive_contract_pct", "order_naming_db_pct", "order_under_db_vehicle_pct", "set_aside_pct_of_db"]),
                          "trajectories": traj, "members_by_year": members_by_year,
                          "tables": {k: table(T[k]) for k in ("rq2_enr", "rq2_cmar", "rq2_db", "rq3")}})

    # ---------------------------------------------------------------- answers.json
    comps = []
    for rq, rq_label, items in QUESTIONS:
        for fam, label, letters in items:
            for ch in letters:
                tid = fam + ch
                t = tests[tid]
                comps.append({"id": tid, "rq": rq, "rq_label": rq_label, "label": label, "g": t["exposure"][:2], "est": rnd(t["estimate"], 4), "lo": rnd(t["ci_low"], 4),
                              "hi": rnd(t["ci_high"], 4), "p": float(f"{float(t['p']):.4g}"), "outcome": t["outcome"].replace("CM at risk", "CMAR"), "unit": t.get("estimate_type"),
                              "n": clean(t["n"]), "firms": clean(t["n_orgs"]), "words": t["effect_in_words"].replace("CM at risk", "CMAR"), "main": tid in main_ids})
    assert sum(c["main"] for c in comps) == 45 and len(comps) == 45, len(comps)
    s4rows = [{"check": r.check, "spec": r.specification, "est": rnd(r.est, 4), "lo": rnd(r.lo, 4), "hi": rnd(r.hi, 4),
               "p": None if pd.isna(r.p_wild) and pd.isna(r.p_cluster) else float(f"{float(r.p_wild if not pd.isna(r.p_wild) else r.p_cluster):.4g}"),
               "awards": clean(r.awards), "firms": clean(r.firms)} for r in s4.itertuples()]
    surv = [{"id": t["test_id"], "outcome": t["outcome"], "exposure": t["exposure"], "est": rnd(t["estimate"], 4), "lo": rnd(t["ci_low"], 4), "hi": rnd(t["ci_high"], 4),
             "p": float(f"{float(t['p']):.4g}"), "n": clean(t["n"]), "exposed": clean(t.get("n_exposed")), "role": t["role"], "words": t["effect_in_words"]} for t in rtt.values()]
    dump("answers.json", {"comparisons": comps, "tables": {k: table(T[k]) for k in ("rq1", "rq4")}, "s4": s4rows, "survivorship": surv})

    # ---------------------------------------------------------------- summary.json
    rq3 = T["rq3"]["panels"]
    mm = lambda pan, col: rq3[pan]["rows"][0]["cells"][col]
    sig = T["rq2_db"]["panels"][0]["rows"][3]["cells"]
    head = {"cmar_points": cell(T["rq2_enr"]["panels"][0]["rows"][0]["cells"][0]), "cmar_part_mm": rnd(N.enr.loc[GROUP_KEY["MM"], "cm_market_part_pct"], 0),
            "cmar_award_mm": cell(T["rq2_cmar"]["panels"][0]["rows"][0]["cells"][0]), "cmar_award_ns": cell(T["rq2_cmar"]["panels"][0]["rows"][4]["cells"][0]),
            "db_signal": cell(sig[0]), "db_signal_no_sealed": cell(sig[4]),
            "rq1_mm": cell(T["rq1"]["panels"][0]["rows"][0]["cells"][0]), "rq1_mm_raw": cell(T["rq1"]["panels"][0]["rows"][0]["cells"][1]),
            "rev_level_mm": cell(mm(0, 4)), "rank_level_mm": cell(mm(1, 4)), "cmrank_level_mm": cell(mm(2, 4)), "rev_level_mm_size": cell(mm(0, 5)),
            "rev_trend_mm": cell(mm(0, 0)), "rank_trend_mm": cell(mm(1, 0)), "cmrank_trend_mm": cell(mm(2, 0)),
            "dbb_change_signal": cell(T["rq4"]["panels"][0]["rows"][3]["cells"][1]), "ext_ms_all": cell(T["rq4"]["panels"][0]["rows"][1]["cells"][4]),
            "pandemic": {k: rnd(rtt["H42a"][k], 3) for k in ("estimate", "ci_low", "ci_high", "p")},
            "full_panel": {k: {j: rnd(rtt[k][j], 3) for j in ("estimate", "ci_low", "ci_high", "p")} for k in ("H45a", "H45b", "H45c")}}
    counts = {"lists": 26, "y0": 2001, "y1": 2026, "series": int(len(wall)), "firm_lists": int(len(panel)), "classified": int(len(firms)),
              "pages": int(N.x["pages"].replace(",", "")), "awards_usable": int(N.x["awards"].replace(",", "")), "domains": int(N.x["domains"]),
              "awards_comparable": int(T["rq4"]["panels"][1]["footer"][0]["values"][0].replace(",", "")), "fed_firms_comparable": int(T["rq4"]["panels"][1]["footer"][1]["values"][0].replace(",", "")),
              "cmar_awards": int(N.x["cmar_comparable"]), "exits": int((rt.final_status == "permanent").sum()), "censored": int((rt.final_status == "censored").sum()),
              "returns": int((rt.returns > 0).sum()), "groups": {g: int(N.enr.loc[GROUP_KEY[g], "firms"]) for g in CODES + ["U"]},
              "members_ever": int(firms18.member.sum()), "lean_firms": int(len(content))}
    dump("summary.json", {"built": date.today().isoformat(), "counts": counts, "headline": head, "labels": {**LABEL},
                          "x": {k: v for k, v in N.x.items()}})
    print(json.dumps(counts, indent=1))


if __name__ == "__main__":
    main()
