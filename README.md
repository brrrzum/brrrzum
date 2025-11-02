# Floating Diorama Viewer

Create a miniature, spatial feeling view for your floating diorama art. Drop in any image and orbit around it with smooth lighting and a gentle hover animation.

## Getting started

1. Open `index.html` in a modern browser (Chrome, Edge, Safari, Firefox). No build step is required.
2. Click **Choose a diorama image** and select your floating diorama artwork (PNG, JPG, or WebP work great).
3. Drag with your mouse or trackpad to orbit around the scene, scroll to zoom, and right-click to pan.

## Features

- Uses [three.js](https://threejs.org/) to create a lightweight 3D scene with orbital controls.
- Adds soft lighting, shadows, and a halo ring to accentuate the floating effect.
- Automatically rescales the frame to match your artwork’s aspect ratio.
- Works entirely offline—just open the HTML file locally.

## Development notes

All assets live at the repository root:

- `index.html` – markup and layout for the viewer.
- `styles.css` – glassmorphism-inspired styling and layout helpers.
- `src/app.js` – the three.js scene setup and interactivity.

Feel free to customize the lighting, camera positions, or animation speed directly in `src/app.js` to match your diorama’s mood.
