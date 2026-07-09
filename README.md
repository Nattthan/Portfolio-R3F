# Natthan | R3F Portfolio

A 3D portfolio built as a small construction site: the page opens on an `UNDER CONSTRUCTION` scene where a crane and a bulldozer help place the final letters, then become interactive controls inside the scene.

The goal is simple: make a recruiter-facing portfolio that feels playful and technical without turning into a gimmick. Most of the experience lives in WebGL, but the important controls and links stay readable through regular DOM UI.

## What is in the scene

- A construction-site environment built with React Three Fiber and Three.js.
- Dynamic `UNDER CONSTRUCTION` letters backed by Rapier rigid bodies.
- A crane with a rope joint, hook, grab/release behavior, and manual keyboard control.
- A bulldozer with keyboard driving and physical interaction with the scene.
- Intro sequences that place the missing letters before handing control to the user.
- Clickable in-scene signs for the CV and portfolio link.
- A loading screen, control overlay, tuned shadows, bloom, and shader-based floor treatment.
- Optional Umami analytics for interaction events.

## Controls

After the intro finishes, click the crane or bulldozer cursor prompt to take control.

### Crane

- `Left / Right arrows`: rotate the crane
- `Up / Down arrows`: raise or lower the hook
- `A`: grab
- `D`: release

### Bulldozer

- `Up / Down arrows`: move forward or backward
- `Left / Right arrows`: turn

## Tech Stack

- React 19
- Vite
- Three.js
- React Three Fiber
- Drei
- React Three Rapier
- Postprocessing
- GLSL shaders
- Oxlint

## Running Locally

This project expects Node 22.

```bash
npm install
npm run dev
```

The dev server is provided by Vite. The app is usually available at:

```text
http://localhost:5173/
```

Build the production bundle with:

```bash
npm run build
```

Run the linter with:

```bash
npm run lint
```

Preview the production build with:

```bash
npm run preview
```

## Analytics

Analytics are optional. If the Umami variables are not present, the app runs normally without loading the script.

Create a local `.env` from `.env.example`:

```bash
VITE_UMAMI_SCRIPT_SRC=https://your-umami-domain.com/script.js
VITE_UMAMI_WEBSITE_ID=your-umami-website-id
```

Tracked interactions include scene control clicks, first keyboard use for the crane or bulldozer, and clicks on the CV / portfolio signs.

## Project Structure

```text
src/
  App.jsx                         Canvas setup, overlays, analytics loader
  Experience.jsx                  Main scene composition and interaction state
  components/
    Crane.jsx                     Crane model, rope joint, hook physics, controls
    Bulldozer.jsx                 Bulldozer model, driving behavior, controls
    ConstructionAssets.jsx        Site props and anchored/dynamic GLB assets
    ClickableSign.jsx             In-scene link signs
    ControlsOverlay.jsx           DOM keyboard instructions
    Floor.jsx                     Floor shader, shadow catcher, physics bounds
    LoadingScreen.jsx             Asset loading UI
    letters/                      Text3D rigid letters and layout data
    intro/                        Crane and bulldozer intro sequences
    effects/                      Postprocessing
  shaders/                        Floor and exhaust GLSL
public/
  models/                         GLB scene assets
  fonts/                          Text3D / sign fonts
  CV/                             Public CV file
docs/
  week-1-project-plan.md          Original MVP plan
  Blender/                        Source Blender files
```

## Notes

This started as a week-one MVP for a creative developer portfolio. The finished direction is intentionally narrow: one strong scene, a few physical interactions, and direct links to the important material instead of a large multi-page site.

Some implementation choices are practical rather than flashy:

- DOM overlays are kept outside the R3F canvas so instructions stay readable and easy to style.
- Physics is used where it adds something visible: letters, hook behavior, bulldozer contact, and scene boundaries.
- Visual cost is kept under control with reduced DPR, tuned shadows, shared letter materials, and a small postprocessing pass.

## License

Personal portfolio project. Code and assets are not currently published under an open-source license.
