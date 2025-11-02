# badger-icon-generator

A React application for generating 24x24 pixel icons with drawing and emoji rendering capabilities.

![Badger Icon Generator](https://github.com/user-attachments/assets/19c2c4e6-8eb8-4eab-85c5-3fba2f79f5e2)

## Features

- **24x24 Pixel Grid**: Interactive grid for creating icons
- **Color Picker**: Select any color for drawing
- **Emoji Rendering**: Convert emoji or characters to pixel art
- **Click and Drag Drawing**: Draw individual pixels or drag to paint
- **PNG Export**: Export icons with transparent background
- **Clear Grid**: Reset to start fresh

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Usage

### Drawing with Color

1. Select a color using the color picker
2. Click on individual pixels in the grid to draw
3. Or click and drag to draw multiple pixels

### Creating from Emoji

1. Enter an emoji or character (max 2 characters) in the input field
2. Click "Render to Grid" to convert it to pixel art

### Exporting

Click "Export to PNG" to download your icon as a 24x24 PNG file with a transparent background.

### Clearing

Click "Clear Grid" to reset all pixels and start over.

## Technologies

- React 19.1.1
- TypeScript
- Vite 7.1.12
- HTML5 Canvas API

## License

MIT
