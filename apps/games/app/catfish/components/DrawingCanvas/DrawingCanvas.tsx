"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import "./DrawingCanvas.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tool = "pen" | "eraser";

type BrushSize = "S" | "M" | "L";

interface DrawingCanvasProps {
  /** Aspect ratio as a colon-separated string, e.g. "1:1", "16:9", "4:3" */
  aspectRatio?: string;
  /** Internal canvas width in pixels (height derived from aspect ratio). Default 800. */
  width?: number;
  /** Colour palette offered to the user. Defaults to a sensible set. */
  colors?: string[];
  /** Background colour of the canvas. Default white. */
  backgroundColor?: string;
  /** Called with the data-URL (PNG) when the user submits. */
  onSubmit?: (dataUrl: string) => void;
  /** Optional CSS class applied to the outermost wrapper. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_COLORS = [
  "#1a1a1a", // black
  "#e53e3e", // red
  "#2b6cb0", // blue
  "#38a169", // green
  "#d69e2e", // yellow/amber
  "#805ad5", // purple
  "#dd6b20", // orange
  "#e53e9c", // pink
];

const BRUSH_SIZES: Record<BrushSize, number> = {
  S: 3,
  M: 8,
  L: 16,
};

const MAX_HISTORY = 40;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Parse "W:H" → { w, h } numeric ratio components. */
function parseAspectRatio(ratio: string): { w: number; h: number } {
  const [wStr, hStr] = ratio.split(":");
  const w = Number(wStr);
  const h = Number(hStr);
  if (!w || !h || w <= 0 || h <= 0) {
    console.warn(`Invalid aspect ratio "${ratio}", falling back to 1:1`);
    return { w: 1, h: 1 };
  }
  return { w, h };
}

/** Get pointer position relative to canvas, scaled to internal resolution. */
function getPointerPos(
  e: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  internalWidth: number,
  internalHeight: number,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = internalWidth / rect.width;
  const scaleY = internalHeight / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DrawingCanvas({
  aspectRatio = "1:1",
  width: internalWidth = 800,
  colors = DEFAULT_COLORS,
  backgroundColor = "#ffffff",
  onSubmit,
  className = "",
}: DrawingCanvasProps) {
  /* Derived dimensions */
  const { w: ratioW, h: ratioH } = parseAspectRatio(aspectRatio);
  const internalHeight = Math.round(internalWidth * (ratioH / ratioW));

  /* Refs */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  /* State */
  const [activeColor, setActiveColor] = useState(colors[0] ?? "#1a1a1a");
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [brushSize, setBrushSize] = useState<BrushSize>("M");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Canvas initialisation                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with background colour
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, internalWidth, internalHeight);

    // Save initial state to history
    const initialState = ctx.getImageData(0, 0, internalWidth, internalHeight);
    setHistory([initialState]);
    setCanvasReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  History helpers                                                   */
  /* ---------------------------------------------------------------- */

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, internalWidth, internalHeight);
    setHistory((prev) => {
      const next = [...prev, state];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setRedoStack([]); // clear redo when new action happens
  }, [internalWidth, internalHeight]);

  const undo = useCallback(() => {
    if (history.length <= 1) return; // keep initial state
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = [...history];
    const current = newHistory.pop()!;
    setRedoStack((prev) => [...prev, current]);

    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
  }, [history]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newRedoStack = [...redoStack];
    const next = newRedoStack.pop()!;
    setRedoStack(newRedoStack);

    ctx.putImageData(next, 0, 0);
    setHistory((prev) => [...prev, next]);
  }, [redoStack]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, internalWidth, internalHeight);
    saveState();
  }, [backgroundColor, internalWidth, internalHeight, saveState]);

  /* ---------------------------------------------------------------- */
  /*  Drawing handlers                                                 */
  /* ---------------------------------------------------------------- */

  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture pointer so we get events even if pointer leaves canvas
      canvas.setPointerCapture(e.pointerId);

      isDrawing.current = true;
      const pos = getPointerPos(e, canvas, internalWidth, internalHeight);
      lastPos.current = pos;

      // Draw a single dot for taps/clicks
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = BRUSH_SIZES[brushSize];

      if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeTool === "eraser" ? "#000000" : activeColor;
      ctx.fill();
    },
    [internalWidth, internalHeight, brushSize, activeTool, activeColor],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas || !lastPos.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPointerPos(e, canvas, internalWidth, internalHeight);
      const size = BRUSH_SIZES[brushSize];

      if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.strokeStyle = activeTool === "eraser" ? "#000000" : activeColor;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPos.current = pos;
    },
    [internalWidth, internalHeight, brushSize, activeTool, activeColor],
  );

  const stopDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      lastPos.current = null;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.globalCompositeOperation = "source-over";
      }

      saveState();
    },
    [saveState],
  );

  /* ---------------------------------------------------------------- */
  /*  Export                                                            */
  /* ---------------------------------------------------------------- */

  const exportImage = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Flatten: draw background then current content onto temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = internalWidth;
    tempCanvas.height = internalHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;

    tempCtx.fillStyle = backgroundColor;
    tempCtx.fillRect(0, 0, internalWidth, internalHeight);
    tempCtx.drawImage(canvas, 0, 0);

    return tempCanvas.toDataURL("image/png");
  }, [backgroundColor, internalWidth, internalHeight]);

  const handleSubmit = useCallback(() => {
    const dataUrl = exportImage();
    if (dataUrl && onSubmit) onSubmit(dataUrl);
  }, [exportImage, onSubmit]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className={`drawing-canvas-root ${className}`}>
      <div className="drawing-canvas-body relative z-10">
        {/* Canvas area */}
        <div className="drawing-canvas-container">
          <div
            className="drawing-canvas-aspect-box"
            style={{ aspectRatio: `${ratioW} / ${ratioH}` }}
          >
            <canvas
              ref={canvasRef}
              width={internalWidth}
              height={internalHeight}
              className="drawing-canvas-element"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{ touchAction: "none" }}
            />
          </div>
        </div>

        {/* Toolbar (below canvas) */}
        <div className="drawing-canvas-toolbar">
          {/* Row 1: Colours | Pen/Eraser */}
          <div className="drawing-canvas-toolbar-row relative">
            <img
              src={"/images/catfish/backgrounds/drawing-tools-a-bg-mobile.png"}
              alt="Catfish Game Background"
              className="absolute top-1/2 left-1/2 w-[120%] sm:w-[95%] h-full -translate-x-1/2 -translate-y-1/2"
            />
            <div className="drawing-canvas-colors relative z-10">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`drawing-canvas-color-swatch ${activeColor === color && activeTool === "pen" ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setActiveColor(color);
                    setActiveTool("pen");
                  }}
                  aria-label={`Select colour ${color}`}
                  title={color}
                />
              ))}
            </div>

            <div className="drawing-canvas-divider-v relative z-10">
              <img
                src={
                  "/images/catfish/divider/drawing-canvas-divider-vertical.png"
                }
                alt="Divider"
                className="h-[60%] w-[5px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>

            <div className="drawing-canvas-tools relative z-10 p-3">
              <button
                className={`drawing-canvas-tool-btn ${activeTool === "pen" ? "active" : ""}`}
                onClick={() => setActiveTool("pen")}
                aria-label="Pen tool"
                title="Pen"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                className={`drawing-canvas-tool-btn ${activeTool === "eraser" ? "active" : ""}`}
                onClick={() => setActiveTool("eraser")}
                aria-label="Eraser tool"
                title="Eraser"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                  <path d="M22 21H7" />
                  <path d="m5 11 9 9" />
                </svg>
              </button>
            </div>
          </div>

          <div className="drawing-canvas-divider-h" />

          {/* Row 2: Brush sizes | Undo/Redo/Clear */}
          <div className="drawing-canvas-toolbar-row">
            <div className="drawing-canvas-sizes">
              {(["S", "M", "L"] as BrushSize[]).map((size) => (
                <button
                  key={size}
                  className={`drawing-canvas-size-btn ${brushSize === size ? "active" : ""}`}
                  onClick={() => setBrushSize(size)}
                  aria-label={`Brush size ${size}`}
                  title={`Size ${size}`}
                >
                  <span
                    className="drawing-canvas-size-dot"
                    style={{
                      width: size === "S" ? 6 : size === "M" ? 12 : 20,
                      height: size === "S" ? 6 : size === "M" ? 12 : 20,
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="drawing-canvas-divider-v" />

            <div className="drawing-canvas-actions">
              <button
                className="drawing-canvas-tool-btn"
                onClick={undo}
                disabled={history.length <= 1}
                aria-label="Undo"
                title="Undo"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
              <button
                className="drawing-canvas-tool-btn"
                onClick={redo}
                disabled={redoStack.length === 0}
                aria-label="Redo"
                title="Redo"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
              </button>
              <button
                className="drawing-canvas-tool-btn drawing-canvas-clear-btn"
                onClick={clearCanvas}
                aria-label="Clear canvas"
                title="Clear"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
