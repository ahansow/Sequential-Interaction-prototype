# Study 04 — Develop

Digital Darkroom, step 4 of 4. Source artifact: https://claude.ai/artifact/MmzTLXmby87pMRacDwCCbU

## What the study does
The user drags the exposed paper into the developer tray. The tray rocks while the image appears as a negative and turns into a grainy black-and-white positive over 9 seconds. The print then lifts out, glides to center, scales up, gets a light sheen, and can be saved as a JPEG.

## Main visual and interactive components
- **Header** — "Step 4 of 4", chips (first three done, Develop current), title "Develop", hint.
- **Paper** (`div#paper`, focusable `role="button"`) — cream paper card with `canvas#print` (film-grain positive) and a "Drag me" label. The canvas starts invisible and inverted.
- **Developer tray** (`div#tray`) — dashed drop zone; red border when the paper is over it (`.ready`); solid and darker once filled (`.active`).
- **Develop progress bar** (`#dev-bar-wrap` / `#dev-fill`) + status text (`#dev-text`).
- **Lamp glow** (`#lamp`) — dim (.35), rises to full on reveal.
- **Done panel** — title, subtitle, **Save photograph** button (`#save`), save status (`#save-note`), "Try again".
- **"Use your own photo"** + drag-and-drop.

## User actions, feedback, states, transitions
| State | Trigger | Feedback |
|---|---|---|
| `waiting` | load / Try again | Paper beside the tray; hint "Drag the paper into the developer tray." |
| `dragging` | `pointerdown` on paper, then `pointermove` | Paper follows the pointer, scales to 1.04, `grabbing` cursor; tray highlights when the paper's center is inside it |
| missed drop | release outside tray | Paper springs back to origin (.35s) |
| `placed` | release with center inside tray, or Enter/Space on focused paper | Paper snaps to tray center (.45s); "Drag me" hides; tray turns active |
| `developing` | 500 ms after placing | Bar fills linearly over 9s; `develop` keyframes: invisible → faint negative → positive; tray and paper rock together (`agitate`, slower with reduced motion); at 800 ms a sharper 1800px print is swapped in silently |
| `reveal` | 9.3s after develop start | Tray fades out; bench grows; lamp rises; paper animates up, across, and scales to fit (3s, 0.5s with reduced motion) with deepening shadow; page scrolls the print into view if needed; sheen sweep near the end |
| `done` | reveal end + 250 ms | "Photograph developed — Your print is ready."; Save button shown |
| saving | Save clicked | Status "Preparing the print…"; renders a 2400px-long-edge grainy JPEG (q 0.92) named `digital-darkroom-print.jpg` |
| reset | Try again / new photo | Cancels animations, clears classes and transforms |

## Where it is implemented (`index.html`)
- Lines 4–178: shared CSS (paper, `develop`/`sheen`/`agitate` keyframes, tray).
- Lines 184–213: markup; bench with paper + tray at 194, `#ctl-4` at 202, `#done` with Save at 206.
- Lines 216–581: script IIFE. Shared pipeline (`drawScene` 229, `grainify`, `setPhoto` 327 — which writes the grained positive to `#print`, `handleFile` 343), then:
  - `STEP = 4` (380), `DEVELOP_MS = 9000`
  - Drag: `applyMove`, `centerInTray`, pointer and keyboard handlers, `endDrag`, `dropInTray`
  - `startDeveloping`, `upgradePrint`, `reveal` (Web Animations API)
  - Save: `renderFinal`, `buildPrint`, save click handler
  - `restart` (556)

## Dependencies and assets
- None to install; single self-contained HTML file, vanilla JS, Web Animations API.
- IBM Plex Mono from Google Fonts (system monospace fallback).
- Saving: inside Claude the page uses the `window.claude.use('downloads')` capability. Outside Claude (local, GitHub Pages, etc.) that object doesn't exist, so it falls back to a normal browser download via an `<a download>` link. No change needed to run it standalone.
- Sample photo is procedural; user photos load locally.
