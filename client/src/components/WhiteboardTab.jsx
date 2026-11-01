import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function WhiteboardTab({ socket, roomId }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  // Draw a segment on canvas
  const drawSegment = useCallback((ctx, x0, y0, x1, y1, strokeColor, size) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
  }, []);

  const clearCanvasLocal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Socket listeners for live sync
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawSegment(
        ctx,
        stroke.x0,
        stroke.y0,
        stroke.x1,
        stroke.y1,
        stroke.color,
        stroke.size
      );
    };

    const handleClear = () => {
      clearCanvasLocal();
    };

    const handleWhiteboardState = (strokes) => {
      clearCanvasLocal();
      const canvas = canvasRef.current;
      if (!canvas || !strokes) return;
      const ctx = canvas.getContext('2d');
      strokes.forEach((stroke) => {
        drawSegment(
          ctx,
          stroke.x0,
          stroke.y0,
          stroke.x1,
          stroke.y1,
          stroke.color,
          stroke.size
        );
      });
    };

    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-clear', handleClear);
    socket.on('whiteboard-state', handleWhiteboardState);

    return () => {
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-clear', handleClear);
      socket.off('whiteboard-state', handleWhiteboardState);
    };
  }, [socket, drawSegment, clearCanvasLocal]);

  // Coordinate conversion helper
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    const { x, y } = getCanvasCoords(e);
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    if (e.type === 'touchmove') {
      e.preventDefault(); // prevent touch scroll while drawing
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    const x0 = lastPosRef.current.x;
    const y0 = lastPosRef.current.y;
    const x1 = x;
    const y1 = y;

    drawSegment(ctx, x0, y0, x1, y1, color, brushSize);

    if (socket) {
      socket.emit('whiteboard-draw', {
        roomId,
        stroke: { x0, y0, x1, y1, color, size: brushSize }
      });
    }

    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearClick = () => {
    clearCanvasLocal();
    if (socket) {
      socket.emit('whiteboard-clear', { roomId });
    }
  };

  return (
    <div className="whiteboard-tab">
      <div className="whiteboard-toolbar">
        <label className="toolbar-item">
          <span>Color:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
        </label>

        <label className="toolbar-item">
          <span>Brush:</span>
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="select"
          >
            <option value={2}>Fine (2px)</option>
            <option value={4}>Medium (4px)</option>
            <option value={8}>Thick (8px)</option>
            <option value={14}>Marker (14px)</option>
          </select>
        </label>

        <button className="btn btn-secondary btn-sm" onClick={handleClearClick}>
          🗑️ Clear
        </button>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}

