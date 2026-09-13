import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  Crop, 
  X, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Maximize2, 
  FileText,
  Sliders,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { detectReceiptBounds, CropBox } from '../utils/documentEdgeDetector';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string; // Base64 or URL
  onClose: () => void;
  onCrop: (croppedBase64: string) => void;
  title?: string;
  initialAspectRatio?: 'free' | '1:1' | '4:3' | '16:9';
}

type DragAction = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right' | null;

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
  title = "Potong & Sesuaikan Dokumen / Nota",
  initialAspectRatio = "free"
}: ImageCropperModalProps) {
  if (!isOpen || !imageSrc) return null;

  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>(initialAspectRatio);
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  
  // Crop window in percentages (0-100) of the visible image bounds
  const [crop, setCrop] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 1, naturalHeight: 1 });
  
  // Auto-detection states
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectedSuccess, setDetectedSuccess] = useState<boolean>(false);
  const [enhanceReceipt, setEnhanceReceipt] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasAutoDetectedRef = useRef<boolean>(false);

  // Dragging state
  const dragInfo = useRef<{
    active: boolean;
    action: DragAction;
    startX: number;
    startY: number;
    startCrop: CropBox;
  }>({
    active: false,
    action: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 10, y: 10, w: 80, h: 80 }
  });

  // Calculate visible image size inside its object-contain frame
  const updateVisibleImageSize = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) return;

    const containerRatio = rect.width / rect.height;
    const isRotated90 = rotation % 180 !== 0;
    const effNaturalWidth = isRotated90 ? naturalHeight : naturalWidth;
    const effNaturalHeight = isRotated90 ? naturalWidth : naturalHeight;
    const imageRatio = effNaturalWidth / effNaturalHeight;

    let visibleWidth = rect.width;
    let visibleHeight = rect.height;

    if (imageRatio > containerRatio) {
      visibleHeight = rect.width / imageRatio;
    } else {
      visibleWidth = rect.height * imageRatio;
    }

    setImageSize({
      width: visibleWidth,
      height: visibleHeight,
      naturalWidth,
      naturalHeight
    });
  }, [rotation]);

  // Trigger recalculation on load, rotate, or ratio change
  useEffect(() => {
    updateVisibleImageSize();
  }, [imageSrc, rotation, updateVisibleImageSize]);

  // Auto-detect receipt edges
  const runAutoDetect = useCallback((showFeedback: boolean = true) => {
    const img = imageRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    setIsDetecting(true);
    setDetectedSuccess(false);

    // Brief timeout so UI renders laser scan line animation
    setTimeout(() => {
      const bounds = detectReceiptBounds(img, rotation);
      setIsDetecting(false);

      if (bounds) {
        setAspectRatio('free');
        setCrop(bounds);
        if (showFeedback) {
          setDetectedSuccess(true);
          setTimeout(() => setDetectedSuccess(false), 3500);
        }
      }
    }, 350);
  }, [rotation]);

  // Automatically run edge detection when image first loads
  useEffect(() => {
    if (!hasAutoDetectedRef.current && imageSize.width > 0 && imageRef.current) {
      hasAutoDetectedRef.current = true;
      runAutoDetect(true);
    }
  }, [imageSize.width, runAutoDetect]);

  // Adjust crop box automatically when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'free') return;

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (aspectRatio === '16:9') targetRatio = 16 / 9;

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

  // Handle Drag Move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragInfo.current.active) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;

    const dxPercent = (dx / (imageSize.width || 1)) * 100;
    const dyPercent = (dy / (imageSize.height || 1)) * 100;

    const start = dragInfo.current.startCrop;
    const action = dragInfo.current.action;

    let nextCrop: CropBox = { ...start };

    if (action === 'move') {
      nextCrop.x = Math.max(0, Math.min(100 - start.w, start.x + dxPercent));
      nextCrop.y = Math.max(0, Math.min(100 - start.h, start.y + dyPercent));
    } else {
      const minSize = 6; // minimum 6% crop area

      if (aspectRatio === 'free') {
        // Corners
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
        // Edges (Single axis for super easy alignment)
        else if (action === 'top') {
          const bottom = start.y + start.h;
          nextCrop.y = Math.max(0, Math.min(bottom - minSize, start.y + dyPercent));
          nextCrop.h = bottom - nextCrop.y;
        } else if (action === 'bottom') {
          nextCrop.h = Math.max(minSize, Math.min(100 - start.y, start.h + dyPercent));
        } else if (action === 'left') {
          const right = start.x + start.w;
          nextCrop.x = Math.max(0, Math.min(right - minSize, start.x + dxPercent));
          nextCrop.w = right - nextCrop.x;
        } else if (action === 'right') {
          nextCrop.w = Math.max(minSize, Math.min(100 - start.x, start.w + dxPercent));
        }
      } else {
        // Locked aspect ratio resizing
        let ratioVal = 1;
        if (aspectRatio === '1:1') ratioVal = 1;
        else if (aspectRatio === '4:3') ratioVal = 4 / 3;
        else if (aspectRatio === '16:9') ratioVal = 16 / 9;

        const imgRatio = imageSize.width / (imageSize.height || 1);
        const wToHPercentRatio = ratioVal / (imgRatio || 1);

        if (action === 'br' || action === 'tr' || action === 'right') {
          const newW = Math.max(minSize, Math.min(100 - start.x, start.w + dxPercent));
          const newH = newW / wToHPercentRatio;
          if (start.y + newH <= 100) {
            nextCrop.w = newW;
            nextCrop.h = newH;
          }
        } else if (action === 'bl' || action === 'tl' || action === 'left') {
          const right = start.x + start.w;
          const newX = Math.max(0, Math.min(right - minSize, start.x + dxPercent));
          const newW = right - newX;
          const newH = newW / wToHPercentRatio;
          if (start.y + newH <= 100) {
            nextCrop.x = newX;
            nextCrop.w = newW;
            nextCrop.h = newH;
          }
        } else if (action === 'bottom') {
          const newH = Math.max(minSize, Math.min(100 - start.y, start.h + dyPercent));
          const newW = newH * wToHPercentRatio;
          if (start.x + newW <= 100) {
            nextCrop.w = newW;
            nextCrop.h = newH;
          }
        } else if (action === 'top') {
          const bottom = start.y + start.h;
          const newY = Math.max(0, Math.min(bottom - minSize, start.y + dyPercent));
          const newH = bottom - newY;
          const newW = newH * wToHPercentRatio;
          if (start.x + newW <= 100) {
            nextCrop.y = newY;
            nextCrop.h = newH;
            nextCrop.w = newW;
          }
        }
      }
    }

    setCrop(nextCrop);
  }, [aspectRatio, imageSize.width, imageSize.height]);

  // Handle Drag End
  const handleDragEnd = useCallback(() => {
    dragInfo.current.active = false;
    dragInfo.current.action = null;
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  }, [handleDragMove]);

  // Handle Drag Start (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, action: DragAction) => {
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

  // Rotate image clockwise by 90 degrees
  const handleRotate = () => {
    setRotation(prev => {
      const next = (prev + 90) % 360;
      return next;
    });
    // Trigger detection again after rotate animation settles
    setTimeout(() => {
      runAutoDetect(false);
    }, 280);
  };

  // Full image preset
  const handleFullCrop = () => {
    setAspectRatio('free');
    setCrop({ x: 0, y: 0, w: 100, h: 100 });
  };

  // Vertical receipt preset (standard 3:4 / long receipt)
  const handleVerticalReceiptPreset = () => {
    setAspectRatio('free');
    setCrop({ x: 15, y: 4, w: 70, h: 92 });
  };

  // Micro adjustments: expand or shrink by delta percentage
  const handleNudgeCrop = (delta: number) => {
    setCrop(prev => {
      const newX = Math.max(0, Math.min(prev.x + prev.w - 10, prev.x - delta));
      const newY = Math.max(0, Math.min(prev.y + prev.h - 10, prev.y - delta));
      const newW = Math.min(100 - newX, Math.max(10, prev.w + delta * 2));
      const newH = Math.min(100 - newY, Math.max(10, prev.h + delta * 2));
      return {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        w: Math.round(newW * 10) / 10,
        h: Math.round(newH * 10) / 10
      };
    });
  };

  // Reset all adjustments
  const handleReset = () => {
    setRotation(0);
    setCrop({ x: 10, y: 10, w: 80, h: 80 });
    setAspectRatio(initialAspectRatio);
    setEnhanceReceipt(false);
    setDetectedSuccess(false);
  };

  // Execute Canvas Cropping and yield base64
  const handleCropSave = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const isRotated90 = rotation % 180 !== 0;

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
      cropXPix = (crop.x / 100) * nh;
      cropYPix = (crop.y / 100) * nw;
      cropWPix = (crop.w / 100) * nh;
      cropHPix = (crop.h / 100) * nw;
    }

    canvas.width = Math.max(1, Math.round(cropWPix));
    canvas.height = Math.max(1, Math.round(cropHPix));

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
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
      ctx.drawImage(img, cropXPix, cropYPix, cropWPix, cropHPix, 0, 0, cropWPix, cropHPix);
    }
    ctx.restore();

    // If Document / Receipt Enhancement is enabled, boost clarity of text
    if (enhanceReceipt) {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const contrastFactor = 1.30;
        const brightnessOffset = 8;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, (d[i] - 128) * contrastFactor + 128 + brightnessOffset));
          d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * contrastFactor + 128 + brightnessOffset));
          d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * contrastFactor + 128 + brightnessOffset));
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn('Document enhancement error:', err);
      }
    }

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    onCrop(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm tracking-tight">{title}</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-Detect Nota
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pilih otomatis garis pinggir nota atau sesuaikan sisi dengan mudah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Workspace */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative p-3 sm:p-6 select-none overflow-hidden min-h-[280px] sm:min-h-[340px]">
          
          {/* Laser Scanning Overlay during auto detection */}
          {isDetecting && (
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex flex-col justify-start">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-pulse" />
              <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[0.5px]" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold border border-emerald-500/50 shadow-2xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Mendeteksi garis pinggir nota...</span>
              </div>
            </div>
          )}

          {/* Success Notification Badge */}
          {detectedSuccess && !isDetecting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-xl border border-emerald-400/40 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Garis pinggir nota berhasil terdeteksi otomatis!</span>
            </div>
          )}

          <div 
            ref={containerRef}
            className="relative max-w-full max-h-[52vh] flex items-center justify-center"
            style={{ width: '100%', height: '100%' }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source Dokumen"
              onLoad={updateVisibleImageSize}
              className={`max-w-full max-h-[52vh] object-contain transition-transform duration-200 pointer-events-none ${
                enhanceReceipt ? 'contrast-125 brightness-105' : ''
              }`}
              style={{ 
                transform: `rotate(${rotation}deg)`,
                opacity: imageSize.width ? 1 : 0 
              }}
              referrerPolicy="no-referrer"
            />

            {/* Overlays and Cropper bounds */}
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
                  className="absolute bg-black/65 backdrop-blur-[1px] transition-all top-0 left-0 right-0 pointer-events-none"
                  style={{ height: `${crop.y}%` }}
                />
                <div 
                  className="absolute bg-black/65 backdrop-blur-[1px] transition-all bottom-0 left-0 right-0 pointer-events-none"
                  style={{ top: `${crop.y + crop.h}%` }}
                />
                <div 
                  className="absolute bg-black/65 backdrop-blur-[1px] transition-all left-0 pointer-events-none"
                  style={{ 
                    top: `${crop.y}%`, 
                    bottom: `${100 - (crop.y + crop.h)}%`,
                    width: `${crop.x}%`
                  }}
                />
                <div 
                  className="absolute bg-black/65 backdrop-blur-[1px] transition-all right-0 pointer-events-none"
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
                  className="absolute border-2 border-emerald-400 cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_12px_rgba(16,185,129,0.35)] transition-all flex flex-col justify-between"
                  style={{
                    top: `${crop.y}%`,
                    left: `${crop.x}%`,
                    width: `${crop.w}%`,
                    height: `${crop.h}%`,
                  }}
                >
                  {/* Grid Lines helper */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-emerald-300" />
                    <div className="border-r border-b border-emerald-300" />
                    <div className="border-b border-emerald-300" />
                    <div className="border-r border-b border-emerald-300" />
                    <div className="border-r border-b border-emerald-300" />
                    <div className="border-b border-emerald-300" />
                    <div className="border-r border-emerald-300" />
                    <div className="border-r border-emerald-300" />
                    <div />
                  </div>

                  {/* Document badge in center for easy recognition */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <FileText className="w-12 h-12 text-white" />
                  </div>

                  {/* 4 Corner Handles (Extra responsive hit areas for mobile touch) */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'tl')}
                    onTouchStart={(e) => handleDragStart(e, 'tl')}
                    className="absolute -top-2.5 -left-2.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 cursor-nwse-resize drop-shadow-md active:scale-125 transition-transform touch-none before:absolute before:-inset-3 before:content-['']"
                    title="Tarik sudut kiri atas"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'tr')}
                    onTouchStart={(e) => handleDragStart(e, 'tr')}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 cursor-nesw-resize drop-shadow-md active:scale-125 transition-transform touch-none before:absolute before:-inset-3 before:content-['']"
                    title="Tarik sudut kanan atas"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'bl')}
                    onTouchStart={(e) => handleDragStart(e, 'bl')}
                    className="absolute -bottom-2.5 -left-2.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 cursor-nesw-resize drop-shadow-md active:scale-125 transition-transform touch-none before:absolute before:-inset-3 before:content-['']"
                    title="Tarik sudut kiri bawah"
                  />
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'br')}
                    onTouchStart={(e) => handleDragStart(e, 'br')}
                    className="absolute -bottom-2.5 -right-2.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 cursor-nwse-resize drop-shadow-md active:scale-125 transition-transform touch-none before:absolute before:-inset-3 before:content-['']"
                    title="Tarik sudut kanan bawah"
                  />

                  {/* 4 Edge Handles (Bar Pills) - Solves "susah penggunaannya" by allowing direct single-edge adjustment */}
                  {/* Top Edge Handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'top')}
                    onTouchStart={(e) => handleDragStart(e, 'top')}
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full border border-white shadow-md cursor-ns-resize touch-none flex items-center justify-center active:scale-110 transition-transform before:absolute before:-inset-3 before:content-['']"
                    title="Geser batas atas nota"
                  >
                    <div className="w-5 h-0.5 bg-white rounded-full opacity-80" />
                  </div>

                  {/* Bottom Edge Handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'bottom')}
                    onTouchStart={(e) => handleDragStart(e, 'bottom')}
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full border border-white shadow-md cursor-ns-resize touch-none flex items-center justify-center active:scale-110 transition-transform before:absolute before:-inset-3 before:content-['']"
                    title="Geser batas bawah nota"
                  >
                    <div className="w-5 h-0.5 bg-white rounded-full opacity-80" />
                  </div>

                  {/* Left Edge Handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'left')}
                    onTouchStart={(e) => handleDragStart(e, 'left')}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full border border-white shadow-md cursor-ew-resize touch-none flex items-center justify-center active:scale-110 transition-transform before:absolute before:-inset-3 before:content-['']"
                    title="Geser batas kiri nota"
                  >
                    <div className="w-0.5 h-5 bg-white rounded-full opacity-80" />
                  </div>

                  {/* Right Edge Handle */}
                  <div
                    onMouseDown={(e) => handleDragStart(e, 'right')}
                    onTouchStart={(e) => handleDragStart(e, 'right')}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full border border-white shadow-md cursor-ew-resize touch-none flex items-center justify-center active:scale-110 transition-transform before:absolute before:-inset-3 before:content-['']"
                    title="Geser batas kanan nota"
                  >
                    <div className="w-0.5 h-5 bg-white rounded-full opacity-80" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Fast Action Controls */}
        <div className="bg-slate-50 border-t border-b border-slate-200/80 p-3 sm:px-6 flex flex-wrap gap-2.5 sm:gap-3 items-center justify-between">
          
          {/* Magic Button: Otomatis Crop Garis Pinggir Nota */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runAutoDetect(true)}
              disabled={isDetecting}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Deteksi otomatis tepi kertas nota dari background meja"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>✨ Otomatis Crop Nota</span>
            </button>

            {/* Quick Preset: Struk Vertikal & Penuh */}
            <button
              onClick={handleVerticalReceiptPreset}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              title="Bentuk nota panjang / struk kasir"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xs:inline">Nota Vertikal</span>
              <span className="xs:hidden">Vertikal</span>
            </button>

            <button
              onClick={handleFullCrop}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              title="Pilih seluruh gambar 100%"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Penuh</span>
            </button>
          </div>

          {/* Ratio Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-0.5 hidden sm:inline">Rasio:</span>
            {(['free', '1:1', '4:3', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {ratio === 'free' ? 'Bebas' : ratio}
              </button>
            ))}
          </div>

          {/* Rotate, Nudge & Reset */}
          <div className="flex items-center gap-1.5">
            {/* Fine Nudge (+ / - 3%) */}
            <div className="flex items-center bg-white border border-slate-250 rounded-xl p-0.5 shadow-2xs" title="Perbesar / perkecil batas bidang">
              <button
                onClick={() => handleNudgeCrop(-2.5)}
                className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Rapatkan bidang (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 px-1 font-mono">Batas</span>
              <button
                onClick={() => handleNudgeCrop(2.5)}
                className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Luaskan bidang (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleRotate}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
              title="Putar 90 Derajat"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Putar 90°</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-500 border border-slate-250 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
              title="Kembalikan ke awal"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

        </div>

        {/* Footer info & Confirmation */}
        <div className="px-4 sm:px-6 py-3 bg-white flex flex-wrap items-center justify-between gap-3">
          
          {/* Receipt clarity filter toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={enhanceReceipt}
              onChange={(e) => setEnhanceReceipt(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Perjelas Teks Nota (Tingkatkan Kontras Kertas)</span>
            </span>
          </label>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            >
              Batal
            </button>
            <button
              onClick={handleCropSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Potong Nota</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
