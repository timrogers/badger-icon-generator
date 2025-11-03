import { useState, useRef, useEffect } from 'react'
import './App.css'

const GRID_SIZE = 24;
const PIXEL_SIZE = 16;

function App() {
  const [pixels, setPixels] = useState(() => {
    // Initialize 24x24 grid with transparent pixels
    return Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ color: null }))
    );
  });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [emojiInput, setEmojiInput] = useState('');
  const canvasRef = useRef(null);

  // Handle drawing on the grid
  const handlePixelClick = (row, col) => {
    const newPixels = [...pixels];
    newPixels[row][col] = { color: selectedColor };
    setPixels(newPixels);
  };

  const handleMouseDown = (row, col) => {
    setIsDrawing(true);
    handlePixelClick(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (isDrawing) {
      handlePixelClick(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Clear the grid
  const clearGrid = () => {
    setPixels(Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ color: null }))
    ));
    setEmojiInput('');
  };

  // Render emoji/character to grid
  const renderCharacterToGrid = () => {
    if (!emojiInput) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    
    // Set font and draw character centered
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw at exact center
    const x = GRID_SIZE / 2;
    const y = GRID_SIZE / 2;
    
    ctx.fillText(emojiInput, x, y);
    
    // Get image data and convert to pixels
    const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const newPixels = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ color: null }))
    );
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const index = (row * GRID_SIZE + col) * 4;
        const alpha = imageData.data[index + 3];
        if (alpha > 0) {
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          newPixels[row][col] = { 
            color: `rgba(${r},${g},${b},${alpha / 255})` 
          };
        }
      }
    }
    
    setPixels(newPixels);
  };

  // Export to PNG with transparent background
  const exportToPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    
    // Draw each pixel
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const pixel = pixels[row][col];
        if (pixel.color) {
          ctx.fillStyle = pixel.color;
          ctx.fillRect(col, row, 1, 1);
        }
      }
    }
    
    // Download as PNG
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'icon-24x24.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  useEffect(() => {
    // Add global mouse up listener
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="app">
      <h1>24×24 Icon Generator</h1>
      
      <div className="container">
        <div className="controls">
          <div className="control-group">
            <label>Emoji/Character:</label>
            <div className="emoji-input-group">
              <input
                type="text"
                value={emojiInput}
                onChange={(e) => setEmojiInput(e.target.value)}
                placeholder="Enter emoji or character"
                maxLength={2}
              />
              <button onClick={renderCharacterToGrid}>Render</button>
            </div>
          </div>

          <div className="control-group">
            <label>Draw Color:</label>
            <div className="color-picker-group">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              />
              <span className="color-value">{selectedColor}</span>
            </div>
          </div>

          <div className="control-group">
            <button onClick={clearGrid} className="clear-btn">Clear Grid</button>
            <button onClick={exportToPNG} className="export-btn">Export PNG</button>
          </div>
        </div>

        <div className="grid-container">
          <div 
            className="grid"
            onMouseLeave={handleMouseUp}
          >
            {pixels.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {row.map((pixel, colIndex) => (
                  <div
                    key={colIndex}
                    className="pixel"
                    style={{
                      backgroundColor: pixel.color || 'transparent',
                      width: PIXEL_SIZE,
                      height: PIXEL_SIZE,
                    }}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default App
