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
  // Use a reasonable limit (e.g. 10 snapshots) to prevent exceeding browser 5MB quota
  const counts = [10, 6, 3, 1];
  for (const count of counts) {
    try {
      const limited = snapshots.slice(0, count);
      localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(limited));
      return true;
    } catch (e) {
      console.warn(`Penyimpanan snapshots penuh di slot ${count}, mencoba slot lebih ringkas...`, e);
    }
  }
  return false;
}

/**
 * Helper to download an individual snapshot item as a physical JSON file
 */
export function downloadSnapshotAsJSON(snap: SnapshotItem) {
  try {
    const payload = {
      rt08_backup_ver: "1.0",
      timestamp: snap.timestamp,
      dateString: snap.dateString,
      label: snap.label,
      kas: snap.kas,
      ledger: snap.ledger,
      wargaList: snap.wargaList,
      rombongList: snap.rombongList,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(payload, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    const safeLabel = (snap.label || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    downloadAnchor.setAttribute(
      "download",
      `BACKUP_RT08_${safeLabel}_${snap.dateString.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Gagal mengunduh file snapshot:', err);
    alert('Gagal mengunduh file cadangan: ' + String(err));
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
