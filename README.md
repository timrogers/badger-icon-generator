# Badger Icon Generator

A lightweight React app for crafting 24×24 pixel icons. Start from an emoji seed, tweak every pixel
with a colour brush or eraser, and export the final art as a transparent PNG.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL and begin drawing. The grid supports pointer, mouse, and touch input.

## Key features

- 24×24 pixel canvas with adjustable on-screen zoom and optional grid guides.
- Emoji/character seeding: type or drag an emoji to instantly rasterise it onto the grid.
- Palette picker, custom colour input, and eraser toggle for precise editing.
- Live preview showing total painted pixels.
- Export to PNG with a configurable upscale multiplier while retaining transparency.

## Building for production

```bash
npm run build
npm run preview
```

`npm run build` outputs a static bundle to `dist/` that can be hosted on any static server.
