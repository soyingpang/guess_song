# Songlist Language and Era Split (2026-06-12)

All generated lists keep the existing 500,000 view-count floor.

## Summary

| List | Count |
| --- | ---: |
| hymns.json | 183 |
| songlists/pop-80s.json | 552 |
| songlists/pop-90s.json | 894 |
| songlists/pop-recent-25.json | 1900 |
| songlists/pop-00s.json | 1900 |
| songlists/pop-recent-15.json | 1874 |
| songlists/pop-all.json | 3346 |
| songlists/pop-cantonese.json | 1633 |
| songlists/pop-mandarin.json | 1713 |
| songlists/all-songlists.json | 3529 |
| songlists/all-cantonese.json | 1721 |
| songlists/all-mandarin.json | 1808 |

## Notes

- Cantonese / Mandarin classification uses existing language metadata first, then artist/channel/source rules.
- `00後流行曲` means the full 2000-and-after recent-pop pool previously shown as recent 25 years.
- `最近15年流行曲` is a narrower recent subset; explicit years are used when available from the original 2026-05-23 match CSV.
- Later bulk-added recent songs without reliable year metadata also carry `最近15年流行曲`; the CSV includes `eraConfidence` for manual review.
- Full per-song audit: `docs/SONGLIST_LANGUAGE_ERA_SPLIT_2026-06-12.csv`.
