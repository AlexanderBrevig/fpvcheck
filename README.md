# FPV-sjekk

NLF **Vedlegg H** (sjekkliste for FPV uten utkikksperson) as an offline-first PWA. No build step, no backend, no accounts — everything lives in the phone's `localStorage`.

## Run

```sh
./serve.sh          # http://localhost:8080
```

Phone over USB (keeps the secure-context features — GPS, service worker, install):

```sh
adb reverse tcp:8080 tcp:8080   # then open http://localhost:8080 in Chrome on the phone
```

A LAN IP (`http://192.168.x.x:8080`) loads, but Chrome blocks GPS and offline mode on plain http — use the hosted version instead.

## Hosted

GitHub Pages from `main` (root): https://alexanderbrevig.github.io/fpvcheck/ — push to `main` to deploy (remember to bump `VERSION` in `sw.js`).

## What it does

- **Profile gate** — NLF membership unlocks solo mode; non-members get spotter mode only. M-FPV status shown, with the pending theory-test notice.
- **Solo checklist** — the 10 Vedlegg H items verbatim in Norwegian (English translation when the UI is English). Any NEI → "Ikke tillatt solo her" + spotter rule + one tap to switch.
- **Context per item** — nearest airport distance from GPS/site coords (red < 5 km), nearby airfields/heliports for #2, quad weight vs 1 kg for #8, failsafe/strobe from the quad profile for #9/#10, Naturbase/NSM links for #6.
- **Spotter mode** — short reminder list derived from §3.6.2 / §3.4.3 (our own, not an official form).
- **Log** — every saved check with GPS, nearest airport, quad snapshot and rule versions. Printable sheet laid out like the paper form. "Neste pakke" adds pack timestamps to today's check. JSON export.
- **Share** — pick quads/sites → link (`#/import/<base64url>`). The recipient gets a copy; nothing syncs.

## Files

| | |
|---|---|
| `rules.js` | All rule text + source URLs + versions. **The only file to touch when NLF revises the handbook.** |
| `i18n.js` | UI strings nb/en |
| `app.js` | State, routing (`#/…`), views, actions |
| `data/airports.json` | Norwegian airports/airfields/heliports from OurAirports (public domain), fetched 2026-10-14 |
| `rules/` | Snapshot of the source PDFs + verbatim excerpts (`rules/README.md`) |
| `sw.js` | Network-first service worker; bump `VERSION` when shell files change |

## Known limits

- Controlled airspace (CTR) isn't modelled — the app links to Avinor/NinoxDrone2 instead.
- Airport list is a static snapshot; distance hints are guidance, not clearance.
- Unofficial aid. The pilot is responsible for following current rules.
