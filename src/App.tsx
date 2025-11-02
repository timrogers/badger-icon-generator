import { useState, useRef } from 'react'
import './App.css'

type Pixel = string | null

function App() {
  const GRID_SIZE = 24
  const [grid, setGrid] = useState<Pixel[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  )
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [isDrawing, setIsDrawing] = useState(false)
  const [emoji, setEmoji] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handlePixelClick = (row: number, col: number) => {
    const newGrid = grid.map(r => [...r])
    newGrid[row][col] = selectedColor
    setGrid(newGrid)
  }

  const handlePixelEnter = (row: number, col: number) => {
    if (isDrawing) {
      const newGrid = grid.map(r => [...r])
      newGrid[row][col] = selectedColor
      setGrid(newGrid)
    }
  }

  const handleEmojiSubmit = () => {
    if (!emoji) return
    
    const canvas = document.createElement('canvas')
    canvas.width = GRID_SIZE
    canvas.height = GRID_SIZE
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE)
      ctx.font = `${GRID_SIZE - 2}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, GRID_SIZE / 2, GRID_SIZE / 2)
      
      const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE)
      const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
      
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const index = (row * GRID_SIZE + col) * 4
          const alpha = imageData.data[index + 3]
          if (alpha > 0) {
            const r = imageData.data[index]
            const g = imageData.data[index + 1]
            const b = imageData.data[index + 2]
            newGrid[row][col] = `rgb(${r}, ${g}, ${b})`
          }
        }
      }
      
      setGrid(newGrid)
    }
  }

  const handleClear = () => {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)))
  }

  const handleExportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE)
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const color = grid[row][col]
        if (color) {
          ctx.fillStyle = color
          ctx.fillRect(col, row, 1, 1)
        }
      }
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'icon.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  return (
    <div className="app">
      <h1>Badger Icon Generator</h1>
      <p className="subtitle">Create 24x24 pixel icons</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Emoji/Character:</label>
          <div className="emoji-input-group">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Enter emoji or character"
              maxLength={2}
            />
            <button onClick={handleEmojiSubmit}>Apply</button>
          </div>
        </div>
        
        <div className="control-group">
          <label>Draw Color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          />
        </div>
        
        <div className="control-group">
          <button onClick={handleClear}>Clear</button>
          <button onClick={handleExportPNG} className="export-btn">Export PNG</button>
        </div>
      </div>
      
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
                style={{ backgroundColor: pixel || 'transparent' }}
                onClick={() => handlePixelClick(rowIndex, colIndex)}
                onMouseEnter={() => handlePixelEnter(rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
      
      <canvas
        ref={canvasRef}
        width={GRID_SIZE}
        height={GRID_SIZE}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default App
