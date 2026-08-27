import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { LedgerEntry, Balance, AppUser, WargaBill, RombongBill } from '../types';
import { getBase64SizeInBytes, formatFileSize } from '../utils/fileSizeUtils';
import { compressImage } from '../utils/fileCompressor';
import ImageCropperModal from './ImageCropperModal';
import DateRangePicker from './DateRangePicker';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Tag, 
  Calendar, 
  Filter, 
  Search,
  BookOpen,
  Trash2,
  Printer,
  FileSpreadsheet,
  X,
  Camera,
  Receipt,
  Download,
  Eye,
  Edit2,
  MessageSquare,
  Check,
  Copy,
  Lock,
  Unlock,
  Zap,
  ArrowRightLeft,
  Scale
} from 'lucide-react';

interface LedgerProps {
  ledger: LedgerEntry[];
  setLedger: (newLedger: LedgerEntry[]) => void;
  kas: Balance;
  updateKas: (newKas: Balance) => void;
  isLoggedIn: boolean;
  currentUser?: AppUser | null;
  usersList?: AppUser[];
  yearsList?: number[];
  rtTitle?: string;
  rtAddress?: string;
  rtEmail?: string;
  onTriggerLogin?: () => void;
  wargaList?: WargaBill[];
  rombongList?: RombongBill[];
}

export default function Ledger({ 
  ledger, 
  setLedger, 
  kas, 
  updateKas, 
  isLoggedIn, 
  currentUser = null, 
  usersList = [], 
  yearsList = [2024, 2025, 2026, 2027, 2028],
  rtTitle = 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04',
  rtAddress = 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.',
  rtEmail = '',
  onTriggerLogin,
  wargaList = [],
  rombongList = []
}: LedgerProps) {
  const printContentViaIframe = (htmlContent: string) => {
    // Keep original document title to restore later
    const originalTitle = document.title;

    // Use DOMParser to parse the HTML string cleanly
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(htmlContent, 'text/html');
    const printTitle = parsedDoc.querySelector('title')?.textContent;

    if (printTitle) {
      document.title = printTitle;
    }

    // Clean up any existing print containers and temp styles first to prevent duplication
    document.getElementById('mobile-print-container')?.remove();
    document.querySelectorAll('.mobile-temp-print-style').forEach(el => el.remove());
    const oldStyle = document.getElementById('mobile-print-style');
    if (oldStyle) oldStyle.remove();

    // Extract styles and copy them to the main head
    const docStyles = parsedDoc.querySelectorAll('style');
    const tempStyles: HTMLStyleElement[] = [];
    docStyles.forEach((styleEl) => {
      const newStyle = document.createElement('style');
      newStyle.className = 'mobile-temp-print-style';
      newStyle.innerHTML = styleEl.innerHTML;
      document.head.appendChild(newStyle);
      tempStyles.push(newStyle);
    });

    // Extract body content and append to body
    const bodyContent = parsedDoc.body.innerHTML;
    const container = document.createElement('div');
    container.id = 'mobile-print-container';
    container.innerHTML = bodyContent;
    document.body.appendChild(container);

    // Create print-specific hiding styles
    const style = document.createElement('style');
    style.id = 'mobile-print-style';
    style.innerHTML = `
      @media print {
        body > *:not(#mobile-print-container):not(.mobile-temp-print-style) {
          display: none !important;
          visibility: hidden !important;
        }
        #mobile-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
          display: block !important;
          visibility: visible !important;
        }
        #mobile-print-container, #mobile-print-container * {
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Give browser a short delayed moment to digest the style and DOM before opening print dialog
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        container.remove();
        tempStyles.forEach(el => el.remove());
        style.remove();
        document.title = originalTitle;
      }, 10000);
    }, 600);
  };

  const getTerbilang = (nilai: number): string => {
    const semua = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";
    if (nilai < 12) {
      temp = " " + semua[nilai];
    } else if (nilai < 20) {
      temp = getTerbilang(nilai - 10) + " Belas";
    } else if (nilai < 100) {
      temp = getTerbilang(Math.floor(nilai / 10)) + " Puluh" + getTerbilang(nilai % 10);
    } else if (nilai < 200) {
      temp = " Seratus" + getTerbilang(nilai - 100);
    } else if (nilai < 1000) {
      temp = getTerbilang(Math.floor(nilai / 100)) + " Ratus" + getTerbilang(nilai % 100);
    } else if (nilai < 2000) {
      temp = " Seribu" + getTerbilang(nilai - 1000);
    } else if (nilai < 1000000) {
      temp = getTerbilang(Math.floor(nilai / 1000)) + " Ribu" + getTerbilang(nilai % 1000);
    } else if (nilai < 1000000000) {
      temp = getTerbilang(Math.floor(nilai / 1000000)) + " Juta" + getTerbilang(nilai % 1000000);
    }
    return temp.trim();
  };

  const drawReceiptOnCanvas = (receiptInfo: {
    id: string;
    nama: string;
    tipe: 'warga' | 'rombong';
    blok?: string;
    noRumah?: string;
    noLapak?: string;
    noWa: string;
    category: string;
    bulan: string;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    jamBayar: string;
    kasPenerima: string;
    petugas: string;
    catatan?: string;
  }, canvas: HTMLCanvasElement) => {
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

    // 1. Header Area
    // Draw Logo Circle with double ring
    ctx.beginPath();
    ctx.arc(60, 65, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(60, 65, 22, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Logo Text "08"
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('08', 60, 65);

    // RT Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('RT.008 RW.004', 100, 58);

    // RT Subtitle
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Perumtas 3 Wonoayu Sidoarjo • Desa Popoh • Jawa Timur', 100, 80);

    // KUITANSI title right aligned
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('KUITANSI', 750, 55);

    // Receipt No
    const detailLoc = receiptInfo.tipe === 'warga'
      ? `Blok ${receiptInfo.blok || ''}-${receiptInfo.noRumah || ''}`
      : `No Lapak ${receiptInfo.noLapak || ''}`;
    const yearForNo = receiptInfo.tahun && receiptInfo.tahun !== 0
      ? receiptInfo.tahun
      : (receiptInfo.tanggalBayar ? receiptInfo.tanggalBayar.split('-')[0] : new Date().getFullYear());
    const receiptNo = `KWT/${receiptInfo.tipe === 'warga' ? 'WRG' : 'RBG'}/${yearForNo}/${(receiptInfo.bulan || '').replace(/[\s,]+/g, '-').slice(0, 10).toUpperCase()}/${(receiptInfo.id || '').substring(0, 4).toUpperCase()}`;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px monospace';
    ctx.fillText(`NO: ${receiptNo}`, 750, 75);

    // Draw Header separator line
    ctx.beginPath();
    ctx.moveTo(35, 105);
    ctx.lineTo(765, 105);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Content Table
    const startXLabel = 40;
    const startXValue = 240;
    const maxTextWidth = 510; // 750 - 240
    let currentY = 125;
    const rowHeight = 28;
    const valueLineHeight = 16;

    const rawBulan = receiptInfo.bulan || '';
    const hasYearInBulan = /\b\d{4}\b/.test(rawBulan);
    const periodeValue = hasYearInBulan ? rawBulan : `${rawBulan} ${receiptInfo.tahun || ''}`;

    const rawNama = (receiptInfo.nama || 'Penyetor').trim();
    const formattedNama = /^(bapak|ibu|pak|bu|sdr|sdri|penyetor|hamba)\b/i.test(rawNama)
      ? rawNama
      : `Bapak/Ibu ${rawNama}`;

    const fields = [
      { label: 'TELAH DITERIMA DARI', value: formattedNama, isHighlight: true },
      { label: receiptInfo.tipe === 'warga' ? 'UNIT RUMAH' : 'NO LAPAK', value: detailLoc },
      { label: 'KATEGORI PEMBAYARAN', value: receiptInfo.category || '' },
      { label: 'PERIODE / BULAN', value: periodeValue },
      { label: 'TERBILANG (UANG)', value: getTerbilang(receiptInfo.nominal) + ' Rupiah', isItalic: true },
      { label: 'CATATAN / LAMPIRAN', value: receiptInfo.catatan || '-' }
    ];

    fields.forEach(field => {
      // 1. Determine font style
      let fontStyle = 'bold 11px "Helvetica Neue", Arial, sans-serif';
      if (field.isHighlight) {
        fontStyle = '900 12.5px "Helvetica Neue", Arial, sans-serif';
      } else if (field.isItalic) {
        fontStyle = 'italic bold 11px "Helvetica Neue", Arial, sans-serif';
      }

      // 2. Wrap text of the value column
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

      // 3. Draw Label & Colon on the first line's Y
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9.5px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(field.label, startXLabel, currentY);

      // Separator colon
      ctx.fillStyle = '#0f172a';
      ctx.fillText(':', startXValue - 15, currentY);

      // 4. Draw Wrapped Value Lines
      ctx.font = fontStyle;
      if (field.isHighlight) {
        ctx.fillStyle = '#0f172a';
      } else if (field.isItalic) {
        ctx.fillStyle = '#1e293b';
      } else {
        ctx.fillStyle = '#1e293b';
      }

      lines.forEach((line, lineIdx) => {
        ctx.fillText(line, startXValue, currentY + (lineIdx * valueLineHeight));
      });

      // 5. Calculate row baseline for dashed line
      const rowContentHeight = (lines.length - 1) * valueLineHeight;
      const dashedLineY = currentY + rowContentHeight + 10;

      // Dashed line under row
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(startXLabel, dashedLineY);
      ctx.lineTo(760, dashedLineY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]); // Reset dashed line

      // 6. Advance currentY for next row
      currentY += rowHeight + rowContentHeight;
    });

    // 3. Terbilang Box
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

    // 4. Footer & Signature
    // Left: Tanda Terima Penyetor
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('TANDA TERIMA PENYETOR', 150, currentY);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(receiptInfo.nama || '', 150, currentY + 65);
    // draw thin underline for name
    ctx.beginPath();
    ctx.moveTo(90, currentY + 70);
    ctx.lineTo(210, currentY + 70);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 9px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Pembayar', 150, currentY + 82);

    // Middle: LUNAS Stamp
    ctx.save();
    ctx.translate(400, currentY + 35);
    ctx.rotate(-5 * Math.PI / 180);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    // rounded rectangle for stamp
    ctx.strokeRect(-60, -18, 120, 36);
    ctx.fillStyle = '#10b981';
    ctx.font = '900 15px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('LUNAS ✓', 0, 5);
    ctx.restore();

    // Right: Petugas Kas
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(`SIDOARJO, ${receiptInfo.tanggalBayar || ''}`, 650, currentY);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(receiptInfo.petugas || '', 650, currentY + 65);
    // draw thin underline for name
    ctx.beginPath();
    ctx.moveTo(590, currentY + 70);
    ctx.lineTo(710, currentY + 70);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 9px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(`Petugas Kas (${(receiptInfo.kasPenerima || '').toUpperCase()})`, 650, currentY + 82);
  };

  const printSingleReceiptPNG = (receiptInfo: {
    id: string;
    nama: string;
    tipe: 'warga' | 'rombong';
    blok?: string;
    noRumah?: string;
    noLapak?: string;
    noWa: string;
    category: string;
    bulan: string;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    jamBayar: string;
    kasPenerima: string;
    petugas: string;
    catatan?: string;
  }) => {
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
      link.download = `Kuitansi_${(receiptInfo.nama || 'Warga').replace(/\s+/g, '_')}_${receiptInfo.bulan || 'Periode'}_${receiptInfo.tahun || 'Tahun'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getMatchedBillInfo = (entry: LedgerEntry) => {
    if (!entry || entry.tipe !== 'pemasukan' || !entry.jumlah || entry.jumlah <= 0) return null;
    const desc = (entry.deskripsi || '').toLowerCase();
    
    const isWargaPayment = desc.includes('iuran rt') || desc.includes('iuranrt');
    const isRombongPayment = desc.includes('iuran rombong') || desc.includes('sewa rombong');
    
    if (isWargaPayment) {
      // Find matching warga first from state list
      const matched = (wargaList || []).find(w => {
        if (!w || !w.nama) return false;
        const cleanWName = (w.nama || '').replace(/^(bp\.|ibu|bu|pak|bpk|sdr\.)\s+/i, '').trim().toLowerCase();
        const cleanEntryDesc = (entry.deskripsi || '').toLowerCase();
        
        const nameMatch = cleanEntryDesc.includes(cleanWName) || (w.nama && cleanEntryDesc.includes(w.nama.toLowerCase()));
        const blockMatch = (w.blok && cleanEntryDesc.includes(w.blok.toLowerCase())) || (w.noRumah && cleanEntryDesc.includes(w.noRumah.toLowerCase()));
        return nameMatch && blockMatch;
      });

      let bulan = entry.tanggal || '';
      let tahun = entry.tahun || (entry.tanggal ? new Date(entry.tanggal).getFullYear() : new Date().getFullYear());
      if (isNaN(tahun)) {
        tahun = new Date().getFullYear();
      }
      const kolektifMatch = (entry.deskripsi || '').match(/Kolektif \(([^)]+)\)/);
      if (kolektifMatch) {
        bulan = kolektifMatch[1];
      } else {
        const bulanMatch = (entry.deskripsi || '').match(/Bulan ([a-zA-Z\s,]+)\s+(\d{4})/);
        if (bulanMatch) {
          bulan = bulanMatch[1];
          tahun = parseInt(bulanMatch[2], 10);
        }
      }

      return {
        id: matched?.id || entry.id || '',
        nama: matched?.nama || ((entry.deskripsi || '').match(/ - ([^(]+)\(([^)]+)\)/)?.[1]?.trim() || 'Warga RT 08'),
        tipe: 'warga' as const,
        blok: matched?.blok || ((entry.deskripsi || '').match(/ - ([^(]+)\(([^)]+)\)/)?.[2]?.replace(/Blok/i, '').split('-')[0]?.trim() || ''),
        noRumah: matched?.noRumah || ((entry.deskripsi || '').match(/ - ([^(]+)\(([^)]+)\)/)?.[2]?.replace(/Blok/i, '').split('-')[1]?.trim() || ''),
        noWa: matched?.noWa || '',
        category: 'Iuran RT',
        bulan: bulan,
        tahun: tahun,
        nominal: entry.jumlah,
        tanggalBayar: entry.tanggal || '',
        jamBayar: '00:00',
        kasPenerima: entry.sumberKas || '',
        petugas: entry.petugas || '',
        catatan: entry.fotoNamaFile || undefined
      };
    } else if (isRombongPayment) {
      // Find matching rombong first from state list
      const matched = (rombongList || []).find(r => {
        if (!r || !r.namaPemilik) return false;
        const cleanRName = (r.namaPemilik || '').replace(/^(bp\.|ibu|bu|pak|bpk|sdr\.)\s+/i, '').trim().toLowerCase();
        const cleanEntryDesc = (entry.deskripsi || '').toLowerCase();
        
        const nameMatch = cleanEntryDesc.includes(cleanRName) || (r.namaPemilik && cleanEntryDesc.includes(r.namaPemilik.toLowerCase()));
        const lapakMatch = r.noLapak && cleanEntryDesc.includes(r.noLapak.toLowerCase());
        return nameMatch && lapakMatch;
      });

      let bulan = entry.tanggal || '';
      let tahun = entry.tahun || (entry.tanggal ? new Date(entry.tanggal).getFullYear() : new Date().getFullYear());
      if (isNaN(tahun)) {
        tahun = new Date().getFullYear();
      }
      const kolektifMatch = (entry.deskripsi || '').match(/Kolektif \(([^)]+)\)/);
      if (kolektifMatch) {
        bulan = kolektifMatch[1];
      } else {
        const bulanMatch = (entry.deskripsi || '').match(/Bulan ([a-zA-Z\s,]+)\s+(\d{4})/);
        if (bulanMatch) {
          bulan = bulanMatch[1];
          tahun = parseInt(bulanMatch[2], 10);
        }
      }

      return {
        id: matched?.id || entry.id || '',
        nama: matched?.namaPemilik || ((entry.deskripsi || '').match(/ - ([^(]+)\(([^)]+)\)/)?.[1]?.trim() || 'Pemilik Rombong'),
        tipe: 'rombong' as const,
        noLapak: matched?.noLapak || ((entry.deskripsi || '').match(/ - ([^(]+)\(([^)]+)\)/)?.[2]?.trim() || ''),
        noWa: matched?.noWa || '',
        category: 'Iuran Rombong',
        bulan: bulan,
        tahun: tahun,
        nominal: entry.jumlah,
        tanggalBayar: entry.tanggal || '',
        jamBayar: '00:00',
        kasPenerima: entry.sumberKas || '',
        petugas: entry.petugas || '',
        catatan: entry.fotoNamaFile || undefined
      };
    }

    // Fallback for all other general income / dana masuk transactions
    let penyetorNama = 'Penyetor Kas';
    const rawDesc = (entry.deskripsi || '').trim();
    
    // Extract clean person name from description without appending transaction explanation
    const nameMatch = rawDesc.match(/(?:dari|oleh|penyetor)\s+([a-zA-Z0-9\s.'-]+)/i);
    let extracted = '';
    
    if (nameMatch && nameMatch[1]) {
      extracted = nameMatch[1].trim();
    } else {
      const titleMatch = rawDesc.match(/^(?:bapak|ibu|pak|bu|sdr|sdri)\s+([a-zA-Z0-9\s.'-]+)/i);
      if (titleMatch && titleMatch[0]) {
        extracted = titleMatch[0].trim();
      }
    }

    if (extracted) {
      // Truncate at prepositions or explanation keywords
      const cutMatch = extracted.match(/^(.+?)(?=\s+(?:untuk|guna|pembelian|peruntukan|sebesar|pembangunan|penjualan|iuran|hibah|kas|rt|rw|via|rek|bank|nominal|tgl|tanggal|periode|acara|\d|,|;|-|\()|$)/i);
      if (cutMatch && cutMatch[1].trim().length > 0) {
        extracted = cutMatch[1].trim();
      }
      extracted = extracted.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
      
      const invalidTerms = ['kas', 'pemasukan', 'iuran', 'hibah', 'rombong', 'penjualan', 'bank', 'umum', 'operasional'];
      if (extracted.length >= 2 && !invalidTerms.includes(extracted.toLowerCase())) {
        penyetorNama = extracted.replace(/\b\w/g, c => c.toUpperCase());
      }
    }

    const bulan = entry.tanggal || '';
    const tahun = entry.tahun || (entry.tanggal ? parseInt(entry.tanggal.split('-')[0]) || new Date().getFullYear() : new Date().getFullYear());

    return {
      id: entry.id || '',
      nama: penyetorNama,
      tipe: 'warga' as const,
      blok: 'RT 08',
      noRumah: 'RW 04',
      noWa: '',
      category: entry.kategori || 'Pemasukan Kas',
      bulan: bulan,
      tahun: tahun,
      nominal: entry.jumlah,
      tanggalBayar: entry.tanggal || '',
      jamBayar: '00:00',
      kasPenerima: entry.sumberKas || '',
      petugas: entry.petugas || '',
      catatan: entry.deskripsi || undefined
    };
  };

  const [viewMode, setViewMode] = useState<'jurnal' | 'tabelaris'>('jurnal');

  // Image Cropper States & Helpers
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState('');
  const [cropperAspectRatio, setCropperAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');
  const [cropperTitle, setCropperTitle] = useState('Potong Gambar');
  const [cropperCallback, setCropperCallback] = useState<((cropped: string) => void) | null>(null);

  const triggerCropper = (imageSrc: string, aspect: 'free' | '1:1' | '4:3' | '16:9', title: string, onDone: (cropped: string) => void) => {
    setCropperImageSrc(imageSrc);
    setCropperAspectRatio(aspect);
    setCropperTitle(title);
    setCropperCallback(() => onDone);
    setCropperOpen(true);
  };

  const ALL_CATEGORIES = ['Petty Kas', 'Kas Umum RT', 'Kas Rombong'];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Petty Kas', 'Kas Umum RT', 'Kas Rombong']);
  const [dateFilterMode, setDateFilterMode] = useState<'monthYear' | 'dateRange'>('monthYear');
  const [selectedYear, setSelectedYear] = useState<string>('semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      let next: string[];
      if (prev.includes(cat)) {
        next = prev.filter(c => c !== cat);
      } else {
        next = [...prev, cat];
      }
      return next;
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories([...ALL_CATEGORIES]);
  };

  const getPeriodSummary = () => {
    if (dateFilterMode === 'dateRange') {
      if (startDate && endDate) {
        return `${startDate} s.d. ${endDate}`;
      } else if (startDate) {
        return `Mulai ${startDate}`;
      } else if (endDate) {
        return `Sampai ${endDate}`;
      }
      return 'Semua Rentang Tanggal';
    } else {
      if (selectedMonth === 'semua' && selectedYear === 'semua') {
        return 'Semua Transaksi Buku Kas';
      }
      const monthName = selectedMonth !== 'semua' ? INDO_MONTHS.find(m => m.value === selectedMonth)?.name : 'Semua Bulan';
      const yearName = selectedYear !== 'semua' ? selectedYear : 'Semua Tahun';
      return `${monthName} ${yearName}`;
    }
  };

  const getCategorySummary = () => {
    if (selectedCategories.length === ALL_CATEGORIES.length || selectedCategories.length === 0) {
      return 'Semua Kategori (Petty Kas, Kas Umum RT, Kas Rombong)';
    }
    return selectedCategories.join(', ');
  };
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ deskripsi: string; fotoBase64: string; fotoNamaFile: string } | null>(null);
  const [reprintReceiptInfo, setReprintReceiptInfo] = useState<any | null>(null);
  const [reprintReceiptPNGUrl, setReprintReceiptPNGUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (reprintReceiptInfo) {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        drawReceiptOnCanvas(reprintReceiptInfo, canvas);
        const url = canvas.toDataURL('image/png');
        setReprintReceiptPNGUrl(url);
      }
    } else {
      setReprintReceiptPNGUrl(null);
    }
  }, [reprintReceiptInfo]);
  const [entryToDelete, setEntryToDelete] = useState<{ 
    id: string; 
    jumlah: number; 
    tipe: 'pemasukan' | 'pengeluaran'; 
    sumberKas: keyof Balance; 
    deskripsi: string; 
  } | null>(null);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<LedgerEntry | null>(null);
  const [isAmountLocked, setIsAmountLocked] = useState<boolean>(true);

  React.useEffect(() => {
    if (!editingLedgerEntry) {
      setIsAmountLocked(true);
    }
  }, [editingLedgerEntry]);

  const INDO_MONTHS = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' }
  ];

  const getLastDayOfMonth = (month: string, year: string): number => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(y)) return 31;
    return new Date(y, m, 0).getDate();
  };

  const cleanSignatureName = (nama: string) => {
    return nama.replace(/\s*\(.*\)\s*/g, '').trim();
  };

  const adminUser = usersList.find(u => u.role === 'admin');
  const bendaharaUser = usersList.find(u => u.role === 'bendahara');

  const adminName = adminUser ? cleanSignatureName(adminUser.nama) : 'Bp. Sutriadi';
  const bendaharaName = bendaharaUser ? cleanSignatureName(bendaharaUser.nama) : 'Heri Gunawan';

  const allowedPhotos = isLoggedIn && currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'bendahara' || 
    currentUser.role === 'sekretaris'
  );

  // Precompute perfect running balances on the complete sequence of transactions (including corrections)
  const allSortedWithBalances = React.useMemo(() => {
    const mapped = ledger.map(entry => {
      let kategori = entry.kategori;
      const originalKategori = entry.kategori;
      const catLower = (kategori || '').toLowerCase();
      if (catLower.includes('rombong')) {
        kategori = 'Kas Rombong';
      } else if (catLower.includes('petty') || catLower.includes('kecil')) {
        kategori = 'Petty Kas';
      } else {
        kategori = 'Kas Umum RT';
      }
      return { ...entry, kategori, originalKategori };
    });

    const sortedAll = mapped.sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return a.tanggal.localeCompare(b.tanggal);
      }
      return a.id.localeCompare(b.id);
    });

    const seqCounters: Record<string, { ksub: number; bsub: number }> = {};
    let rtTunaiRunning = 0;
    let rtPettyCashRunning = 0;
    let rtBankRunning = 0;
    let rbRunning = 0; // rombongTunai
    let bkRunning = 0; // rombongBank

    return sortedAll.map((item) => {
      const dateParts = item.tanggal.split('-');
      const year = dateParts[0] || '2026';
      const month = dateParts[1] || '01';
      const yy = year.substring(2);
      const mm = month;
      const monthKey = `${year}-${month}`;

      if (!seqCounters[monthKey]) {
        seqCounters[monthKey] = { ksub: 0, bsub: 0 };
      }

      const isBank = item.sumberKas === 'rtBank' || item.sumberKas === 'rombongBank';
      let noBukti = '';
      if (isBank) {
        seqCounters[monthKey].bsub += 1;
        noBukti = `BSUB.${yy}.${mm}.${String(seqCounters[monthKey].bsub).padStart(3, '0')}`;
      } else {
        seqCounters[monthKey].ksub += 1;
        noBukti = `KSUB.${yy}.${mm}.${String(seqCounters[monthKey].ksub).padStart(3, '0')}`;
      }

      let rtTunaiDebit = 0, rtTunaiKredit = 0;
      let rtPettyCashDebit = 0, rtPettyCashKredit = 0;
      let rtBankDebit = 0, rtBankKredit = 0;
      let rbDebit = 0, rbKredit = 0;
      let bkDebit = 0, bkKredit = 0;

      const val = item.jumlah;
      const isPemasukan = item.tipe === 'pemasukan';
      const isHandover = item.kategori === 'Penarikan Dana Kolektor';

      if (isHandover) {
        // Exclude from changing running balances
      } else {
        if (item.sumberKas === 'rtTunai') {
          if (isPemasukan) {
            rtTunaiDebit = val;
            rtTunaiRunning += val;
          } else {
            rtTunaiKredit = val;
            rtTunaiRunning -= val;
          }
        } else if (item.sumberKas === 'rtPettyCash') {
          if (isPemasukan) {
            rtPettyCashDebit = val;
            rtPettyCashRunning += val;
          } else {
            rtPettyCashKredit = val;
            rtPettyCashRunning -= val;
          }
        } else if (item.sumberKas === 'rtBank') {
          if (isPemasukan) {
            rtBankDebit = val;
            rtBankRunning += val;
          } else {
            rtBankKredit = val;
            rtBankRunning -= val;
          }
        } else if (item.sumberKas === 'rombongTunai') {
          if (isPemasukan) {
            rbDebit = val;
            rbRunning += val;
          } else {
            rbKredit = val;
            rbRunning -= val;
          }
        } else if (item.sumberKas === 'rombongBank') {
          if (isPemasukan) {
            bkDebit = val;
            bkRunning += val;
          } else {
            bkKredit = val;
            bkRunning -= val;
          }
        }
      }

      return {
        ...item,
        noBukti,
        rtTunaiDebit,
        rtTunaiKredit,
        rtTunaiRunning,
        rtPettyCashDebit,
        rtPettyCashKredit,
        rtPettyCashRunning,
        rtBankDebit,
        rtBankKredit,
        rtBankRunning,
        rbDebit,
        rbKredit,
        rbRunning,
        bkDebit,
        bkKredit,
        bkRunning,
        totalRTRunning: rtTunaiRunning + rtPettyCashRunning + rtBankRunning,
        totalRombongRunning: rbRunning + bkRunning,
        totalRunning: rtTunaiRunning + rtPettyCashRunning + rtBankRunning + rbRunning + bkRunning
      };
    });
  }, [ledger]);

  // Preprocess ledger to filter out 0-impact administrative logs while preserving true cash modifications
  const processedLedger = React.useMemo(() => {
    return allSortedWithBalances.filter(entry => {
      const isZero = entry.jumlah === 0;
      if (entry.kategori === 'Koreksi Data' && isZero) return false;
      const descLower = (entry.deskripsi || '').toLowerCase();
      if (descLower.includes('koreksi massal') && isZero) return false;
      if (descLower.includes('[koreksi administratif]') && isZero) return false;
      if (descLower.includes('modifikasi data warga') && isZero) return false;
      return true;
    });
  }, [allSortedWithBalances]);

  // Fixed 3 primary categories for Laporan Kas
  const categories = ['Semua', 'Petty Kas', 'Kas Umum RT', 'Kas Rombong'];

  const handleDeleteLedgerEntry = (id: string, jumlah: number, tipe: 'pemasukan' | 'pengeluaran', sumberKas: keyof Balance, deskripsi: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    setEntryToDelete({ id, jumlah, tipe, sumberKas, deskripsi });
  };

  const handleUpdateLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLedgerEntry) return;

    const originalEntry = ledger.find(item => item.id === editingLedgerEntry.id);
    if (!originalEntry) return;

    const oldSumber = originalEntry.sumberKas;
    const oldJumlah = originalEntry.jumlah;
    const oldTipe = originalEntry.tipe;

    const newSumber = editingLedgerEntry.sumberKas;
    const newJumlah = editingLedgerEntry.jumlah;
    const newTipe = editingLedgerEntry.tipe;

    if (oldSumber !== newSumber || oldJumlah !== newJumlah || oldTipe !== newTipe) {
      const nextKas = { ...kas };

      // Reverse original account balance change
      if (oldTipe === 'pemasukan') {
        nextKas[oldSumber] = (nextKas[oldSumber] || 0) - oldJumlah;
      } else {
        nextKas[oldSumber] = (nextKas[oldSumber] || 0) + oldJumlah;
      }

      // Apply new account balance change
      if (newTipe === 'pemasukan') {
        nextKas[newSumber] = (nextKas[newSumber] || 0) + newJumlah;
      } else {
        nextKas[newSumber] = (nextKas[newSumber] || 0) - newJumlah;
      }

      updateKas(nextKas);
    }

    const updatedLedger = ledger.map(item => {
      if (item.id === editingLedgerEntry.id) {
        return {
          ...item,
          tanggal: editingLedgerEntry.tanggal,
          tanggalInput: editingLedgerEntry.tanggalInput || new Date().toISOString().split('T')[0],
          deskripsi: editingLedgerEntry.deskripsi,
          kategori: editingLedgerEntry.kategori,
          petugas: editingLedgerEntry.petugas,
          sumberKas: editingLedgerEntry.sumberKas,
          jumlah: editingLedgerEntry.jumlah,
          tipe: editingLedgerEntry.tipe
        };
      }
      return item;
    });

    setLedger(updatedLedger);
    setEditingLedgerEntry(null);
  };

  // Use processedLedger directly since running balances are already pre-computed on the full list
  const tabularData = React.useMemo(() => {
    return processedLedger;
  }, [processedLedger]);

  // Find start boundary date based on standard filters
  const startBoundaryDate = React.useMemo(() => {
    if (dateFilterMode === 'dateRange') {
      return startDate ? startDate : null;
    }
    if (selectedYear === 'semua') return null;
    if (selectedMonth === 'semua') {
      return `${selectedYear}-01-01`;
    }
    return `${selectedYear}-${selectedMonth}-01`;
  }, [dateFilterMode, startDate, selectedYear, selectedMonth]);

  // Calculate opening balances based strictly on transactions prior to the selected period
  const saldoAwal = React.useMemo(() => {
    if (!startBoundaryDate) {
      return { rtTunai: 0, rtPettyCash: 0, rtBank: 0, rb: 0, bk: 0, totalRT: 0, totalRombong: 0, total: 0 };
    }

    const priorEntries = tabularData.filter(e => e.tanggal < startBoundaryDate);
    if (priorEntries.length === 0) {
      return { rtTunai: 0, rtPettyCash: 0, rtBank: 0, rb: 0, bk: 0, totalRT: 0, totalRombong: 0, total: 0 };
    }

    const lastPrior = priorEntries[priorEntries.length - 1];
    return {
      rtTunai: lastPrior.rtTunaiRunning,
      rtPettyCash: lastPrior.rtPettyCashRunning,
      rtBank: lastPrior.rtBankRunning,
      rb: lastPrior.rbRunning,
      bk: lastPrior.bkRunning,
      totalRT: lastPrior.totalRTRunning,
      totalRombong: lastPrior.totalRombongRunning,
      total: lastPrior.totalRunning
    };
  }, [tabularData, startBoundaryDate]);

  // General Filtered Ledger list for the portrait mode "Jurnal"
  const filteredLedger = processedLedger.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const cat = (entry.kategori || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    const matchesSearch = desc.includes(searchTerm.toLowerCase()) ||
                          cat.includes(searchTerm.toLowerCase()) ||
                          pet.includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'semua' || entry.tipe === selectedType;

    const matchesCategory = selectedCategories.length === 0 || 
                          selectedCategories.length === ALL_CATEGORIES.length || 
                          selectedCategories.includes(entry.kategori);

    let matchesDate = true;
    if (dateFilterMode === 'dateRange') {
      if (startDate && entry.tanggal < startDate) matchesDate = false;
      if (endDate && entry.tanggal > endDate) matchesDate = false;
    } else {
      if (entry.tanggal) {
        const parts = entry.tanggal.split('-');
        if (parts.length >= 2) {
          const entryYear = parts[0];
          const entryMonth = parts[1];

          const yearMatch = selectedYear === 'semua' || entryYear === selectedYear;
          const monthMatch = selectedMonth === 'semua' || entryMonth === selectedMonth;
          matchesDate = yearMatch && monthMatch;
        }
      }
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  // Universal helper to detect internal non-operational transfers (mutasi bank, petty cash transfer, alokasi dana, etc.)
  const isInternalMutationOrTransfer = (e: any): boolean => {
    if (!e) return false;
    const orig = ((e.originalKategori || e.kategori) || '').toLowerCase().trim();
    const cat = (e.kategori || '').toLowerCase().trim();
    const desc = (e.deskripsi || '').toLowerCase().trim();

    // 1. Exact Category / Tag Match
    if (
      orig === 'setor bank' ||
      orig === 'mutasi bank-petty' ||
      orig === 'mutasi bank-kas' ||
      orig === 'mutasi kas' ||
      orig === 'transfer kas' ||
      orig === 'penarikan dana kolektor' ||
      orig === 'penyesuaian saldo' ||
      cat === 'setor bank' ||
      cat === 'mutasi bank-petty' ||
      cat === 'mutasi bank-kas' ||
      cat === 'mutasi kas' ||
      cat === 'transfer kas' ||
      cat === 'penarikan dana kolektor' ||
      cat === 'penyesuaian saldo'
    ) {
      return true;
    }

    // 2. Keyword Match in Category
    if (
      orig.includes('mutasi') ||
      orig.includes('setor bank') ||
      orig.includes('pemindahbukuan') ||
      orig.includes('penarikan dana kolektor') ||
      orig.includes('alokasi dana') ||
      cat.includes('mutasi') ||
      cat.includes('setor bank') ||
      cat.includes('pemindahbukuan') ||
      cat.includes('penarikan dana kolektor') ||
      cat.includes('alokasi dana')
    ) {
      return true;
    }

    // 3. Keyword Match in Description (all variants of petty cash, bank, and cash transfers)
    if (
      desc.includes('mutasi') ||
      desc.includes('setor bank') ||
      desc.includes('pemindahbukuan') ||
      desc.includes('penarikan dana kolektor') ||
      desc.includes('alokasi dana') ||
      desc.includes('pengembalian dana') ||
      desc.includes('petty cash ke') ||
      desc.includes('ke petty cash') ||
      desc.includes('petty ke') ||
      desc.includes('ke petty') ||
      desc.includes('kas kecil ke') ||
      desc.includes('ke kas kecil') ||
      desc.includes('dari kas kecil') ||
      desc.includes('dari petty cash') ||
      desc.includes('isi kas kecil') ||
      desc.includes('mengisi kas kecil') ||
      desc.includes('pengisian kas kecil') ||
      desc.includes('tarik kas bank') ||
      desc.includes('tarik dari bank') ||
      desc.includes('penyetoran sisa') ||
      desc.includes('penyesuaian saldo') ||
      desc.includes('saldo opname') ||
      desc.includes('transfer kas') ||
      desc.includes('transfer antar') ||
      desc.includes('pindah kas') ||
      desc.includes('pindah dana')
    ) {
      return true;
    }

    return false;
  };

  const totalPemasukan = filteredLedger
    .filter(e => 
      e.tipe === 'pemasukan' && 
      !isInternalMutationOrTransfer(e)
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  const totalPengeluaran = filteredLedger
    .filter(e => 
      e.tipe === 'pengeluaran' && 
      !isInternalMutationOrTransfer(e)
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  // Laporan Cepat: Debit/Kredit for Kas RT (Umum + Petty) vs Kas Rombong with Mutasi Filter
  const quickSummary = React.useMemo(() => {
    // Entries matching date filter
    const dateFiltered = processedLedger.filter(entry => {
      let matchesDate = true;
      if (dateFilterMode === 'dateRange') {
        if (startDate && entry.tanggal < startDate) matchesDate = false;
        if (endDate && entry.tanggal > endDate) matchesDate = false;
      } else {
        if (entry.tanggal) {
          const parts = entry.tanggal.split('-');
          if (parts.length >= 2) {
            const entryYear = parts[0];
            const entryMonth = parts[1];
            const yearMatch = selectedYear === 'semua' || entryYear === selectedYear;
            const monthMatch = selectedMonth === 'semua' || entryMonth === selectedMonth;
            matchesDate = yearMatch && monthMatch;
          }
        }
      }
      return matchesDate;
    });

    // Kas RT = 'Kas Umum RT' or 'Petty Kas' or source is rtTunai / rtPettyCash / rtBank
    const rtEntries = dateFiltered.filter(e => {
      const src = e.sumberKas;
      if (src === 'rtTunai' || src === 'rtPettyCash' || src === 'rtBank') return true;
      if (src === 'rombongTunai' || src === 'rombongBank') return false;
      return e.kategori === 'Kas Umum RT' || e.kategori === 'Petty Kas';
    });

    // Kas Rombong = 'Kas Rombong' or source is rombongTunai / rombongBank
    const rbEntries = dateFiltered.filter(e => {
      const src = e.sumberKas;
      if (src === 'rombongTunai' || src === 'rombongBank') return true;
      if (src === 'rtTunai' || src === 'rtPettyCash' || src === 'rtBank') return false;
      return e.kategori === 'Kas Rombong';
    });

    // Real Kas RT (Excluding all internal mutations and transfers)
    const rtDebit = rtEntries
      .filter(e => e.tipe === 'pemasukan' && !isInternalMutationOrTransfer(e))
      .reduce((sum, e) => sum + e.jumlah, 0);

    const rtKredit = rtEntries
      .filter(e => e.tipe === 'pengeluaran' && !isInternalMutationOrTransfer(e))
      .reduce((sum, e) => sum + e.jumlah, 0);

    const rtMutasiOut = rtEntries
      .filter(e => isInternalMutationOrTransfer(e) && e.tipe === 'pengeluaran')
      .reduce((sum, e) => sum + e.jumlah, 0);
    const rtMutasiIn = rtEntries
      .filter(e => isInternalMutationOrTransfer(e) && e.tipe === 'pemasukan')
      .reduce((sum, e) => sum + e.jumlah, 0);
    const rtMutasi = Math.max(rtMutasiOut, rtMutasiIn);

    // Real Kas Rombong (Excluding all internal mutations and transfers)
    const rbDebit = rbEntries
      .filter(e => e.tipe === 'pemasukan' && !isInternalMutationOrTransfer(e))
      .reduce((sum, e) => sum + e.jumlah, 0);

    const rbKredit = rbEntries
      .filter(e => e.tipe === 'pengeluaran' && !isInternalMutationOrTransfer(e))
      .reduce((sum, e) => sum + e.jumlah, 0);

    const rbMutasiOut = rbEntries
      .filter(e => isInternalMutationOrTransfer(e) && e.tipe === 'pengeluaran')
      .reduce((sum, e) => sum + e.jumlah, 0);
    const rbMutasiIn = rbEntries
      .filter(e => isInternalMutationOrTransfer(e) && e.tipe === 'pemasukan')
      .reduce((sum, e) => sum + e.jumlah, 0);
    const rbMutasi = Math.max(rbMutasiOut, rbMutasiIn);

    const totalDebit = rtDebit + rbDebit;
    const totalKredit = rtKredit + rbKredit;
    const totalSurplus = totalDebit - totalKredit;
    const totalMutasi = rtMutasi + rbMutasi;

    return {
      rtDebit,
      rtKredit,
      rtNet: rtDebit - rtKredit,
      rtMutasi,
      rbDebit,
      rbKredit,
      rbNet: rbDebit - rbKredit,
      rbMutasi,
      totalDebit,
      totalKredit,
      totalSurplus,
      totalMutasi
    };
  }, [processedLedger, dateFilterMode, startDate, endDate, selectedYear, selectedMonth]);

  // Filtered tabular rows (sorted ascending) for the tabular spreadsheet display
  const visibleTabularRows = React.useMemo(() => {
    return tabularData.filter(entry => {
      const desc = (entry.deskripsi || '').toLowerCase();
      const cat = (entry.kategori || '').toLowerCase();
      const pet = (entry.petugas || '').toLowerCase();
      const matchesSearch = desc.includes(searchTerm.toLowerCase()) ||
                            cat.includes(searchTerm.toLowerCase()) ||
                            pet.includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'semua' || entry.tipe === selectedType;

      const matchesCategory = selectedCategories.length === 0 || 
                            selectedCategories.length === ALL_CATEGORIES.length || 
                            selectedCategories.includes(entry.kategori);

      let matchesDate = true;
      if (dateFilterMode === 'dateRange') {
        if (startDate && entry.tanggal < startDate) matchesDate = false;
        if (endDate && entry.tanggal > endDate) matchesDate = false;
      } else {
        if (entry.tanggal) {
          const parts = entry.tanggal.split('-');
          if (parts.length >= 2) {
            const entryYear = parts[0];
            const entryMonth = parts[1];

            const yearMatch = selectedYear === 'semua' || entryYear === selectedYear;
            const monthMatch = selectedMonth === 'semua' || entryMonth === selectedMonth;
            matchesDate = yearMatch && monthMatch;
          }
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [tabularData, searchTerm, selectedType, selectedCategories, dateFilterMode, startDate, endDate, selectedYear, selectedMonth]);

  // Sum periodic totals for the spreadsheet footer
  const totalsTabular = React.useMemo(() => {
    let sumRtTunaiDebit = 0, sumRtTunaiKredit = 0;
    let sumRtPettyCashDebit = 0, sumRtPettyCashKredit = 0;
    let sumRtBankDebit = 0, sumRtBankKredit = 0;
    let sumRbDebit = 0, sumRbKredit = 0;
    let sumBkDebit = 0, sumBkKredit = 0;

    visibleTabularRows.forEach(row => {
      sumRtTunaiDebit += row.rtTunaiDebit || 0;
      sumRtTunaiKredit += row.rtTunaiKredit || 0;
      sumRtPettyCashDebit += row.rtPettyCashDebit || 0;
      sumRtPettyCashKredit += row.rtPettyCashKredit || 0;
      sumRtBankDebit += row.rtBankDebit || 0;
      sumRtBankKredit += row.rtBankKredit || 0;
      sumRbDebit += row.rbDebit || 0;
      sumRbKredit += row.rbKredit || 0;
      sumBkDebit += row.bkDebit || 0;
      sumBkKredit += row.bkKredit || 0;
    });

    const lastRow = visibleTabularRows[visibleTabularRows.length - 1];
    
    return {
      rtTunaiDebit: sumRtTunaiDebit,
      rtTunaiKredit: sumRtTunaiKredit,
      rtTunaiRunning: lastRow ? lastRow.rtTunaiRunning : saldoAwal.rtTunai,
      rtPettyCashDebit: sumRtPettyCashDebit,
      rtPettyCashKredit: sumRtPettyCashKredit,
      rtPettyCashRunning: lastRow ? lastRow.rtPettyCashRunning : saldoAwal.rtPettyCash,
      rtBankDebit: sumRtBankDebit,
      rtBankKredit: sumRtBankKredit,
      rtBankRunning: lastRow ? lastRow.rtBankRunning : saldoAwal.rtBank,
      rbDebit: sumRbDebit,
      rbKredit: sumRbKredit,
      rbRunning: lastRow ? lastRow.rbRunning : saldoAwal.rb,
      bkDebit: sumBkDebit,
      bkKredit: sumBkKredit,
      bkRunning: lastRow ? lastRow.bkRunning : saldoAwal.bk,
      totalRTRunning: lastRow ? lastRow.totalRTRunning : saldoAwal.totalRT,
      totalRombongRunning: lastRow ? lastRow.totalRombongRunning : saldoAwal.totalRombong,
      totalRunning: lastRow ? lastRow.totalRunning : saldoAwal.total
    };
  }, [visibleTabularRows, saldoAwal]);

  const handleExportExcel = () => {
    let periodStr = 'Semua_Periode';
    let periodDisplayTitle = 'Semua Periode';
    
    if (dateFilterMode === 'dateRange') {
      if (startDate && endDate) {
        periodStr = `${startDate}_sd_${endDate}`;
        periodDisplayTitle = `${startDate} s/d ${endDate}`;
      } else if (startDate) {
        periodStr = `Mulai_${startDate}`;
        periodDisplayTitle = `Mulai ${startDate}`;
      } else if (endDate) {
        periodStr = `Sampai_${endDate}`;
        periodDisplayTitle = `Sampai ${endDate}`;
      }
    } else if (selectedYear !== 'semua') {
      periodStr = `${selectedYear}`;
      if (selectedMonth !== 'semua') {
        const monthIndex = parseInt(selectedMonth, 10) - 1;
        const name = INDO_MONTHS[monthIndex]?.name || 'Bulan';
        periodStr = `${name}_${selectedYear}`;
        periodDisplayTitle = `${name} ${selectedYear}`;
      } else {
        periodDisplayTitle = `Tahun ${selectedYear}`;
      }
    }

    if (viewMode === 'tabelaris') {
      // 1. Export in native XLSX with real Excel formulas and synchronized balances
      const wb = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = {};

      // Title & Header Information (Rows 1-3)
      ws['A1'] = { t: 's', v: 'REKAP TABELARIS BUKU KAS RT 08 / RW 04' };
      ws['A2'] = { t: 's', v: `Periode: ${periodDisplayTitle}` };
      ws['A3'] = { t: 's', v: '*File ini dilengkapi formula Excel dinamis & saldo tersinkronisasi. Perubahan nilai Debit/Kredit otomatis memperbarui seluruh saldo.' };

      // Row 5: Header Tier 1
      ws['A5'] = { t: 's', v: 'TANGGAL' };
      ws['B5'] = { t: 's', v: 'NO BUKTI' };
      ws['C5'] = { t: 's', v: 'KAS / KETERANGAN TRANSAKSI' };
      ws['D5'] = { t: 's', v: 'PETUGAS' };
      ws['E5'] = { t: 's', v: 'TOTAL KAS RT (IURAN, KECIL & BANK)' };
      ws['O5'] = { t: 's', v: 'TOTAL KAS ROMBONG (TUNAI & BANK)' };
      ws['V5'] = { t: 's', v: 'GRAND TOTAL KAS (KAS UMUM)' };

      // Row 6: Header Tier 2
      ws['E6'] = { t: 's', v: 'IURAN RT (rtTunai)' };
      ws['H6'] = { t: 's', v: 'KAS KECIL (rtPettyCash)' };
      ws['K6'] = { t: 's', v: 'RT BANK (rtBank)' };
      ws['N6'] = { t: 's', v: 'TOTAL SALDO RT' };
      ws['O6'] = { t: 's', v: 'ROMBONG TUNAI (rombongTunai)' };
      ws['R6'] = { t: 's', v: 'ROMBONG BANK (rombongBank)' };
      ws['U6'] = { t: 's', v: 'TOTAL SALDO RB' };

      // Row 7: Header Tier 3
      ws['E7'] = { t: 's', v: 'DEBIT' };
      ws['F7'] = { t: 's', v: 'KREDIT' };
      ws['G7'] = { t: 's', v: 'SALDO' };
      ws['H7'] = { t: 's', v: 'DEBIT' };
      ws['I7'] = { t: 's', v: 'KREDIT' };
      ws['J7'] = { t: 's', v: 'SALDO' };
      ws['K7'] = { t: 's', v: 'DEBIT' };
      ws['L7'] = { t: 's', v: 'KREDIT' };
      ws['M7'] = { t: 's', v: 'SALDO' };
      ws['O7'] = { t: 's', v: 'DEBIT' };
      ws['P7'] = { t: 's', v: 'KREDIT' };
      ws['Q7'] = { t: 's', v: 'SALDO' };
      ws['R7'] = { t: 's', v: 'DEBIT' };
      ws['S7'] = { t: 's', v: 'KREDIT' };
      ws['T7'] = { t: 's', v: 'SALDO' };

      // Row 8: Saldo Awal (Periode Lalu)
      ws['C8'] = { t: 's', v: 'SALDO PERIODE LALU' };
      ws['E8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['F8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['G8'] = { t: 'n', v: saldoAwal.rtTunai || 0, z: '#,##0' };
      ws['H8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['I8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['J8'] = { t: 'n', v: saldoAwal.rtPettyCash || 0, z: '#,##0' };
      ws['K8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['L8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['M8'] = { t: 'n', v: saldoAwal.rtBank || 0, z: '#,##0' };
      ws['N8'] = { t: 'n', f: 'G8+J8+M8', v: saldoAwal.totalRT || 0, z: '#,##0' };
      ws['O8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['P8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['Q8'] = { t: 'n', v: saldoAwal.rb || 0, z: '#,##0' };
      ws['R8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['S8'] = { t: 'n', v: 0, z: '#,##0' };
      ws['T8'] = { t: 'n', v: saldoAwal.bk || 0, z: '#,##0' };
      ws['U8'] = { t: 'n', f: 'Q8+T8', v: saldoAwal.totalRombong || 0, z: '#,##0' };
      ws['V8'] = { t: 'n', f: 'N8+U8', v: saldoAwal.total || 0, z: '#,##0' };

      // Rows 9+: Transaction rows
      visibleTabularRows.forEach((row, idx) => {
        const r = idx + 9;
        const prevR = r - 1;

        ws[`A${r}`] = { t: 's', v: row.tanggal };
        ws[`B${r}`] = { t: 's', v: row.noBukti };
        ws[`C${r}`] = { t: 's', v: row.deskripsi };
        ws[`D${r}`] = { t: 's', v: row.petugas };

        // rtTunai
        ws[`E${r}`] = { t: 'n', v: row.rtTunaiDebit || 0, z: '#,##0' };
        ws[`F${r}`] = { t: 'n', v: row.rtTunaiKredit || 0, z: '#,##0' };
        ws[`G${r}`] = { t: 'n', f: `G${prevR}+E${r}-F${r}`, v: row.rtTunaiRunning, z: '#,##0' };

        // rtPettyCash
        ws[`H${r}`] = { t: 'n', v: row.rtPettyCashDebit || 0, z: '#,##0' };
        ws[`I${r}`] = { t: 'n', v: row.rtPettyCashKredit || 0, z: '#,##0' };
        ws[`J${r}`] = { t: 'n', f: `J${prevR}+H${r}-I${r}`, v: row.rtPettyCashRunning, z: '#,##0' };

        // rtBank
        ws[`K${r}`] = { t: 'n', v: row.rtBankDebit || 0, z: '#,##0' };
        ws[`L${r}`] = { t: 'n', v: row.rtBankKredit || 0, z: '#,##0' };
        ws[`M${r}`] = { t: 'n', f: `M${prevR}+K${r}-L${r}`, v: row.rtBankRunning, z: '#,##0' };

        // Total Saldo RT
        ws[`N${r}`] = { t: 'n', f: `G${r}+J${r}+M${r}`, v: row.totalRTRunning, z: '#,##0' };

        // rombongTunai (rb)
        ws[`O${r}`] = { t: 'n', v: row.rbDebit || 0, z: '#,##0' };
        ws[`P${r}`] = { t: 'n', v: row.rbKredit || 0, z: '#,##0' };
        ws[`Q${r}`] = { t: 'n', f: `Q${prevR}+O${r}-P${r}`, v: row.rbRunning, z: '#,##0' };

        // rombongBank (bk)
        ws[`R${r}`] = { t: 'n', v: row.bkDebit || 0, z: '#,##0' };
        ws[`S${r}`] = { t: 'n', v: row.bkKredit || 0, z: '#,##0' };
        ws[`T${r}`] = { t: 'n', f: `T${prevR}+R${r}-S${r}`, v: row.bkRunning, z: '#,##0' };

        // Total Saldo RB
        ws[`U${r}`] = { t: 'n', f: `Q${r}+T${r}`, v: row.totalRombongRunning, z: '#,##0' };

        // Grand Total
        ws[`V${r}`] = { t: 'n', f: `N${r}+U${r}`, v: row.totalRunning, z: '#,##0' };
      });

      const lastR = visibleTabularRows.length > 0 ? (8 + visibleTabularRows.length) : 8;
      const sumR = lastR + 1;

      // Summary row
      ws[`A${sumR}`] = { t: 's', v: 'TOTAL PERIODIK' };
      ws[`C${sumR}`] = { t: 's', v: 'REKAP TOTAL & AKUMULASI SALDO AKHIR PERIODE' };

      ws[`E${sumR}`] = { t: 'n', f: `SUM(E9:E${lastR})`, v: totalsTabular.rtTunaiDebit, z: '#,##0' };
      ws[`F${sumR}`] = { t: 'n', f: `SUM(F9:F${lastR})`, v: totalsTabular.rtTunaiKredit, z: '#,##0' };
      ws[`G${sumR}`] = { t: 'n', f: `G${lastR}`, v: totalsTabular.rtTunaiRunning, z: '#,##0' };

      ws[`H${sumR}`] = { t: 'n', f: `SUM(H9:H${lastR})`, v: totalsTabular.rtPettyCashDebit, z: '#,##0' };
      ws[`I${sumR}`] = { t: 'n', f: `SUM(I9:I${lastR})`, v: totalsTabular.rtPettyCashKredit, z: '#,##0' };
      ws[`J${sumR}`] = { t: 'n', f: `J${lastR}`, v: totalsTabular.rtPettyCashRunning, z: '#,##0' };

      ws[`K${sumR}`] = { t: 'n', f: `SUM(K9:K${lastR})`, v: totalsTabular.rtBankDebit, z: '#,##0' };
      ws[`L${sumR}`] = { t: 'n', f: `SUM(L9:L${lastR})`, v: totalsTabular.rtBankKredit, z: '#,##0' };
      ws[`M${sumR}`] = { t: 'n', f: `M${lastR}`, v: totalsTabular.rtBankRunning, z: '#,##0' };

      ws[`N${sumR}`] = { t: 'n', f: `G${sumR}+J${sumR}+M${sumR}`, v: totalsTabular.totalRTRunning, z: '#,##0' };

      ws[`O${sumR}`] = { t: 'n', f: `SUM(O9:O${lastR})`, v: totalsTabular.rbDebit, z: '#,##0' };
      ws[`P${sumR}`] = { t: 'n', f: `SUM(P9:P${lastR})`, v: totalsTabular.rbKredit, z: '#,##0' };
      ws[`Q${sumR}`] = { t: 'n', f: `Q${lastR}`, v: totalsTabular.rbRunning, z: '#,##0' };

      ws[`R${sumR}`] = { t: 'n', f: `SUM(R9:R${lastR})`, v: totalsTabular.bkDebit, z: '#,##0' };
      ws[`S${sumR}`] = { t: 'n', f: `SUM(S9:S${lastR})`, v: totalsTabular.bkKredit, z: '#,##0' };
      ws[`T${sumR}`] = { t: 'n', f: `T${lastR}`, v: totalsTabular.bkRunning, z: '#,##0' };

      ws[`U${sumR}`] = { t: 'n', f: `Q${sumR}+T${sumR}`, v: totalsTabular.totalRombongRunning, z: '#,##0' };
      ws[`V${sumR}`] = { t: 'n', f: `N${sumR}+U${sumR}`, v: totalsTabular.totalRunning, z: '#,##0' };

      // Set sheet metadata
      ws['!ref'] = `A1:V${sumR}`;
      ws['!cols'] = [
        { wch: 12 }, // A: Tanggal
        { wch: 16 }, // B: No Bukti
        { wch: 45 }, // C: Deskripsi
        { wch: 22 }, // D: Petugas
        { wch: 14 }, // E: rtTunai Debit
        { wch: 14 }, // F: rtTunai Kredit
        { wch: 16 }, // G: rtTunai Saldo
        { wch: 14 }, // H: rtPettyCash Debit
        { wch: 14 }, // I: rtPettyCash Kredit
        { wch: 16 }, // J: rtPettyCash Saldo
        { wch: 14 }, // K: rtBank Debit
        { wch: 14 }, // L: rtBank Kredit
        { wch: 16 }, // M: rtBank Saldo
        { wch: 18 }, // N: Total Saldo RT
        { wch: 14 }, // O: rb Debit
        { wch: 14 }, // P: rb Kredit
        { wch: 16 }, // Q: rb Saldo
        { wch: 14 }, // R: bk Debit
        { wch: 14 }, // S: bk Kredit
        { wch: 16 }, // T: bk Saldo
        { wch: 18 }, // U: Total Saldo RB
        { wch: 20 }  // V: Grand Total Kas
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 21 } }, // Periode
        { s: { r: 2, c: 0 }, e: { r: 2, c: 21 } }, // Note

        // Table Header mergers
        { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } }, // A5:A7 TANGGAL
        { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } }, // B5:B7 NO BUKTI
        { s: { r: 4, c: 2 }, e: { r: 6, c: 2 } }, // C5:C7 DESKRIPSI
        { s: { r: 4, c: 3 }, e: { r: 6, c: 3 } }, // D5:D7 PETUGAS
        { s: { r: 4, c: 4 }, e: { r: 4, c: 13 } }, // E5:N5 TOTAL KAS RT
        { s: { r: 4, c: 14 }, e: { r: 4, c: 20 } }, // O5:U5 TOTAL KAS ROMBONG
        { s: { r: 4, c: 21 }, e: { r: 6, c: 21 } }, // V5:V7 GRAND TOTAL KAS

        { s: { r: 5, c: 4 }, e: { r: 5, c: 6 } }, // E6:G6 IURAN RT
        { s: { r: 5, c: 7 }, e: { r: 5, c: 9 } }, // H6:J6 KAS KECIL
        { s: { r: 5, c: 10 }, e: { r: 5, c: 12 } }, // K6:M6 RT BANK
        { s: { r: 5, c: 13 }, e: { r: 6, c: 13 } }, // N6:N7 TOTAL SALDO RT
        { s: { r: 5, c: 14 }, e: { r: 5, c: 16 } }, // O6:Q6 ROMBONG TUNAI
        { s: { r: 5, c: 17 }, e: { r: 5, c: 19 } }, // R6:T6 ROMBONG BANK
        { s: { r: 5, c: 20 }, e: { r: 6, c: 20 } }  // U6:U7 TOTAL SALDO RB
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Tabelaris Kas RT08');
      XLSX.writeFile(wb, `Laporan_Tabelaris_Buku_Kas_RT08_${periodStr}.xlsx`);

    } else {
      // 2. Export standard ledger report in XLSX
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [
        ['LAPORAN BUKU KAS UMUM RT 08 / RW 04'],
        [`Periode: ${periodDisplayTitle}`],
        [''],
        ['No', 'Tanggal', 'No Bukti', 'Keterangan Transaksi', 'Kategori', 'Petugas', 'Akun Kas', 'Tipe', 'Debit / Pemasukan (Rp)', 'Kredit / Pengeluaran (Rp)', 'Saldo Kas (Rp)']
      ];

      let runningBal = 0;
      const sortedEntries = [...filteredLedger].sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return (a.id || '').localeCompare(b.id || '');
      });

      sortedEntries.forEach((entry, idx) => {
        const isDebit = entry.tipe === 'pemasukan';
        const debit = isDebit ? entry.jumlah : 0;
        const kredit = !isDebit ? entry.jumlah : 0;
        runningBal += isDebit ? entry.jumlah : -entry.jumlah;

        wsData.push([
          idx + 1,
          entry.tanggal,
          entry.noBukti || '-',
          entry.deskripsi,
          entry.kategori,
          entry.petugas,
          entry.sumberKas,
          isDebit ? 'Pemasukan' : 'Pengeluaran',
          debit,
          kredit,
          runningBal
        ]);
      });

      wsData.push(['']);
      wsData.push(['', '', '', 'TOTAL PEMASUKAN (DEBIT)', '', '', '', '', totalPemasukan, 0, '']);
      wsData.push(['', '', '', 'TOTAL PENGELUARAN (KREDIT)', '', '', '', '', 0, totalPengeluaran, '']);
      wsData.push(['', '', '', 'SALDO BERSIH PERIODE', '', '', '', '', saldoBersih, '', '']);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 16 },
        { wch: 45 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 14 },
        { wch: 22 },
        { wch: 22 },
        { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Buku Kas RT08');
      XLSX.writeFile(wb, `Laporan_Buku_Kas_RT08_${periodStr}.xlsx`);
    }
  };

  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser.role === 'bendahara' || currentUser.role === 'sekretaris' || currentUser.role === 'audit');
  const canModify = isLoggedIn && currentUser && (currentUser.role === 'admin' || currentUser.role === 'bendahara');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        {/* Top background glow pattern */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-rose-500" />
        
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-600">
          <BookOpen className="w-8 h-8 pointer-events-none opacity-80" />
        </div>

        <h3 className="text-slate-900 font-extrabold text-lg tracking-tight mb-2">
          Akses Terbatas: Buku Kas Umum
        </h3>
        
        <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-6 font-medium">
          Mohon maaf, rincian Buku Kas Umum, aliran dana, rekap tabelaris, mutasi harian, cetak laporan, dan dokumen pembukuan lainnya 
          <strong className="text-slate-900 font-bold"> hanya dapat diakses, dilihat, maupun dicetak</strong> oleh pengurus RT yang berwenang (Ketua RT atau Bendahara).
        </p>

        <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] text-slate-500 font-medium leading-relaxed mb-6 space-y-2 text-left font-sans">
          <p className="flex items-center gap-2 font-bold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>Akses Terkunci Untuk Pengunjung / Warga</span>
          </p>
          <p>
            Silakan login sebagai Pengurus RT yang sah untuk mengelola catatan mutasi dan mencetak bukti/laporan kas periodik.
          </p>
        </div>

        {onTriggerLogin ? (
          <button
            onClick={onTriggerLogin}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl text-xs transition active:scale-97 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-sky-600/10 font-sans"
            id="restricted-login-btn"
          >
            <span>Masuk Sebagai Pengurus RT</span>
          </button>
        ) : (
          <div className="text-xs font-bold text-sky-600 font-sans">
            Gunakan tombol <span className="underline">"Masuk Pengurus"</span> di bagian kanan atas/menu navigasi untuk masuk.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-150">
          <h3 className="font-extrabold text-slate-800 text-sm font-mono flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" />
            Filter Laporan Buku Kas RT.008 RW.004
          </h3>
          
          {/* Filter Date Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDateFilterMode('monthYear')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                dateFilterMode === 'monthYear'
                  ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bulan &amp; Tahun</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('dateRange')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                dateFilterMode === 'dateRange'
                  ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Rentang Tanggal</span>
            </button>
          </div>
        </div>
        
        {/* Row 1: Search & Tipe Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-8">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 font-bold" />
            <input
              type="text"
              placeholder="Cari deskripsi, kategori, petugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-450"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            >
              <option value="semua">Semua Tipe Transaksi</option>
              <option value="pemasukan">Dana Masuk (Debit)</option>
              <option value="pengeluaran">Dana Keluar (Kredit)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Multi-Category Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              Pilih Kategori Laporan (Bisa Pilih &gt;1 Kategori Sekaligus):
            </span>
            <button
              type="button"
              onClick={selectAllCategories}
              className="text-[11px] text-sky-600 hover:text-sky-800 font-extrabold hover:underline cursor-pointer"
            >
              Pilih Semua (3 Kategori)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.length === 0 || selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-250 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white text-sky-600 font-black' : 'border border-slate-300 bg-slate-50'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </div>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Date Filter Inputs (Month/Year OR Date Range) */}
        {dateFilterMode === 'monthYear' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Bulan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
              >
                <option value="semua">Semua Bulan</option>
                {INDO_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
              >
                <option value="semua">Semua Tahun</option>
                {yearsList.map(yr => (
                  <option key={yr} value={String(yr)}>Tahun {yr}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Pilih Rentang Tanggal Transaksi:</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Kalender 2 Bulan (Dual View) &amp; Preset Cepat</span>
            </div>
            
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              placeholder="Klik untuk memilih rentang tanggal transaksi..."
              className="w-full"
              buttonClassName="bg-white py-3 border-amber-300 shadow-xs"
            />
          </div>
        )}

        {/* Excel / PDF Report Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl mt-2 animate-in fade-in duration-200">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Periode &amp; Kategori Terpilih:</p>
            <p className="text-xs text-sky-800 font-black font-mono">
              📅 {getPeriodSummary()}
            </p>
            <p className="text-[11px] text-slate-600 font-semibold">
              🏷️ Kategori: <span className="font-extrabold text-slate-900">{getCategorySummary()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Excel */}
            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 font-extrabold px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-97 font-sans"
              title={viewMode === 'tabelaris' ? 'Unduh Rekap Tabelaris dengan formula & rumus Excel aktif (.xls)' : 'Unduh Buku Kas dalam format CSV (.csv)'}
              id="ledger-excel-button"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{viewMode === 'tabelaris' ? 'Ekspor Excel (.xls)' : 'Ekspor CSV'}</span>
            </button>

            {/* Print directly or preview */}
            <button
              onClick={() => setShowPrintPreview(true)}
              className="bg-sky-600 hover:bg-sky-705 text-white font-black px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-600/10 transition cursor-pointer active:scale-97 font-sans"
              title="Pratinjau Laporan & Cetak PDF / Printer"
              id="ledger-pdf-button"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Pratinjau PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Laporan Cepat (Kas RT vs Kas Rombong) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-750 relative overflow-hidden space-y-5 animate-in fade-in duration-300">
        {/* Ambient background glow accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Laporan Cepat Kas RT vs Kas Rombong
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Eliminasi Mutasi Bank &amp; Kas
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Ringkasan Pemasukan (Debit) &amp; Pengeluaran (Kredit) riil pemakaian operasional tanpa distorsi mutasi bank, kas kecil (petty cash), dan perpindahan dana internal.
            </p>
          </div>

          {/* Period indicator & Quick Filter */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/90 border border-slate-700 p-2 rounded-2xl text-xs shrink-0">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0 ml-1" />
            
            {dateFilterMode === 'monthYear' ? (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setDateFilterMode('monthYear');
                    setSelectedMonth(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-700 text-sky-300 rounded-xl px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="semua">Semua Bulan</option>
                  {INDO_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setDateFilterMode('monthYear');
                    setSelectedYear(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-700 text-sky-300 rounded-xl px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="semua">Semua Tahun</option>
                  {yearsList.map(yr => (
                    <option key={yr} value={String(yr)}>Tahun {yr}</option>
                  ))}
                </select>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-2 py-1 text-[11px] font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-slate-400 text-[10px]">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-2 py-1 text-[11px] font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setDateFilterMode(dateFilterMode === 'monthYear' ? 'dateRange' : 'monthYear')}
              className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded-lg font-mono font-extrabold cursor-pointer transition border border-slate-600 ml-1"
              title="Ganti Mode Filter Tanggal / Bulan"
            >
              {dateFilterMode === 'monthYear' ? '📅 Rentang Tanggal' : '🗓️ Bulan & Tahun'}
            </button>
          </div>
        </div>

        {/* 3 Columns: Kas RT (Umum + Petty), Kas Rombong, Konsolidasi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
          
          {/* 1. KAS RT (Kas Umum + Petty Cash) */}
          <div className="bg-slate-800/70 border border-sky-500/30 rounded-2xl p-4 space-y-3.5 hover:border-sky-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-400 shadow-xs shadow-sky-400/50" />
                <h4 className="text-xs font-extrabold text-white tracking-wide uppercase font-mono">1. KAS RT (UMUM + PETTY)</h4>
              </div>
              <span className="text-[10px] font-extrabold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30">
                Kas Utama
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
                <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  Debit (Masuk)
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-emerald-300">
                  Rp {quickSummary.rtDebit.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20 space-y-1">
                <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-400" />
                  Kredit (Keluar)
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-rose-300">
                  Rp {quickSummary.rtKredit.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Net Result & Quick Filter Button */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Surplus / Defisit Kas RT</p>
                <p className={`text-sm sm:text-base font-black font-mono ${quickSummary.rtNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quickSummary.rtNet >= 0 ? '+' : ''}Rp {quickSummary.rtNet.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategories(['Kas Umum RT', 'Petty Kas'])}
                className="text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer active:scale-95 shadow-xs"
              >
                Lihat Kas RT
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-1 border-t border-slate-700/50">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Mutasi internal bank/kas/petty tereliminasi: <strong className="text-amber-300 font-mono font-bold">Rp {quickSummary.rtMutasi.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

          {/* 2. KAS ROMBONG */}
          <div className="bg-slate-800/70 border border-emerald-500/30 rounded-2xl p-4 space-y-3.5 hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <h4 className="text-xs font-extrabold text-white tracking-wide uppercase font-mono">2. KAS ROMBONG</h4>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Kas Khusus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
                <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  Debit (Masuk Riil)
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-emerald-300">
                  Rp {quickSummary.rbDebit.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20 space-y-1">
                <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-400" />
                  Kredit (Keluar Riil)
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-rose-300">
                  Rp {quickSummary.rbKredit.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Net Result & Quick Filter Button */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Surplus / Defisit Rombong</p>
                <p className={`text-sm sm:text-base font-black font-mono ${quickSummary.rbNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quickSummary.rbNet >= 0 ? '+' : ''}Rp {quickSummary.rbNet.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategories(['Kas Rombong'])}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer active:scale-95 shadow-xs"
              >
                Lihat Rombong
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-1 border-t border-slate-700/50">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Mutasi setor bank rombong tereliminasi: <strong className="text-amber-300 font-mono font-bold">Rp {quickSummary.rbMutasi.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

          {/* 3. KONSOLIDASI GABUNGAN */}
          <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3.5 hover:border-indigo-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400/50" />
                <h4 className="text-xs font-extrabold text-white tracking-wide uppercase font-mono">TOTAL KONSOLIDASI (GABUNGAN)</h4>
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                Keseluruhan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
                <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  Total Debit Riil
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-emerald-300">
                  Rp {quickSummary.totalDebit.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20 space-y-1">
                <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-400" />
                  Total Kredit Riil
                </p>
                <p className="text-xs sm:text-sm font-black font-mono text-rose-300">
                  Rp {quickSummary.totalKredit.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Net Result & Reset Filter */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono">Arus Kas Bersih Konsolidasi</p>
                <p className={`text-base sm:text-lg font-black font-mono ${quickSummary.totalSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quickSummary.totalSurplus >= 0 ? '+' : ''}Rp {quickSummary.totalSurplus.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-[11px] bg-slate-700 hover:bg-slate-600 text-white font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer active:scale-95 border border-slate-600 shadow-xs"
              >
                Semua Kategori
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-1 border-t border-slate-700/50">
              <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Total mutasi internal tereliminasi: <strong className="text-sky-300 font-mono font-bold">Rp {quickSummary.totalMutasi.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* Ledger Records List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
          <div className="space-y-0.5">
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Format Tampilan Buku Kas</h4>
            <p className="text-xs text-slate-600">Pilih format pencatatan laporan kas bulanan/periodik RT</p>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 border border-slate-200/50 rounded-xl">
            <button
              onClick={() => setViewMode('jurnal')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'jurnal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="view-mode-jurnal"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jurnal Umum</span>
            </button>
            <button
              onClick={() => setViewMode('tabelaris')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tabelaris'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="view-mode-tabelaris"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabelaris (Spreadsheet)</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {viewMode === 'tabelaris' 
              ? `Menampilkan ${visibleTabularRows.length} baris jurnal tabelaris`
              : `Menampilkan ${filteredLedger.length} riwayat transaksi`}
          </span>
          {isLoggedIn && (
            <span className="text-[10px] text-rose-600 font-mono font-bold">
              *Hapus transaksi akan memulihkan saldo akun kas semula.
            </span>
          )}
        </div>

        {viewMode === 'tabelaris' ? (
          /* SPREADSHEET TABLE VIEW */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Sheet Header */}
            <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-mono font-black tracking-wide uppercase">
                  REKAP TABELARIS PERIODE:{' '}
                  {selectedMonth === 'semua' && selectedYear === 'semua'
                    ? 'SEMUA DATA KAS'
                    : `${selectedMonth !== 'semua' ? INDO_MONTHS.find(m => m.value === selectedMonth)?.name?.toUpperCase() : 'SEMUA BULAN'} ${selectedYear !== 'semua' ? selectedYear : 'SEMUA TAHUN'}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Format Lulus Uji Rekonsiliasi Bank & Kas Umum RT.008 RW.004
                </p>
              </div>
              <div className="bg-emerald-600 text-[10px] font-mono px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider">
                🔒 RECONCILIATED
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1750px] border-collapse border-spacing-0 text-[10px] font-sans">
                <thead>
                  <tr className="bg-slate-900 text-white text-center font-bold font-mono border-b border-slate-300 text-[10px]">
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-16 text-center text-white">TANGGAL</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-24 text-center text-white">NO BUKTI</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 text-left min-w-[180px] text-white">KAS / KETERANGAN TRANSAKSI</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-20 text-center text-white">PETUGAS</th>
                    <th colSpan={10} className="border-r border-b border-slate-300 p-1.5 bg-slate-850 text-white">TOTAL KAS RT (IURAN, KECIL & BANK)</th>
                    <th colSpan={7} className="border-r border-b border-slate-300 p-1.5 bg-sky-900 text-white">TOTAL KAS ROMBONG (TUNAI & BANK)</th>
                    <th rowSpan={3} className="border-b border-slate-300 p-2 bg-indigo-950 text-white font-black w-24 text-center">GRAND TOTAL KAS (KAS UMUM)</th>
                    {isLoggedIn && <th rowSpan={3} className="p-2 border-l border-b border-slate-300 w-10 text-white">AKSI</th>}
                  </tr>
                  <tr className="bg-slate-800 text-white text-center font-bold text-[9px] font-mono border-b border-slate-300">
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-amber-950 text-amber-100">IURAN RT (rtTunai)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-slate-700 text-slate-100">KAS KECIL (rtPettyCash)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-indigo-950 text-indigo-100">RT BANK (rtBank)</th>
                    <th rowSpan={2} className="border-r border-slate-300 p-1 bg-amber-900 text-white text-center leading-tight">TOTAL SALDO RT</th>
                    
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-sky-950 text-sky-100">ROMBONG TUNAI (rombongTunai)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-emerald-950 text-emerald-100">ROMBONG BANK (rombongBank)</th>
                    <th rowSpan={2} className="border-r border-slate-300 p-1 bg-sky-900 text-white text-center leading-tight">TOTAL SALDO RB</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[8px] font-mono text-center border-b border-slate-300">
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-amber-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-amber-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-amber-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-slate-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-slate-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-slate-200/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-indigo-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-indigo-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-indigo-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-sky-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-sky-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-sky-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-emerald-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-emerald-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-emerald-100/55">SALDO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Row 1: Saldo Awal */}
                  <tr className="bg-amber-50/15 text-slate-900 font-extrabold font-sans hover:bg-slate-100/70 transition">
                    <td className="border-r border-slate-300 p-2 text-center font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 font-mono text-center">-</td>
                    <td className="border-r border-slate-300 p-2 tracking-wide text-slate-700 bg-slate-100/30">
                      📌 SALDO AWAL PERIODE SEBELUMNYA
                    </td>
                    <td className="border-r border-slate-300 p-2 font-semibold text-center">-</td>
                    
                    {/* rtTunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-amber-100/50">
                      {saldoAwal.rtTunai > 0 ? saldoAwal.rtTunai.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* rtPettyCash */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-slate-100/55">
                      {saldoAwal.rtPettyCash > 0 ? saldoAwal.rtPettyCash.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* rtBank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-indigo-100/50">
                      {saldoAwal.rtBank > 0 ? saldoAwal.rtBank.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* Total RT */}
                    <td className="border-r border-slate-300 p-1.5 text-right text-amber-950 font-mono bg-amber-100 font-black">
                      {saldoAwal.totalRT > 0 ? saldoAwal.totalRT.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Rombong Tunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-800 font-mono bg-sky-50">
                      {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Rombong Bank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-emerald-800 font-mono bg-emerald-50">
                      {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* Total RB */}
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-950 font-mono bg-sky-100 font-black">
                      {saldoAwal.totalRombong > 0 ? saldoAwal.totalRombong.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Grand Total */}
                    <td className="p-2 text-right font-mono bg-indigo-55 text-indigo-950 font-black text-center text-[11px] border-b border-indigo-200">
                      {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    {isLoggedIn && <td className="border-l border-slate-300 p-2 bg-slate-50"></td>}
                  </tr>

                  {visibleTabularRows.length === 0 ? (
                    <tr>
                      <td colSpan={isLoggedIn ? 23 : 22} className="border-b border-slate-300 py-12 text-center text-slate-400 font-bold bg-slate-50/20 select-none font-sans">
                        Tidak ada aliran transaksi kas terdaftar pada bulan/periode terpilih
                      </td>
                    </tr>
                  ) : (
                    visibleTabularRows.map((row) => {
                      const isBank = row.sumberKas === 'rtBank' || row.sumberKas === 'rombongBank';
                      const isPemasukan = row.tipe === 'pemasukan';
                      const codeColorClass = isBank ? (isPemasukan ? 'text-blue-600 font-semibold' : 'text-red-650 font-semibold') : 'text-slate-800 font-medium';
                      const descColorClass = isBank ? (isPemasukan ? 'text-blue-600 font-semibold' : 'text-red-650 font-bold') : 'text-slate-800';

                      return (
                        <tr key={row.id} className="hover:bg-slate-50 border-b border-slate-150 transition">
                          <td className="border-r border-slate-300 p-2 text-center font-mono font-medium text-slate-600" title={row.tanggalInput ? `Tanggal Input: ${row.tanggalInput}` : 'Tanggal Transaksi'}>
                            <div>{row.tanggal}</div>
                            {row.tanggalInput && row.tanggalInput !== row.tanggal && (
                              <div className="text-[9px] text-slate-400 font-normal">In: {row.tanggalInput}</div>
                            )}
                          </td>
                          <td className={`border-r border-slate-300 p-2 font-mono text-center text-[9px] ${codeColorClass}`}>
                            {row.noBukti}
                          </td>
                          <td className={`border-r border-slate-300 p-2 max-w-xs truncate ${descColorClass}`} title={row.deskripsi}>
                            {row.deskripsi}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-slate-600 font-semibold capitalize truncate max-w-[80px]" title={row.petugas}>
                            {row.petugas}
                          </td>
                          
                          {/* rtTunai */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtTunaiDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtTunaiDebit > 0 ? row.rtTunaiDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtTunaiKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtTunaiKredit > 0 ? row.rtTunaiKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-amber-50/20">
                            {row.rtTunaiRunning.toLocaleString('id-ID')}
                          </td>

                          {/* rtPettyCash */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtPettyCashDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtPettyCashDebit > 0 ? row.rtPettyCashDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtPettyCashKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtPettyCashKredit > 0 ? row.rtPettyCashKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-slate-50/40">
                            {row.rtPettyCashRunning.toLocaleString('id-ID')}
                          </td>

                          {/* rtBank */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtBankDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtBankDebit > 0 ? row.rtBankDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtBankKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtBankKredit > 0 ? row.rtBankKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-indigo-50/20">
                            {row.rtBankRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Total RT */}
                          <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-amber-50 font-bold text-amber-950">
                            {row.totalRTRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Rombong Tunai */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rbDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rbKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-sky-800 font-mono bg-sky-50/15">
                            {row.rbRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Rombong Bank */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.bkDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.bkKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-emerald-800 font-mono bg-emerald-50/15">
                            {row.bkRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Total RB */}
                          <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-sky-50 font-bold text-sky-950">
                            {row.totalRombongRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Grand Total */}
                          <td className="p-2 text-right font-mono bg-indigo-50/20 text-indigo-950 font-black text-center text-[10.5px]">
                            {row.totalRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Action revert */}
                          {canModify && (
                            <td className="border-l border-slate-300 p-1 text-center bg-slate-50/30">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    const orig = ledger.find(l => l.id === row.id);
                                    if (orig) setEditingLedgerEntry(orig);
                                  }}
                                  className="p-1 text-slate-450 hover:text-sky-600 hover:bg-sky-50 rounded transition cursor-pointer"
                                  title="Edit Transaksi Tabelaris"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLedgerEntry(row.id, row.jumlah, row.tipe, row.sumberKas, row.deskripsi)}
                                  className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Hapus Transaksi Tabelaris"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-650" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                  
                  {/* Row 4: Saldo Akhir */}
                  <tr className="bg-slate-100 text-slate-900 font-black font-sans border-t-2 border-slate-400 hover:bg-slate-150/55 transition">
                    <td className="border-r border-slate-300 p-3 text-center font-mono text-[9px]">TOTAL</td>
                    <td className="border-r border-slate-300 p-3 font-mono">-</td>
                    <td className="border-r border-slate-300 p-3 tracking-wide uppercase">TOTAL DEBIT / KREDIT PERIODIK</td>
                    <td className="border-r border-slate-300 p-3">-</td>
                    
                    {/* rtTunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-amber-50">
                      {totalsTabular.rtTunaiDebit > 0 ? totalsTabular.rtTunaiDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-amber-50">
                      {totalsTabular.rtTunaiKredit > 0 ? totalsTabular.rtTunaiKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-amber-100/50">
                      {totalsTabular.rtTunaiRunning.toLocaleString('id-ID')}
                    </td>

                    {/* rtPettyCash */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-slate-150/40">
                      {totalsTabular.rtPettyCashDebit > 0 ? totalsTabular.rtPettyCashDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-slate-150/40">
                      {totalsTabular.rtPettyCashKredit > 0 ? totalsTabular.rtPettyCashKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-slate-200/65">
                      {totalsTabular.rtPettyCashRunning.toLocaleString('id-ID')}
                    </td>

                    {/* rtBank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-indigo-50/40">
                      {totalsTabular.rtBankDebit > 0 ? totalsTabular.rtBankDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-indigo-50/40">
                      {totalsTabular.rtBankKredit > 0 ? totalsTabular.rtBankKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-indigo-100/50">
                      {totalsTabular.rtBankRunning.toLocaleString('id-ID')}
                    </td>

                    {/* Total RT */}
                    <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-amber-200 text-amber-950 font-black">
                      {totalsTabular.totalRTRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Rombong Tunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-950 font-mono bg-sky-100/50">
                      {totalsTabular.rbRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Rombong Bank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-emerald-950 font-mono bg-emerald-100/50">
                      {totalsTabular.bkRunning.toLocaleString('id-ID')}
                    </td>

                    {/* Total RB */}
                    <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-sky-200 text-sky-950 font-black">
                      {totalsTabular.totalRombongRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Grand Total */}
                    <td className="p-2 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-center text-[11px]">
                      {totalsTabular.totalRunning.toLocaleString('id-ID')}
                    </td>
                    {isLoggedIn && <td className="border-l border-slate-300 p-3 bg-slate-100"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* SINGLE-LINE PORTRAIT LIST */
          filteredLedger.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-xs">
              <FileText className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Buku kas belum memiliki catatan transaksi</p>
              <p className="text-slate-400 text-xs mt-1">Sesuaikan filter pencarian atau mulailah mencatat.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {[...filteredLedger]
                .sort((a, b) => {
                  if (a.tanggal !== b.tanggal) {
                    return b.tanggal.localeCompare(a.tanggal);
                  }
                  return (b.id || '').localeCompare(a.id || '');
                })
                .map((entry) => {
                const isPemasukan = entry.tipe === 'pemasukan';
                return (
                  <div 
                    key={entry.id} 
                    className={`p-5 rounded-2xl border transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                      isPemasukan 
                        ? 'bg-white border-emerald-100 hover:border-emerald-300' 
                        : 'bg-white border-rose-100 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Circle icon */}
                      <div className={`p-3 rounded-xl shrink-0 border ${
                        isPemasukan 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {isPemasukan ? <ArrowUpRight className="w-5 h-5 pointer-events-none" /> : <ArrowDownLeft className="w-5 h-5 pointer-events-none" />}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug flex items-center flex-wrap gap-2">
                          <span>{entry.deskripsi}</span>
                          {entry.fotoBase64 && allowedPhotos && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                              className="px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-350 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Lihat Bukti Foto / Nota"
                            >
                              <Receipt className="w-3 h-3 text-sky-600 pointer-events-none" />
                              Nota Bukti ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                            </button>
                          )}
                          {allowedPhotos && (
                            <label className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none">
                              <Camera className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                              <span>{entry.fotoBase64 ? 'Ubah Nota' : 'Tambah Nota'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const base64 = await compressImage(file);
                                    triggerCropper(base64, 'free', 'Potong Bukti Transaksi', (cropped) => {
                                      const updatedLedger = ledger.map(item => {
                                        if (item.id === entry.id) {
                                          return { ...item, fotoBase64: cropped, fotoNamaFile: file.name };
                                        }
                                        return item;
                                      });
                                      setLedger(updatedLedger);
                                    });
                                  } catch (err) {
                                    console.error(err);
                                    alert('Gagal mengunggah foto');
                                  }
                                }}
                              />
                            </label>
                          )}
                          {getMatchedBillInfo(entry) && (
                            <button
                              type="button"
                              onClick={() => {
                                const info = getMatchedBillInfo(entry);
                                if (info) {
                                  setReprintReceiptInfo(info);
                                }
                              }}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-150 hover:border-emerald-350 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Cetak Nota / Kuitansi / Unduh Gambar"
                            >
                              <Printer className="w-3 h-3 text-emerald-600 pointer-events-none" />
                              Nota / Kuitansi (WA/Download)
                            </button>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Tgl Transaksi: {entry.tanggal}
                          </span>
                          {entry.tanggalInput && (
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Tgl Input: {entry.tanggalInput}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            {entry.kategori}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Petugas: {entry.petugas}
                          </span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            Akun: {entry.sumberKas}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-none pt-3 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <span className={`text-base md:text-lg font-extrabold font-mono tracking-tight ${
                          isPemasukan ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPemasukan ? '+' : '-'} Rp {entry.jumlah.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {canModify && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLedgerEntry(entry)}
                            className="p-2 text-slate-450 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                            title="Modifikasi Transaksi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLedgerEntry(entry.id, entry.jumlah, entry.tipe, entry.sumberKas, entry.deskripsi)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Hapus Transaksi (Memulihkan Kas)"
                            id={`del-tx-${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Transaction Deletion Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 text-center relative border-t-4 border-t-rose-500 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEntryToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Batal"
              id="cancel-del-tx"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base mb-2">Hapus Catatan Transaksi</h3>
            <p className="text-slate-605 text-xs md:text-sm mb-6 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus data transaksi <strong className="text-slate-900 font-semibold font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">"{entryToDelete.deskripsi}"</strong>?
              <br /><br />
              <span className="text-rose-650 font-bold">Pemberitahuan Sistem Kas:</span> Penghapusan ini bersifat otomatis dan akan <strong>membalikkan/merevert</strong> saldo keuangan sebesar:
              <br />
              <strong className="text-rose-600 font-extrabold text-base font-mono bg-rose-50/50 mt-2 block p-2 rounded-xl border border-rose-100/50">
                Rp {entryToDelete.jumlah.toLocaleString('id-ID')}
              </strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const { id, jumlah, tipe, sumberKas } = entryToDelete;
                  // Revert cash balance effect
                  const nextKas = { ...kas };
                  if (tipe === 'pemasukan') {
                    nextKas[sumberKas] -= jumlah;
                  } else {
                    nextKas[sumberKas] += jumlah;
                  }
                  updateKas(nextKas);

                  // Remove entry from ledger
                  const updatedLedger = ledger.filter(e => e.id !== id);
                  setLedger(updatedLedger);
                  setEntryToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                id="confirm-del-tx"
              >
                Hapus & Revert Kas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Printable & Pratinjau Modal */}
      {showPrintPreview && isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 md:p-8 z-[100] overflow-y-auto animate-in fade-in duration-200">
          <style>{`
            @media print {
              @page {
                size: ${viewMode === 'tabelaris' ? 'A4 landscape' : 'A4 portrait'};
                margin: ${viewMode === 'tabelaris' ? '4mm 5mm' : '8mm 10mm'};
              }
              body {
                background-color: white !important;
                color: black !important;
                font-family: 'Inter', system-ui, sans-serif !important;
              }
              header, footer, nav, .no-print, button, select, input, #tab-dashboard, #tab-tagihan, #tab-buku_kas, .bg-slate-900\\/60 {
                display: none !important;
                visibility: hidden !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-report-area, #printable-report-area * {
                visibility: visible;
              }
              .overflow-x-auto, div.overflow-x-auto {
                overflow: visible !important;
                width: 100% !important;
                max-width: none !important;
                display: block !important;
              }
              #printable-report-area {
                position: absolute;
                left: 0;
                top: 0;
                width: ${viewMode === 'tabelaris' ? '1440px' : '100%'} !important;
                max-width: ${viewMode === 'tabelaris' ? '1440px' : '100%'} !important;
                ${viewMode === 'tabelaris' ? `
                  zoom: 0.78 !important;
                  transform: scale(0.78) !important;
                  transform-origin: top left !important;
                ` : ''}
                background-color: white !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              table {
                width: 100% !important;
                ${viewMode === 'tabelaris' ? 'min-width: 1400px !important;' : ''}
              }
              th, td {
                border: 1px solid #cbd5e1 !important;
                padding: ${viewMode === 'tabelaris' ? '3px 4px' : '6px 8px'} !important;
                font-size: ${viewMode === 'tabelaris' ? '10px' : '11.5px'} !important;
                text-align: left;
              }
            }
          `}</style>

          <div className={`bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl relative w-full animate-in zoom-in-95 duration-200 text-slate-800 my-8 ${viewMode === 'tabelaris' ? 'max-w-[1250px]' : 'max-w-4xl'}`}>
            {/* Top Toolbar (Invisible in General Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6 no-print">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 font-sans">
                  <Printer className="w-5 h-5 text-sky-600" />
                  Pratinjau Lembar Bukti Buku Kas RT.008 RW.004
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan cetak ini terstruktur secara rapi dalam format{' '}
                  <strong className="text-sky-700">{viewMode === 'tabelaris' ? 'Mendatar (Landscape) A4' : 'Tegak (Portrait) A4'}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  Tutup Laporan
                </button>
                <button
                  onClick={() => {
                    const printableArea = document.getElementById('printable-report-area');
                    if (printableArea) {
                      const printDoc = {
                        write: (htmlContent: string) => {
                          printContentViaIframe(htmlContent);
                        },
                        close: () => {}
                      };
                      printDoc.write(`
                          <html>
                            <head>
                              <title>Laporan Buku Kas RT.008 RW.004</title>
                              <style>
                                @page {
                                  size: A4 ${viewMode === 'tabelaris' ? 'landscape' : 'portrait'};
                                  margin: ${viewMode === 'tabelaris' ? '4mm 5mm' : '8mm 10mm'};
                                }
                                body {
                                  background-color: white !important;
                                  color: black !important;
                                  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                                  padding: 10px;
                                  margin: 0;
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                }
                                .overflow-x-auto, div.overflow-x-auto {
                                  overflow: visible !important;
                                  width: 100% !important;
                                  max-width: none !important;
                                  display: block !important;
                                }
                                #printable-report-area {
                                  width: ${viewMode === 'tabelaris' ? '1440px' : '100%'} !important;
                                  max-width: ${viewMode === 'tabelaris' ? '1440px' : '100%'} !important;
                                  ${viewMode === 'tabelaris' ? `
                                    zoom: 0.78 !important;
                                    transform: scale(0.78) !important;
                                    transform-origin: top left !important;
                                  ` : ''}
                                }
                                table {
                                  width: 100% !important;
                                  border-collapse: collapse;
                                  margin-top: 15px;
                                  margin-bottom: 20px;
                                  ${viewMode === 'tabelaris' ? 'min-width: 1400px !important;' : ''}
                                }
                                th, td {
                                  border: 1px solid #cbd5e1 !important;
                                  padding: ${viewMode === 'tabelaris' ? '3px 4px' : '6px 8px'} !important;
                                  font-size: ${viewMode === 'tabelaris' ? '10px' : '11.5px'} !important;
                                  text-align: left;
                                }
                                th {
                                  background-color: #0f172a !important;
                                  color: white !important;
                                  font-weight: bold !important;
                                  font-family: monospace !important;
                                  text-transform: uppercase !important;
                                }
                                /* Enable colored cells during printing */
                                td.bg-amber-100\/40, td.bg-amber-100 { background-color: #fef3c7 !important; color: #78350f !important; }
                                td.bg-slate-100\/55, td.bg-slate-200 { background-color: #e2e8f0 !important; color: #1e293b !important; }
                                td.bg-indigo-100\/40, td.bg-indigo-100 { background-color: #e0e7ff !important; color: #1e1b4b !important; }
                                td.bg-sky-50, td.bg-sky-100 { background-color: #e0f2fe !important; color: #0c4a6e !important; }
                                td.bg-emerald-50, td.bg-emerald-100 { background-color: #d1fae5 !important; color: #064e3b !important; }
                                td.bg-indigo-50 { background-color: #e0e7ff !important; color: #1e1b4b !important; }
                                th.bg-slate-800 { background-color: #1e293b !important; color: white !important; }
                                th.bg-sky-900 { background-color: #0c4a6e !important; color: white !important; }
                                th.bg-amber-950 { background-color: #451a03 !important; color: #fef3c7 !important; }
                                th.bg-indigo-950 { background-color: #1e1b4b !important; color: #e0e7ff !important; }
                                th.bg-sky-950 { background-color: #082f49 !important; color: #e0f2fe !important; }
                                th.bg-emerald-950 { background-color: #022c22 !important; color: #d1fae5 !important; }
                                th.bg-sky-900 { background-color: #0c4a6e !important; color: white !important; }
                                th.bg-slate-900 { background-color: #0f172a !important; color: white !important; }
                                .text-center { text-align: center !important; }
                                .text-right { text-align: right !important; }
                                .font-bold { font-weight: bold !important; }
                                .text-xs { font-size: 0.75rem !important; }
                                .text-sm { font-size: 0.875rem !important; }
                                .text-lg { font-size: 1.125rem !important; }
                                .text-xl { font-size: 1.25rem !important; }
                                .uppercase { text-transform: uppercase !important; }
                                .mb-4 { margin-bottom: 1rem !important; }
                                .mb-6 { margin-bottom: 1.5rem !important; }
                                .mt-4 { margin-top: 1rem !important; }
                                .border-b-4 { border-bottom: 4px solid #000 !important; }
                                .border-double { border-style: double !important; }
                                .pb-4 { padding-bottom: 1rem !important; }
                                .flex { display: flex !important; }
                                .justify-between { justify-content: space-between !important; }
                                .items-center { align-items: center !important; }
                                .gap-1.5 { gap: 0.375rem !important; }
                                .gap-4 { gap: 1rem !important; }
                                .grid { display: grid !important; }
                                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                                .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                                .no-print, button, input, select {
                                  display: none !important;
                                  visibility: hidden !important;
                                }
                                @media print {
                                  * {
                                    visibility: visible !important;
                                  }
                                  .no-print, .no-print *, button, input, select {
                                    display: none !important;
                                    visibility: hidden !important;
                                  }
                                }
                              </style>
                            </head>
                            <body>
                              ${printableArea.innerHTML}
                              <script>
                                window.onload = function() {
                                  setTimeout(function() {
                                    window.print();
                                  }, 500);
                                };
                              </script>
                            </body>
                          </html>
                        `);
                        printDoc.close();
                    }
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-600/10 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Mulai Cetak / Cetak PDF 🖨️</span>
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div id="printable-report-area" className="bg-white p-2 md:p-4 text-slate-950 font-sans">
              {/* Kop Surat Header */}
              <div className="border-b-4 border-double border-slate-950 pb-4 mb-6 text-center">
                <h2 className="text-sm md:text-base font-black font-sans tracking-wide text-slate-900 uppercase leading-tight">{rtTitle}</h2>
                <h3 className="text-xs md:text-sm font-extrabold font-sans text-slate-800 tracking-wide uppercase leading-tight mt-1">{rtAddress}</h3>
                {rtEmail && (
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1 font-sans">
                    Email: {rtEmail}
                  </p>
                )}
              </div>

              {/* Document Metadata Block */}
              <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6 font-sans">
                <div>
                  <h1 className="text-lg md:text-xl font-black font-sans text-slate-910 uppercase tracking-tight">
                    LAPORAN BUKU KAS {viewMode === 'tabelaris' ? 'TABELARIS (SPREADSHEET)' : 'UMUT RT'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Periode Laporan:{' '}
                    <strong className="text-slate-900 font-extrabold text-sm">
                      {getPeriodSummary()}
                    </strong>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kategori Kas:{' '}
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {getCategorySummary()}
                    </strong>
                  </p>
                </div>
                <div className="text-xs text-slate-630 sm:text-right font-sans">
                  <p>Tanggal Cetak: <strong className="text-slate-900">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                  <p>Petugas Operator: <strong className="text-slate-900">{isLoggedIn && currentUser ? cleanSignatureName(currentUser.nama) + (currentUser.role === 'admin' ? ' (Admin)' : ' (Bendahara)') : 'Sistem Keuangan RT'}</strong></p>
                </div>
              </div>

              {viewMode === 'tabelaris' ? (
                /* LANDSCAPE TABULAR SPREADSHEET FOR PRINT */
                <div className="overflow-x-auto border border-slate-400 rounded-lg mb-6">
                  <table className="w-full min-w-[1400px] text-[9.5px] text-left text-slate-900 font-sans border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-center font-bold font-mono border-b border-slate-400 text-[9px]">
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-12 text-center text-white">TGL</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-20 text-center text-white">NO BUKTI</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 text-left min-w-[160px] text-white">KETERANGAN ALIRAN KAS</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-18 text-center text-white">PETUGAS</th>
                        <th colSpan={10} className="border-r border-b border-slate-400 p-1 bg-slate-800 text-white text-[9px]">TOTAL KAS RT (IURAN, KECIL & BANK)</th>
                        <th colSpan={7} className="border-r border-b border-slate-400 p-1 bg-sky-900 text-white text-[9px]">TOTAL KAS ROMBONG (TUNAI & BANK)</th>
                        <th rowSpan={3} className="border-b border-slate-400 p-1.5 bg-indigo-950 text-white font-black w-22 text-center">GRAND TOTAL KAS (KAS UMUM)</th>
                      </tr>
                      <tr className="bg-slate-800 text-white text-center font-bold text-[8.5px] font-mono border-b border-slate-400">
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-amber-950 text-amber-100">IURAN RT (rtTunai)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-slate-700 text-slate-100">KAS KECIL (rtPettyCash)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-indigo-950 text-indigo-100">RT BANK (rtBank)</th>
                        <th rowSpan={2} className="border-r border-slate-400 p-0.5 bg-amber-900 text-white text-center leading-tight">TOTAL SALDO RT</th>
                        
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-sky-950 text-sky-100">ROMBONG TUNAI (rombongTunai)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-emerald-950 text-emerald-100">ROMBONG BANK (rombongBank)</th>
                        <th rowSpan={2} className="border-r border-slate-400 p-0.5 bg-sky-900 text-white text-center leading-tight">TOTAL SALDO RB</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-700 font-bold text-[7.5px] font-mono text-center border-b border-slate-400">
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-amber-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-amber-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-amber-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-slate-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-slate-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-slate-200/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-indigo-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-indigo-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-indigo-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-sky-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-sky-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-sky-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-emerald-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-emerald-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-emerald-100/55">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-350">
                      <tr className="bg-amber-50/15 font-bold">
                        <td className="border-r border-slate-400 p-1.5 text-center font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono text-center">-</td>
                        <td className="border-r border-slate-400 p-1.5 uppercase font-black text-slate-700 bg-slate-100/35">SALDO SEBELUM PERIODE INI</td>
                        <td className="border-r border-slate-400 p-1.5 text-center">-</td>
                        
                        {/* rtTunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-amber-100/40">
                          {saldoAwal.rtTunai > 0 ? saldoAwal.rtTunai.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* rtPettyCash */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-slate-100/55">
                          {saldoAwal.rtPettyCash > 0 ? saldoAwal.rtPettyCash.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* rtBank */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-indigo-100/40">
                          {saldoAwal.rtBank > 0 ? saldoAwal.rtBank.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* Total RT */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-amber-950 bg-amber-100 font-black">
                          {saldoAwal.totalRT > 0 ? saldoAwal.totalRT.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Rombong Tunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-900 bg-sky-50">
                          {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Rombong Bank */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-900 bg-emerald-50">
                          {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* Total RB */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-950 bg-sky-100 font-black">
                          {saldoAwal.totalRombong > 0 ? saldoAwal.totalRombong.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Grand Total */}
                        <td className="p-1.5 text-right font-mono bg-indigo-50 text-indigo-950 font-black text-center">
                          {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                      </tr>

                      {visibleTabularRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-55/20 transition">
                          <td className="border-r border-slate-400 p-1.5 text-center font-mono text-slate-600" title={row.tanggalInput ? `Tanggal Input: ${row.tanggalInput}` : 'Tanggal Transaksi'}>
                            <div>{row.tanggal}</div>
                            {row.tanggalInput && row.tanggalInput !== row.tanggal && (
                              <div className="text-[8px] text-slate-400">In: {row.tanggalInput}</div>
                            )}
                          </td>
                          <td className="border-r border-slate-400 p-1.5 font-mono text-center text-[8px] text-slate-600">{row.noBukti}</td>
                          <td className="border-r border-slate-400 p-1.5 font-medium leading-tight text-slate-900">{row.deskripsi}</td>
                          <td className="border-r border-slate-400 p-1.5 capitalize text-slate-600 whitespace-nowrap">{row.petugas}</td>
                          
                          {/* rtTunai */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtTunaiDebit > 0 ? row.rtTunaiDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtTunaiKredit > 0 ? row.rtTunaiKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-amber-50/15">{row.rtTunaiRunning.toLocaleString('id-ID')}</td>

                          {/* rtPettyCash */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtPettyCashDebit > 0 ? row.rtPettyCashDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtPettyCashKredit > 0 ? row.rtPettyCashKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-slate-50/45">{row.rtPettyCashRunning.toLocaleString('id-ID')}</td>

                          {/* rtBank */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtBankDebit > 0 ? row.rtBankDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtBankKredit > 0 ? row.rtBankKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-indigo-50/15">{row.rtBankRunning.toLocaleString('id-ID')}</td>

                          {/* Total RT */}
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-755 bg-amber-50/45 font-bold">{row.totalRTRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Rombong Tunai */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-900 bg-sky-50/15">{row.rbRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Rombong Bank */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-900 bg-emerald-50/15">{row.bkRunning.toLocaleString('id-ID')}</td>

                          {/* Total RB */}
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-755 bg-sky-50/45 font-bold">{row.totalRombongRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Grand Total */}
                          <td className="p-1.5 text-right font-mono bg-indigo-50/20 text-slate-900 font-bold text-center">{row.totalRunning.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}

                      {/* Summary Row */}
                      <tr className="bg-slate-100 hover:bg-slate-150 font-black border-t-2 border-slate-400">
                        <td className="border-r border-slate-400 p-1.5 text-center text-[8px]">TOTAL</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 tracking-wide">TOTAL DEBIT / KREDIT PERIODIK</td>
                        <td className="border-r border-slate-400 p-1.5">-</td>
                        
                        {/* rtTunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-amber-50">{totalsTabular.rtTunaiDebit > 0 ? totalsTabular.rtTunaiDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-amber-50">{totalsTabular.rtTunaiKredit > 0 ? totalsTabular.rtTunaiKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-amber-100/50">{totalsTabular.rtTunaiRunning.toLocaleString('id-ID')}</td>

                        {/* rtPettyCash */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-slate-150/40">{totalsTabular.rtPettyCashDebit > 0 ? totalsTabular.rtPettyCashDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-slate-150/40">{totalsTabular.rtPettyCashKredit > 0 ? totalsTabular.rtPettyCashKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-slate-200">{totalsTabular.rtPettyCashRunning.toLocaleString('id-ID')}</td>

                        {/* rtBank */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-indigo-50/40">{totalsTabular.rtBankDebit > 0 ? totalsTabular.rtBankDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-indigo-50/40">{totalsTabular.rtBankKredit > 0 ? totalsTabular.rtBankKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-indigo-100/55">{totalsTabular.rtBankRunning.toLocaleString('id-ID')}</td>

                        {/* Total RT */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono bg-amber-200 text-amber-950 font-black">{totalsTabular.totalRTRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Rombong Tunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-sky-50/40">{totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-sky-50/40">{totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-950 bg-sky-100">{totalsTabular.rbRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Rombong Bank */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-emerald-50/40">{totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-emerald-50/40">{totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-950 bg-emerald-100">{totalsTabular.bkRunning.toLocaleString('id-ID')}</td>

                        {/* Total RB */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono bg-sky-200 text-sky-950 font-black">{totalsTabular.totalRombongRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Grand Total */}
                        <td className="p-1.5 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-center">
                          {totalsTabular.totalRunning.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* PORTRAIT JOURNAL LIST FOR PRINT */
                <>
                  {/* Transactions Table */}
                  <div className="overflow-x-auto border border-slate-300 rounded-xl mb-6">
                    <table className="w-full min-w-[850px] text-xs text-left text-slate-905 font-sans border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center font-mono animate-none">No</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-24">Tanggal</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Keterangan / Deskripsi Transaksi</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28 animate-none">Kategori</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-24">Pintu Kas</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-right">Debit / Pemasukan (Rp)</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 text-right w-28">Kredit / Pengeluaran (Rp)</th>
                          <th className="py-2.5 px-3 text-right w-32 bg-slate-200/50">Jumlah Nominal Transaksi (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedger.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold bg-slate-50">
                              Tidak terdapat rincian transaksi buku kas pada saringan periodik terpilih.
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            let runningAccumulation = 0;
                            const sortedEntries = [...filteredLedger].sort((a, b) => {
                              if (a.tanggal !== b.tanggal) {
                                return a.tanggal.localeCompare(b.tanggal);
                              }
                              return (a.id || '').localeCompare(b.id || '');
                            });

                            return sortedEntries.map((entry, idx) => {
                              const isPemasukan = entry.tipe === 'pemasukan';
                              if (isPemasukan) {
                                runningAccumulation += entry.jumlah;
                              } else {
                                runningAccumulation -= entry.jumlah;
                              }
                              const currentRunningTotal = runningAccumulation;

                              return (
                                <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50/20">
                                  <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                                  <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600 whitespace-nowrap">{entry.tanggal}</td>
                                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900 leading-normal">
                                    <div className="flex items-center justify-between gap-2">
                                      <span>{entry.deskripsi}</span>
                                      {entry.fotoBase64 && allowedPhotos && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                                          className="shrink-0 px-1.5 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-355 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                          title="Lihat Bukti Foto / Nota"
                                        >
                                          <Receipt className="w-2.5 h-2.5 text-sky-600 pointer-events-none" />
                                          Nota ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                                        </button>
                                      )}
                                      {allowedPhotos && (
                                        <label className="shrink-0 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer select-none">
                                          <Camera className="w-2.5 h-2.5 text-slate-500 pointer-events-none" />
                                          <span>{entry.fotoBase64 ? 'Ubah' : '+ Nota'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              try {
                                                const base64 = await compressImage(file);
                                                triggerCropper(base64, 'free', 'Potong Bukti Transaksi', (cropped) => {
                                                  const updatedLedger = ledger.map(item => {
                                                    if (item.id === entry.id) {
                                                      return { ...item, fotoBase64: cropped, fotoNamaFile: file.name };
                                                    }
                                                    return item;
                                                  });
                                                  setLedger(updatedLedger);
                                                });
                                              } catch (err) {
                                                console.error(err);
                                                alert('Gagal mengunggah foto');
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                      {getMatchedBillInfo(entry) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const info = getMatchedBillInfo(entry);
                                            if (info) {
                                              setReprintReceiptInfo(info);
                                            }
                                          }}
                                          className="shrink-0 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-150 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                          title="Cetak Kuitansi / Kirim WhatsApp"
                                        >
                                          <Printer className="w-2.5 h-2.5 text-emerald-600 pointer-events-none" />
                                          Cetak (WA/PDF)
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{entry.kategori}</td>
                                  <td className="py-2 px-3 border-r border-slate-200 font-mono text-[10px] text-slate-500">{entry.sumberKas}</td>
                                  <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                                    {isPemasukan ? `Rp ${entry.jumlah.toLocaleString('id-ID')}` : '-'}
                                  </td>
                                  <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-rose-700">
                                    {!isPemasukan ? `Rp ${entry.jumlah.toLocaleString('id-ID')}` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                                    {currentRunningTotal < 0 ? '-' : ''} Rp {Math.abs(currentRunningTotal).toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Box Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 font-sans">
                    <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">TOTAL SELURUH DEBIT (MASUK)</span>
                      <span className="text-base font-black font-mono text-emerald-900 mt-1">
                        Rp {totalPemasukan.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-rose-800">TOTAL SELURUH KREDIT (KELUAR)</span>
                      <span className="text-base font-black font-mono text-rose-900 mt-1">
                        Rp {totalPengeluaran.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${saldoBersih >= 0 ? 'bg-sky-50/50 border-sky-200 text-sky-950' : 'bg-amber-50/50 border-amber-200 text-amber-950'}`}>
                      <span className="text-[10px] uppercase font-black tracking-wider">SALDO BERSIH PERIODE FILTER</span>
                      <span className="text-base font-black font-mono mt-1">
                        {saldoBersih < 0 ? '-' : ''} Rp {Math.abs(saldoBersih).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-12 text-center pt-8 border-t border-dashed border-slate-250 text-xs font-sans text-slate-800">
                <div className="space-y-16">
                  <p className="font-semibold text-slate-600">Disiapkan Oleh (Bendahara RT):</p>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 underline text-sm">{bendaharaName}</p>
                    <p className="text-[10px] text-slate-500">Staf Keuangan & Pembukuan RT</p>
                  </div>
                </div>
                <div className="space-y-16">
                  <p className="font-semibold text-slate-600">Mengetahui & Menyetujui (Ketua RT.008):</p>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-905 underline text-sm">{adminName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Ketua RT.008 RW.004 PERUMTAS 3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Receipt Preview Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative max-w-xl w-full flex flex-col max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Receipt className="w-5 h-5 text-sky-600 shrink-0" />
                <h4 className="font-extrabold text-slate-800 text-sm truncate font-sans" title={`Bukti Nota: ${selectedReceipt.deskripsi}`}>
                  Bukti Nota: {selectedReceipt.deskripsi}
                </h4>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-full hover:bg-slate-155 transition shrink-0 flex items-center justify-center"
                title="Tutup"
                id="receipt-modal-close-x"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-100 flex-1 min-h-[300px]">
              <img
                src={selectedReceipt.fotoBase64}
                alt={selectedReceipt.deskripsi}
                className="max-h-[50vh] object-contain rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] sm:max-w-[200px]" title={`${selectedReceipt.fotoNamaFile} (${formatFileSize(getBase64SizeInBytes(selectedReceipt.fotoBase64))})`}>
                {selectedReceipt.fotoNamaFile}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-xl text-xs cursor-pointer transition active:scale-95 flex items-center gap-1"
                  id="receipt-modal-close-btn"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedReceipt.fotoBase64;
                    link.download = selectedReceipt.fotoNamaFile;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-600/10 transition active:scale-97"
                  id="receipt-modal-download-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor / Unduh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modification Modal (Admin/Bendahara only) */}
      {editingLedgerEntry && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[998] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative max-w-lg w-full flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Modifikasi Detail Transaksi
                </h4>
              </div>
              <button
                onClick={() => setEditingLedgerEntry(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-full hover:bg-slate-155 transition"
                title="Batal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateLedgerEntry} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3.5 rounded-2xl text-xs leading-relaxed">
                💡 <strong>Catatan Kepatuhan:</strong> Anda mengubah metadata pencatatan (tanggal transaksi, tanggal input, deskripsi, kategori, petugas). Hal ini aman dilakukan tanpa mengganggu saldo kas Anda saat ini.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono">ID Transaksi (Terkunci)</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-bold font-mono">
                  {editingLedgerEntry.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi / Kejadian</label>
                  <input
                    required
                    type="date"
                    value={editingLedgerEntry.tanggal}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, tanggal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Input / Catat</label>
                  <input
                    required
                    type="date"
                    value={editingLedgerEntry.tanggalInput || editingLedgerEntry.tanggal}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, tanggalInput: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Deskripsi Lengkap Transaksi</label>
                <input
                  required
                  type="text"
                  value={editingLedgerEntry.deskripsi}
                  onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, deskripsi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Kategori Transaksi</label>
                  <select
                    required
                    value={editingLedgerEntry.kategori}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, kategori: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="Petty Kas">Petty Kas</option>
                    <option value="Kas Umum RT">Kas Umum RT</option>
                    <option value="Kas Rombong">Kas Rombong</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Petugas / Pembuat</label>
                  <input
                     required
                     type="text"
                     value={editingLedgerEntry.petugas}
                     onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, petugas: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Penempatan Akun Kas</label>
                <select
                  value={editingLedgerEntry.sumberKas}
                  onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, sumberKas: e.target.value as keyof Balance })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
                >
                  <option value="rtTunai">Iuran RT Tunai (rtTunai)</option>
                  <option value="rtPettyCash">Kas Kecil RT (rtPettyCash)</option>
                  <option value="rtBank">RT Bank (rtBank)</option>
                  <option value="rombongTunai">Rombong Tunai (rombongTunai)</option>
                  <option value="rombongBank">Rombong Bank (rombongBank)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-650 font-mono">
                    Nilai &amp; Tipe Transaksi {isAmountLocked ? '(Terkunci)' : '(Diedit)'}
                  </label>
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => setIsAmountLocked(!isAmountLocked)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                        isAmountLocked 
                          ? 'text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100' 
                          : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      {isAmountLocked ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Buka Kunci</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Kunci Kembali</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isAmountLocked ? (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-extrabold font-mono flex items-center justify-between">
                    <span>Rp {editingLedgerEntry.jumlah.toLocaleString('id-ID')}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      editingLedgerEntry.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {editingLedgerEntry.tipe}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 bg-amber-50/40 border border-amber-200/60 rounded-xl p-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">NILAI NOMINAL (Rp)</label>
                        <input
                          required
                          type="number"
                          value={editingLedgerEntry.jumlah}
                          onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, jumlah: Math.max(0, Number(e.target.value)) })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-mono">TIPE TRANSAKSI</label>
                        <select
                          value={editingLedgerEntry.tipe}
                          onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, tipe: e.target.value as 'pemasukan' | 'pengeluaran' })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans text-slate-800 font-bold"
                        >
                          <option value="pemasukan">📥 PEMASUKAN</option>
                          <option value="pengeluaran">📤 PENGELUARAN</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      ⚠️ <strong>Peringatan Admin/Bendahara:</strong> Mengubah nominal atau tipe transaksi akan langsung mengoreksi total saldo akun kas yang terpilih secara otomatis saat Anda menyimpan perubahan ini.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-150 pt-4 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingLedgerEntry(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-sky-600/10 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETIL REPRINT SUKSES & WHATSAPP RECEIPT NOTIFIKASI */}
      {reprintReceiptInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-md w-full font-sans max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setReprintReceiptInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-705 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
              title="Tutup Bukti"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Visual Header */}
            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2.5 shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-black text-slate-900 text-base leading-snug">
                Bukti Pembayaran Terverifikasi!
              </h4>
              <p className="text-[11px] text-emerald-600 font-extrabold tracking-wide uppercase font-mono block mt-0.5">
                Status: Lunas &amp; Terdaftar di Kas 🟢
              </p>
            </div>

            {/* Visual Rincian / Kuitansi PNG Preview */}
            {reprintReceiptPNGUrl ? (
              <div className="mb-4 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2 shadow-inner">
                <p className="text-[10px] text-slate-500 font-bold mb-1.5 text-center font-mono uppercase tracking-wider">Gambar Kuitansi Digital (PNG) 📸</p>
                <img 
                  src={reprintReceiptPNGUrl} 
                  alt="Kuitansi Digital" 
                  className="w-full rounded-lg border border-slate-100 shadow-md transition hover:scale-[1.01] duration-250"
                />
                <p className="text-[9px] text-slate-400 text-center mt-1.5 italic">
                  *Bisa tekan lama gambar di atas untuk simpan/bagikan langsung di HP
                </p>
              </div>
            ) : (
              <div className="h-32 mb-4 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                Mempersiapkan gambar kuitansi...
              </div>
            )}

            {/* Rincian Finansial Kuitansi */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2.5 text-[11px]">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Kategori Iuran</span>
                <span className="font-extrabold text-slate-900">{reprintReceiptInfo.category || ''}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Nama Pembayar</span>
                <span className="font-extrabold text-slate-900">{reprintReceiptInfo.nama || ''}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">
                  {reprintReceiptInfo.tipe === 'warga' ? 'Unit Rumah' : 'No Lapak'}
                </span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {reprintReceiptInfo.tipe === 'warga' 
                    ? `Blok ${(reprintReceiptInfo.blok || '')}-${(reprintReceiptInfo.noRumah || '')}` 
                    : `Lapak ${(reprintReceiptInfo.noLapak || '')}`}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Periode Pembayaran</span>
                <span className="font-extrabold text-slate-900">
                  {/\b\d{4}\b/.test(reprintReceiptInfo.bulan || '') 
                    ? (reprintReceiptInfo.bulan || '') 
                    : `${(reprintReceiptInfo.bulan || '')} ${(reprintReceiptInfo.tahun || '')}`}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Metode Kas Masuk</span>
                <span className="font-extrabold text-slate-950 font-mono text-[10px] bg-slate-200/65 px-1.5 py-0.5 rounded uppercase">
                  {(reprintReceiptInfo.kasPenerima || '')}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Tanggal &amp; Waktu</span>
                <span className="font-extrabold text-slate-800 font-mono">
                  {(reprintReceiptInfo.tanggalBayar || '')} ({(reprintReceiptInfo.jamBayar || '')})
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Petugas Kas</span>
                <span className="font-extrabold text-slate-800">{(reprintReceiptInfo.petugas || '')}</span>
              </div>
              {reprintReceiptInfo.catatan && (
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Berkas Struk</span>
                  <span className="font-extrabold text-slate-500 truncate max-w-[200px]" title={reprintReceiptInfo.catatan}>
                    {reprintReceiptInfo.catatan}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono text-xs">Total Nominal</span>
                <span className="font-black text-emerald-600 text-sm font-mono">
                  Rp {(reprintReceiptInfo.nominal || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Visual Kartu Ucapan Terima Kasih (Premium Gratitude Card) */}
            <div className="mt-3.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-250/60 rounded-2xl p-3.5 text-center relative overflow-hidden group shadow border-dashed animate-in slide-in-from-bottom-2 duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/30 rounded-bl-full pointer-events-none transition duration-500 group-hover:scale-110" />
              <div className="absolute -left-2 -bottom-2 text-3xl opacity-15 pointer-events-none select-none">🎉</div>
              <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 pointer-events-none select-none">🌸</div>
              
              <div className="flex justify-center items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider mb-1.5 font-mono">
                <span>💖 UCAPAN APRESIASI RT 08 💖</span>
              </div>
              
              <h5 className="text-xs font-black text-emerald-950 leading-snug">
                Terima Kasih Banyak Atas Pembayaran Anda! 🙏
              </h5>
              
              <p className="text-[10.5px] text-slate-650 leading-relaxed mt-2 font-medium font-sans">
                Terima kasih atas partisipasi aktif Bapak/Ibu <span className="font-extrabold text-emerald-800">{(reprintReceiptInfo.nama || '')}</span> dalam pelunasan {(reprintReceiptInfo.bulan || '').includes(',') ? 'Kolektif ' : ''}<strong className="text-slate-805 font-bold">{(reprintReceiptInfo.category || '')} ({/\b\d{4}\b/.test(reprintReceiptInfo.bulan || '') ? reprintReceiptInfo.bulan : `${reprintReceiptInfo.bulan || ''} ${reprintReceiptInfo.tahun || ''}`})</strong>.
              </p>
              
              <p className="text-[10px] text-slate-505 leading-relaxed mt-1.5 font-semibold italic bg-white/70 border border-slate-100 p-1.5 rounded-xl">
                "Kontribusi nyata Bapak/Ibu adalah wujud kepedulian berharga yang menguatkan tali kekeluargaan, menjaga kehangatan paguyuban warga, serta membawa kebaikan bersama di RT 08 Perumahan TAS 3."
              </p>
              
              <div className="flex justify-center gap-1 mt-2.5">
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
              </div>
            </div>

            {/* Tombol-Tombol Aksi Utama */}
            <div className="space-y-2 mt-4 font-sans">
              
              {/* WhatsApp Notification Share Button */}
              <button
                type="button"
                onClick={() => {
                  const noWaRaw = reprintReceiptInfo.noWa || '';
                  let noWaFmt = noWaRaw.replace(/[^\d]/g, '');
                  if (noWaFmt.startsWith('0')) {
                    noWaFmt = '62' + noWaFmt.substring(1);
                  } else if (noWaFmt.length > 0 && !noWaFmt.startsWith('62')) {
                    noWaFmt = '62' + noWaFmt;
                  }
                  
                  const detailLoc = reprintReceiptInfo.tipe === 'warga'
                    ? `Blok ${(reprintReceiptInfo.blok || '')}-${(reprintReceiptInfo.noRumah || '')}`
                    : `No Lapak ${(reprintReceiptInfo.noLapak || '')}`;

                  const isBatch = (reprintReceiptInfo.bulan || '').includes(',');
                  const numMonths = isBatch ? (reprintReceiptInfo.bulan || '').split(',').length : 1;
                  const tipeBayarText = isBatch ? `\n• Jenis: Pembayaran Kolektif (${numMonths} Bulan)` : '';
                  const hasYear = /\b\d{4}\b/.test(reprintReceiptInfo.bulan || '');
                  const periodeText = hasYear 
                    ? (reprintReceiptInfo.bulan || '') 
                    : `${(reprintReceiptInfo.bulan || '')} ${(reprintReceiptInfo.tahun || '')}`;

                  const textMessage = `Assalamualaikum wr.wb.\n\n*BUKTI PEMBAYARAN IURAN RT 08* ✅\n\nHalo Bapak/Ibu *${(reprintReceiptInfo.nama || '')}*,\nTerima kasih, pembayaran Iuran Anda telah sukses kami verifikasi.\n\n*Detail Pembayaran:*\n• Nama: ${(reprintReceiptInfo.nama || '')}\n• Unit: ${detailLoc}\n• Kategori: ${(reprintReceiptInfo.category || '')}${tipeBayarText}\n• Periode: ${periodeText}\n• Nominal: Rp ${(reprintReceiptInfo.nominal || 0).toLocaleString('id-ID')}\n• Tanggal: ${(reprintReceiptInfo.tanggalBayar || '')} ${(reprintReceiptInfo.jamBayar || '')}\n• Penerima: KAS ${(reprintReceiptInfo.kasPenerima || '').toUpperCase()}\n• Petugas: ${(reprintReceiptInfo.petugas || '')}\n\n*Status:* LUNAS & TERVERIFIKASI 🟢\n\nTerima kasih atas partisipasi aktif Bapak/Ibu dalam mendukung program pembangunan lingkungan RT 08 Perumahan TAS 3.\n\nSalam hangat,\n*Pengurus RT 08 Perumahan TAS 3* 🙏`;
                  
                  const url = noWaFmt
                    ? `https://api.whatsapp.com/send?phone=${noWaFmt}&text=${encodeURIComponent(textMessage)}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(textMessage)}`;
                  window.open(url, '_blank');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-2 active:scale-97 shadow-lg shadow-emerald-500/10"
              >
                <MessageSquare className="w-4 h-4 fill-white text-white" />
                <span>Kirim Bukti via WhatsApp</span>
              </button>

              {/* Copy Image to Clipboard Button */}
              {reprintReceiptPNGUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const ClipboardItemClass = (window as any).ClipboardItem;
                      if (!ClipboardItemClass || !navigator.clipboard || !navigator.clipboard.write) {
                        alert("Salin gambar tidak didukung oleh browser Anda di lingkungan ini. Silakan unduh gambar kuitansi sebagai gantinya.");
                        return;
                      }
                      
                      const arr = reprintReceiptPNGUrl.split(',');
                      const mime = arr[0].match(/:(.*?);/)![1];
                      const bstr = atob(arr[1]);
                      let n = bstr.length;
                      const u8arr = new Uint8Array(n);
                      while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                      }
                      const blob = new Blob([u8arr], { type: mime });

                      await navigator.clipboard.write([
                        new ClipboardItemClass({
                          [blob.type]: blob
                        })
                      ]);
                      alert("Gambar kuitansi berhasil disalin ke clipboard! Silakan paste (Ctrl+V) langsung di chat WhatsApp.");
                    } catch (err) {
                      console.error(err);
                      alert("Browser Anda membatasi salin gambar langsung. Silakan gunakan tombol Unduh Gambar.");
                    }
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-2 active:scale-97 shadow-lg shadow-sky-500/10"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Gambar Kuitansi</span>
                </button>
              )}

              {/* PNG Download Button */}
              <button
                type="button"
                onClick={() => {
                  printSingleReceiptPNG(reprintReceiptInfo);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-2 active:scale-97 border border-slate-250"
              >
                <Download className="w-4 h-4 text-slate-700" />
                <span>Unduh Gambar Kuitansi (PNG)</span>
              </button>

              {/* Tutup Button */}
              <button
                type="button"
                onClick={() => setReprintReceiptInfo(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-1 active:scale-97 shadow-sm"
              >
                Tutup
              </button>

            </div>
          </div>
        </div>
      )}

      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperImageSrc}
        initialAspectRatio={cropperAspectRatio}
        title={cropperTitle}
        onCrop={(cropped) => {
          if (cropperCallback) cropperCallback(cropped);
          setCropperOpen(false);
        }}
      />

    </div>
  );
}
