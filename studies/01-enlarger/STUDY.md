# Study 01 — Enlarger

Digital Darkroom, step 1 of 4. Source artifact: https://claude.ai/artifact/UTEyDuWNmdSgK3xsNrEyhC

## What the study does
The user switches on the enlarger. The dark, blurred negative on the easel lights up under a warm safelight glow, and the step ends in a "done" state ready to hand off to Focus.

## Main visual and interactive components
- **Header** — brand line ("Step 1 of 4"), progress chips (Enlarger / Focus / Expose / Develop), step title and hint.
- **Easel** (`#easel` > `canvas#photo`) — the negative of the photo. Starts at `blur(16px) brightness(.16)`.
- **Lamp glow** (`#lamp`) — fixed full-screen radial gradient behind the app; fades in over 1.4s.
- **Toggle switch** (`button#lamp-switch`, `role="switch"`) — square track and knob with an OFF/ON label. Knob turns red when on.
- **Done panel** (`#done`) — title, subtitle and "Try again" link.
- **"Use your own photo"** (`#choose`) — file picker; drag-and-drop anywhere on the page also works.

## User actions, feedback, states, transitions
| State | Trigger | Feedback |
|---|---|---|
| `idle` (switch OFF) | page load / Try again | Negative dark and blurred; Enlarger chip is "current"; hint "Tap the switch." |
| `on` | click/tap/Enter/Space on switch | `aria-checked="true"`, label ON, knob slides right and turns red; `#lamp` fades to opacity 1; negative brightens to `brightness(.6)` (still blurred) via a .9s filter transition |
| `done` | 1300 ms after switching on | Controls hide; header and done panel read "Enlarger on — The negative is lit and waiting to be focused."; the chip shows as done; panel fades in |
| reset | "Try again" or loading a new photo | All of the above reverts; scrolls to top |

The switch is one-way: clicking it again while on does nothing.

## Where it is implemented (`index.html`)
- Lines 4–178: CSS (shared across all four studies; design tokens on `:root` at the top).
- Lines 184–213: markup (`#app`, header at 189, bench at 194, controls at 199, `#ctl-1` at 200, `#done` at 207).
- Lines 216–406: script, an IIFE:
  - `rng`, `drawScene` (from 229): seeded procedural sample photo (sun, mountain ridges, birds, pine tree, cabin, grain, vignette).
  - `toGray`, `fromImage`: user photo → grayscale canvas, aspect clamped to 0.75–1.6.
  - `grainify`, `copyCanvas`: film grain (used by the print in step 4; inert here).
  - `setPhoto` (327): draws the inverted negative into `#photo`, sets `--ar` for layout.
  - `handleFile` (343) + file input / drag-drop listeners.
  - Shared step helpers: `later`, `clearTimers`, `setDots`, `showDone`.
  - `STEP = 1` (380), switch click handler, `restart` (390).

## Dependencies and assets
- None to install. Single self-contained HTML file; vanilla JS, no framework.
- Font: IBM Plex Mono from Google Fonts (falls back to the system monospace offline).
- Image: none. The sample photo is drawn procedurally on a canvas; users can load their own.
