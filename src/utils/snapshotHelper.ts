import { safeStorage as localStorage } from './safeStorage';
import { Balance, LedgerEntry, WargaBill, RombongBill } from '../types';

export interface SnapshotItem {
  id: string;
  timestamp: string;
  dateString: string;
  label: string;
  type: 'auto' | 'manual' | 'export';
  kas: Balance;
  ledger: LedgerEntry[];
  wargaList: WargaBill[];
  rombongList: RombongBill[];
}

/**
 * Strips heavy Base64 media (KTP, KK, receipt images) to make snapshots ultra-lightweight (~50KB)
 * so that multiple snapshots easily fit within browser localStorage limits (usually 5MB max)
 * without ever triggering DOMException: QuotaExceededError.
 */
export function sanitizeSnapshotData(data: {
  kas: Balance;
  ledger: LedgerEntry[];
  wargaList: WargaBill[];
  rombongList: RombongBill[];
}) {
  const cleanLedger = (data.ledger || []).map((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fotoBase64, fotoBase64s, ...rest } = entry;
    return rest as LedgerEntry;
  });

  const cleanWarga = (data.wargaList || []).map((w) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ktpBase64, kkBase64, fotoBase64, anggotaKeluarga, iuranRT, ...wRest } = w;
    return {
      ...wRest,
      anggotaKeluarga: (anggotaKeluarga || []).map((m) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fotoBase64, ...mRest } = m;
        return mRest;
      }),
      iuranRT: (iuranRT || []).map((i) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fotoBase64, fotoBase64s, ...iRest } = i;
        return iRest;
      }),
    } as WargaBill;
  });

  const cleanRombong = (data.rombongList || []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fotoBase64, ...rRest } = r;
    return rRest as RombongBill;
  });

  return {
    kas: { ...(data.kas || { rtTunai: 0, rtPettyCash: 0, rtBank: 0, rombongTunai: 0, rombongBank: 0 }) },
    ledger: cleanLedger,
    wargaList: cleanWarga,
    rombongList: cleanRombong,
  };
}

/**
 * Safely retrieve list of snapshots from localStorage
 */
export function getStoredSnapshots(): SnapshotItem[] {
  try {
    const raw = localStorage.getItem('perumtas_rt08_snapshots');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Gagal membaca snapshots dari storage:', e);
    return [];
  }
}

/**
 * Safely save snapshots to localStorage with automatic pruning if quota exceeded
 */
export function saveStoredSnapshots(snapshots: SnapshotItem[]): boolean {
  try {
    const limited = snapshots.slice(0, 20);
    localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(limited));
    return true;
  } catch (e) {
    console.warn('Penyimpanan snapshots penuh, memangkas slot menjadi 10:', e);
    try {
      const pruned = snapshots.slice(0, 10);
      localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(pruned));
      return true;
    } catch (e2) {
      console.warn('Gagal menyimpan snapshots bahkan setelah dipangkas:', e2);
      return false;
    }
  }
}

/**
 * Helper to build a new snapshot item
 */
export function createSnapshotItem(
  label: string,
  type: 'auto' | 'manual' | 'export',
  data: {
    kas: Balance;
    ledger: LedgerEntry[];
    wargaList: WargaBill[];
    rombongList: RombongBill[];
  }
): SnapshotItem {
  const now = Date.now();
  const timeStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const sanitized = sanitizeSnapshotData(data);

  return {
    id: `snap-${now}`,
    timestamp: new Date().toISOString(),
    dateString: timeStr,
    label: label.trim() || `Snapshot ${timeStr}`,
    type,
    ...sanitized,
  };
}
