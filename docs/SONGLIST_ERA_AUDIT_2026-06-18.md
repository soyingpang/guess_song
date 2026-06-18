# Songlist Era Audit (2026-06-18)

All generated lists keep the existing 500,000 view-count floor.

## Summary

| List | Count |
| --- | ---: |
| hymns.json | 183 |
| songlists/pop-80s.json | 39 |
| songlists/pop-90s.json | 66 |
| songlists/pop-00s.json | 30 |
| songlists/pop-recent-15.json | 48 |
| songlists/pop-recent-25.json | 78 |
| songlists/pop-era-unverified.json | 3133 |
| songlists/pop-all.json | 3316 |
| songlists/pop-cantonese.json | 1589 |
| songlists/pop-mandarin.json | 1727 |
| songlists/all-songlists.json | 3499 |
| songlists/all-cantonese.json | 1677 |
| songlists/all-mandarin.json | 1822 |

## Rules

- Era lists are strict and non-overlapping.
- 80年代 = 1980-1989, 90年代 = 1990-1999, 00後 = 2000-2010, 最近15年 = 2011-2026.
- Songs without a reliable year are kept in the all-pop pool but moved to 年代未核實 instead of being forced into an era.
- Year evidence comes from the original matched CSVs, explicit song metadata, `年代：YYYY` hints, and a small manual correction map for obvious high-view songs found in the audit.
- Full per-song audit: `docs/SONGLIST_ERA_AUDIT_2026-06-18.csv`.

