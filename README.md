# Badger Icon Generator

A React-based web application for creating 24x24 pixel icons.

## Features

- **24x24 Pixel Grid**: Interactive grid for pixel-perfect icon creation
- **Emoji/Character Input**: Start with an emoji or character that gets rasterized to the grid
- **Color Picker**: Choose any color for drawing
- **Direct Drawing**: Click or drag to draw pixels directly on the grid
- **PNG Export**: Export your icon as a 24x24 PNG with transparent background

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Linting

```bash
npm run lint
```

## Usage

1. **Start with an emoji**: Enter an emoji or character in the text field and click "Apply" to rasterize it to the grid
2. **Draw manually**: Select a color using the color picker and click on pixels to draw
3. **Drag to draw**: Hold down the mouse button and drag across pixels for continuous drawing
4. **Clear the grid**: Click "Clear" to reset the entire grid
5. **Export**: Click "Export PNG" to download your icon as a 24x24 PNG file with transparent background

## Technologies

- React 19
- TypeScript
- Vite
- CSS3
