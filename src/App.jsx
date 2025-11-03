import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const GRID_SIZE = 24;

const createEmptyPixels = () => Array(GRID_SIZE * GRID_SIZE).fill(null);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeHex = (value) => {
  if (!value) return '#000000';
  let hex = value.toLowerCase();
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex.slice(0, 7).padEnd(7, '0');
};

const hexToRgba = (hex) => {
  const normalized = normalizeHex(hex);
  const value = normalized.replace('#', '');
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, a: 1 };
};

const rgbaToCss = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${clamp(a, 0, 1).toFixed(3)})`;

function App() {
  const [pixels, setPixels] = useState(createEmptyPixels);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [emojiInput, setEmojiInput] = useState('');
  const [tool, setTool] = useState('paint');
  const drawingRef = useRef(false);
  const previewRef = useRef(null);
  const exportCanvasRef = useRef(null);

  const paintColor = useMemo(() => rgbaToCss(hexToRgba(selectedColor)), [selectedColor]);

  const setPixel = useCallback((index, value) => {
    setPixels((prev) => {
      if (prev[index] === value) return prev;
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (index, event) => {
      event.preventDefault();
      drawingRef.current = true;
      const value = tool === 'paint' ? paintColor : null;
      setPixel(index, value);
    },
    [paintColor, setPixel, tool]
  );

  const handlePointerEnter = useCallback(
    (index) => {
      if (!drawingRef.current) return;
      const value = tool === 'paint' ? paintColor : null;
      setPixel(index, value);
    },
    [paintColor, setPixel, tool]
  );

  useEffect(() => {
    const stopDrawing = () => {
      drawingRef.current = false;
    };

    window.addEventListener('pointerup', stopDrawing);
    window.addEventListener('pointercancel', stopDrawing);
    window.addEventListener('blur', stopDrawing);

    return () => {
      window.removeEventListener('pointerup', stopDrawing);
      window.removeEventListener('pointercancel', stopDrawing);
      window.removeEventListener('blur', stopDrawing);
    };
  }, []);

  const seedWithEmoji = useCallback(() => {
    const glyph = emojiInput.trim();
    if (!glyph) return;

    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `${GRID_SIZE * 0.92}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', system-ui, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.fillText(glyph[0], GRID_SIZE / 2, GRID_SIZE / 2 + 1);

    const image = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const nextPixels = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
      const offset = idx * 4;
      const r = image.data[offset];
      const g = image.data[offset + 1];
      const b = image.data[offset + 2];
      const a = image.data[offset + 3] / 255;
      return a > 0 ? rgbaToCss({ r, g, b, a }) : null;
    });

    setPixels(nextPixels);
  }, [emojiInput]);

  const clearCanvas = useCallback(() => {
    setPixels(createEmptyPixels());
  }, []);

  const exportAsPng = useCallback(() => {
    const canvas = exportCanvasRef.current ?? document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    pixels.forEach((pixel, index) => {
      if (!pixel) return;
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);
      ctx.fillStyle = pixel;
      ctx.fillRect(x, y, 1, 1);
    });

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'icon-24x24.png';
    link.href = url;
    link.click();
  }, [pixels]);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    pixels.forEach((pixel, index) => {
      if (!pixel) return;
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);
      ctx.fillStyle = pixel;
      ctx.fillRect(x, y, 1, 1);
    });
  }, [pixels]);

  const filledPixels = useMemo(() => pixels.filter(Boolean).length, [pixels]);

  return (
    <div className="app">
      <header>
        <h1>Badger Icon Generator</h1>
        <p>
          Craft crisp 24×24 pixel icons from scratch or kick-start the grid with your
          favourite emoji. Paint with custom colours, erase with ease, and export
          production-ready PNGs with transparent backgrounds.
        </p>
      </header>

      <div className="controls">
        <div className="seed-row">
          <label htmlFor="emoji-input">Seed with emoji or character</label>
          <input
            id="emoji-input"
            type="text"
            maxLength={2}
            value={emojiInput}
            onChange={(event) => setEmojiInput(event.target.value)}
            placeholder="😀"
          />
          <button type="button" onClick={seedWithEmoji} disabled={!emojiInput.trim()}>
            Apply seed
          </button>
          <button type="button" onClick={clearCanvas} className="secondary">
            Clear
          </button>
        </div>

        <div className="color-picker">
          <label htmlFor="color-input">Paint colour</label>
          <input
            id="color-input"
            type="color"
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.target.value)}
          />
          <span>{selectedColor.toUpperCase()}</span>
        </div>

        <div className="tool-row">
          <span>Tool</span>
          <button
            type="button"
            className={tool === 'paint' ? 'active' : ''}
            onClick={() => setTool('paint')}
          >
            Paint
          </button>
          <button
            type="button"
            className={tool === 'erase' ? 'active' : ''}
            onClick={() => setTool('erase')}
          >
            Erase
          </button>
        </div>

        <div className="actions-row">
          <button type="button" onClick={exportAsPng} disabled={!filledPixels}>
            Export PNG
          </button>
          <span>{filledPixels} pixel{filledPixels === 1 ? '' : 's'} filled</span>
        </div>
      </div>

      <div
        className="canvas-wrapper"
        onPointerLeave={() => {
          drawingRef.current = false;
        }}
      >
        {pixels.map((pixel, index) => (
          <div
            key={index}
            className="pixel"
            style={{ backgroundColor: pixel ?? 'transparent' }}
            onPointerDown={(event) => handlePointerDown(index, event)}
            onPointerEnter={() => handlePointerEnter(index)}
            role="presentation"
          />
        ))}
      </div>

      <div className="preview">
        <canvas ref={previewRef} style={{ width: 240, height: 240 }} />
        <div className="preview-details">
          <h2 style={{ margin: 0, color: '#0f172a' }}>Live Preview</h2>
          <p>
            The canvas always renders at 24×24 pixels. The enlarged preview keeps pixels
            crisp so you can inspect your icon before exporting it.
          </p>
          <p>
            Downloaded PNGs preserve transparency and scale beautifully thanks to
            nearest-neighbour interpolation.
          </p>
        </div>
      </div>

      <canvas ref={exportCanvasRef} style={{ display: 'none' }} width={GRID_SIZE} height={GRID_SIZE} />
    </div>
  );
}

export default App;
