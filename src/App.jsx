import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const GRID_SIZE = 24;

const starterPalette = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#d946ef',
  '#fb7185',
  '#a16207',
  '#2dd4bf',
];

const createEmptyGrid = () =>
  Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));

const cloneGrid = (grid) => grid.map((row) => [...row]);

const rgbaString = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 100) / 100})`;

function App() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [activeColor, setActiveColor] = useState('#0ea5e9');
  const [emojiText, setEmojiText] = useState('🐾');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushMode, setBrushMode] = useState('draw');
  const [showGuides, setShowGuides] = useState(true);
  const [pixelSize, setPixelSize] = useState(22);
  const [exportScale, setExportScale] = useState(24);
  const gridRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const pointerButtonRef = useRef('left');

  useEffect(() => {
    const stopDrawing = () => {
      setIsDrawing(false);
      pointerButtonRef.current = 'left';
    };
    window.addEventListener('pointerup', stopDrawing);
    window.addEventListener('pointercancel', stopDrawing);
    return () => {
      window.removeEventListener('pointerup', stopDrawing);
      window.removeEventListener('pointercancel', stopDrawing);
    };
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.setProperty('--cell-size', `${pixelSize}px`);
  }, [pixelSize]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });
    });
  }, [grid]);

  const paintedPixels = useMemo(
    () => grid.reduce((acc, row) => acc + row.filter(Boolean).length, 0),
    [grid],
  );

  const applyColor = (row, col, color) => {
    setGrid((prev) => {
      if (prev[row][col] === color) return prev;
      const next = cloneGrid(prev);
      next[row][col] = color;
      return next;
    });
  };

  const handleCellAction = (row, col, pointerType = 'left') => {
    if (pointerType === 'right' || brushMode === 'erase') {
      applyColor(row, col, null);
    } else {
      applyColor(row, col, activeColor);
    }
  };

  const handlePointerDown = (event, row, col) => {
    event.preventDefault();
    const pointerType = event.button === 2 ? 'right' : 'left';
    pointerButtonRef.current = pointerType;
    handleCellAction(row, col, pointerType);
    setIsDrawing(true);
  };

  const handlePointerEnter = (event, row, col) => {
    if (!isDrawing) return;
    const pointerType = pointerButtonRef.current;
    handleCellAction(row, col, pointerType);
  };

  const handlePointerMove = (event, row, col) => {
    if (!isDrawing) return;
    event.preventDefault();
    const pointerType = pointerButtonRef.current;
    handleCellAction(row, col, pointerType);
  };

  const stampGlyph = (glyph) => {
    if (!glyph) return;

    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = GRID_SIZE * 0.94;
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.save();
    ctx.translate(GRID_SIZE / 2, GRID_SIZE / 2);
    ctx.fillText(glyph, 0, 0);
    ctx.restore();

    const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const next = createEmptyGrid();
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const index = (y * GRID_SIZE + x) * 4;
        const alpha = data[index + 3];
        if (alpha === 0) continue;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        next[y][x] = rgbaString(r, g, b, alpha);
      }
    }
    setGrid(next);
  };

  const handleEmojiSeed = (event) => {
    event.preventDefault();
    const glyph = Array.from(emojiText.trim())[0];
    stampGlyph(glyph);
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
  };

  const handleExport = () => {
    const scale = Math.max(1, Math.floor(exportScale));
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE * scale;
    canvas.height = GRID_SIZE * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'badger-icon.png';
    link.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain') || event.dataTransfer.getData('text');
    if (!data) return;
    setEmojiText(data);
    const glyph = Array.from(data.trim())[0];
    stampGlyph(glyph);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="app">
      <header>
        <h1>Badger Icon Generator</h1>
        <p className="subtitle">
          Paint crisp 24 × 24 pixel icons starting from an emoji or sketching freehand. Export your
          masterpiece as a transparent PNG in one click.
        </p>
      </header>

      <div className="workspace">
        <section className="canvas-panel">
          <div
            className="grid-wrapper"
            onContextMenu={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div
              ref={gridRef}
              className={`pixel-grid ${showGuides ? 'guides' : ''}`}
            >
              {grid.map((row, rowIndex) =>
                row.map((color, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="grid-cell"
                    style={{ backgroundColor: color || 'transparent' }}
                    onPointerDown={(event) => handlePointerDown(event, rowIndex, colIndex)}
                    onPointerEnter={(event) => handlePointerEnter(event, rowIndex, colIndex)}
                    onPointerMove={(event) => handlePointerMove(event, rowIndex, colIndex)}
                  />
                )),
              )}
            </div>
          </div>
          <div className="preview">
            <canvas
              width={GRID_SIZE}
              height={GRID_SIZE}
              style={{ width: 120, height: 120, imageRendering: 'pixelated' }}
              ref={previewCanvasRef}
            />
            <small>{paintedPixels} / {GRID_SIZE * GRID_SIZE} pixels used</small>
          </div>
        </section>

        <aside className="tools-panel">
          <div className="panel-section">
            <h2 className="section-title">Brush</h2>
            <div className="color-swatch-row">
              {starterPalette.map((hex) => (
                <button
                  key={hex}
                  className={`color-swatch ${activeColor === hex ? 'active' : ''}`}
                  style={{ background: hex }}
                  onClick={() => {
                    setBrushMode('draw');
                    setActiveColor(hex);
                  }}
                  aria-label={`Use color ${hex}`}
                  type="button"
                >
                  {activeColor === hex ? '✓' : ''}
                </button>
              ))}
            </div>
            <div className="color-picker">
              <label htmlFor="color-input">Custom</label>
              <input
                id="color-input"
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(activeColor) ? activeColor : '#000000'}
                onChange={(event) => {
                  setBrushMode('draw');
                  setActiveColor(event.target.value);
                }}
              />
              <button
                className={`button secondary ${brushMode === 'erase' ? 'active' : ''}`}
                onClick={() => setBrushMode((mode) => (mode === 'erase' ? 'draw' : 'erase'))}
                type="button"
              >
                {brushMode === 'erase' ? 'Eraser on' : 'Use eraser'}
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h2 className="section-title">Emoji kickstart</h2>
            <form className="emoji-input" onSubmit={handleEmojiSeed}>
              <input
                type="text"
                maxLength={3}
                value={emojiText}
                onChange={(event) => setEmojiText(event.target.value)}
                aria-label="Emoji or character"
              />
              <button className="button" type="submit">
                Stamp emoji
              </button>
            </form>
            <small>Tip: drag &amp; drop an emoji from another window straight onto the canvas.</small>
          </div>

          <div className="panel-section">
            <h2 className="section-title">Canvas options</h2>
            <div className="slider-control">
              <label htmlFor="zoom-range">Zoom</label>
              <input
                id="zoom-range"
                type="range"
                min="14"
                max="36"
                value={pixelSize}
                onChange={(event) => setPixelSize(Number(event.target.value))}
              />
            </div>
            <div className="slider-control">
              <label htmlFor="export-scale">Export scale ({exportScale}×)</label>
              <input
                id="export-scale"
                type="range"
                min="1"
                max="48"
                value={exportScale}
                onChange={(event) => setExportScale(Number(event.target.value))}
              />
            </div>
            <div className="controls-row">
              <button className="button secondary" type="button" onClick={() => setShowGuides((value) => !value)}>
                {showGuides ? 'Hide grid' : 'Show grid'}
              </button>
              <button className="button secondary" type="button" onClick={handleClear}>
                Clear
              </button>
              <button className="button" type="button" onClick={handleExport}>
                Export PNG
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
