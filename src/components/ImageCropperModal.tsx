import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Crop, X, Check, RefreshCw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string; // Base64 or URL
  onClose: () => void;
  onCrop: (croppedBase64: string) => void;
  title?: string;
  initialAspectRatio?: 'free' | '1:1' | '4:3' | '16:9';
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
  title = "Potong & Sesuaikan Gambar",
  initialAspectRatio = "free"
}: ImageCropperModalProps) {
  if (!isOpen || !imageSrc) return null;

  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>(initialAspectRatio);
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  
  // Crop window in percentages (0-100) of the visible image bounds
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 1, naturalHeight: 1 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Dragging state
  const dragInfo = useRef<{
    active: boolean;
    action: 'move' | 'tl' | 'tr' | 'bl' | 'br' | null;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
  }>({
    active: false,
    action: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 10, y: 10, w: 80, h: 80 }
  });

  // Calculate visible image size inside its object-contain frame
  const updateVisibleImageSize = () => {
    const img = imageRef.current;
    if (!img) return;

    // The actual layout bounds of the <img> element
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Since object-contain is used, let's find the exact bounding box of the rendered image pixels
    const containerRatio = rect.width / rect.height;
    // Account for rotation
    const isRotated90 = rotation % 180 !== 0;
    const effNaturalWidth = isRotated90 ? naturalHeight : naturalWidth;
    const effNaturalHeight = isRotated90 ? naturalWidth : naturalHeight;
    const imageRatio = effNaturalWidth / effNaturalHeight;

    let visibleWidth = rect.width;
    let visibleHeight = rect.height;

    if (imageRatio > containerRatio) {
      // Bounded by width
      visibleHeight = rect.width / imageRatio;
    } else {
      // Bounded by height
      visibleWidth = rect.height * imageRatio;
    }

    setImageSize({
      width: visibleWidth,
      height: visibleHeight,
      naturalWidth,
      naturalHeight
    });
  };

  // Trigger recalculation on load, rotate, or ratio change
  useEffect(() => {
    updateVisibleImageSize();
  }, [imageSrc, rotation]);

  // Adjust crop box automatically when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'free') return;

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (aspectRatio === '16:9') targetRatio = 16 / 9;

    // To preserve aspect ratio in percentage crop:
    // cropW_percent / cropH_percent = targetRatio / (imageSize.width / imageSize.height)
    const imgRatio = imageSize.width && imageSize.height ? (imageSize.width / imageSize.height) : 1;
    const neededWPercentToHPercent = targetRatio / imgRatio;

    let newW = 70;
    let newH = 70 / neededWPercentToHPercent;

    if (newH > 80) {
      newH = 80;
      newW = 80 * neededWPercentToHPercent;
    }

    if (newW > 80) {
      newW = 80;
      newH = 80 / neededWPercentToHPercent;
    }

    const newX = (100 - newW) / 2;
    const newY = (100 - newH) / 2;

    setCrop({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      w: Math.min(100, newW),
      h: Math.min(100, newH)
    });
  }, [aspectRatio, imageSize.width, imageSize.height]);

  // Handle Drag Start (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, action: 'move' | 'tl' | 'tr' | 'bl' | 'br') => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragInfo.current = {
      active: true,
      action,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop }
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  // Handle Drag Move
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragInfo.current.active) return;
    
    // Prevent scrolling on mobile while dragging
    if (e.cancelable) {
      e.preventDefault();
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;

    // Convert pixel delta to percentage delta based on the calculated visible image size
    const dxPercent = (dx / (imageSize.width || 1)) * 100;
    const dyPercent = (dy / (imageSize.height || 1)) * 100;

    const start = dragInfo.current.startCrop;
    const action = dragInfo.current.action;

    let nextCrop = { ...crop };

    if (action === 'move') {
      nextCrop.x = Math.max(0, Math.min(100 - start.w, start.x + dxPercent));
      nextCrop.y = Math.max(0, Math.min(100 - start.h, start.y + dyPercent));
    } else {
      const minSize = 10; // min 10% crop area

      if (aspectRatio === 'free') {
        if (action === 'tl') {
          const right = start.x + start.w;
          const bottom = start.y + start.h;
          nextCrop.x = Math.max(0, Math.min(right - minSize, start.x + dxPercent));
          nextCrop.w = right - nextCrop.x;
          
          nextCrop.y = Math.max(0, Math.min(bottom - minSize, start.y + dyPercent));
          nextCrop.h = bottom - nextCrop.y;
        } else if (action === 'tr') {
          const bottom = start.y + start.h;
          nextCrop.w = Math.max(minSize, Math.min(100 - start.x, start.w + dxPercent));
          
          nextCrop.y = Math.max(0, Math.min(bottom - minSize, start.y + dyPercent));
          nextCrop.h = bottom - nextCrop.y;
        } else if (action === 'bl') {
          const right = start.x + start.w;
          nextCrop.x = Math.max(0, Math.min(right - minSize, start.x + dxPercent));
          nextCrop.w = right - nextCrop.x;
          
          nextCrop.h = Math.max(minSize, Math.min(100 - start.y, start.h + dyPercent));
        } else if (action === 'br') {
          nextCrop.w = Math.max(minSize, Math.min(100 - start.x, start.w + dxPercent));
          nextCrop.h = Math.max(minSize, Math.min(100 - start.y, start.h + dyPercent));
        }
      } else {
        // Locked aspect ratio resize
        let ratioVal = 1;
        if (aspectRatio === '1:1') ratioVal = 1;
        else if (aspectRatio === '4:3') ratioVal = 4 / 3;
        else if (aspectRatio === '16:9') ratioVal = 16 / 9;

        const imgRatio = imageSize.width / imageSize.height;
        const wToHPercentRatio = ratioVal / imgRatio;

        if (action === 'br' || action === 'tr') {
          const newW = Math.max(minSize, Math.min(100 - start.x, start.w + dxPercent));
          const newH = newW / wToHPercentRatio;
          
          if (start.y + newH <= 100) {
            nextCrop.w = newW;
            nextCrop.h = newH;
          }
        } else if (action === 'bl' || action === 'tl') {
          const right = start.x + start.w;
          const newX = Math.max(0, Math.min(right - minSize, start.x + dxPercent));
          const newW = right - newX;
          const newH = newW / wToHPercentRatio;
          
          if (start.y + newH <= 100) {
            nextCrop.x = newX;
            nextCrop.w = newW;
            nextCrop.h = newH;
          }
        }
      }
    }

    setCrop(nextCrop);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    dragInfo.current.active = false;
    dragInfo.current.action = null;
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };

  // Rotate image clockwise by 90 degrees
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Reset all adjustments
  const handleReset = () => {
    setRotation(0);
    setCrop({ x: 10, y: 10, w: 80, h: 80 });
    setAspectRatio(initialAspectRatio);
  };

  // Execute Canvas Cropping and yield base64
  const handleCropSave = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Source image dimensions
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // Check if orientation swaps dimensions
    const isRotated90 = rotation % 180 !== 0;

    // Calculate crop rectangle in source image pixel space
    // First, let's understand how crop percentages map to rotated image coordinates
    let cropXPix = 0;
    let cropYPix = 0;
    let cropWPix = 0;
    let cropHPix = 0;

    if (!isRotated90) {
      cropXPix = (crop.x / 100) * nw;
      cropYPix = (crop.y / 100) * nh;
      cropWPix = (crop.w / 100) * nw;
      cropHPix = (crop.h / 100) * nh;
    } else {
      // Swapped natural sizes for visible projection
      cropXPix = (crop.x / 100) * nh;
      cropYPix = (crop.y / 100) * nw;
      cropWPix = (crop.w / 100) * nh;
      cropHPix = (crop.h / 100) * nw;
    }

    // Set canvas dimensions to the target cropped size
    canvas.width = cropWPix;
    canvas.height = cropHPix;

    // Enable high quality drawing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Now, we must draw the original image onto canvas with translation and rotation,
    // and clip/position it such that the cropped area is drawn correctly.
    ctx.save();

    // Move the coordinate system center to align with rotation
    if (rotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -cropYPix, -(nw - (cropXPix + cropWPix)), nh, nw);
    } else if (rotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
      ctx.drawImage(img, -(nw - (cropXPix + cropWPix)), -(nh - (cropYPix + cropHPix)), nw, nh);
    } else if (rotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
      ctx.drawImage(img, -(nh - (cropYPix + cropHPix)), -cropXPix, nh, nw);
    } else {
      // 0 degrees rotation
      ctx.drawImage(img, cropXPix, cropYPix, cropWPix, cropHPix, 0, 0, cropWPix, cropHPix);
    }

    ctx.restore();

    // Compress resulting crop to optimized jpeg base64
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Crop className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{title}</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Sesuaikan rotasi & bidang gambar agar rapi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Workspace */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative p-6 select-none overflow-hidden min-h-[300px]">
          <div 
            ref={containerRef}
            className="relative max-w-full max-h-[50vh] flex items-center justify-center"
            style={{ width: '100%', height: '100%' }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source"
              onLoad={updateVisibleImageSize}
              className="max-w-full max-h-[50vh] object-contain transition-transform duration-200 pointer-events-none"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                opacity: imageSize.width ? 1 : 0 
              }}
              referrerPolicy="no-referrer"
            />

            {/* Overlays and Cropper bounds (only show after dimensions are evaluated) */}
            {imageSize.width > 0 && (
              <div 
                className="absolute"
                style={{
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                  top: `calc(50% - ${imageSize.height / 2}px)`,
                  left: `calc(50% - ${imageSize.width / 2}px)`,
                }}
              >
                {/* 4 dark scrim boundary divs surrounding the crop box */}
                <div 
                  className="absolute bg-black/60 backdrop-blur-[1px] transition-all top-0 left-0 right-0"
                  style={{ height: `${crop.y}%` }}
                />
                <div 
                  className="absolute bg-black/60 backdrop-blur-[1px] transition-all bottom-0 left-0 right-0"
                  style={{ top: `${crop.y + crop.h}%` }}
                />
                <div 
                  className="absolute bg-black/60 backdrop-blur-[1px] transition-all left-0"
                  style={{ 
                    top: `${crop.y}%`, 
                    bottom: `${100 - (crop.y + crop.h)}%`,
                    width: `${crop.x}%`
                  }}
                />
                <div 
                  className="absolute bg-black/60 backdrop-blur-[1px] transition-all right-0"
                  style={{ 
                    top: `${crop.y}%`, 
                    bottom: `${100 - (crop.y + crop.h)}%`,
                    left: `${crop.x + crop.w}%`
                  }}
                />

                {/* Draggable Active Crop Frame */}
                <div
                  onMouseDown={(e) => handleDragStart(e, 'move')}
                  onTouchStart={(e) => handleDragStart(e, 'move')}
                  className="absolute border-2 border-white cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.4)] transition-all flex flex-col justify-between"
                  style={{
                    top: `${crop.y}%`,
                    left: `${crop.x}%`,
                    width: `${crop.w}%`,
                    height: `${crop.h}%`,
                  }}
                >
                  {/* Grid Lines helper */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner resizing handles */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'tl')}
                    onTouchStart={(e) => handleDragStart(e, 'tl')}
                    className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 border-t-4 border-l-4 border-emerald-400 cursor-nwse-resize drop-shadow-md active:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'tr')}
                    onTouchStart={(e) => handleDragStart(e, 'tr')}
                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 border-t-4 border-r-4 border-emerald-400 cursor-nesw-resize drop-shadow-md active:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'bl')}
                    onTouchStart={(e) => handleDragStart(e, 'bl')}
                    className="absolute -bottom-1.5 -left-1.5 w-4.5 h-4.5 border-b-4 border-l-4 border-emerald-400 cursor-nesw-resize drop-shadow-md active:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'br')}
                    onTouchStart={(e) => handleDragStart(e, 'br')}
                    className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 border-b-4 border-r-4 border-emerald-400 cursor-nwse-resize drop-shadow-md active:scale-125 transition-transform"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Ratio Config */}
        <div className="bg-slate-50 border-t border-b border-slate-100 py-3.5 px-6 flex flex-wrap gap-4 items-center justify-between">
          
          {/* Ratio Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-extrabold tracking-wide uppercase mr-1">Rasio:</span>
            {(['free', '1:1', '4:3', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {ratio === 'free' ? 'Bebas' : ratio}
              </button>
            ))}
          </div>

          {/* Action buttons (Rotate, Reset) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
              title="Putar 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Putar 90°</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
              title="Reset"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleCropSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Selesai & Potong</span>
          </button>
        </div>

      </div>
    </div>
  );
}
