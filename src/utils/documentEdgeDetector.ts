/**
 * Utility for intelligent automatic detection of receipt / document edges (Auto-Crop Nota).
 * Analyzes contrast, Otsu binarization, and Sobel edge gradients on an offscreen canvas
 * to find the boundary of the paper against the background surface.
 */

export interface CropBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export function detectReceiptBounds(
  image: HTMLImageElement,
  rotation: number = 0
): CropBox | null {
  try {
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return null;
    }

    const isRotated90 = rotation % 180 !== 0;
    const origW = isRotated90 ? image.naturalHeight : image.naturalWidth;
    const origH = isRotated90 ? image.naturalWidth : image.naturalHeight;

    if (origW <= 0 || origH <= 0) return null;

    // Use normalized analysis resolution (max 360px) for speed & noise suppression
    const maxDim = 360;
    const scale = Math.min(maxDim / origW, maxDim / origH, 1);
    const w = Math.max(40, Math.round(origW * scale));
    const h = Math.max(40, Math.round(origH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // Render rotated image onto analysis canvas
    ctx.save();
    if (rotation === 90) {
      ctx.translate(w, 0);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(image, 0, 0, h, w);
    } else if (rotation === 180) {
      ctx.translate(w, h);
      ctx.rotate((180 * Math.PI) / 180);
      ctx.drawImage(image, 0, 0, w, h);
    } else if (rotation === 270) {
      ctx.translate(0, h);
      ctx.rotate((270 * Math.PI) / 180);
      ctx.drawImage(image, 0, 0, h, w);
    } else {
      ctx.drawImage(image, 0, 0, w, h);
    }
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const totalPixels = w * h;

    // 1. Grayscale & Histogram computation
    const gray = new Uint8Array(totalPixels);
    const hist = new Int32Array(256);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // Rec. 601 luma
      const luma = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
      const val = Math.min(255, Math.max(0, Math.round(luma)));
      gray[p] = val;
      hist[val]++;
    }

    // 2. Otsu's Global Thresholding
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * hist[t];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let otsuThreshold = 128;

    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      wF = totalPixels - wB;
      if (wF === 0) break;

      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > varMax) {
        varMax = varBetween;
        otsuThreshold = t;
      }
    }

    // 3. Sample the outer perimeter (background baseline)
    const margin = Math.max(3, Math.floor(Math.min(w, h) * 0.05));
    let bgSum = 0;
    let bgCount = 0;

    for (let x = 0; x < w; x += 2) {
      for (let y = 0; y < margin; y++) {
        bgSum += gray[y * w + x];
        bgSum += gray[(h - 1 - y) * w + x];
        bgCount += 2;
      }
    }
    for (let y = margin; y < h - margin; y += 2) {
      for (let x = 0; x < margin; x++) {
        bgSum += gray[y * w + x];
        bgSum += gray[y * w + (w - 1 - x)];
        bgCount += 2;
      }
    }
    const bgAvgLuma = bgCount > 0 ? bgSum / bgCount : 128;

    // 4. Sobel Edge Gradient Magnitude
    const edgeMag = new Uint8Array(totalPixels);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx =
          -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] +
          -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
          -gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
        const gy =
          -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
          gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
        const mag = Math.sqrt(gx * gx + gy * gy);
        edgeMag[idx] = Math.min(255, Math.round(mag));
      }
    }

    // 5. Binary document mask:
    // Determine whether paper is brighter than background (usual case) or darker
    const paperIsBrighter = bgAvgLuma < 190;
    const docMask = new Uint8Array(totalPixels);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const luma = gray[idx];
        const isOtsuFg = paperIsBrighter ? luma >= otsuThreshold : luma < otsuThreshold;
        const diffFromBg = Math.abs(luma - bgAvgLuma);
        const hasStrongEdge = edgeMag[idx] > 32;

        if ((isOtsuFg && diffFromBg > 18) || hasStrongEdge) {
          docMask[idx] = 1;
        }
      }
    }

    // 6. Find document boundary bounds by scanning profile density
    // Scan inward from each of the 4 borders
    const searchLimitX = Math.floor(w * 0.42);
    const searchLimitY = Math.floor(h * 0.42);
    const thresholdDensity = 0.20; // At least 20% of the slice has paper content

    let left = 0;
    for (let x = 0; x < searchLimitX; x++) {
      let count = 0;
      const spanStart = Math.floor(h * 0.1);
      const spanEnd = Math.floor(h * 0.9);
      const spanLen = spanEnd - spanStart;
      for (let y = spanStart; y < spanEnd; y++) {
        if (docMask[y * w + x]) count++;
      }
      if (count / spanLen >= thresholdDensity) {
        left = x;
        break;
      }
    }

    let right = w - 1;
    for (let x = w - 1; x >= w - 1 - searchLimitX; x--) {
      let count = 0;
      const spanStart = Math.floor(h * 0.1);
      const spanEnd = Math.floor(h * 0.9);
      const spanLen = spanEnd - spanStart;
      for (let y = spanStart; y < spanEnd; y++) {
        if (docMask[y * w + x]) count++;
      }
      if (count / spanLen >= thresholdDensity) {
        right = x;
        break;
      }
    }

    let top = 0;
    for (let y = 0; y < searchLimitY; y++) {
      let count = 0;
      const spanStart = Math.floor(w * 0.1);
      const spanEnd = Math.floor(w * 0.9);
      const spanLen = spanEnd - spanStart;
      for (let x = spanStart; x < spanEnd; x++) {
        if (docMask[y * w + x]) count++;
      }
      if (count / spanLen >= thresholdDensity) {
        top = y;
        break;
      }
    }

    let bottom = h - 1;
    for (let y = h - 1; y >= h - 1 - searchLimitY; y--) {
      let count = 0;
      const spanStart = Math.floor(w * 0.1);
      const spanEnd = Math.floor(w * 0.9);
      const spanLen = spanEnd - spanStart;
      for (let x = spanStart; x < spanEnd; x++) {
        if (docMask[y * w + x]) count++;
      }
      if (count / spanLen >= thresholdDensity) {
        bottom = y;
        break;
      }
    }

    // Safety padding (1.5% of dimension) so text right at the edge of the receipt is preserved
    const padX = Math.round(w * 0.015);
    const padY = Math.round(h * 0.015);

    const safeLeft = Math.max(0, left - padX);
    const safeRight = Math.min(w, right + padX);
    const safeTop = Math.max(0, top - padY);
    const safeBottom = Math.min(h, bottom + padY);

    const boxW = safeRight - safeLeft;
    const boxH = safeBottom - safeTop;

    // Check validity: must cover at least 25% of width and height
    const ratioW = boxW / w;
    const ratioH = boxH / h;

    if (ratioW < 0.25 || ratioH < 0.25) {
      // Fallback: centered 80% if detection is ambiguous
      return { x: 10, y: 10, w: 80, h: 80 };
    }

    // If receipt already fills >= 97% of both dimensions, return full
    if (ratioW >= 0.96 && ratioH >= 0.96) {
      return { x: 2, y: 2, w: 96, h: 96 };
    }

    return {
      x: Math.round((safeLeft / w) * 1000) / 10,
      y: Math.round((safeTop / h) * 1000) / 10,
      w: Math.round((boxW / w) * 1000) / 10,
      h: Math.round((boxH / h) * 1000) / 10,
    };
  } catch (err) {
    console.error('detectReceiptBounds error:', err);
    return null;
  }
}
