# Study 02 — Focus

Digital Darkroom, step 2 of 4. Source artifact: https://claude.ai/artifact/6mjSrotBYme8Qa4iKPeMLg

## What the study does
With the enlarger already on, the user drags a focus slider until the projected negative is sharp, then locks focus. Locking only succeeds when the image is actually sharp.

## Main visual and interactive components
- **Header** — "Step 2 of 4", progress chips (Enlarger shown done, Focus current), title "Focus the image", hint.
- **Easel** (`canvas#photo`) — the negative at `brightness(.6)`; blur is driven live by the slider.
- **Lamp glow** (`#lamp`) — on from the start (continuity from step 1).
- **Focus slider** (`input#focus`, range 0–100, starts at 8).
- **Lock focus** button (`#lock-focus`) and a status line (`#focus-state`).
- **Done panel** (`#done`), **"Use your own photo"** (`#choose`) + drag-and-drop.

## User actions, feedback, states, transitions
- Sharp target: `TARGET = 72`, tolerance `TOL = 3` (values 69–75 are sharp).
- Blur mapping (`focusBlur`): 0px inside tolerance; otherwise `min(16, 0.6 + (distance − 3) × 0.45)` px.

| State | Trigger | Feedback |
|---|---|---|
| `adjusting` | page load / Try again | Slider at 8, image heavily blurred |
| dragging | slider `input` | Blur updates with an 80 ms filter transition; status line clears |
| rejected lock | Lock pressed while blur > 0 | Status: "Not sharp yet. Keep adjusting, then lock again." |
| `locked` | Lock pressed while sharp | Slider and button disable; status "Focus locked." |
| `done` | 1100 ms after lock | Controls hide; "Focus locked — The negative is sharp and ready to be exposed."; chip done |
| reset | Try again / new photo | Back to slider 8, controls enabled |

## Where it is implemented (`index.html`)
- Lines 4–178: shared CSS (slider styles under `input[type=range]`, `.btn`, `#focus-state`).
- Lines 184–212: markup; `#ctl-2` at 200, `#done` at 206.
- Lines 215–414: script IIFE. Shared photo pipeline (`drawScene` 228, `setPhoto` 326, `handleFile` 342) and step helpers, then:
  - `STEP = 2` (379), `TARGET`/`TOL`, `focusBlur`, slider `input` handler, lock click handler, `restart` (397).

## Dependencies and assets
- None to install; single self-contained HTML file, vanilla JS.
- IBM Plex Mono from Google Fonts (system monospace fallback).
- Sample photo is procedural; user photos load locally via file picker or drop.
