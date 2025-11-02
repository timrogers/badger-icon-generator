import { useState, useRef } from 'react';
import './IconGenerator.css';

const GRID_SIZE = 24;

interface Pixel {
  color: string;
}

function IconGenerator() {
  const [grid, setGrid] = useState<Pixel[][]>(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ color: 'transparent' }))
      )
  );
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle drawing on the grid
  const handlePixelClick = (row: number, col: number) => {
    const newGrid = grid.map((r, rowIndex) =>
      r.map((pixel, colIndex) =>
        rowIndex === row && colIndex === col
          ? { color: selectedColor }
          : pixel
      )
    );
    setGrid(newGrid);
  };

  const handlePixelEnter = (row: number, col: number) => {
    if (isDrawing) {
      handlePixelClick(row, col);
    }
  };

  // Clear the grid
  const clearGrid = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() =>
          Array(GRID_SIZE)
            .fill(null)
            .map(() => ({ color: 'transparent' }))
        )
    );
  };

  // Render emoji/character to grid
  const renderEmojiToGrid = () => {
    if (!emojiInput || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Set canvas size
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;

    // Draw emoji
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${GRID_SIZE * 0.8}px Arial`;
    ctx.fillText(emojiInput, GRID_SIZE / 2, GRID_SIZE / 2);

    // Read pixel data
    const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ color: 'transparent' }))
      );

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const index = (row * GRID_SIZE + col) * 4;
        const alpha = imageData.data[index + 3];

        if (alpha > 0) {
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          newGrid[row][col] = {
            color: `rgb(${r}, ${g}, ${b})`,
          };
        }
      }
    }

    setGrid(newGrid);
  };

  // Export to PNG
  const exportToPNG = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = GRID_SIZE;
    exportCanvas.height = GRID_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw the grid to the canvas
    grid.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel.color !== 'transparent') {
          ctx.fillStyle = pixel.color;
          ctx.fillRect(colIndex, rowIndex, 1, 1);
        }
      });
    });

    // Export as PNG
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="icon-generator">
      <h1>Badger Icon Generator</h1>
      <p>Generate 24x24 pixel icons</p>

      <div className="controls">
        <div className="control-group">
          <label>
            Color:
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            />
            <span className="color-value">{selectedColor}</span>
          </label>
        </div>

        <div className="control-group">
          <label>
            Emoji/Character:
            <input
              type="text"
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value)}
              placeholder="Enter emoji or character"
              maxLength={2}
            />
          </label>
          <button onClick={renderEmojiToGrid}>Render to Grid</button>
        </div>

        <div className="button-group">
          <button onClick={clearGrid}>Clear Grid</button>
          <button onClick={exportToPNG} className="export-button">
            Export to PNG
          </button>
        </div>
      </div>

      <div className="grid-container">
        <div
          className="grid"
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        >
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map((pixel, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="pixel"
                  style={{
                    backgroundColor: pixel.color,
                  }}
                  onClick={() => handlePixelClick(rowIndex, colIndex)}
                  onMouseEnter={() => handlePixelEnter(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden canvas for emoji rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default IconGenerator;
