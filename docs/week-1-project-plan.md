# Week 1 GitHub Project Plan

## Project

**Name:** Portfolio R3F - Week 1 MVP

**Board columns:**

- Backlog
- Ready
- In Progress
- Review
- Done

**Labels:**

- design
- r3f
- physics
- content
- performance
- deployment
- polish

**Milestone:**

- Week 1 MVP

## Hero Direction

The homepage starts on a stylized construction site.

The word `UNDER CONSTRUCTION` is visible as large physical letters:

- Most letters are already placed.
- One missing letter is carried into place by a crane.
- One missing letter is pushed into place by a bulldozer.
- After the final placement, the scene reveals the portfolio navigation.

The scene should feel premium and intentional, not chaotic. The animation must be skippable and respect reduced motion.

## Project Display Direction

Use construction billboards for the first version.

Each project appears as a billboard in or near the site. Selecting a billboard focuses the camera and opens a clean UI panel with:

- Project title
- Short role/context
- Tech stack
- One strong image or video
- GitHub link
- Live demo link
- Case study notes when available

This keeps the portfolio visual while staying readable for recruiters.

## Issues

### 1. Bootstrap Vite React Three Fiber app

**Labels:** r3f

Create the technical base for the portfolio.

Acceptance criteria:

- Vite + React + TypeScript app is installed.
- `@react-three/fiber`, `@react-three/drei`, and `@react-three/rapier` are available.
- App runs locally with `npm run dev`.
- Initial folder structure is clean and ready for components, scenes, data, and styles.

### 2. Create base construction site scene

**Labels:** r3f, design

Build the first visual pass of the construction environment.

Acceptance criteria:

- Ground plane, camera, lights, and shadows are configured.
- Placeholder crane, bulldozer, and letter blocks exist.
- Scene composition frames `UNDER CONSTRUCTION` clearly.
- Desktop and mobile camera framing are considered.

### 3. Implement UNDER CONSTRUCTION letter layout

**Labels:** r3f, design

Place the full `UNDER CONSTRUCTION` word group as physical 3D text or block letters.

Acceptance criteria:

- Most letters start already placed.
- One crane-delivered letter has a clear empty target slot.
- One bulldozer-pushed letter has a clear empty target slot.
- Letter spacing is readable from the default camera.

### 4. Animate crane letter delivery

**Labels:** r3f, physics, polish

Make the crane bring one letter into the word.

Acceptance criteria:

- Crane hook/cable movement reads clearly.
- The carried letter follows the crane motion.
- The letter settles into its target position.
- Animation timing feels deliberate and premium.

### 5. Animate bulldozer letter push

**Labels:** r3f, physics, polish

Make the bulldozer push another letter into the word.

Acceptance criteria:

- Bulldozer motion is readable from the camera.
- The pushed letter moves into its target position.
- The final placement aligns cleanly with the word.
- Motion uses either physics or physics-inspired animation.

### 6. Add physics pass for letters and site props

**Labels:** physics, r3f

Add controlled physical behavior without making the scene messy.

Acceptance criteria:

- Rapier world is configured.
- At least the moving letters use colliders or physics bodies.
- Settling behavior is stable and repeatable.
- Physics does not create layout-breaking randomness.

### 7. Add portfolio navigation reveal

**Labels:** r3f, polish

Reveal navigation after the construction animation completes.

Acceptance criteria:

- Navigation appears after the final letter placement.
- Users can skip the intro.
- Reduced-motion users see the completed state immediately.
- Navigation includes Projects, About, Skills, Contact, and CV.

### 8. Build project billboard system

**Labels:** r3f, content

Create the first project display mechanism.

Acceptance criteria:

- Projects are defined in structured data.
- Each project renders as a billboard or construction sign.
- Selecting a project opens a readable detail panel.
- Detail panel supports image/video, links, stack, and summary.

### 9. Write recruiter-focused content

**Labels:** content

Prepare the first version of the portfolio copy.

Acceptance criteria:

- Short intro mentions junior Creative Developer focus in Europe.
- Education mentions Polytech Dijon.
- Timeline mentions internship ending in August and availability from September/October.
- Project descriptions explain role, constraints, and outcomes.

### 10. Add responsive and accessibility basics

**Labels:** polish, performance

Make the portfolio usable beyond the ideal desktop screen.

Acceptance criteria:

- Mobile layout has a usable fallback or adjusted camera.
- Keyboard users can access project details and links.
- Important text exists in HTML, not only in WebGL.
- Reduced motion is respected.

### 11. Optimize performance

**Labels:** performance

Keep the experience smooth and recruiter-friendly.

Acceptance criteria:

- Assets are compressed or procedurally lightweight.
- Loading state exists.
- No unnecessary expensive shadows or geometries.
- Build size and frame rate are checked before launch.

### 12. Deploy MVP

**Labels:** deployment

Publish the first version.

Acceptance criteria:

- Site is deployed to Vercel, Netlify, or GitHub Pages.
- Production build succeeds.
- README includes live URL.
- Final smoke test is done on desktop and mobile viewport.
