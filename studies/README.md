# Digital Darkroom — Interaction Studies

Four standalone interaction studies, one per step of making a black-and-white print in a darkroom. Each folder holds an unmodified export of its published artifact (`index.html`) plus a `STUDY.md`.

| # | Folder | Interaction | Completes when |
|---|---|---|---|
| 1 | `01-enlarger/` | Tap a toggle switch | Switch is on (+1.3s) |
| 2 | `02-focus/` | Drag a slider, press Lock | Slider within 69–75 and locked (+1.1s) |
| 3 | `03-expose/` | Press and hold a bulb for 5s total | Exposure reaches 100% (+0.9s) |
| 4 | `04-develop/` | Drag paper into a tray, wait 9s | Print revealed; optional JPEG save |

## Running
No build step and nothing to install. Any of these works:

- Open a study's `index.html` directly in a browser.
- Serve the folder (recommended, avoids file:// quirks): `npx serve .` or `python3 -m http.server 8000`, then open `/01-enlarger/` etc.
- `npm start` runs `npx serve .` (see `package.json`).

Requirements: a modern browser (Chrome, Safari, Firefox, Edge) with Canvas 2D, Pointer Events, Web Animations API and CSS `translate`/`rotate` properties. Internet is only needed for the IBM Plex Mono web font; without it the pages fall back to system monospace.

## Shared foundation (identical in all four files)
- **CSS** (lines 4–178): design tokens on `:root` (`--bg`, `--ink`, `--dim`, `--safe` red, `--glow`, `--paper`, `--tray`, `--mono`) and styles for every step's components, so each file already carries the full system.
- **Markup frame**: `#lamp` and `#flood` overlays, `#app` > top bar (brand + "Use your own photo") > header (`#dots` progress chips, `#stepname`, `#stephint`) > `.bench` > `.controls` (one `#ctl-N` group + `#done`).
- **Photo pipeline**: `drawScene` (procedural sample photo), `toGray`, `fromImage`, `grainify`, `copyCanvas`, `setPhoto`, `handleFile`, file input + page-wide drag-and-drop.
- **Step helpers**: `later`/`clearTimers` (tracked timeouts), `setDots(complete)` (chip states from `STEP`), `showDone(title, sub)`.
- Each study differs only in: brand text, `#dots` current step, header copy, bench contents, its `#ctl-N` group, the `STEP` constant and the step-specific script block after it, and its `restart()`.

## Notes for building the connected prototype
- **Entry states already chain.** Each study's `restart()` sets up the visual state the previous step leaves behind:
  - Step 2 starts with the lamp on and the negative at `brightness(.6)`.
  - Step 3 starts sharp (`blur(0)`).
  - Step 4 starts with the lamp at .35 and the paper ready.
  These are the seams to join on.
- **Exit points.** Every step ends by calling `showDone(...)`. That is the natural place to emit a "step complete" event or advance to the next step instead of showing the per-step "Try again".
- **Shared photo.** The selected photo lives in `exportSrc` and is drawn by `setPhoto`. In a single page, call `setPhoto` once and keep both `#photo` (steps 1–3) and `#print` (step 4).
- **De-duplication.** The CSS, photo pipeline and helpers can be lifted into shared modules unchanged; only the per-step blocks need to become step controllers with `enter()` / `reset()`.
- **Unused leftovers.** CSS for `#intro`, `#err`, `#dropnote`, `#back` and `#ctl-5` is present, but no matching elements exist. These are remnants of a load screen and back button from the original combined version. They are harmless; reuse or delete them.
- **Save in step 4.** This uses Claude's `downloads` capability when hosted on claude.ai and a plain browser download elsewhere. No changes are needed for GitHub Pages or local use.

## Sources
- 01 Enlarger — https://claude.ai/artifact/UTEyDuWNmdSgK3xsNrEyhC
- 02 Focus — https://claude.ai/artifact/6mjSrotBYme8Qa4iKPeMLg
- 03 Expose — https://claude.ai/artifact/5FbwGPy6nQQanqYQWgL4Y2
- 04 Develop — https://claude.ai/artifact/MmzTLXmby87pMRacDwCCbU
