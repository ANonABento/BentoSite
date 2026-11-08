# Prologue: plan to ship (agreed 2026-10-31)

Launch waits on Kevin choosing a domain and host. Everything up to deployment is done on `crt-site`,
committed locally and **not pushed** (a push can trigger a Vercel preview).

1. **Model** (`lochara/blender/vroid_maid.py`, CC0 VRoid sample E):
   - fit the headdress to the hair and slim the joint rings;
   - give her a segmented robot right hand, after the FLUX reference;
   - add a handkerchief prop that can be shown and hidden;
   - compress to under about 3 MB and commit it as the default model.
2. **v6 choreography** (`index.html`, script in `PROLOGUE.md`): headdress tidy-up, handkerchief from the apron pocket,
   the real hand entering the frame as the reveal, the wipe and moody → cute flip, click, tuck, bow, dive.
3. **Sound:** opt-in effects synthesised with WebAudio (no audio files).
4. **Site port:**
   - a lazy client component on `/`, once per tab session;
   - skippable, and off for deep links and reduced motion;
   - hands off to the existing boot (`TrayFill`).
5. **Mobile:** a short recorded video of the desktop prologue in its place, then the normal boot.
6. **Checks:** `npm run lint && npm run type-check && npm run build`, desktop and mobile screenshots.

Afterwards: project polish (thumbnails, GIFs, sizing, new projects from Kevin's links and local files).

## Status (2026-10-31, overnight): everything up to deployment is done on `crt-site`, not pushed

Review checklist:
- [ ] `npm run dev`, open `/` in a fresh tab: the prologue plays, then the board boots. Skip, Esc and Enter
  skip it; `?noprologue` turns it off; same-tab reloads and `/?project=<id>` deep links don't play it.
- [ ] Phone (or DevTools device mode): the letterboxed recording plays, then the board.
- [ ] Sound: the SOUND button (bottom left) works; the effects are synthesised and untested by ear.
- [ ] Length: about 15 s to the board (8.5 s to the click, then the boot text and dive). If it's too long, the
  boot text after the click is the easiest place to cut.
- [ ] The model and choreography: tune in `prototypes/crt-site/index.html` (GUI, `?t=` scrubbing), then re-record the
  phone video with `record.mjs`.
- [ ] The new projects (WALDO, WreckLess) and the reworked heroes: check the wording and claims.
- [ ] Next.js reports a known security vulnerability in 16.4.0: upgrade before deploying.
