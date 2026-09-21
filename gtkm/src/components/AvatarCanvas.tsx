import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, RotateCcw, Trash2, Check, Sparkles, Wand2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AvatarCanvasProps {
  initialAvatar?: string;
  onSave: (avatarDataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

const PALETTE_COLORS = [
  '#120e28', // Black / Dark Navy
  '#ffffff', // White
  '#ff007a', // Neon Pink / Party Magenta
  '#ff453a', // Red
  '#ff9f0a', // Orange
  '#ffd60a', // Bright Yellow
  '#30d158', // Lime Green
  '#00d2ff', // Cyan / Electric Blue
  '#5e5ce6', // Purple / Indigo
  '#bf5af2', // Lavender
  '#8d5524', // Skin tone 1
  '#e0ac69', // Skin tone 2
];

const BRUSH_SIZES = [
  { label: 'Fino', size: 4 },
  { label: 'Normal', size: 8 },
  { label: 'Grueso', size: 16 },
  { label: 'Brocha', size: 28 },
];

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  initialAvatar,
  onSave,
  onCancel,
  title = '¡Dibuja tu Avatar!',
  subtitle = 'Usa tu dedo o el mouse en el lienzo para crear tu personaje único'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#120e28');
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#fde047'); // Default vibrant yellow background
  const [history, setHistory] = useState<ImageData[]>([]);

  // Inicializar canvas y fondo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialAvatar) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveHistoryState();
      };
      img.src = initialAvatar;
    } else {
      // Fondo inicial predeterminado limpio
      resetCanvasWithBg(canvasBgColor);
    }
  }, []);

  const resetCanvasWithBg = (bgColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar un círculo suave central sugerido
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Borde suave
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.stroke();

    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory(prev => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : selectedColor;
    ctx.lineWidth = brushSize;

    // Pintar un punto inicial
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe fallback
      }
    }
    setIsDrawing(false);
    saveHistoryState();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    sounds.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    sounds.playClick();
    resetCanvasWithBg(canvasBgColor);
  };

  const handlePresetFace = (type: 'happy' | 'cool' | 'cat' | 'silly') => {
    sounds.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.strokeStyle = selectedColor === '#ffffff' ? '#120e28' : selectedColor;
    ctx.fillStyle = selectedColor === '#ffffff' ? '#120e28' : selectedColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (type === 'happy') {
      // Eyes
      ctx.beginPath();
      ctx.arc(cx - 35, cy - 20, 10, 0, Math.PI * 2);
      ctx.arc(cx + 35, cy - 20, 10, 0, Math.PI * 2);
      ctx.fill();
      // Big Smile
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 35, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
      // Cheeks
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.arc(cx - 55, cy + 15, 12, 0, Math.PI * 2);
      ctx.arc(cx + 55, cy + 15, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'cool') {
      // Glasses
      ctx.fillStyle = '#120e28';
      ctx.fillRect(cx - 65, cy - 35, 50, 30);
      ctx.fillRect(cx + 15, cy - 35, 50, 30);
      ctx.fillRect(cx - 15, cy - 25, 30, 8);
      // Smirk
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 30);
      ctx.quadraticCurveTo(cx + 25, cy + 45, cx + 45, cy + 25);
      ctx.stroke();
    } else if (type === 'cat') {
      // Cat ears
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 65);
      ctx.lineTo(cx - 30, cy - 105);
      ctx.lineTo(cx - 10, cy - 70);
      ctx.moveTo(cx + 10, cy - 70);
      ctx.lineTo(cx + 30, cy - 105);
      ctx.lineTo(cx + 50, cy - 65);
      ctx.stroke();
      // Whiskers
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy + 10);
      ctx.lineTo(cx - 75, cy + 5);
      ctx.moveTo(cx - 35, cy + 25);
      ctx.lineTo(cx - 75, cy + 30);
      ctx.moveTo(cx + 35, cy + 10);
      ctx.lineTo(cx + 75, cy + 5);
      ctx.moveTo(cx + 35, cy + 25);
      ctx.lineTo(cx + 75, cy + 30);
      ctx.stroke();
      // Nose & mouth
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'silly') {
      // Spiral eyes
      ctx.beginPath();
      ctx.arc(cx - 35, cy - 20, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 35, cy - 20, 10, 0, Math.PI * 2);
      ctx.fill();
      // Tongue out
      ctx.beginPath();
      ctx.arc(cx, cy + 15, 30, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
      ctx.fillStyle = '#ff2a6d';
      ctx.beginPath();
      ctx.arc(cx + 8, cy + 35, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    saveHistoryState();
  };

  const handleSave = () => {
    sounds.playSuccess();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#1b153b] border-2 border-[#ff007a]/40 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Title */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff007a]/20 text-[#ff70a6] text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Avatar Personalizado
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-purple-200/80 mt-1 max-w-md mx-auto">{subtitle}</p>
      </div>

      {/* Canvas Area with Playful Frame */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="relative p-3 bg-gradient-to-br from-[#ff007a] via-[#7928ca] to-[#00d2ff] rounded-3xl shadow-xl hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-all">
          <canvas
            id="avatar-drawing-canvas"
            ref={canvasRef}
            width={320}
            height={320}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-2xl bg-white cursor-crosshair touch-none shadow-inner border-4 border-[#120e28]"
          />
        </div>

        {/* Quick Face Presets / Helpers */}
        <div className="flex items-center gap-2 mt-3 text-xs text-purple-200">
          <span className="flex items-center gap-1 font-semibold text-amber-300">
            <Wand2 className="w-3.5 h-3.5" /> Plantillas rápidas:
          </span>
          <button
            type="button"
            onClick={() => handlePresetFace('happy')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition text-white"
          >
            😊 Feliz
          </button>
          <button
            type="button"
            onClick={() => handlePresetFace('cool')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition text-white"
          >
            😎 Cool
          </button>
          <button
            type="button"
            onClick={() => handlePresetFace('cat')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition text-white"
          >
            🐱 Michi
          </button>
          <button
            type="button"
            onClick={() => handlePresetFace('silly')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition text-white"
          >
            🤪 Loco
          </button>
        </div>
      </div>

      {/* Palette and Drawing Tools */}
      <div className="space-y-3 bg-[#120e28]/70 p-4 rounded-2xl border border-white/10 mt-3">
        {/* Color Swatches */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" /> Paleta de Colores
            </span>
            <span className="text-xs text-purple-300/70">
              {isEraser ? 'Borrador activo' : 'Color seleccionado'}
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {PALETTE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedColor(color);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: color }}
                className={`h-7 rounded-lg transition-transform active:scale-90 border-2 ${
                  !isEraser && selectedColor === color
                    ? 'border-white scale-110 shadow-[0_0_10px_white]'
                    : 'border-white/20 hover:scale-105'
                }`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Brush Size & Tool Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          {/* Sizes */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-purple-300 mr-1">Grosor:</span>
            {BRUSH_SIZES.map(b => (
              <button
                key={b.size}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setBrushSize(b.size);
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                  brushSize === b.size
                    ? 'bg-[#ff007a] text-white font-bold'
                    : 'bg-white/10 text-purple-200 hover:bg-white/20'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Action Buttons: Eraser, Undo, Clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsEraser(!isEraser);
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                isEraser
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
              title="Modo Borrador"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Borrar</span>
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-2 rounded-xl text-xs font-semibold bg-white/10 text-purple-200 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Deshacer trazo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
              title="Limpiar todo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3 mt-5">
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 font-bold transition text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          id="btn-save-avatar"
          type="button"
          onClick={handleSave}
          className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] hover:from-[#ff1a8c] hover:to-[#ff6a1a] text-white font-extrabold text-base shadow-[0_4px_20px_rgba(255,0,122,0.4)] active:scale-95 transition flex items-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" /> ¡Guardar mi Avatar!
        </button>
      </div>
    </div>
  );
};
