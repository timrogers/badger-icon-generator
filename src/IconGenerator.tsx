import { useState, useRef } from 'react';
import './IconGenerator.css';

const GRID_SIZE = 24;

interface Pixel {
  color: string;
}

// Helper function to create an empty grid
const createEmptyGrid = (): Pixel[][] => {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(GRID_SIZE)
        .fill(null)
        .map(() => ({ color: 'transparent' }))
    );
};

function IconGenerator() {
  const [grid, setGrid] = useState<Pixel[][]>(() => createEmptyGrid());
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle drawing on the grid
  const handlePixelClick = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = { color: selectedColor };
    setGrid(newGrid);
  };

  const handlePixelEnter = (row: number, col: number) => {
    if (isDrawing) {
      handlePixelClick(row, col);
    }
  };

  // Clear the grid
  const clearGrid = () => {
    setGrid(createEmptyGrid());
  };

  // Render emoji/character to grid
  const renderEmojiToGrid = () => {
    if (!emojiInput || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a larger canvas for better emoji rendering quality, then scale down
    const scale = 4;
    const renderSize = GRID_SIZE * scale;

    // Set canvas size to larger scale
    canvas.width = renderSize;
    canvas.height = renderSize;

    // Clear canvas
    ctx.clearRect(0, 0, renderSize, renderSize);

    // Draw emoji at larger size with proper centering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Use system emoji font and make it slightly larger to fill more of the space
    ctx.font = `${renderSize * 0.875}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
    ctx.fillText(emojiInput, renderSize / 2, renderSize / 2);

    // Read pixel data from the high-res canvas
    const imageData = ctx.getImageData(0, 0, renderSize, renderSize);
    const newGrid = createEmptyGrid();

    // Downsample to 24x24 by averaging pixels in each grid cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        let r = 0, g = 0, b = 0, count = 0;

        // Average pixels in this grid cell
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const srcRow = row * scale + dy;
            const srcCol = col * scale + dx;
            const index = (srcRow * renderSize + srcCol) * 4;
            
            const pixelAlpha = imageData.data[index + 3];
            if (pixelAlpha > 0) {
              r += imageData.data[index];
              g += imageData.data[index + 1];
              b += imageData.data[index + 2];
              count++;
            }
          }
        }

        // Set pixel if it has any content
        if (count > 0) {
          newGrid[row][col] = {
            color: `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`,
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
