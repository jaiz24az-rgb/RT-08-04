export interface ReceiptInfo {
  id: string;
  nama: string;
  tipe?: 'warga' | 'rombong';
  blok?: string;
  noRumah?: string;
  noLapak?: string;
  noWa?: string;
  category: string;
  bulan?: string;
  tahun?: number;
  nominal: number;
  tanggalBayar: string;
  jamBayar?: string;
  kasPenerima: string;
  petugas: string;
  catatan?: string;
}

export const getTerbilang = (nilai: number): string => {
  const angka = Math.abs(nilai);
  if (angka === 0) return "Nol";
  
  const getTerbilangSub = (val: number): string => {
    let temp = "";
    if (val < 12) {
      const arr = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
      temp = " " + arr[val];
    } else if (val < 20) {
      temp = getTerbilangSub(val - 10) + " Belas";
    } else if (val < 100) {
      temp = getTerbilangSub(Math.floor(val / 10)) + " Puluh" + getTerbilangSub(val % 10);
    } else if (val < 200) {
      temp = " Seratus" + getTerbilangSub(val - 100);
    } else if (val < 1000) {
      temp = getTerbilangSub(Math.floor(val / 100)) + " Ratus" + getTerbilangSub(val % 100);
    } else if (val < 2000) {
      temp = " Seribu" + getTerbilangSub(val - 1000);
    } else if (val < 1000000) {
      temp = getTerbilangSub(Math.floor(val / 1000)) + " Ribu" + getTerbilangSub(val % 1000);
    } else if (val < 1000000000) {
      temp = getTerbilangSub(Math.floor(val / 1000000)) + " Juta" + getTerbilangSub(val % 1000000);
    }
    return temp.trim();
  };

  return getTerbilangSub(angka);
};

export const drawReceiptOnCanvas = (receiptInfo: ReceiptInfo, canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 560);

  // Background light beige tint
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(15, 15, 770, 530);

  // Outer border double
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, 770, 530);
  ctx.strokeRect(19, 19, 762, 522);

  // Header Logo Circle
  ctx.beginPath();
  ctx.arc(60, 65, 25, 0, Math.PI * 2);
  ctx.fillStyle = '#0284c7';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(60, 65, 22, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('08', 60, 65);

  // Header Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('RT.008 RW.004', 100, 58);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('Perumtas 3 Wonoayu Sidoarjo • Desa Popoh • Jawa Timur', 100, 80);

  // Title Right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 22px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('KUITANSI / NOTA', 750, 55);

  // Receipt No
  const detailLoc = receiptInfo.tipe === 'rombong'
    ? `Lapak ${receiptInfo.noLapak || ''}`
    : (receiptInfo.blok && receiptInfo.noRumah ? `Blok ${receiptInfo.blok}-${receiptInfo.noRumah}` : 'RT 08 RW 04');
  
  const yearForNo = receiptInfo.tahun && receiptInfo.tahun !== 0
    ? receiptInfo.tahun
    : (receiptInfo.tanggalBayar ? receiptInfo.tanggalBayar.split('-')[0] : new Date().getFullYear());
  const receiptNo = `NOTA/${receiptInfo.tipe === 'rombong' ? 'RBG' : 'KAS'}/${yearForNo}/${(receiptInfo.category || 'MASUK').replace(/[\s,]+/g, '-').slice(0, 10).toUpperCase()}/${(receiptInfo.id || '0000').substring(0, 6).toUpperCase()}`;
  
  ctx.fillStyle = '#64748b';
  ctx.font = '500 10px monospace';
  ctx.fillText(`NO: ${receiptNo}`, 750, 75);

  // Separator
  ctx.beginPath();
  ctx.moveTo(35, 105);
  ctx.lineTo(765, 105);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Content Table
  const startXLabel = 40;
  const startXValue = 240;
  const maxTextWidth = 510;
  let currentY = 125;
  const rowHeight = 28;
  const valueLineHeight = 16;

  const rawBulan = receiptInfo.bulan || receiptInfo.tanggalBayar || '';
  const hasYearInBulan = /\b\d{4}\b/.test(rawBulan);
  const periodeValue = hasYearInBulan ? rawBulan : `${rawBulan} ${receiptInfo.tahun || ''}`;

  const rawNama = (receiptInfo.nama || 'Penyetor / Warga').trim();
  const nameFormatted = /^(bapak|ibu|pak|bu|sdr|sdri|penyetor|hamba)\b/i.test(rawNama) 
    ? rawNama 
    : `Bapak/Ibu ${rawNama}`;

  const fields = [
    { label: 'TELAH DITERIMA DARI', value: nameFormatted, isHighlight: true },
    { label: 'WILAYAH / LOKASI', value: detailLoc },
    { label: 'KATEGORI PEMASUKAN', value: receiptInfo.category || 'Pemasukan Kas' },
    { label: 'PERIODE / TANGGAL', value: periodeValue },
    { label: 'TERBILANG (UANG)', value: getTerbilang(receiptInfo.nominal) + ' Rupiah', isItalic: true },
    { label: 'CATATAN / KETERANGAN', value: receiptInfo.catatan || '-' }
  ];

  fields.forEach(field => {
    let fontStyle = 'bold 11px "Helvetica Neue", Arial, sans-serif';
    if (field.isHighlight) {
      fontStyle = '900 12.5px "Helvetica Neue", Arial, sans-serif';
    } else if (field.isItalic) {
      fontStyle = 'italic bold 11px "Helvetica Neue", Arial, sans-serif';
    }

    ctx.font = fontStyle;
    const valueText = field.value;
    const words = valueText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
          currentLine = '';
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9.5px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(field.label, startXLabel, currentY);

    ctx.fillStyle = '#0f172a';
    ctx.fillText(':', startXValue - 15, currentY);

    ctx.font = fontStyle;
    ctx.fillStyle = field.isHighlight ? '#0f172a' : '#1e293b';

    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, startXValue, currentY + (lineIdx * valueLineHeight));
    });

    const rowContentHeight = (lines.length - 1) * valueLineHeight;
    const dashedLineY = currentY + rowContentHeight + 10;

    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(startXLabel, dashedLineY);
    ctx.lineTo(760, dashedLineY);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    currentY += rowHeight + rowContentHeight;
  });

  // Terbilang Box
  const terbilangText = getTerbilang(receiptInfo.nominal) + ' Rupiah';
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, currentY + 5, 720, 36);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, currentY + 5, 720, 36);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'italic bold 11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(`Terbilang: "# ${terbilangText} #"`, 55, currentY + 27);

  currentY += 60;

  // Footer Signatures
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('TANDA TERIMA PENYETOR', 150, currentY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(receiptInfo.nama || 'Penyetor', 150, currentY + 65);
  ctx.beginPath();
  ctx.moveTo(90, currentY + 70);
  ctx.lineTo(210, currentY + 70);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('Pembayar / Penyetor', 150, currentY + 82);

  // Stamp LUNAS
  ctx.save();
  ctx.translate(400, currentY + 35);
  ctx.rotate(-5 * Math.PI / 180);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.strokeRect(-65, -18, 130, 36);
  ctx.fillStyle = '#10b981';
  ctx.font = '900 15px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('TERIMA / LUNAS ✓', 0, 5);
  ctx.restore();

  // Right Signature
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(`SIDOARJO, ${receiptInfo.tanggalBayar || ''}`, 650, currentY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(receiptInfo.petugas || 'Bendahara RT', 650, currentY + 65);
  ctx.beginPath();
  ctx.moveTo(590, currentY + 70);
  ctx.lineTo(710, currentY + 70);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 9px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(`Petugas Penerima (${(receiptInfo.kasPenerima || 'KAS').toUpperCase()})`, 650, currentY + 82);
};

export const downloadReceiptPNG = (receiptInfo: ReceiptInfo) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(2, 2);
    drawReceiptOnCanvas(receiptInfo, canvas);
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    const cleanName = (receiptInfo.nama || 'Penyetor').replace(/[^\w]/g, '_');
    const cleanCat = (receiptInfo.category || 'Kas').replace(/[^\w]/g, '_');
    link.download = `Nota_Pemasukan_${cleanName}_${cleanCat}_${receiptInfo.tanggalBayar || 'Tgl'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
