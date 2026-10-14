# Study 03 — Expose

Digital Darkroom, step 3 of 4. Source artifact: https://claude.ai/artifact/5FbwGPy6nQQanqYQWgL4Y2

## What the study does
The user presses and holds a light-bulb button to expose the paper. Exposure accumulates only while held and takes 5 seconds total. Letting go pauses it; holding again resumes.

## Main visual and interactive components
- **Header** — "Step 3 of 4", chips (Enlarger, Focus done; Expose current), title "Expose", hint.
- **Easel** (`canvas#photo`) — sharp negative (`blur(0)`); brightness rises from .6 to 1.35 as exposure builds.
- **Lamp glow** (`#lamp`) on; **light flood** (`#flood`) — fixed warm overlay whose opacity tracks exposure while held (0.06 → 0.30).
- **Bulb button** (`button#bulb`) — round hold target with:
  - a dashed SVG track ring and a red progress ring (`#bulb-prog`, `stroke-dashoffset` 1 → 0),
  - a bulb icon that fills and glows (`.bulb.on`) while held.
- **Countdown readout** (`#exp-read`) — "5.0 s" counting down to "0.0 s".
- **Done panel**, **"Use your own photo"** + drag-and-drop.

## User actions, feedback, states, transitions
| State | Trigger | Feedback |
|---|---|---|
| `ready` | load / Try again | Ring empty, "5.0 s", hint "Press and hold the light bulb…" |
| `holding` | `pointerdown` (with pointer capture) or Space/Enter keydown | Bulb glows; flood lights the room; rAF loop advances progress (`dt` capped at 0.1s); ring fills, countdown falls, negative brightens; hint "Keep holding. The paper is being exposed." |
| `paused` | `pointerup` / `pointercancel` / lost capture / key up / button blur / window blur | Glow and flood go out; progress is kept; hint "The light went out. Hold the bulb again to keep exposing." |
| `exposed` | progress reaches 1 | Bulb disables; readout "0.0 s"; flood fades over .6s |
| `done` | 900 ms later | Controls hide; "Paper exposed — The image is now on the paper, waiting for the developer." |
| reset | Try again / new photo | Progress 0, rAF cancelled |

Context menu is suppressed on the bulb so long-press works on touch devices.

## Where it is implemented (`index.html`)
- Lines 4–178: shared CSS (bulb styles under "Hold-to-expose light bulb").
- Lines 184–220: markup; `#ctl-3` with inline SVG ring + icon at 200, `#done` at 214.
- Lines 223–462: script IIFE. Shared pipeline (`drawScene` 236, `setPhoto` 334, `handleFile` 350), then:
  - `STEP = 3` (387), `EXPOSE_S = 5`, `paintExposure`, `tick` (rAF), `startHold`, `stopHold`, pointer/keyboard/blur listeners, `finishExpose`, `restart` (442).

## Dependencies and assets
- None to install; single self-contained HTML file, vanilla JS, inline SVG.
- IBM Plex Mono from Google Fonts (system monospace fallback).
- Sample photo is procedural; user photos load locally.
