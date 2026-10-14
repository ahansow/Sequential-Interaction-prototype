# Sequential-Interaction-prototype
Codebase for my sequential interaction project in IXD 107-03, working with Claude Code. 

**Live site:** https://ahansow.github.io/Sequential-Interaction-prototype/

***

## Digital Darkroom — sequence prototype
One continuous interaction that makes a black-and-white print: **pick a photo → turn on the enlarger → focus → expose → develop → save / make another print.** One sheet of paper stays on screen the whole way, and each step's control appears only after the previous step succeeds.

- `docs/` — the published static site (`index.html`, `styles.css`, `app.js`, `.nojekyll`). No build step; open `docs/index.html` or serve the folder.
- **Behavior Controls** (step 2): a collapsible panel under the focus slider that live-edits its width, track thickness, center circle size and color, with *Reset to defaults* and *Copy as prompt*. Settings are remembered in the browser.
- `studies/` — the four original interaction studies (extracted from `digital-darkroom-studies.zip`) that the sequence is built from.

To publish: in the repository's **Settings → Pages**, set the source to **Deploy from a branch**, branch `main`, folder `/docs`.
