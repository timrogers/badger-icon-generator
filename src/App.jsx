import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const GRID_SIZE = 24;
const DEFAULT_COLOR = '#2563eb';

const createEmptyGrid = () =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));

const hexToRgba = (hex) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, a: 255 };
};

const rgbaToCss = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;

const colorsMatch = (a, b) =>
  a?.r === b?.r && a?.g === b?.g && a?.b === b?.b && a?.a === b?.a;

function App() {
  const [pixels, setPixels] = useState(createEmptyGrid);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [activeTool, setActiveTool] = useState('brush');
  const [emojiInput, setEmojiInput] = useState('');
  const isDrawing = useRef(false);

  useEffect(() => {
    const stopDrawing = () => {
      isDrawing.current = false;
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

  const paintPixel = (rowIdx, colIdx, color) => {
    setPixels((prev) => {
      const existing = prev[rowIdx][colIdx];
      if (colorsMatch(existing, color)) {
        return prev;
      }

      const next = prev.slice();
      const updatedRow = prev[rowIdx].slice();
      updatedRow[colIdx] = color ? { ...color } : null;
      next[rowIdx] = updatedRow;
      return next;
    });
  };

  const handlePointerDown = (event, row, col) => {
    event.preventDefault();
    isDrawing.current = true;
    const color = activeTool === 'brush' ? hexToRgba(currentColor) : null;
    paintPixel(row, col, color);
  };

  const handlePointerEnter = (event, row, col) => {
    if (event.buttons === 0 && !isDrawing.current) {
      return;
    }
    if (!isDrawing.current) {
      return;
    }
    const color = activeTool === 'brush' ? hexToRgba(currentColor) : null;
    paintPixel(row, col, color);
  };

  const handlePointerMove = (event, row, col) => {
    if (!isDrawing.current || event.buttons === 0) {
      return;
    }
    const color = activeTool === 'brush' ? hexToRgba(currentColor) : null;
    paintPixel(row, col, color);
  };

  const handleClear = () => {
    setPixels(createEmptyGrid());
    isDrawing.current = false;
  };

  const handleEmojiApply = () => {
    const emoji = emojiInput.trim();
    if (!emoji) {
      return;
    }

    const [firstGlyph] = Array.from(emoji);
    if (!firstGlyph) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.font = `${GRID_SIZE * 0.9}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const metrics = ctx.measureText(firstGlyph);
    const left = metrics.actualBoundingBoxLeft ?? 0;
    const right = metrics.actualBoundingBoxRight ?? metrics.width ?? 0;
    const ascent = metrics.actualBoundingBoxAscent ?? GRID_SIZE / 2;
    const descent = metrics.actualBoundingBoxDescent ?? 0;
    const width = left + right || metrics.width || GRID_SIZE;
    const height = ascent + descent || GRID_SIZE;
    const drawX = Math.round((GRID_SIZE - width) / 2 + left);
    const drawY = Math.round((GRID_SIZE - height) / 2 + ascent);

    ctx.fillText(firstGlyph, drawX, drawY);

    const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const nextPixels = createEmptyGrid();

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = (y * GRID_SIZE + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        nextPixels[y][x] = a > 0 ? { r, g, b, a } : null;
      }
    }

    setPixels(nextPixels);
  };

  const handleExport = () => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

    pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel) {
          ctx.fillStyle = rgbaToCss(pixel);
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });

    const link = document.createElement('a');
    link.download = 'icon-24.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const previewUrl = useMemo(() => {
    if (typeof document === 'undefined') {
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

    pixels.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel) {
          ctx.fillStyle = rgbaToCss(pixel);
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });

    return canvas.toDataURL();
  }, [pixels]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Badger Icon Generator</h1>
        <p>Create crisp 24×24 icons starting from an emoji or by painting pixel art.</p>
      </header>

      <main className="app-main">
        <section className="toolbar">
          <div className="field-group">
            <label className="field-label" htmlFor="emoji-input">
              Start from emoji or character
            </label>
            <div className="emoji-controls">
              <input
                id="emoji-input"
                type="text"
                maxLength={8}
                placeholder="😀"
                value={emojiInput}
                onChange={(event) => setEmojiInput(event.target.value)}
              />
              <button type="button" onClick={handleEmojiApply} className="primary">
                Apply
              </button>
            </div>
          </div>

          <div className="field-group">
            <span className="field-label">Brush colour</span>
            <div className="color-row">
              <input
                type="color"
                value={currentColor}
                onChange={(event) => setCurrentColor(event.target.value)}
                aria-label="Pick brush colour"
              />
              <button
                type="button"
                className={activeTool === 'brush' ? 'tool active' : 'tool'}
                onClick={() => setActiveTool('brush')}
              >
                Brush
              </button>
              <button
                type="button"
                className={activeTool === 'eraser' ? 'tool active' : 'tool'}
                onClick={() => setActiveTool('eraser')}
              >
                Eraser
              </button>
            </div>
          </div>

          <div className="toolbar-actions">
            <button type="button" onClick={handleClear} className="secondary">
              Clear grid
            </button>
            <button type="button" onClick={handleExport} className="primary">
              Export PNG
            </button>
          </div>
        </section>

        <section className="workspace">
          <div className="pixel-canvas" role="application" aria-label="24 by 24 icon editor">
            {pixels.map((row, rowIdx) => (
              <div className="pixel-row" key={`row-${rowIdx}`}>
                {row.map((pixel, colIdx) => (
                  <button
                    key={`pixel-${rowIdx}-${colIdx}`}
                    type="button"
                    className="pixel"
                    aria-label={`Pixel row ${rowIdx + 1}, column ${colIdx + 1}`}
                    style={{ backgroundColor: pixel ? rgbaToCss(pixel) : 'transparent' }}
                    onPointerDown={(event) => handlePointerDown(event, rowIdx, colIdx)}
                    onPointerEnter={(event) => handlePointerEnter(event, rowIdx, colIdx)}
                    onPointerMove={(event) => handlePointerMove(event, rowIdx, colIdx)}
                  />
                ))}
              </div>
            ))}
          </div>

          <aside className="preview">
            <h2>Live preview</h2>
            <div className="preview-card">
              <img src={previewUrl} alt="Icon preview" width={GRID_SIZE * 4} height={GRID_SIZE * 4} />
              <p>Scaled ×4 for visibility</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
