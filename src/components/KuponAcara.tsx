import React, { useState, useMemo, useRef } from 'react';
import { 
  Ticket, Plus, Search, Filter, Printer, Share2, DollarSign, 
  TrendingUp, TrendingDown, Gift, Award, CheckCircle2, Clock, 
  AlertCircle, Eye, Trash2, Edit, Calendar, Users, FileText, 
  Sparkles, Shuffle, RefreshCw, X, ChevronRight, Phone, 
  ArrowUpRight, ArrowDownRight, Wallet, Check, AlertTriangle,
  FileSpreadsheet, SlidersHorizontal, ToggleLeft, ToggleRight,
  ExternalLink, Copy, HelpCircle, Download, Image as ImageIcon, Camera, Upload, MessageSquare,
  Lock, Unlock, Archive, CheckCircle, UserX, UserCheck, Send, Home
} from 'lucide-react';
import { EventCoupon, CouponOrder, EventLedgerEntry, WargaBill, AppUser } from '../types';
import DateRangePicker from './DateRangePicker';

interface KuponAcaraProps {
  events: EventCoupon[];
  onSaveEvent: (event: EventCoupon) => Promise<void> | void;
  onDeleteEvent: (id: string) => Promise<void> | void;
  orders: CouponOrder[];
  onSaveOrder: (order: CouponOrder) => Promise<void> | void;
  onDeleteOrder: (id: string) => Promise<void> | void;
  eventLedger: EventLedgerEntry[];
  onSaveLedgerEntry: (entry: EventLedgerEntry) => Promise<void> | void;
  onDeleteLedgerEntry: (id: string) => Promise<void> | void;
  wargaList: WargaBill[];
  currentUser: AppUser | null;
  rtTitle: string;
  rtAddress: string;
  isCouponFeatureEnabled: boolean;
  onToggleFeature: (enabled: boolean) => void;
  onTransferToMainRT?: (amount: number, description: string) => Promise<void> | void;
}

export const KuponAcara: React.FC<KuponAcaraProps> = ({
  events = [],
  onSaveEvent,
  onDeleteEvent,
  orders = [],
  onSaveOrder,
  onDeleteOrder,
  eventLedger = [],
  onSaveLedgerEntry,
  onDeleteLedgerEntry,
  wargaList = [],
  currentUser,
  rtTitle = '',
  rtAddress = '',
  isCouponFeatureEnabled = true,
  onToggleFeature,
  onTransferToMainRT
}) => {
  // Active Event Selector
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const list = Array.isArray(events) ? events : [];
    const active = list.find(e => e.status === 'aktif');
    return active ? active.id : (list[0]?.id || '');
  });

  const activeEvent = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return list.find(e => e.id === selectedEventId) || list[0] || null;
  }, [events, selectedEventId]);

  // Sub-tabs: 'penjualan' | 'laporan' | 'belum_beli' | 'buku_kas' | 'undian' | 'cetak_massal' | 'pengaturan'
  const [subTab, setSubTab] = useState<'penjualan' | 'laporan' | 'belum_beli' | 'buku_kas' | 'undian' | 'cetak_massal' | 'pengaturan'>('penjualan');

  // Filters & Search for Orders
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'lunas' | 'belum_bayar'>('semua');
  const [filterBlok, setFilterBlok] = useState<string>('semua');
  const [reportSortBy, setReportSortBy] = useState<'terbaru' | 'terbanyak' | 'nama' | 'nominal'>('terbanyak');

  // Filters & Search for Warga Belum Beli Kupon
  const [searchUnboughtKeyword, setSearchUnboughtKeyword] = useState('');
  const [filterUnboughtBlok, setFilterUnboughtBlok] = useState<string>('semua');
  const [filterUnboughtStatusRumah, setFilterUnboughtStatusRumah] = useState<string>('semua');
  const [sortUnboughtBy, setSortUnboughtBy] = useState<'blok' | 'nama'>('blok');

  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CouponOrder | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventCoupon | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EventLedgerEntry | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<CouponOrder | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<CouponOrder | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [viewingPhotoModal, setViewingPhotoModal] = useState<{ url: string; title: string } | null>(null);

  // Form states for Order Modal
  const [orderBuyerType, setOrderBuyerType] = useState<'warga' | 'bebas'>('warga');
  const [orderWargaId, setOrderWargaId] = useState('');
  const [orderBuyerName, setOrderBuyerName] = useState('');
  const [orderBlokRumah, setOrderBlokRumah] = useState('');
  const [orderNoWa, setOrderNoWa] = useState('');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [orderPriceCustom, setOrderPriceCustom] = useState<number>(0);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'tunai' | 'transfer' | 'qris'>('tunai');
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<'lunas' | 'belum_bayar'>('lunas');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderFotoBukti, setOrderFotoBukti] = useState<string>('');
  const [orderFotoBuktiNama, setOrderFotoBuktiNama] = useState<string>('');
  const [orderPetugas, setOrderPetugas] = useState(currentUser?.nama || 'Panitia');

  // Form states for Event Modal
  const [eventNameInput, setEventNameInput] = useState('');
  const [eventDescInput, setEventDescInput] = useState('');
  const [eventPriceInput, setEventPriceInput] = useState(5000);
  const [eventTargetInput, setEventTargetInput] = useState(1000);
  const [eventPrefixInput, setEventPrefixInput] = useState('RI-');
  const [eventStartNumInput, setEventStartNumInput] = useState(1);
  const [eventStartDateInput, setEventStartDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [eventEndDateInput, setEventEndDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [eventPrizesInput, setEventPrizesInput] = useState('');
  const [eventBankInput, setEventBankInput] = useState('');
  const [eventContactInput, setEventContactInput] = useState('');
  const [eventStatusInput, setEventStatusInput] = useState<'aktif' | 'selesai'>('aktif');

  // Event Action Modal State (Selesai Acara vs Hapus Permanen)
  const [showActionConfirmModal, setShowActionConfirmModal] = useState(false);
  const [eventForAction, setEventForAction] = useState<EventCoupon | null>(null);

  // Form states for Event Ledger Expense
  const [expType, setExpType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [expCategory, setExpCategory] = useState('Hadiah Doorprize');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Doorprize Spinner state
  const [selectedPrizeToDraw, setSelectedPrizeToDraw] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spunNumber, setSpunNumber] = useState<string | null>(null);
  const [winnerOrder, setWinnerOrder] = useState<CouponOrder | null>(null);
  const [spinHistory, setSpinHistory] = useState<Array<{ number: string; buyer: string; prize: string; time: string }>>([]);

  // Print Mass range
  const [printStartRange, setPrintStartRange] = useState(1);
  const [printEndRange, setPrintEndRange] = useState(50);

  // Filtered orders for active event
  const eventOrders = useMemo(() => {
    if (!activeEvent) return [];
    return orders.filter(o => o.eventId === activeEvent.id);
  }, [orders, activeEvent]);

  // Filtered ledger for active event
  const eventLedgerList = useMemo(() => {
    if (!activeEvent) return [];
    return eventLedger.filter(l => l.eventId === activeEvent.id);
  }, [eventLedger, activeEvent]);

  // Financial calculations for active event (SEPARATE from Main RT)
  const stats = useMemo(() => {
    const totalKuponTerjual = eventOrders.reduce((sum, o) => sum + (o.statusBayar === 'lunas' ? o.jumlahKupon : 0), 0);
    const totalKuponPending = eventOrders.reduce((sum, o) => sum + (o.statusBayar === 'belum_bayar' ? o.jumlahKupon : 0), 0);
    
    // Revenue from paid coupons
    const revenueKupon = eventOrders.reduce((sum, o) => sum + (o.statusBayar === 'lunas' ? o.totalBayar : 0), 0);
    const revenuePending = eventOrders.reduce((sum, o) => sum + (o.statusBayar === 'belum_bayar' ? o.totalBayar : 0), 0);
    
    // Additional income in event ledger (donations, sponsors, etc.)
    const additionalIncome = eventLedgerList
      .filter(l => l.tipe === 'pemasukan')
      .reduce((sum, l) => sum + l.jumlah, 0);

    const totalIncome = revenueKupon + additionalIncome;

    // Total expense for event
    const totalExpense = eventLedgerList
      .filter(l => l.tipe === 'pengeluaran')
      .reduce((sum, l) => sum + l.jumlah, 0);

    const netBalance = totalIncome - totalExpense;

    return {
      totalKuponTerjual,
      totalKuponPending,
      revenueKupon,
      revenuePending,
      additionalIncome,
      totalIncome,
      totalExpense,
      netBalance,
      target: activeEvent?.targetKupon || 1000,
      persenTarget: Math.min(100, Math.round((totalKuponTerjual / (activeEvent?.targetKupon || 1000)) * 100))
    };
  }, [eventOrders, eventLedgerList, activeEvent]);

  // All valid coupon numbers from paid orders for Doorprize
  const allPaidCoupons = useMemo(() => {
    const list: Array<{ number: string; order: CouponOrder }> = [];
    eventOrders.forEach(order => {
      if (order.statusBayar === 'lunas') {
        order.nomorKupon.forEach(num => {
          list.push({ number: num, order });
        });
      }
    });
    return list;
  }, [eventOrders]);

  // Filtered orders display
  const displayedOrders = useMemo(() => {
    return eventOrders.filter(order => {
      // Keyword filter
      const q = searchKeyword.toLowerCase();
      const matchKeyword = !searchKeyword || 
        order.namaPembeli.toLowerCase().includes(q) ||
        (order.blokRumah && order.blokRumah.toLowerCase().includes(q)) ||
        (order.noWa && order.noWa.includes(q)) ||
        order.nomorKupon.some(n => n.toLowerCase().includes(q));

      // Status filter
      const matchStatus = filterStatus === 'semua' || order.statusBayar === filterStatus;

      // Blok filter
      const matchBlok = filterBlok === 'semua' || (order.blokRumah && order.blokRumah.startsWith(filterBlok));

      return matchKeyword && matchStatus && matchBlok;
    });
  }, [eventOrders, searchKeyword, filterStatus, filterBlok]);

  // Aggregated Buyer Report (Laporan Pembeli Teragregasi & Per Transaksi)
  const reportData = useMemo(() => {
    // 1. Group by Buyer (Nama + Blok)
    const buyerMap: {
      [key: string]: {
        namaPembeli: string;
        blokRumah?: string;
        noWa?: string;
        totalKupon: number;
        totalNominal: number;
        totalLunas: number;
        totalBelumBayar: number;
        transaksiCount: number;
        nomorKuponList: string[];
        orderIds: string[];
        statusSummary: 'lunas' | 'belum_bayar' | 'sebagian';
        latestDate: string;
      }
    } = {};

    let totalNominalSemua = 0;
    let totalKuponSemua = 0;
    let totalNominalLunas = 0;
    let totalNominalBelumBayar = 0;

    eventOrders.forEach(order => {
      const key = `${order.namaPembeli.trim().toLowerCase()}_${(order.blokRumah || '').trim().toLowerCase()}`;
      totalNominalSemua += order.totalBayar;
      totalKuponSemua += order.jumlahKupon;
      if (order.statusBayar === 'lunas') {
        totalNominalLunas += order.totalBayar;
      } else {
        totalNominalBelumBayar += order.totalBayar;
      }

      if (!buyerMap[key]) {
        buyerMap[key] = {
          namaPembeli: order.namaPembeli,
          blokRumah: order.blokRumah,
          noWa: order.noWa,
          totalKupon: 0,
          totalNominal: 0,
          totalLunas: 0,
          totalBelumBayar: 0,
          transaksiCount: 0,
          nomorKuponList: [],
          orderIds: [],
          statusSummary: 'lunas',
          latestDate: order.tanggalBeli
        };
      }

      buyerMap[key].totalKupon += order.jumlahKupon;
      buyerMap[key].totalNominal += order.totalBayar;
      buyerMap[key].transaksiCount += 1;
      buyerMap[key].nomorKuponList.push(...order.nomorKupon);
      buyerMap[key].orderIds.push(order.id);
      if (order.noWa && !buyerMap[key].noWa) {
        buyerMap[key].noWa = order.noWa;
      }
      if (order.statusBayar === 'lunas') {
        buyerMap[key].totalLunas += order.totalBayar;
      } else {
        buyerMap[key].totalBelumBayar += order.totalBayar;
      }
    });

    // Finalize status summary for each buyer
    const buyerList = Object.values(buyerMap).map(b => {
      let statusSummary: 'lunas' | 'belum_bayar' | 'sebagian' = 'lunas';
      if (b.totalBelumBayar > 0 && b.totalLunas === 0) {
        statusSummary = 'belum_bayar';
      } else if (b.totalBelumBayar > 0 && b.totalLunas > 0) {
        statusSummary = 'sebagian';
      }
      return { ...b, statusSummary };
    });

    // Filter by keyword & blok
    const filteredBuyers = buyerList.filter(b => {
      const q = searchKeyword.toLowerCase();
      const matchKeyword = !searchKeyword || 
        b.namaPembeli.toLowerCase().includes(q) ||
        (b.blokRumah && b.blokRumah.toLowerCase().includes(q)) ||
        (b.noWa && b.noWa.includes(q)) ||
        b.nomorKuponList.some(n => n.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'semua' || 
        (filterStatus === 'lunas' && b.statusSummary === 'lunas') ||
        (filterStatus === 'belum_bayar' && (b.statusSummary === 'belum_bayar' || b.statusSummary === 'sebagian'));

      const matchBlok = filterBlok === 'semua' || (b.blokRumah && b.blokRumah.startsWith(filterBlok));

      return matchKeyword && matchStatus && matchBlok;
    });

    // Sort
    filteredBuyers.sort((a, b) => {
      if (reportSortBy === 'terbanyak') {
        return b.totalKupon - a.totalKupon;
      }
      if (reportSortBy === 'nominal') {
        return b.totalNominal - a.totalNominal;
      }
      if (reportSortBy === 'nama') {
        return a.namaPembeli.localeCompare(b.namaPembeli);
      }
      // default: terbaru
      return b.latestDate.localeCompare(a.latestDate);
    });

    return {
      buyers: filteredBuyers,
      totalPembeliUnik: Object.keys(buyerMap).length,
      totalKuponSemua,
      totalNominalSemua,
      totalNominalLunas,
      totalNominalBelumBayar
    };
  }, [eventOrders, searchKeyword, filterStatus, filterBlok, reportSortBy]);

  // Active Residents in RT (not deleted & not non-active)
  const activeWargaList = useMemo(() => {
    return (wargaList || []).filter(w => !w.isDeleted && w.statusKeaktifan !== 'nonaktif');
  }, [wargaList]);

  // Unique Blocks in RT for filtering
  const uniqueBlocks = useMemo(() => {
    const blocks = new Set<string>();
    activeWargaList.forEach(w => {
      if (w.blok) blocks.add(w.blok.trim());
    });
    return Array.from(blocks).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [activeWargaList]);

  // Analysis of Residents who have bought vs NOT bought coupons for the active event
  const wargaCouponAnalysis = useMemo(() => {
    const boughtMap = new Map<string, { totalKupon: number; totalNominal: number; orders: CouponOrder[] }>();

    // Scan all orders for active event
    eventOrders.forEach(order => {
      // 1. Direct wargaId match
      if (order.wargaId) {
        const existing = boughtMap.get(order.wargaId) || { totalKupon: 0, totalNominal: 0, orders: [] };
        existing.totalKupon += order.jumlahKupon;
        existing.totalNominal += order.totalBayar;
        existing.orders.push(order);
        boughtMap.set(order.wargaId, existing);
      } else {
        // 2. Fallback match by Name and/or Blok
        const orderBlokClean = (order.blokRumah || '').toLowerCase().replace(/[\s\/\-_]/g, '');
        const orderNameClean = order.namaPembeli.trim().toLowerCase();

        const matchedWarga = activeWargaList.find(w => {
          const wBlokClean = `${w.blok}${w.noRumah}`.toLowerCase().replace(/[\s\/\-_]/g, '');
          const wNameClean = w.nama.trim().toLowerCase();
          
          if (wNameClean === orderNameClean) return true;
          if (orderBlokClean && (orderBlokClean === wBlokClean || orderBlokClean.includes(wBlokClean))) {
            return true;
          }
          return false;
        });

        if (matchedWarga) {
          const existing = boughtMap.get(matchedWarga.id) || { totalKupon: 0, totalNominal: 0, orders: [] };
          existing.totalKupon += order.jumlahKupon;
          existing.totalNominal += order.totalBayar;
          existing.orders.push(order);
          boughtMap.set(matchedWarga.id, existing);
        }
      }
    });

    const sudahBeli: Array<{ warga: WargaBill; totalKupon: number; totalNominal: number; orders: CouponOrder[] }> = [];
    const belumBeli: Array<WargaBill> = [];

    activeWargaList.forEach(w => {
      if (boughtMap.has(w.id)) {
        const info = boughtMap.get(w.id)!;
        sudahBeli.push({ warga: w, totalKupon: info.totalKupon, totalNominal: info.totalNominal, orders: info.orders });
      } else {
        belumBeli.push(w);
      }
    });

    // Total metrics
    const totalWarga = activeWargaList.length;
    const totalSudahBeli = sudahBeli.length;
    const totalBelumBeli = belumBeli.length;
    const persenPartisipasi = totalWarga > 0 ? Math.round((totalSudahBeli / totalWarga) * 100) : 0;
    const hargaKupon = activeEvent?.hargaPerKupon || 5000;
    const potensiKupon = totalBelumBeli * 2; // Estimasi 2 kupon per KK
    const potensiNominal = potensiKupon * hargaKupon;

    return {
      activeWargaList,
      sudahBeli,
      belumBeli,
      totalWarga,
      totalSudahBeli,
      totalBelumBeli,
      persenPartisipasi,
      potensiKupon,
      potensiNominal
    };
  }, [activeWargaList, eventOrders, activeEvent]);

  // Filtered Unbought Residents based on UI filters
  const filteredUnboughtWarga = useMemo(() => {
    let list = [...wargaCouponAnalysis.belumBeli];

    // Keyword filter
    if (searchUnboughtKeyword.trim()) {
      const q = searchUnboughtKeyword.toLowerCase();
      list = list.filter(w => 
        w.nama.toLowerCase().includes(q) ||
        w.blok.toLowerCase().includes(q) ||
        w.noRumah.toLowerCase().includes(q) ||
        `${w.blok}/${w.noRumah}`.toLowerCase().includes(q) ||
        (w.noWa && w.noWa.includes(q))
      );
    }

    // Blok filter
    if (filterUnboughtBlok !== 'semua') {
      list = list.filter(w => w.blok === filterUnboughtBlok);
    }

    // Status Rumah filter
    if (filterUnboughtStatusRumah !== 'semua') {
      list = list.filter(w => (w.statusRumah || 'milik_sendiri') === filterUnboughtStatusRumah);
    }

    // Sort
    list.sort((a, b) => {
      if (sortUnboughtBy === 'nama') {
        return a.nama.localeCompare(b.nama);
      }
      // default: blok & no rumah
      const blokComp = a.blok.localeCompare(b.blok, undefined, { numeric: true });
      if (blokComp !== 0) return blokComp;
      return a.noRumah.localeCompare(b.noRumah, undefined, { numeric: true });
    });

    return list;
  }, [wargaCouponAnalysis.belumBeli, searchUnboughtKeyword, filterUnboughtBlok, filterUnboughtStatusRumah, sortUnboughtBy]);

  // Generate next sequential coupon numbers
  const generateCouponNumbers = (qty: number): string[] => {
    if (!activeEvent) return [];
    const prefix = activeEvent.prefixKupon || 'KPN-';
    
    // Find highest allocated number so far
    let highestNum = activeEvent.nomorMulai ? activeEvent.nomorMulai - 1 : 0;
    eventOrders.forEach(o => {
      o.nomorKupon.forEach(k => {
        const numPart = parseInt(k.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      });
    });

    const newNumbers: string[] = [];
    for (let i = 1; i <= qty; i++) {
      const numStr = String(highestNum + i).padStart(3, '0');
      newNumbers.push(`${prefix}${numStr}`);
    }
    return newNumbers;
  };

  // Open New Order Modal (General)
  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setOrderBuyerType('warga');
    setOrderWargaId('');
    setOrderBuyerName('');
    setOrderBlokRumah('');
    setOrderNoWa('');
    setOrderQty(1);
    setOrderPriceCustom(activeEvent?.hargaPerKupon || 5000);
    setOrderPaymentMethod('tunai');
    setOrderPaymentStatus('lunas');
    setOrderNotes('');
    setOrderFotoBukti('');
    setOrderFotoBuktiNama('');
    setOrderPetugas(currentUser?.nama || 'Panitia');
    setShowOrderModal(true);
  };

  // Open New Order Modal directly for a specific Warga
  const handleOpenNewOrderForWarga = (w: WargaBill) => {
    setEditingOrder(null);
    setOrderBuyerType('warga');
    setOrderWargaId(w.id);
    setOrderBuyerName(w.nama);
    setOrderBlokRumah(`${w.blok}/${w.noRumah}`);
    setOrderNoWa(w.noWa || '');
    setOrderQty(1);
    setOrderPriceCustom(activeEvent?.hargaPerKupon || 5000);
    setOrderPaymentMethod('tunai');
    setOrderPaymentStatus('lunas');
    setOrderNotes('');
    setOrderFotoBukti('');
    setOrderFotoBuktiNama('');
    setOrderPetugas(currentUser?.nama || 'Panitia');
    setShowOrderModal(true);
  };

  // Send WhatsApp Invitation/Reminder to Warga
  const handleSendReminderWA = (w: WargaBill) => {
    const phone = (w.noWa || '').replace(/[^0-9]/g, '');
    const priceStr = (activeEvent?.hargaPerKupon || 5000).toLocaleString('id-ID');
    const prizesStr = (activeEvent?.hadiahDoorprize && activeEvent.hadiahDoorprize.length > 0)
      ? activeEvent.hadiahDoorprize.slice(0, 4).join(', ')
      : 'Kulkas, Sepeda, TV & Aneka Hadiah Menarik';

    const lines = [
      `Assalamu'alaikum / Halo Bapak/Ibu *${w.nama}* (Rumah *${w.blok}/${w.noRumah}*),`,
      ``,
      `Semoga selalu sehat dan lancar rezekinya. Kami dari Panitia *${activeEvent?.namaAcara || 'Kupon Doorprize'}* ${rtTitle ? `*${rtTitle}*` : ''} menginfokan bahwa penjualan kupon doorprize masih dibuka.`,
      ``,
      `🎟️ *Harga Kupon:* Rp ${priceStr} / lembar`,
      `🎁 *Hadiah Utama:* ${prizesStr}`,
      activeEvent?.rekeningPanitia ? `💳 *Pembayaran / Transfer:* ${activeEvent.rekeningPanitia}` : `💳 *Pembayaran:* Tunai via Panitia / Kolektor RT`,
      ``,
      `Mari bersama-sama meramaikan acara lingkungan kita! Partisipasi Bapak/Ibu sangat berarti bagi kesuksesan dan kerukunan warga.`,
      ``,
      `Bapak/Ibu bisa langsung memesan atau titip kupon dengan membalas pesan WhatsApp ini ya. Terima kasih banyak! 🙏✨`,
      ``,
      `_Salam Hangat, Panitia ${activeEvent?.namaAcara || 'Acara RT'}_`
    ];

    const fullMsg = lines.join('\n');
    if (phone) {
      const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
    }
  };

  // Share entire unbought list to Panitia / Kolektor WA
  const handleShareUnboughtToPanitiaWA = (unboughtList: WargaBill[]) => {
    const lines = [
      `📋 *DAFTAR WARGA BELUM BELI KUPON ${activeEvent?.namaAcara.toUpperCase() || 'ACARA RT'}*`,
      `📍 *${rtTitle || 'Pengurus RT'}*`,
      `📅 Per: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👥 Total Belum Beli: *${unboughtList.length} Warga / KK*`,
      `🎟️ Target Kupon: Rp ${(activeEvent?.hargaPerKupon || 5000).toLocaleString('id-ID')}/lembar`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `*RINCIAN WARGA (PER BLOK & RUMAH):*`,
      ...unboughtList.map((w, idx) => 
        `${idx + 1}. *${w.blok}/${w.noRumah}* - ${w.nama} ${w.noWa ? `(WA: ${w.noWa})` : '(Belum ada WA)'}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_Mohon bantuan panitia dan kolektor RT untuk silaturahmi & penawaran kupon doorprize door-to-door. Terima kasih!_`
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: CouponOrder) => {
    setEditingOrder(order);
    setOrderBuyerType(order.wargaId ? 'warga' : 'bebas');
    setOrderWargaId(order.wargaId || '');
    setOrderBuyerName(order.namaPembeli);
    setOrderBlokRumah(order.blokRumah || '');
    setOrderNoWa(order.noWa || '');
    setOrderQty(order.jumlahKupon);
    setOrderPriceCustom(order.hargaSatuan);
    setOrderPaymentMethod(order.metodeBayar);
    setOrderPaymentStatus(order.statusBayar);
    setOrderNotes(order.catatan || '');
    setOrderFotoBukti(order.fotoBuktiBase64 || '');
    setOrderFotoBuktiNama(order.fotoBuktiNamaFile || '');
    setOrderPetugas(order.petugas);
    setShowOrderModal(true);
  };

  // Submit Order Form
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    let buyerName = orderBuyerName.trim();
    let blokRumah = orderBlokRumah.trim();
    let noWa = orderNoWa.trim();

    if (orderBuyerType === 'warga' && orderWargaId) {
      const citizen = wargaList.find(w => w.id === orderWargaId);
      if (citizen) {
        buyerName = citizen.nama;
        blokRumah = `${citizen.blok}/${citizen.noRumah}`;
        if (!noWa && citizen.noWa) noWa = citizen.noWa;
      }
    }

    if (!buyerName) {
      alert('Mohon masukkan nama pembeli kupon.');
      return;
    }

    const unitPrice = orderPriceCustom > 0 ? orderPriceCustom : activeEvent.hargaPerKupon;
    const totalBayar = unitPrice * orderQty;

    let couponNumbers = editingOrder ? editingOrder.nomorKupon : generateCouponNumbers(orderQty);

    // If editing and quantity changed
    if (editingOrder && editingOrder.jumlahKupon !== orderQty) {
      if (orderQty > editingOrder.jumlahKupon) {
        const extraQty = orderQty - editingOrder.jumlahKupon;
        const extraNumbers = generateCouponNumbers(extraQty);
        couponNumbers = [...editingOrder.nomorKupon, ...extraNumbers];
      } else {
        couponNumbers = editingOrder.nomorKupon.slice(0, orderQty);
      }
    }

    const orderPayload: CouponOrder = {
      id: editingOrder ? editingOrder.id : `kpn-ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: activeEvent.id,
      wargaId: orderBuyerType === 'warga' ? (orderWargaId || undefined) : undefined,
      namaPembeli: buyerName,
      blokRumah: blokRumah || undefined,
      noWa: noWa || undefined,
      jumlahKupon: orderQty,
      hargaSatuan: unitPrice,
      totalBayar,
      nomorKupon: couponNumbers,
      tanggalBeli: editingOrder ? editingOrder.tanggalBeli : new Date().toISOString().split('T')[0],
      jamBeli: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      metodeBayar: orderPaymentMethod,
      statusBayar: orderPaymentStatus,
      petugas: orderPetugas,
      catatan: orderNotes || undefined,
      fotoBuktiBase64: orderFotoBukti || undefined,
      fotoBuktiNamaFile: orderFotoBuktiNama || undefined,
      createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString()
    };

    await onSaveOrder(orderPayload);
    setShowOrderModal(false);
  };

  // Open Action Modal (Pilihan Selesai Acara vs Hapus Permanen)
  const handleOpenActionModal = (event: EventCoupon) => {
    setEventForAction(event);
    setShowActionConfirmModal(true);
  };

  // Toggle status acara (Aktif <-> Selesai)
  const handleToggleEventStatus = async (event: EventCoupon, newStatus: 'aktif' | 'selesai') => {
    const updated: EventCoupon = {
      ...event,
      status: newStatus
    };
    await onSaveEvent(updated);
    setShowActionConfirmModal(false);
  };

  // Hapus permanen acara dari database
  const handlePermanentDelete = async (event: EventCoupon) => {
    await onDeleteEvent(event.id);
    const remaining = events.filter(e => e.id !== event.id);
    if (remaining.length > 0) {
      setSelectedEventId(remaining[0].id);
    } else {
      setSelectedEventId('');
    }
    setShowActionConfirmModal(false);
    setShowEventModal(false);
  };

  // Open New/Edit Event Modal
  const handleOpenEventModal = (event?: EventCoupon) => {
    if (event) {
      setEditingEvent(event);
      setEventNameInput(event.namaAcara);
      setEventDescInput(event.deskripsi);
      setEventPriceInput(event.hargaPerKupon);
      setEventTargetInput(event.targetKupon || 1000);
      setEventPrefixInput(event.prefixKupon);
      setEventStartNumInput(event.nomorMulai || 1);
      setEventStartDateInput(event.tanggalMulai);
      setEventEndDateInput(event.tanggalSelesai);
      setEventPrizesInput(event.hadiahDoorprize ? event.hadiahDoorprize.join('\n') : '');
      setEventBankInput(event.rekeningPanitia || '');
      setEventContactInput(event.kontakPanitia || '');
      setEventStatusInput(event.status || 'aktif');
    } else {
      setEditingEvent(null);
      setEventNameInput('Jalan Sehat & Doorprize 17 Agustus');
      setEventDescInput('Penjualan kupon jalan sehat dan undian doorprize kemerdekaan RT 08');
      setEventPriceInput(5000);
      setEventTargetInput(1000);
      setEventPrefixInput('RI-');
      setEventStartNumInput(1);
      setEventStartDateInput(new Date().toISOString().split('T')[0]);
      setEventEndDateInput(new Date().toISOString().split('T')[0]);
      setEventPrizesInput('Kulkas 1 Pintu\nSepeda Gunung\nMesin Cuci\nMagic Com\nKipas Angin\nPuluhan Hadiah Hiburan');
      setEventBankInput('BCA 1234567890 a/n Panitia HUT RI RT 08');
      setEventContactInput('0812-3456-7890');
      setEventStatusInput('aktif');
    }
    setShowEventModal(true);
  };

  // Submit Event Form
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventNameInput.trim()) {
      alert('Mohon isi nama acara kupon.');
      return;
    }

    const prizes = eventPrizesInput
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const eventPayload: EventCoupon = {
      id: editingEvent ? editingEvent.id : `ev-${Date.now()}`,
      namaAcara: eventNameInput.trim(),
      deskripsi: eventDescInput.trim(),
      hargaPerKupon: Number(eventPriceInput) || 5000,
      targetKupon: Number(eventTargetInput) || 1000,
      prefixKupon: (eventPrefixInput.trim() || 'KPN-').toUpperCase(),
      nomorMulai: Number(eventStartNumInput) || 1,
      tanggalMulai: eventStartDateInput,
      tanggalSelesai: eventEndDateInput,
      status: eventStatusInput,
      hadiahDoorprize: prizes,
      rekeningPanitia: eventBankInput.trim() || undefined,
      kontakPanitia: eventContactInput.trim() || undefined,
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString().split('T')[0],
      createdBy: currentUser?.nama || 'Pengurus RT'
    };

    await onSaveEvent(eventPayload);
    setSelectedEventId(eventPayload.id);
    setShowEventModal(false);
  };

  // Submit Expense Form
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;
    if (!expDesc.trim() || expAmount <= 0) {
      alert('Mohon isi deskripsi dan jumlah nominal yang valid.');
      return;
    }

    const entryPayload: EventLedgerEntry = {
      id: editingExpense ? editingExpense.id : `ev-tx-${Date.now()}`,
      eventId: activeEvent.id,
      tanggal: expDate,
      tipe: expType,
      kategori: expCategory,
      deskripsi: expDesc.trim(),
      jumlah: Number(expAmount),
      petugas: currentUser?.nama || 'Bendahara Acara',
      createdAt: new Date().toISOString()
    };

    await onSaveLedgerEntry(entryPayload);
    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpDesc('');
    setExpAmount(0);
  };

  // Doorprize Random Spinner Logic
  const handleSpinDoorprize = () => {
    if (allPaidCoupons.length === 0) {
      alert('Belum ada kupon yang LUNAS untuk diundi.');
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setWinnerOrder(null);
    setSpunNumber(null);

    let counter = 0;
    const maxIterations = 35;
    const intervalTime = 60;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allPaidCoupons.length);
      const tempPick = allPaidCoupons[randomIndex];
      setSpunNumber(tempPick.number);
      counter++;

      if (counter >= maxIterations) {
        clearInterval(interval);
        // Final pick
        const finalWinner = allPaidCoupons[Math.floor(Math.random() * allPaidCoupons.length)];
        setSpunNumber(finalWinner.number);
        setWinnerOrder(finalWinner.order);
        setIsSpinning(false);

        // Add to spin history
        const prizeLabel = selectedPrizeToDraw || 'Doorprize Spesial';
        setSpinHistory(prev => [
          {
            number: finalWinner.number,
            buyer: `${finalWinner.order.namaPembeli} (${finalWinner.order.blokRumah || 'Umum'})`,
            prize: prizeLabel,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
      }
    }, intervalTime);
  };

  // WhatsApp Share Message Formatter with Full Nota / Bukti Bayar
  const handleShareWhatsApp = (order: CouponOrder) => {
    if (!order.noWa) {
      alert('Nomor WhatsApp pembeli belum diisi. Silakan isi nomor WhatsApp di menu Edit.');
      return;
    }

    const cleanWa = order.noWa.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const msg = `🧾 *NOTA & BUKTI BAYAR KUPON ACARA RT*
━━━━━━━━━━━━━━━━━━━━━━
*${activeEvent?.namaAcara.toUpperCase() || 'ACARA JALAN SEHAT & BAZAR RT 08'}*
📍 *${rtTitle || 'RT 08 RW 08'}*
${rtAddress ? `_${rtAddress}_` : ''}
━━━━━━━━━━━━━━━━━━━━━━

Halo Bpk/Ibu *${order.namaPembeli}* (${order.blokRumah || 'Warga RT 08'}),
Terima kasih atas partisipasi dan dukungannya untuk acara RT kita!

📋 *RINCIAN TRANSAKSI:*
• No. Kuitansi: *#${order.id.slice(-6).toUpperCase()}*
• Tanggal: *${order.tanggalBeli}${order.jamBeli ? ` (${order.jamBeli} WIB)` : ''}*
• Jumlah Kupon: *${order.jumlahKupon} Lembar*
• Harga Satuan: *Rp ${order.hargaSatuan.toLocaleString('id-ID')}*
• Total Pembayaran: *Rp ${order.totalBayar.toLocaleString('id-ID')}*
• Metode Bayar: *${order.metodeBayar.toUpperCase()}*
• Status: *${order.statusBayar === 'lunas' ? '✅ LUNAS' : '⏳ BELUM BAYAR'}*
• Petugas Panitia: *${order.petugas}*

🎟️ *NOMOR SERI KUPON ANDA:*
${order.nomorKupon.map((num, i) => `👉 *${num}*`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
🎁 *HADIAH & DOORPRIZE:*
${activeEvent?.hadiahDoorprize && activeEvent.hadiahDoorprize.length > 0 
  ? activeEvent.hadiahDoorprize.slice(0, 5).map(h => `• ${h}`).join('\n') + (activeEvent.hadiahDoorprize.length > 5 ? '\n• Dan puluhan hadiah menarik lainnya!' : '')
  : '• Hadiah Utama & Puluhan Doorprize Menarik!'}

📌 *Catatan Penting:*
1. Pesan ini merupakan bukti/nota pembayaran sah.
2. Harap simpan pesan ini dan nomor seri kupon untuk pencocokan saat pengundian doorprize.
3. Kupon yang sah diundi adalah kupon dengan status pembayaran *LUNAS*.

Semoga beruntung dan membawa pulang hadiah utama! 🏆🎉

Salam Hangat,
*Panitia Acara ${activeEvent?.namaAcara || 'HUT RI RT 08'}*`;

    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & EVENT BANNER */}
      <div className="bg-linear-to-r from-red-700 via-rose-700 to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                <Ticket className="w-3.5 h-3.5 text-amber-300" />
                Fitur Temporer Khusus Acara RT
              </span>
              {activeEvent && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  activeEvent.status === 'aktif' 
                    ? 'bg-emerald-500/90 text-white' 
                    : 'bg-amber-400 text-red-950 shadow-xs'
                }`}>
                  {activeEvent.status === 'aktif' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>Penjualan Dibuka</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-red-950" />
                      <span>Acara Selesai (Penjualan Ditutup)</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeEvent ? activeEvent.namaAcara : 'Pengumpulan & Penjualan Kupon Acara'}
            </h1>
            
            <p className="text-red-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {activeEvent?.deskripsi || 'Sistem penjualan kupon bazar, jalan sehat 17 Agustus, dan undian doorprize dengan pembukuan kas panitia yang terpisah penuh dari Kas Utama RT.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-red-100 font-medium">
              <span>🎟️ Harga: <strong className="text-amber-300 font-bold">Rp {activeEvent?.hargaPerKupon.toLocaleString('id-ID') || '5.000'}</strong> / Kupon</span>
              <span>📅 Periode: {activeEvent?.tanggalMulai} s/d {activeEvent?.tanggalSelesai}</span>
              <span>🎯 Target: {stats.totalKuponTerjual} / {stats.target} Lembar ({stats.persenTarget}%)</span>
            </div>
          </div>

          {/* Quick Actions & Event Selector */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5">
            {events.length > 1 && (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id} className="text-slate-800">
                    {ev.namaAcara} ({ev.status === 'selesai' ? 'SELESAI (DITUTUP)' : 'AKTIF'})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              {activeEvent?.status === 'selesai' ? (
                <button
                  type="button"
                  onClick={() => handleToggleEventStatus(activeEvent, 'aktif')}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-red-950 font-extrabold text-xs rounded-xl shadow-lg hover:shadow-amber-400/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Buka kembali penerbitan kupon baru untuk acara ini"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Kembali Penjualan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenNewOrder}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-red-950 font-extrabold text-xs rounded-xl shadow-lg hover:shadow-amber-400/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Beli / Catat Kupon Baru</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenEventModal()}
                className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/20 transition cursor-pointer"
                title="Buat Acara Kupon Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REKAP SALDO KAS ACARA (TERPISAH DARI KAS UTAMA RT) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Kupon Terjual */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Kupon Terjual</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.totalKuponTerjual} <span className="text-xs font-normal text-slate-500">lbr</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Target {stats.target} lbr</span>
            <span className="font-bold text-amber-600">{stats.persenTarget}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.persenTarget}%` }}
            />
          </div>
        </div>

        {/* Pemasukan Kupon & Donasi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pemasukan Acara</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            Rp {stats.totalIncome.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Kupon: Rp {stats.revenueKupon.toLocaleString('id-ID')} {stats.additionalIncome > 0 && `+ Donasi: Rp ${stats.additionalIncome.toLocaleString('id-ID')}`}
          </p>
        </div>

        {/* Pengeluaran Acara */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pengeluaran Acara</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            Rp {stats.totalExpense.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Hadiah, Tenda, Sound &amp; Konsumsi
          </p>
        </div>

        {/* Sisa Saldo Kas Panitia (Terpisah) */}
        <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-bold">Saldo Bersih Panitia</span>
            <div className="p-1.5 bg-white/10 rounded-lg text-amber-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            Rp {stats.netBalance.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
            <span>🔒 Rekening Khusus Acara</span>
            {stats.netBalance > 0 && onTransferToMainRT && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="text-amber-300 hover:text-amber-200 underline font-sans font-bold cursor-pointer"
              >
                Setor ke Kas RT
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 2.5 STATUS PARTISIPASI WARGA RT (CEK SUDAH VS BELUM BELI) */}
      <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Partisipasi Warga RT: {wargaCouponAnalysis.totalSudahBeli} dari {wargaCouponAnalysis.totalWarga} Rumah ({wargaCouponAnalysis.persenPartisipasi}%)
              </h4>
              {wargaCouponAnalysis.totalBelumBeli > 0 ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold rounded-full animate-pulse">
                  {wargaCouponAnalysis.totalBelumBeli} Rumah Belum Beli
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 100% Partisipasi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {wargaCouponAnalysis.totalBelumBeli > 0 
                ? `Masih ada ${wargaCouponAnalysis.totalBelumBeli} warga RT yang belum memesan kupon doorprize acara ini.`
                : 'Seluruh warga RT terdaftar telah ikut berpartisipasi membeli kupon doorprize!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSubTab('belum_beli')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs ${
            subTab === 'belum_beli'
              ? 'bg-red-600 text-white'
              : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
          }`}
        >
          <UserX className="w-3.5 h-3.5 text-red-600" />
          <span>Cek Warga Belum Beli ({wargaCouponAnalysis.totalBelumBeli})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            type="button"
            onClick={() => setSubTab('penjualan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'penjualan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Daftar Transaksi ({eventOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('laporan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'laporan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Laporan Pembeli &amp; Nominal ({reportData.totalPembeliUnik})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('belum_beli')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'belum_beli'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4 text-amber-500" />
            <span>Belum Beli Kupon</span>
            {wargaCouponAnalysis.totalBelumBeli > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                subTab === 'belum_beli' ? 'bg-white text-red-600' : 'bg-red-500 text-white'
              }`}>
                {wargaCouponAnalysis.totalBelumBeli}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('buku_kas')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'buku_kas'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Buku Kas Acara (Terpisah)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('undian')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'undian'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Undian Doorprize (Spinner)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('cetak_massal')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'cetak_massal'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kupon Massal</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pengaturan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'pengaturan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Pengaturan Acara</span>
          </button>

        </div>

        {/* Feature Visibility Toggle */}
        <div className="flex items-center gap-2 pl-2">
          <button
            type="button"
            onClick={() => onToggleFeature(!isCouponFeatureEnabled)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isCouponFeatureEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Klik untuk menyembunyikan atau menampilkan tab Kupon dari navigasi utama"
          >
            {isCouponFeatureEnabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isCouponFeatureEnabled ? 'Fitur Kupon Aktif' : 'Fitur Disembunyikan'}</span>
          </button>
        </div>
      </div>

      {/* 4. TAB 1: PENJUALAN KUPON */}
      {subTab === 'penjualan' && (
        <div className="space-y-4">
          
          {/* Closed Event Alert Banner */}
          {activeEvent?.status === 'selesai' && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                    <span>Acara Telah Selesai (Penjualan Ditutup)</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">Terkunci</span>
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Penerbitan kupon baru telah dinonaktifkan. Seluruh data transaksi, kuitansi digital, dan laporan nominal tetap tersimpan rapi untuk arsip &amp; pembukuan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEventStatus(activeEvent, 'aktif')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 transition"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Kembali Penjualan</span>
              </button>
            </div>
          )}

          {/* Controls: Search, Filter, Add button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama pembeli, blok, nomor kupon (cth: RI-005)..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="semua">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum_bayar">Belum Bayar</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {activeEvent?.status === 'selesai' ? (
                <button
                  type="button"
                  onClick={() => handleToggleEventStatus(activeEvent, 'aktif')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Klik untuk membuka kembali penjualan kupon"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Penjualan Ditutup (Buka?)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenNewOrder}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Pembelian</span>
                </button>
              )}
            </div>

          </div>

          {/* Table of Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {displayedOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Belum Ada Transaksi Pembelian Kupon</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Klik tombol <strong>"Catat Pembelian"</strong> di atas untuk mendaftarkan pembelian kupon warga.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pembeli / Warga</th>
                      <th className="py-3 px-4">Jumlah Kupon</th>
                      <th className="py-3 px-4">Nomor Kupon</th>
                      <th className="py-3 px-4">Total Bayar</th>
                      <th className="py-3 px-4">Status &amp; Metode</th>
                      <th className="py-3 px-4 text-center">Aksi / Cetak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Pembeli */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{order.namaPembeli}</span>
                            {order.isPemenang && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-extrabold flex items-center gap-0.5">
                                <Award className="w-3 h-3 text-amber-600" /> Pemenang
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>🏠 {order.blokRumah || 'Warga Luar RT'}</span>
                            {order.noWa && <span>• 📱 {order.noWa}</span>}
                          </div>
                        </td>

                        {/* Jumlah */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 font-extrabold rounded-lg">
                            {order.jumlahKupon} Kupon
                          </span>
                        </td>

                        {/* Nomor Kupon Badges */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {order.nomorKupon.map((num, idx) => (
                              <span 
                                key={idx} 
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-mono font-bold text-[10px]"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            Rp {order.totalBayar.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            @ Rp {order.hargaSatuan.toLocaleString('id-ID')}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.statusBayar === 'lunas' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {order.statusBayar === 'lunas' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {order.statusBayar === 'lunas' ? 'LUNAS' : 'BELUM BAYAR'}
                            </span>
                            {order.fotoBuktiBase64 && (
                              <button
                                type="button"
                                onClick={() => setViewingPhotoModal({ 
                                  url: order.fotoBuktiBase64!, 
                                  title: `Bukti Bayar: ${order.namaPembeli} (${order.jumlahKupon} Kupon)` 
                                })}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                                title="Lihat Foto Bukti Transfer / Struk"
                              >
                                <ImageIcon className="w-3 h-3" /> Foto Bukti
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                            {order.metodeBayar} • {order.tanggalBeli}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* Kuitansi */}
                            <button
                              type="button"
                              onClick={() => setShowReceiptModal(order)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Lihat Kuitansi / Nota Digital"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Nota / Bukti Bayar */}
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(order)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                order.noWa 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={order.noWa ? "Kirim Nota / Bukti Bayar via WhatsApp" : "Nomor WA belum diisi (klik untuk isi)"}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Cetak Tiket Kupon */}
                            <button
                              type="button"
                              onClick={() => setShowTicketModal(order)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition cursor-pointer"
                              title="Cetak Tiket Kupon Warga"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditOrder(order)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title="Edit Data Pembelian & Bukti Bayar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus pembelian kupon atas nama ${order.namaPembeli}?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4.5. TAB: LAPORAN DAFTAR NAMA PEMBELI, JUMLAH KUPON & NOMINAL ANGKA */}
      {subTab === 'laporan' && (
        <div className="space-y-4">
          
          {/* Quick Notice to check non-buyers */}
          {wargaCouponAnalysis.totalBelumBeli > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-amber-950">
                    Masih ada {wargaCouponAnalysis.totalBelumBeli} warga RT yang belum membeli kupon ({wargaCouponAnalysis.persenPartisipasi}% sudah beli)
                  </p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Gunakan tab "Belum Beli Kupon" untuk melihat nama dan blok warga yang belum berpartisipasi serta follow-up via WhatsApp.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSubTab('belum_beli')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Lihat {wargaCouponAnalysis.totalBelumBeli} Warga Belum Beli</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Header & Quick Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Warga/Pembeli</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {reportData.totalPembeliUnik} <span className="text-xs font-normal text-slate-500">orang</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi seluruh pemesan</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Kupon Terjual</span>
              <div className="text-xl font-black text-red-600 mt-0.5">
                {reportData.totalKuponSemua} <span className="text-xs font-normal text-slate-500">lembar</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">@ Rp {activeEvent?.hargaPerKupon.toLocaleString('id-ID') || '5.000'} / kupon</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Uang Masuk (Lunas)</span>
              <div className="text-xl font-black text-emerald-600 mt-0.5">
                Rp {reportData.totalNominalLunas.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Sudah diterima panitia</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Belum Bayar</span>
              <div className="text-xl font-black text-amber-600 mt-0.5">
                Rp {reportData.totalNominalBelumBayar.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Menunggu pelunasan</p>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama pembeli, blok rumah, no kupon..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="semua">Semua Status Bayar</option>
                <option value="lunas">Hanya Lunas</option>
                <option value="belum_bayar">Belum Lunas / Sebagian</option>
              </select>

              {/* Sort selector */}
              <select
                value={reportSortBy}
                onChange={(e) => setReportSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="terbanyak">Urut: Kupon Terbanyak</option>
                <option value="nominal">Urut: Nominal Tertinggi</option>
                <option value="nama">Urut: Nama Warga (A-Z)</option>
                <option value="terbaru">Urut: Transaksi Terbaru</option>
              </select>
            </div>

            {/* Action buttons: Print & WhatsApp Summary */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const summaryLines = [
                    `📊 *LAPORAN PENJUALAN KUPON ${activeEvent?.namaAcara.toUpperCase() || 'ACARA RT'}*`,
                    `📍 *${rtTitle || 'Pengurus RT 08'}*`,
                    `📅 Per: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    `👥 Total Pembeli: *${reportData.totalPembeliUnik} Orang*`,
                    `🎟️ Total Kupon: *${reportData.totalKuponSemua} Lembar*`,
                    `💰 Total Nominal: *Rp ${reportData.totalNominalSemua.toLocaleString('id-ID')}*`,
                    `✅ Lunas: *Rp ${reportData.totalNominalLunas.toLocaleString('id-ID')}*`,
                    `⏳ Belum Bayar: *Rp ${reportData.totalNominalBelumBayar.toLocaleString('id-ID')}*`,
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    `*DAFTAR NAMA & JUMLAH KUPON:*`,
                    ...reportData.buyers.map((b, i) => 
                      `${i + 1}. *${b.namaPembeli}* (${b.blokRumah || 'Warga'})\n   👉 ${b.totalKupon} Kupon = Rp ${b.totalNominal.toLocaleString('id-ID')} [${b.statusSummary === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}]`
                    ),
                    `━━━━━━━━━━━━━━━━━━━━━━`,
                    `_Panitia ${activeEvent?.namaAcara || 'Kupon Acara RT'}_`
                  ];
                  const fullText = summaryLines.join('\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Kirim Rekap Daftar Pembeli ke WhatsApp Panitia / Grup RT"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan ke WA</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Cetak Dokumen Laporan"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            
            {/* Header visible for print */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Daftar Warga &amp; Pembeli Kupon ({reportData.buyers.length} Orang Terdaftar)
                </h4>
                <p className="text-xs text-slate-500">
                  Rincian lengkap nama warga, blok rumah, jumlah lembar kupon, nomor seri kupon, dan nominal angka pembayaran.
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-500">Grand Total: </span>
                <span className="text-sm font-black text-slate-900">
                  Rp {reportData.totalNominalSemua.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {reportData.buyers.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <p className="text-xs font-bold text-slate-600">Tidak ada data pembeli yang sesuai dengan filter.</p>
                <p className="text-[11px] text-slate-400">Silakan ubah kata kunci pencarian atau status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-4">Nama Pembeli</th>
                      <th className="py-3 px-4">Blok / Alamat</th>
                      <th className="py-3 px-4 text-center">Jumlah Kupon</th>
                      <th className="py-3 px-4">Nominal Angka (Rp)</th>
                      <th className="py-3 px-4">Status Pembayaran</th>
                      <th className="py-3 px-4">Nomor Seri Kupon</th>
                      <th className="py-3 px-3.5 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.buyers.map((buyer, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        
                        {/* No */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Nama */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{buyer.namaPembeli}</span>
                          </div>
                          {buyer.noWa && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              WA: {buyer.noWa}
                            </div>
                          )}
                        </td>

                        {/* Blok */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {buyer.blokRumah || 'Luar RT'}
                          </span>
                        </td>

                        {/* Jumlah Kupon */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-black rounded-lg text-xs">
                            {buyer.totalKupon} Lembar
                          </span>
                        </td>

                        {/* Nominal Angka */}
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 text-xs">
                            Rp {buyer.totalNominal.toLocaleString('id-ID')}
                          </div>
                          {buyer.transaksiCount > 1 && (
                            <span className="text-[10px] text-slate-400">
                              ({buyer.transaksiCount}x transaksi)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {buyer.statusSummary === 'lunas' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold rounded-full text-[10px]">
                              <Check className="w-3 h-3" /> LUNAS
                            </span>
                          ) : buyer.statusSummary === 'sebagian' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-extrabold rounded-full text-[10px]">
                              <Clock className="w-3 h-3" /> Sebagian (Lunas: Rp {buyer.totalLunas.toLocaleString('id-ID')})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold rounded-full text-[10px]">
                              <Clock className="w-3 h-3" /> BELUM BAYAR
                            </span>
                          )}
                        </td>

                        {/* Nomor Kupon */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                            {buyer.nomorKuponList.map((num, kIdx) => (
                              <span 
                                key={kIdx}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-mono font-bold text-[10px]"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center print:hidden">
                          {buyer.noWa && (
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `Halo Bpk/Ibu *${buyer.namaPembeli}*,\nBerikut konfirmasi data pembelian kupon *${activeEvent?.namaAcara || 'Acara RT'}*:\n\n• Jumlah: *${buyer.totalKupon} Kupon*\n• Total Nominal: *Rp ${buyer.totalNominal.toLocaleString('id-ID')}*\n• Status: *${buyer.statusSummary === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}*\n• Nomor Kupon:\n${buyer.nomorKuponList.map(n => `👉 *${n}*`).join('\n')}\n\nTerima kasih atas partisipasinya!`;
                                const clean = buyer.noWa!.replace(/\D/g, '').replace(/^0/, '62');
                                window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                              title="Kirim rincian ke WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                  {/* Table Footer Total */}
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right">
                        TOTAL KESELURUHAN:
                      </td>
                      <td className="py-3 px-4 text-center text-red-700 font-black">
                        {reportData.totalKuponSemua} Lembar
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        Rp {reportData.totalNominalSemua.toLocaleString('id-ID')}
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-[11px] text-slate-500 font-bold">
                        (Lunas: Rp {reportData.totalNominalLunas.toLocaleString('id-ID')} • Belum Lunas: Rp {reportData.totalNominalBelumBayar.toLocaleString('id-ID')})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4.6. TAB: WARGA BELUM BELI KUPON (CHECK & FOLLOW-UP WARGA RT) */}
      {/* ========================================================================= */}
      {subTab === 'belum_beli' && (
        <div className="space-y-4">
          
          {/* Header & Quick Metric Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Total Warga RT */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Warga RT</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {wargaCouponAnalysis.totalWarga} <span className="text-xs font-normal text-slate-500">Rumah / KK</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Warga aktif terdata di buku warga</p>
            </div>

            {/* Belum Beli Kupon */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50/60 border border-red-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-700 uppercase">Belum Beli Kupon</span>
                <span className="text-[10px] font-extrabold bg-red-200 text-red-900 px-2 py-0.5 rounded-md">
                  {wargaCouponAnalysis.totalWarga > 0 
                    ? `${Math.round((wargaCouponAnalysis.totalBelumBeli / wargaCouponAnalysis.totalWarga) * 100)}%` 
                    : '0%'}
                </span>
              </div>
              <div className="text-xl font-black text-red-700 mt-0.5">
                {wargaCouponAnalysis.totalBelumBeli} <span className="text-xs font-bold text-red-600">Rumah / KK</span>
              </div>
              <p className="text-[10px] text-red-700 mt-0.5">Perlu follow-up / penawaran</p>
            </div>

            {/* Sudah Beli Kupon */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Sudah Beli Kupon</span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  {wargaCouponAnalysis.persenPartisipasi}% Partisipasi
                </span>
              </div>
              <div className="text-xl font-black text-emerald-600 mt-0.5">
                {wargaCouponAnalysis.totalSudahBeli} <span className="text-xs font-normal text-slate-500">Rumah / KK</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Sudah pesan kupon doorprize</p>
            </div>

            {/* Potensi Kas Tambahan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Potensi Tambahan Kas</span>
              <div className="text-xl font-black text-amber-600 mt-0.5">
                Rp {wargaCouponAnalysis.potensiNominal.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Jika {wargaCouponAnalysis.totalBelumBeli} KK beli min. 2 kupon (@ Rp {(activeEvent?.hargaPerKupon || 5000).toLocaleString('id-ID')})
              </p>
            </div>

          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama warga, blok/no rumah, WA..."
                  value={searchUnboughtKeyword}
                  onChange={(e) => setSearchUnboughtKeyword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              {/* Filter Blok */}
              <select
                value={filterUnboughtBlok}
                onChange={(e) => setFilterUnboughtBlok(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="semua">Semua Blok ({uniqueBlocks.length} Blok)</option>
                {uniqueBlocks.map(b => (
                  <option key={b} value={b}>Blok {b}</option>
                ))}
              </select>

              {/* Filter Status Rumah */}
              <select
                value={filterUnboughtStatusRumah}
                onChange={(e) => setFilterUnboughtStatusRumah(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="semua">Semua Status Rumah</option>
                <option value="milik_sendiri">Milik Sendiri</option>
                <option value="sewa_kontrak">Sewa / Kontrak</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortUnboughtBy}
                onChange={(e) => setSortUnboughtBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="blok">Urut: Blok &amp; No Rumah</option>
                <option value="nama">Urut: Nama Warga (A-Z)</option>
              </select>

            </div>

            {/* Action buttons: Broadcast WhatsApp & Print Door-to-Door sheet */}
            <div className="flex items-center gap-2 shrink-0">
              
              <button
                type="button"
                onClick={() => handleShareUnboughtToPanitiaWA(filteredUnboughtWarga)}
                disabled={filteredUnboughtWarga.length === 0}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Kirim Daftar Warga Belum Beli ke WhatsApp Panitia / Kolektor Blok"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Rekap ke WA Panitia</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Cetak Lembar Checklist Kunjungan Panitia"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Kunjungan</span>
              </button>

            </div>
          </div>

          {/* Table of Unbought Residents */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            
            {/* Header info */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-600" />
                  <span>Daftar Warga RT Belum Beli Kupon ({filteredUnboughtWarga.length} Rumah / KK)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar warga aktif RT yang belum terdata melakukan pemesanan kupon acara <strong>{activeEvent?.namaAcara}</strong>.
                </p>
              </div>

              {filteredUnboughtWarga.length > 0 && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500">Harga Kupon: </span>
                  <span className="text-xs font-extrabold text-red-600">
                    Rp {(activeEvent?.hargaPerKupon || 5000).toLocaleString('id-ID')} / lembar
                  </span>
                </div>
              )}
            </div>

            {filteredUnboughtWarga.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                {wargaCouponAnalysis.totalBelumBeli === 0 ? (
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
                      🎉
                    </div>
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      Luar Biasa! 100% Warga RT Telah Membeli Kupon
                    </h4>
                    <p className="text-xs text-slate-500">
                      Seluruh {wargaCouponAnalysis.totalWarga} rumah / KK terdaftar di RT telah berpartisipasi membeli kupon doorprize acara ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <p className="text-xs font-bold text-slate-600">Tidak ada data warga yang sesuai dengan filter pencarian.</p>
                    <p className="text-[11px] text-slate-400">Silakan ubah kata kunci pencarian atau ganti filter blok.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-4">Blok / No Rumah</th>
                      <th className="py-3 px-4">Nama Kepala Keluarga</th>
                      <th className="py-3 px-4">Status Rumah</th>
                      <th className="py-3 px-4">Kontak WhatsApp</th>
                      <th className="py-3 px-4 text-center print:table-cell hidden sm:table-cell">Target Min.</th>
                      <th className="py-3 px-3.5 text-center print:hidden">Aksi Follow-Up</th>
                      <th className="py-3 px-4 text-center hidden print:table-cell">Checklist / TTD Warga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnboughtWarga.map((warga, idx) => (
                      <tr key={warga.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* No */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Blok & No Rumah */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                            {warga.blok}/{warga.noRumah}
                          </span>
                        </td>

                        {/* Nama Warga */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{warga.nama}</span>
                          </div>
                        </td>

                        {/* Status Rumah */}
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            warga.statusRumah === 'sewa_kontrak'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {warga.statusRumah === 'sewa_kontrak' ? 'Sewa / Kontrak' : 'Milik Sendiri'}
                          </span>
                        </td>

                        {/* Kontak WA */}
                        <td className="py-3 px-4">
                          {warga.noWa ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-700 font-mono text-[11px]">{warga.noWa}</span>
                              <button
                                type="button"
                                onClick={() => handleSendReminderWA(warga)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition cursor-pointer print:hidden"
                                title="Buka Chat WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ada no WA</span>
                          )}
                        </td>

                        {/* Target Min (2 Kupon) */}
                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                          <span className="text-slate-600 font-semibold text-[11px]">
                            2 Kupon (Rp {( (activeEvent?.hargaPerKupon || 5000) * 2 ).toLocaleString('id-ID')})
                          </span>
                        </td>

                        {/* Aksi Follow-Up (Web view) */}
                        <td className="py-3 px-3.5 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Tombol Catat / Beli Kupon */}
                            <button
                              type="button"
                              onClick={() => handleOpenNewOrderForWarga(warga)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                              title={`Catat Pembelian Kupon untuk ${warga.nama}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Beli Kupon</span>
                            </button>

                            {/* Tombol Kirim WA Penawaran */}
                            <button
                              type="button"
                              onClick={() => handleSendReminderWA(warga)}
                              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                                warga.noWa
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                              title={`Kirim Pesan Penawaran Kupon ke WhatsApp ${warga.nama}`}
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden md:inline">Kirim WA</span>
                            </button>

                          </div>
                        </td>

                        {/* Printable Column for Door-to-Door rounds */}
                        <td className="py-3 px-4 text-center hidden print:table-cell border-l border-slate-200">
                          <div className="h-6 border-b border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                            [ &nbsp; &nbsp; &nbsp; &nbsp; Lembar / Rp &nbsp; &nbsp; &nbsp; &nbsp; ]
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                  {/* Table Footer */}
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 text-left">
                        TOTAL BELUM BELI:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-red-700 font-black">
                        {filteredUnboughtWarga.length} Rumah / KK
                      </td>
                      <td colSpan={4} className="py-3 px-4 text-[11px] text-slate-600 text-right">
                        Potensi Kas Masuk: <strong>Rp {(filteredUnboughtWarga.length * 2 * (activeEvent?.hargaPerKupon || 5000)).toLocaleString('id-ID')}</strong> (asumsi 2 kupon/KK)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 5. TAB 2: BUKU KAS ACARA (TERPISAH DARI RT) */}
      {subTab === 'buku_kas' && (
        <div className="space-y-4">
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Catatan Keuangan Khusus Acara Panitia</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Seluruh transaksi pemasukan kupon, donasi sponsor, dan pengeluaran hadiah/panggung di bawah ini dicatat 
                <strong> terpisah sepenuhnya</strong> dari Kas Rutin RT &amp; Lapak Rombong.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Riwayat Mutasi Keuangan Acara</h3>
              <p className="text-xs text-slate-500">Pemasukan penjualan kupon otomatis terhitung dalam rekap saldo.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpType('pemasukan');
                  setExpCategory('Donasi / Sponsor Acara');
                  setExpDesc('');
                  setExpAmount(0);
                  setShowExpenseModal(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Pemasukan Donatur/Sponsor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpType('pengeluaran');
                  setExpCategory('Hadiah Doorprize');
                  setExpDesc('');
                  setExpAmount(0);
                  setShowExpenseModal(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>- Catat Pengeluaran Acara</span>
              </button>
            </div>
          </div>

          {/* Table of Event Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {eventLedgerList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <p className="text-xs font-semibold">Belum ada catatan mutasi pengeluaran khusus acara.</p>
                <p className="text-[11px] text-slate-400">Pemasukan kupon telah otomatis terkumpul Rp {stats.revenueKupon.toLocaleString('id-ID')}.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Tipe &amp; Kategori</th>
                    <th className="py-3 px-4">Deskripsi / Keperluan</th>
                    <th className="py-3 px-4">Jumlah Nominal</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventLedgerList.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">{entry.tanggal}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          entry.tipe === 'pemasukan' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {entry.tipe === 'pemasukan' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {entry.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{entry.deskripsi}</td>
                      <td className="py-3 px-4 font-black">
                        <span className={entry.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}>
                          {entry.tipe === 'pemasukan' ? '+' : '-'} Rp {entry.jumlah.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{entry.petugas}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus catatan mutasi "${entry.deskripsi}"?`)) {
                              onDeleteLedgerEntry(entry.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* 6. TAB 3: UNDIAN DOORPRIZE (SPINNER) */}
      {subTab === 'undian' && (
        <div className="space-y-6">
          
          <div className="bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative overflow-hidden text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              Sistem Undian Doorprize Acara RT 08
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              Kocok Nomor Kupon Doorprize
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-1">
              Hanya nomor kupon dengan status <strong>LUNAS</strong> yang masuk dalam undian (Total: <strong>{allPaidCoupons.length} kupon berhak undian</strong>).
            </p>

            {/* Prize Selector */}
            {activeEvent?.hadiahDoorprize && activeEvent.hadiahDoorprize.length > 0 && (
              <div className="max-w-md mx-auto mt-4">
                <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1.5">
                  Pilih Kategori Hadiah Yang Sedang Diundi:
                </label>
                <select
                  value={selectedPrizeToDraw}
                  onChange={(e) => setSelectedPrizeToDraw(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="">-- Pilih Hadiah Yang Diundi --</option>
                  {activeEvent.hadiahDoorprize.map((prize, idx) => (
                    <option key={idx} value={prize}>
                      🎁 {prize}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Large Spinner Display Box */}
            <div className="my-8 py-8 px-6 bg-slate-950/80 border-2 border-amber-500/40 rounded-3xl max-w-lg mx-auto shadow-inner relative overflow-hidden">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-2 font-mono">
                {isSpinning ? 'Sedang Mengacak Nomor Kupon...' : (winnerOrder ? '🎉 SELAMAT KEPADA PEMENANG! 🎉' : 'Siap Untuk Diundi')}
              </div>

              {/* Number Display */}
              <div className="text-5xl sm:text-7xl font-black text-amber-300 tracking-wider font-mono my-2 animate-in zoom-in duration-150">
                {spunNumber || 'RI-???'}
              </div>

              {/* Winner Details */}
              {winnerOrder && !isSpinning && (
                <div className="mt-4 p-4 bg-amber-400/10 border border-amber-400/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-lg font-extrabold text-white">
                    {winnerOrder.namaPembeli}
                  </div>
                  <div className="text-xs text-amber-200 mt-0.5">
                    🏠 Blok {winnerOrder.blokRumah || 'Umum'} {winnerOrder.noWa && `• 📱 ${winnerOrder.noWa}`}
                  </div>
                  {selectedPrizeToDraw && (
                    <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 py-1 px-3 rounded-full inline-block border border-emerald-500/30">
                      🎁 Memenangkan: {selectedPrizeToDraw}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Spin Button */}
            <button
              type="button"
              disabled={isSpinning || allPaidCoupons.length === 0}
              onClick={handleSpinDoorprize}
              className="px-8 py-4 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-red-950 font-black text-base rounded-2xl shadow-xl hover:shadow-amber-400/40 transition active:scale-95 cursor-pointer inline-flex items-center gap-2.5"
            >
              <Shuffle className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Mengocok Kupon...' : 'PUTAR / KOCOK UNDIAN SEKARANG'}</span>
            </button>
          </div>

          {/* History of Winners */}
          {spinHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Daftar Pemenang Undian Doorprize</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {spinHistory.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-mono font-black rounded-lg">
                        {item.number}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{item.buyer}</div>
                        <div className="text-[11px] text-slate-500">Hadiah: <strong className="text-emerald-700">{item.prize}</strong></div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{item.time} WIB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 7. TAB 4: CETAK KUPON MASSAL */}
      {subTab === 'cetak_massal' && (
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Lembar Cetak Kupon Fisik (Format A4)</h3>
              <p className="text-xs text-slate-500">Format kupon robek dengan nomor seri rapi siap cetak dan digunting.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span>Rentang:</span>
                <input
                  type="number"
                  min="1"
                  value={printStartRange}
                  onChange={(e) => setPrintStartRange(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                />
                <span>s/d</span>
                <input
                  type="number"
                  min={printStartRange}
                  value={printEndRange}
                  onChange={(e) => setPrintEndRange(Math.max(printStartRange, Number(e.target.value)))}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembaran</span>
              </button>
            </div>
          </div>

          {/* Printable Ticket Grid Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2">
            {Array.from({ length: Math.max(1, printEndRange - printStartRange + 1) }).map((_, idx) => {
              const currentNum = printStartRange + idx;
              const formattedNo = `${activeEvent?.prefixKupon || 'RI-'}${String(currentNum).padStart(3, '0')}`;
              
              return (
                <div 
                  key={currentNum}
                  className="border-2 border-dashed border-red-300 bg-white rounded-2xl p-4 flex flex-col justify-between shadow-xs relative overflow-hidden"
                >
                  {/* Left decorative strip */}
                  <div className="flex items-start justify-between border-b border-red-100 pb-2 mb-2">
                    <div>
                      <div className="text-[10px] font-extrabold text-red-700 uppercase tracking-wide">
                        {rtTitle}
                      </div>
                      <div className="font-black text-slate-900 text-xs">
                        {activeEvent?.namaAcara || 'Kupon Jalan Sehat & Doorprize'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-red-600 text-white font-mono font-black text-xs rounded-md">
                        {formattedNo}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] my-1">
                    <div className="col-span-2 space-y-0.5">
                      <p className="text-slate-500">Harga: <strong className="text-slate-900">Rp {activeEvent?.hargaPerKupon.toLocaleString('id-ID')}</strong></p>
                      <p className="text-slate-500">Tgl: <strong className="text-slate-900">{activeEvent?.tanggalSelesai}</strong></p>
                      <p className="text-[9px] text-slate-400 italic">Bawa potongan ini saat hari H pengundian.</p>
                    </div>

                    {/* Tear-off slip for ballot box */}
                    <div className="border-l-2 border-dashed border-slate-200 pl-2 flex flex-col justify-between text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">POTONGAN KOTAK UNDIAN</span>
                      <span className="font-mono font-black text-red-700 text-xs">{formattedNo}</span>
                      <span className="text-[8px] text-slate-400">Nama: ........</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 8. TAB 5: PENGATURAN ACARA */}
      {subTab === 'pengaturan' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Pengaturan Program &amp; Acara Kupon</h3>
            <p className="text-xs text-slate-500">Kelola detail acara, harga tiket, dan kontrol visibilitas fitur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Detail Acara Card */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800 text-xs">Acara Aktif Saat Ini</span>
                  {activeEvent && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      activeEvent.status === 'aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {activeEvent.status === 'aktif' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Aktif (Dibuka)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Selesai (Terkunci)</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {activeEvent && (
                    <button
                      type="button"
                      onClick={() => handleToggleEventStatus(activeEvent, activeEvent.status === 'aktif' ? 'selesai' : 'aktif')}
                      className={`text-xs font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg transition ${
                        activeEvent.status === 'aktif'
                          ? 'text-amber-800 bg-amber-100 hover:bg-amber-200'
                          : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200'
                      }`}
                      title={activeEvent.status === 'aktif' ? 'Kunci & Selesaikan Acara (Tutup Penjualan)' : 'Buka Kembali Penjualan Kupon'}
                    >
                      {activeEvent.status === 'aktif' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Selesaikan Acara</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Buka Penjualan</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => activeEvent && handleOpenEventModal(activeEvent)}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>

                  {events.length > 0 && activeEvent && (
                    <button
                      type="button"
                      onClick={() => handleOpenActionModal(activeEvent)}
                      className="text-xs text-rose-700 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition"
                      title="Kelola Status Selesai atau Hapus Permanen"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus / Kelola
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p><span className="text-slate-500">Nama Acara:</span> <strong className="text-slate-900">{activeEvent?.namaAcara}</strong></p>
                <p><span className="text-slate-500">Harga Per Kupon:</span> <strong className="text-slate-900">Rp {activeEvent?.hargaPerKupon.toLocaleString('id-ID')}</strong></p>
                <p><span className="text-slate-500">Prefix Nomor:</span> <strong className="text-slate-900 font-mono">{activeEvent?.prefixKupon}</strong></p>
                <p><span className="text-slate-500">Target Kuota:</span> <strong className="text-slate-900">{activeEvent?.targetKupon} Lembar</strong></p>
                <p><span className="text-slate-500">Periode:</span> <strong className="text-slate-900">{activeEvent?.tanggalMulai} s/d {activeEvent?.tanggalSelesai}</strong></p>
              </div>
            </div>

            {/* Daftar Semua Acara & Manajemen Hapus */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">Daftar Semua Acara Kupon ({events.length})</span>
                <button
                  type="button"
                  onClick={() => handleOpenEventModal()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat Acara Baru
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Belum ada acara kupon yang dibuat.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {events.map((ev) => {
                    const isCurrent = ev.id === activeEvent?.id;
                    return (
                      <div 
                        key={ev.id} 
                        className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                          isCurrent 
                            ? 'bg-white border-red-300 shadow-xs ring-1 ring-red-400' 
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              ev.status === 'aktif' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {ev.status === 'aktif' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  <span>Aktif (Dibuka)</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-amber-700" />
                                  <span>Selesai (Terkunci)</span>
                                </>
                              )}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                Sedang Dibuka
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{ev.namaAcara}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Rp {ev.hargaPerKupon.toLocaleString('id-ID')} / kupon • Target: {ev.targetKupon} lbr
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => setSelectedEventId(ev.id)}
                              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            >
                              Pilih Acara
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Acara Terpilih</span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleEventStatus(ev, ev.status === 'aktif' ? 'selesai' : 'aktif')}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                ev.status === 'aktif' 
                                  ? 'text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100' 
                                  : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                              title={ev.status === 'aktif' ? 'Tandai Selesai (Kunci Penjualan)' : 'Buka Kembali Penjualan'}
                            >
                              {ev.status === 'aktif' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEventModal(ev)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Acara"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenActionModal(ev)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                              title="Hapus / Selesai Acara"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Toggle Visibilitas */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">Visibilitas Menu Kupon</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Karena fitur kupon ini bersifat <em>temporary</em> (musiman), Anda dapat menyembunyikan tab ini dari menu navigasi RT jika acara telah selesai.
              </p>

              <button
                type="button"
                onClick={() => onToggleFeature(!isCouponFeatureEnabled)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  isCouponFeatureEnabled 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                }`}
              >
                {isCouponFeatureEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{isCouponFeatureEnabled ? 'Status: Fitur Ditampilkan di Menu' : 'Status: Fitur Disembunyikan'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATAT / BELI KUPON BARU */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-w-lg w-full text-slate-800 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {editingOrder ? 'Edit Pembelian Kupon' : 'Catat Pembelian Kupon Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{activeEvent?.namaAcara}</p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setShowOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* Tipe Pembeli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Pembeli:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderBuyerType('warga')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      orderBuyerType === 'warga'
                        ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Warga Terdaftar RT
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderBuyerType('bebas')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      orderBuyerType === 'bebas'
                        ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Warga Luar / Umum
                  </button>
                </div>
              </div>

              {/* Select Warga */}
              {orderBuyerType === 'warga' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Warga:
                  </label>
                  <select
                    value={orderWargaId}
                    onChange={(e) => {
                      setOrderWargaId(e.target.value);
                      const w = wargaList.find(c => c.id === e.target.value);
                      if (w) {
                        setOrderBuyerName(w.nama);
                        setOrderBlokRumah(`${w.blok}/${w.noRumah}`);
                        if (w.noWa) setOrderNoWa(w.noWa);
                      }
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Pilih Nama Warga &amp; Blok --</option>
                    {wargaList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.blok}/{w.noRumah} - {w.nama}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Pembeli:
                    </label>
                    <input
                      type="text"
                      placeholder="Nama lengkap"
                      value={orderBuyerName}
                      onChange={(e) => setOrderBuyerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat / Blok:
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: Blok B3 / Tamu"
                      value={orderBlokRumah}
                      onChange={(e) => setOrderBlokRumah(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* No WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp (untuk kirim nomor kupon digital):
                </label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={orderNoWa}
                  onChange={(e) => setOrderNoWa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Jumlah Kupon & Shortcut Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Kupon:
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 5, 10, 20].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setOrderQty(qty)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        orderQty === qty 
                          ? 'bg-red-600 text-white border-red-600' 
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-red-900 font-medium">Total Pembayaran:</span>
                  <div className="text-lg font-black text-red-700">
                    Rp {((orderPriceCustom > 0 ? orderPriceCustom : (activeEvent?.hargaPerKupon || 5000)) * orderQty).toLocaleString('id-ID')}
                  </div>
                </div>
                <span className="text-xs font-bold text-red-800">
                  {orderQty} Kupon x Rp {(orderPriceCustom > 0 ? orderPriceCustom : (activeEvent?.hargaPerKupon || 5000)).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Status & Metode Bayar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Bayar:
                  </label>
                  <select
                    value={orderPaymentMethod}
                    onChange={(e) => setOrderPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="tunai">Tunai (Cash Panitia)</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Bayar:
                  </label>
                  <select
                    value={orderPaymentStatus}
                    onChange={(e) => setOrderPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="lunas">LUNAS</option>
                    <option value="belum_bayar">Belum Bayar</option>
                  </select>
                </div>
              </div>

              {/* Upload Foto Bukti Bayar / Struk Transfer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto Bukti Bayar / Struk Transfer (Opsional):
                </label>
                
                {orderFotoBukti ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={orderFotoBukti} 
                        alt="Bukti Bayar" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0 cursor-pointer"
                        onClick={() => setViewingPhotoModal({ url: orderFotoBukti, title: `Bukti Bayar: ${orderBuyerName || 'Kupon'}` })}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{orderFotoBuktiNama || 'bukti-transfer.jpg'}</p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Foto Bukti Terlampir
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingPhotoModal({ url: orderFotoBukti, title: `Bukti Bayar: ${orderBuyerName || 'Kupon'}` })}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Perbesar Foto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderFotoBukti('');
                          setOrderFotoBuktiNama('');
                        }}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-red-400 bg-slate-50/70 hover:bg-red-50/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <div className="p-2 bg-white rounded-full shadow-xs text-slate-400 group-hover:text-red-600 mb-1.5 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-red-700">
                      Unggah / Foto Bukti Transfer / Nota
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, atau WebP (Maks. 5MB)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Ukuran file maksimal 5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setOrderFotoBukti(reader.result as string);
                            setOrderFotoBuktiNama(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Cth: Titip di pos satpam / Bayar via transfer BCA"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Petugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Petugas Panitia:
                </label>
                <input
                  type="text"
                  value={orderPetugas}
                  onChange={(e) => setOrderPetugas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {!editingOrder && activeEvent?.status === 'selesai' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-950">Acara Telah Selesai (Penjualan Ditutup)</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Penerbitan kupon baru tidak dapat dilakukan karena status acara telah ditandai Selesai. Buka kembali status acara di tab Pengaturan jika ingin melanjutkan penjualan.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!editingOrder && activeEvent?.status === 'selesai'}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer transition"
                >
                  {!editingOrder && activeEvent?.status === 'selesai'
                    ? 'Penjualan Ditutup'
                    : (editingOrder ? 'Simpan Perubahan' : 'Simpan Pembelian')
                  }
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT / EDIT ACARA KUPON */}
      {/* ========================================================================= */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-w-lg w-full text-slate-800 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingEvent ? 'Edit Acara Kupon' : 'Buat Acara Kupon Baru'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowEventModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Acara:</label>
                <input
                  type="text"
                  placeholder="Cth: Jalan Sehat & Bazar 17 Agustus 2026"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Keterangan:</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat kegiatan..."
                  value={eventDescInput}
                  onChange={(e) => setEventDescInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Per Kupon (Rp):</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={eventPriceInput}
                    onChange={(e) => setEventPriceInput(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Kuota (Lembar):</label>
                  <input
                    type="number"
                    min="10"
                    value={eventTargetInput}
                    onChange={(e) => setEventTargetInput(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prefix Nomor Kupon:</label>
                  <input
                    type="text"
                    placeholder="Cth: RI- atau JS-"
                    value={eventPrefixInput}
                    onChange={(e) => setEventPrefixInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Awal:</label>
                  <input
                    type="number"
                    min="1"
                    value={eventStartNumInput}
                    onChange={(e) => setEventStartNumInput(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Periode Penjualan Kupon (Tanggal Mulai &amp; Selesai):
                </label>
                <DateRangePicker
                  startDate={eventStartDateInput}
                  endDate={eventEndDateInput}
                  onChange={(start, end) => {
                    setEventStartDateInput(start);
                    setEventEndDateInput(end);
                  }}
                  placeholder="Pilih periode pelaksanaan acara..."
                  className="w-full"
                  buttonClassName="bg-slate-50 border-slate-200 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daftar Hadiah Doorprize (1 baris = 1 hadiah):
                </label>
                <textarea
                  rows={3}
                  placeholder="Hadiah Utama: Kulkas&#10;Sepeda Gunung&#10;Mesin Cuci Portable"
                  value={eventPrizesInput}
                  onChange={(e) => setEventPrizesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Status Acara: Aktif vs Selesai */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Penjualan Kupon:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventStatusInput('aktif')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      eventStatusInput === 'aktif'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Aktif (Buka Penjualan)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventStatusInput('selesai')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      eventStatusInput === 'selesai'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Selesai (Tutup Penjualan)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih "Selesai" jika acara telah selesai agar nomor kupon baru tidak dapat diterbitkan.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      handleOpenActionModal(editingEvent);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Pilih Selesai Acara atau Hapus Permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus / Selesaikan...
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    {editingEvent ? 'Simpan Perubahan' : 'Simpan Acara Baru'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATAT PENGELUARAN / PEMASUKAN KAS ACARA */}
      {/* ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-w-md w-full text-slate-800">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {expType === 'pemasukan' ? 'Catat Pemasukan Donatur Acara' : 'Catat Pengeluaran Khusus Acara'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowExpenseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori:</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {expType === 'pemasukan' ? (
                    <>
                      <option value="Donasi / Sponsor Acara">Donasi / Sponsor Acara</option>
                      <option value="Bantuan Kas RT">Bantuan Kas RT</option>
                      <option value="Penjualan Bazar Acara">Penjualan Bazar Acara</option>
                      <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Hadiah Doorprize">Hadiah Doorprize</option>
                      <option value="Sewa Tenda & Sound">Sewa Tenda &amp; Sound System</option>
                      <option value="Konsumsi Panitia & Warga">Konsumsi Panitia &amp; Warga</option>
                      <option value="Hadiah Lomba Agustusan">Hadiah Lomba Agustusan</option>
                      <option value="Cetak Kupon & Spanduk">Cetak Kupon &amp; Spanduk Banner</option>
                      <option value="Operasional Acara">Operasional Acara Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Rincian:</label>
                <input
                  type="text"
                  placeholder="Cth: Beli Hadiah Utama Kulkas Polytron di Toko Elektronik"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal:</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KUITANSI DIGITAL PEMBELIAN KUPON */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-w-md w-full text-slate-800">
            
            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <div className="text-xs font-extrabold text-red-700 uppercase tracking-widest">{rtTitle}</div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">TANDA TERIMA PEMBELIAN KUPON</h3>
              <p className="text-[11px] text-slate-500">{activeEvent?.namaAcara}</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nama Pembeli:</span>
                <span className="font-extrabold text-slate-900">{showReceiptModal.namaPembeli}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Alamat / Blok:</span>
                <span className="font-bold text-slate-800">{showReceiptModal.blokRumah || 'Warga RT'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jumlah Kupon:</span>
                <span className="font-bold text-slate-900">{showReceiptModal.jumlahKupon} Lembar</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Pembayaran:</span>
                <span className="font-black text-red-700 text-sm">Rp {showReceiptModal.totalBayar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status Pembayaran:</span>
                <span className={`font-black ${showReceiptModal.statusBayar === 'lunas' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {showReceiptModal.statusBayar === 'lunas' ? 'LUNAS' : 'BELUM BAYAR'}
                </span>
              </div>

              {/* List of Coupon Numbers */}
              <div className="pt-2">
                <span className="block text-slate-500 mb-1.5 font-bold">Nomor Seri Kupon Terdaftar:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                  {showReceiptModal.nomorKupon.map((num, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-slate-800 text-xs">
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lampiran Foto Bukti Bayar */}
              {showReceiptModal.fotoBuktiBase64 && (
                <div className="pt-2">
                  <span className="block text-slate-500 mb-1.5 font-bold">Lampiran Bukti Transfer / Struk:</span>
                  <div 
                    onClick={() => setViewingPhotoModal({ 
                      url: showReceiptModal.fotoBuktiBase64!, 
                      title: `Bukti Bayar: ${showReceiptModal.namaPembeli}` 
                    })}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <img 
                      src={showReceiptModal.fotoBuktiBase64} 
                      alt="Bukti Bayar" 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Lihat Foto Bukti Pembayaran
                      </p>
                      <p className="text-[10px] text-slate-500">Klik untuk memperbesar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReceiptModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
              
              <button
                type="button"
                onClick={() => handleShareWhatsApp(showReceiptModal)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Kirim Nota Lengkap via WhatsApp"
              >
                <Share2 className="w-4 h-4" /> Kirim WA
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Cetak Nota
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK TIKET KUPON WARGA */}
      {/* ========================================================================= */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-w-lg w-full text-slate-800 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Kupon Fisik: {showTicketModal.namaPembeli}</h3>
                <p className="text-[11px] text-slate-500">{showTicketModal.jumlahKupon} Lembar Kupon Terdaftar</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTicketModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {showTicketModal.nomorKupon.map((noKupon, idx) => (
                <div 
                  key={idx}
                  className="border-2 border-dashed border-red-300 bg-linear-to-r from-red-50/50 to-white rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[10px] font-extrabold text-red-700 uppercase">{activeEvent?.namaAcara}</div>
                    <div className="text-xs font-black text-slate-900">{showTicketModal.namaPembeli} ({showTicketModal.blokRumah || 'RT 08'})</div>
                    <div className="text-[10px] text-slate-500">Harga: Rp {showTicketModal.hargaSatuan.toLocaleString('id-ID')} • LUNAS</div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-600 text-white font-mono font-black text-sm rounded-lg shadow-xs">
                      {noKupon}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTicketModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Kupon
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SETOR SISA SALDO ACARA KE KAS UTAMA RT */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-w-md w-full text-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Setor Surplus Kas Acara ke Kas Utama RT</h3>
                <p className="text-[11px] text-slate-500">Serah terima sisa dana panitia</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Sisa saldo bersih kas acara saat ini adalah <strong className="text-emerald-600 font-extrabold">Rp {stats.netBalance.toLocaleString('id-ID')}</strong>. 
              Apakah Anda ingin menyetorkan dana ini ke Buku Kas Utama RT sebagai pemasukan resmi?
            </p>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onTransferToMainRT && stats.netBalance > 0) {
                    await onTransferToMainRT(stats.netBalance, `Setoran Sisa Kas Panitia ${activeEvent?.namaAcara || 'Kupon 17 Agustus'}`);
                    setShowTransferModal(false);
                    alert(`Dana sebesar Rp ${stats.netBalance.toLocaleString('id-ID')} berhasil disetorkan ke Kas Utama RT!`);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Konfirmasi Setor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PILIHAN KELOLA ACARA (SELESAI ACARA VS HAPUS PERMANEN) */}
      {/* ========================================================================= */}
      {showActionConfirmModal && eventForAction && (
        <div 
          onClick={() => setShowActionConfirmModal(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl relative max-w-lg w-full text-slate-800 animate-in zoom-in-95 duration-150 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Kelola / Hapus Acara Kupon</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-sm">
                    {eventForAction.namaAcara}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowActionConfirmModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Silakan pilih tindakan yang ingin Anda lakukan terhadap acara <strong>"{eventForAction.namaAcara}"</strong>:
            </p>

            {/* Pilihan 1 & 2 Cards */}
            <div className="space-y-3">
              
              {/* Option A: Selesai Acara (Kunci Kupon, Data Tetap Tersimpan) */}
              <div className={`p-4 rounded-2xl border transition ${
                eventForAction.status === 'selesai'
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-amber-50/60 border-amber-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    eventForAction.status === 'selesai'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {eventForAction.status === 'selesai' ? (
                      <Unlock className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        {eventForAction.status === 'selesai' 
                          ? '1. Buka Kembali Penjualan Kupon' 
                          : '1. Selesai Acara (Tutup Penjualan)'}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        eventForAction.status === 'selesai'
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}>
                        Disarankan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {eventForAction.status === 'selesai' ? (
                        'Membuka kembali penerbitan kupon baru untuk acara ini dan mengaktifkan form pembelian.'
                      ) : (
                        'Mengunci penerbitan nomor kupon baru. Seluruh data kupon terjual, kuitansi digital, nama pembeli, buku kas panitia, dan undian doorprize tetap tersimpan aman untuk arsip laporan RT.'
                      )}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleEventStatus(eventForAction, eventForAction.status === 'selesai' ? 'aktif' : 'selesai')}
                        className={`w-full py-2.5 px-4 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          eventForAction.status === 'selesai'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                      >
                        {eventForAction.status === 'selesai' ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            <span>Aktifkan Kembali Penjualan Kupon</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Tandai Selesai Acara (Kunci Kupon)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option B: Hapus Acara Permanen */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-rose-950">2. Hapus Acara Permanen</h4>
                      <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                        Permanen
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Menghapus acara ini beserta seluruh data kupon, nomor seri, dan catatan kas secara permanen dari sistem database. Tindakan ini <strong>tidak dapat dikembalikan</strong>.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`KONFIRMASI AKHIR:\n\nApakah Anda benar-benar yakin ingin MENGHAPUS PERMANEN acara "${eventForAction.namaAcara}"?\n\nSemua data nomor kupon dan pembukuan akan hilang.`)) {
                            await handlePermanentDelete(eventForAction);
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus Permanen Dari Database</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowActionConfirmModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                Batal / Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW FOTO BUKTI BAYAR (FULL SCREEN POPUP) */}
      {/* ========================================================================= */}
      {viewingPhotoModal && (
        <div 
          onClick={() => setViewingPhotoModal(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 shadow-2xl relative max-w-xl w-full text-slate-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{viewingPhotoModal.title}</h4>
              </div>
              <button 
                type="button"
                onClick={() => setViewingPhotoModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 min-h-[250px]">
              <img 
                src={viewingPhotoModal.url} 
                alt="Foto Bukti Bayar" 
                referrerPolicy="no-referrer"
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Bukti Pembayaran Kupon Acara</span>
              <button
                type="button"
                onClick={() => setViewingPhotoModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
