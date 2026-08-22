import { createClient } from '@supabase/supabase-js';
import { Balance, LedgerEntry, WargaBill, RombongBill, AppUser, OfficialLetter, EventCoupon, CouponOrder, EventLedgerEntry } from './types';
import { safeStorage } from './utils/safeStorage';
import { isFirebaseConfigured } from './firebase';

// Helper to retrieve keys dynamically with custom storage override support
export const getSupabaseConfig = () => {
  const customUrl = safeStorage.getItem('custom_supabase_url') || '';
  const customKey = safeStorage.getItem('custom_supabase_anon_key') || '';
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  return {
    supabaseUrl: customUrl || envUrl,
    supabaseAnonKey: customKey || envKey,
    isCustom: !!(customUrl || customKey)
  };
};

const config = getSupabaseConfig();
const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

// Check if configuration exists and is a valid URL
const isValidHttpUrl = (urlStr: string): boolean => {
  if (!urlStr || urlStr === 'https://your-project-ref.supabase.co' || urlStr.includes('your-project-ref')) {
    return false;
  }
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = !isFirebaseConfigured && !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  isValidHttpUrl(supabaseUrl)
);

// Create Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.info(
  isSupabaseConfigured
    ? `🔌 Supabase is fully configured${config.isCustom ? ' (dari Browser Storage)' : ''}: ${supabaseUrl}`
    : '🔌 Supabase is NOT configured. Operating on local cache mode.'
);

export function saveCustomSupabaseKeys(url: string, anonKey: string) {
  safeStorage.setItem('custom_supabase_url', url.trim());
  safeStorage.setItem('custom_supabase_anon_key', anonKey.trim());
}

export function clearCustomSupabaseKeys() {
  safeStorage.removeItem('custom_supabase_url');
  safeStorage.removeItem('custom_supabase_anon_key');
}

// Graceful handler wrapper for logging operations
export enum SupabaseOpType {
  INSERT = 'insert',
  UPDATE = 'update',
  UPSERT = 'upsert',
  DELETE = 'delete',
  SELECT = 'select',
}

export function handleSupabaseError(error: unknown, operation: SupabaseOpType, table: string) {
  console.error(`❌ [Supabase Error] Operation: ${operation} on Table: ${table}`, error);
}

// Convert column names from snake_case database schema to camelCase client types
export function mapGeneralSettingsToClient(dbData: any) {
  if (!dbData) return null;
  return {
    kas: dbData.kas as Balance,
    blocksList: dbData.blocks_list as string[],
    yearsList: dbData.years_list as number[],
    rateRT: Number(dbData.rate_rt),
    rateRombong: Number(dbData.rate_rombong),
    rtTitle: String(dbData.rt_title),
    rtAddress: String(dbData.rt_address),
    rtEmail: String(dbData.rt_email),
    appName: dbData.app_name ? String(dbData.app_name) : undefined,
    appLogo: dbData.app_logo ? String(dbData.app_logo) : undefined,
    labelWargaSingular: dbData.label_warga_singular ? String(dbData.label_warga_singular) : undefined,
    labelWargaPlural: dbData.label_warga_plural ? String(dbData.label_warga_plural) : undefined,
    labelRombongSingular: dbData.label_rombong_singular ? String(dbData.label_rombong_singular) : undefined,
    labelRombongPlural: dbData.label_rombong_plural ? String(dbData.label_rombong_plural) : undefined,
    bankNama: dbData.bank_nama ? String(dbData.bank_nama) : undefined,
    bankNoRek: dbData.bank_no_rek ? String(dbData.bank_no_rek) : undefined,
    bankPenerima: dbData.bank_penerima ? String(dbData.bank_penerima) : undefined,
    bankCatatanVendor: dbData.bank_catatan_vendor ? String(dbData.bank_catatan_vendor) : undefined,
    meetingNotulen: dbData.meeting_notulen ? String(dbData.meeting_notulen) : undefined,
    isCouponFeatureEnabled: dbData.is_coupon_feature_enabled !== undefined ? Boolean(dbData.is_coupon_feature_enabled) : undefined,
  };
}

export function mapWargaBillToClient(row: any): WargaBill {
  return {
    id: row.id,
    nama: row.nama,
    blok: row.blok,
    noRumah: row.no_rumah,
    noWa: row.no_wa,
    isDeleted: row.is_deleted,
    noKtp: row.no_ktp,
    noKk: row.no_kk,
    alamatKtpAsal: row.alamat_ktp_asal,
    ktpBase64: row.ktp_base64,
    kkBase64: row.kk_base64,
    ktpNamaFile: row.ktp_nama_file,
    kkNamaFile: row.kk_nama_file,
    fotoBase64: row.foto_base64,
    fotoNamaFile: row.foto_nama_file,
    statusRumah: row.status_rumah || 'milik_sendiri',
    tglAwalSewa: row.tgl_awal_sewa || undefined,
    tglAkhirSewa: row.tgl_akhir_sewa || undefined,
    isWargaBaru: row.is_warga_baru || false,
    mulaiBulan: row.mulai_bulan || undefined,
    mulaiTahun: row.mulai_tahun || undefined,
    iuranRT: row.iuran_rt || [],
    anggotaKeluarga: row.anggota_keluarga || [],
  };
}

export function mapRombongBillToClient(row: any): RombongBill {
  return {
    id: row.id,
    namaPemilik: row.nama_pemilik,
    lokasi: row.lokasi,
    noLapak: row.no_lapak,
    noWa: row.no_wa,
    isDeleted: row.is_deleted,
    fotoBase64: row.foto_base64,
    fotoNamaFile: row.foto_nama_file,
    iuranRombong: row.iuran_rombong || [],
  };
}

export function mapLedgerEntryToClient(row: any): LedgerEntry {
  return {
    id: row.id,
    tanggal: row.tanggal,
    deskripsi: row.deskripsi,
    jumlah: Number(row.jumlah),
    tipe: row.tipe as 'pemasukan' | 'pengeluaran',
    sumberKas: row.sumber_kas as keyof Balance,
    kategori: row.kategori,
    petugas: row.petugas,
    fotoBase64: row.foto_base64,
    fotoNamaFile: row.foto_nama_file,
    isCustomRombong: row.is_custom_rombong,
    approvedByAdmin: row.approved_by_admin,
    needApproval: row.need_approval,
    rombongId: row.rombong_id,
    bulan: row.bulan,
    tahun: row.tahun
  };
}

export function mapAppUserToClient(row: any): AppUser {
  return {
    id: row.id,
    username: row.username,
    pin: row.pin,
    role: row.role,
    nama: row.nama,
    wargaId: row.warga_id || undefined,
    rombongId: row.rombong_id || undefined,
  };
}

export function mapOfficialLetterToClient(row: any): OfficialLetter {
  return {
    id: row.id,
    nomorSurat: row.nomor_surat,
    tanggalSurat: row.tanggal_surat,
    jenisSurat: row.jenis_surat,
    perihal: row.perihal,
    penerima: row.penerima,
    keperluan: row.keperluan || undefined,
    wargaId: row.warga_id || undefined,
    createdAt: row.created_at_str || row.created_at || '',
    createdBy: row.created_by,
  };
}

// --- DYNAMIC DATA SYNCHRONIZATION HELPERS VIA SUPABASE API ---

// 1. Settings Synchronization
export async function getGeneralSettings() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'general')
      .single();
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      throw error;
    }
    return mapGeneralSettingsToClient(data);
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'settings');
    return null;
  }
}

export async function upsertGeneralSettings(settings: Partial<any>) {
  if (!supabase) return;
  try {
    const dbPayload: any = { id: 'general' };
    if (settings.kas !== undefined) dbPayload.kas = settings.kas;
    if (settings.blocksList !== undefined) dbPayload.blocks_list = settings.blocksList;
    if (settings.yearsList !== undefined) dbPayload.years_list = settings.yearsList;
    if (settings.rateRT !== undefined) dbPayload.rate_rt = settings.rateRT;
    if (settings.rateRombong !== undefined) dbPayload.rate_rombong = settings.rateRombong;
    if (settings.rtTitle !== undefined) dbPayload.rt_title = settings.rtTitle;
    if (settings.rtAddress !== undefined) dbPayload.rt_address = settings.rtAddress;
    if (settings.rtEmail !== undefined) dbPayload.rt_email = settings.rtEmail;
    if (settings.appName !== undefined) dbPayload.app_name = settings.appName;
    if (settings.appLogo !== undefined) dbPayload.app_logo = settings.appLogo;
    if (settings.labelWargaSingular !== undefined) dbPayload.label_warga_singular = settings.labelWargaSingular;
    if (settings.labelWargaPlural !== undefined) dbPayload.label_warga_plural = settings.labelWargaPlural;
    if (settings.labelRombongSingular !== undefined) dbPayload.label_rombong_singular = settings.labelRombongSingular;
    if (settings.labelRombongPlural !== undefined) dbPayload.label_rombong_plural = settings.labelRombongPlural;
    if (settings.bankNama !== undefined) dbPayload.bank_nama = settings.bankNama;
    if (settings.bankNoRek !== undefined) dbPayload.bank_no_rek = settings.bankNoRek;
    if (settings.bankPenerima !== undefined) dbPayload.bank_penerima = settings.bankPenerima;
    if (settings.bankCatatanVendor !== undefined) dbPayload.bank_catatan_vendor = settings.bankCatatanVendor;
    if (settings.meetingNotulen !== undefined) dbPayload.meeting_notulen = settings.meetingNotulen;
    if (settings.isCouponFeatureEnabled !== undefined) dbPayload.is_coupon_feature_enabled = settings.isCouponFeatureEnabled;

    const { error } = await supabase
      .from('settings')
      .upsert(dbPayload);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'settings');
  }
}

// 2. App Users Synchronization
export async function getAppUsers(): Promise<AppUser[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*');
    if (error) throw error;
    return (data || []).map(row => mapAppUserToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'app_users');
    return [];
  }
}

export async function saveAppUser(user: AppUser) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('app_users')
      .upsert({
        id: user.id,
        username: user.username,
        pin: user.pin,
        role: user.role,
        nama: user.nama,
        warga_id: user.wargaId || null,
        rombong_id: user.rombongId || null
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'app_users');
  }
}

export async function deleteAppUser(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'app_users');
  }
}

// 3. Ledger Entries Synchronization
export async function getLedgerEntries(): Promise<LedgerEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('tanggal', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => mapLedgerEntryToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'ledger_entries');
    return [];
  }
}

export async function saveLedgerEntry(entry: LedgerEntry) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('ledger_entries')
      .upsert({
        id: entry.id,
        tanggal: entry.tanggal,
        deskripsi: entry.deskripsi,
        jumlah: entry.jumlah,
        tipe: entry.tipe,
        sumber_kas: entry.sumberKas,
        kategori: entry.kategori,
        petugas: entry.petugas,
        foto_base64: entry.fotoBase64 || null,
        foto_nama_file: entry.fotoNamaFile || null,
        is_custom_rombong: entry.isCustomRombong || false,
        approved_by_admin: entry.approvedByAdmin || false,
        need_approval: entry.needApproval || false,
        rombong_id: entry.rombongId || null,
        bulan: entry.bulan || null,
        tahun: entry.tahun || null
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'ledger_entries');
  }
}

export async function deleteLedgerEntry(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('ledger_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'ledger_entries');
  }
}

// 4. Warga Bills Synchronization
export async function getWargaBills(): Promise<WargaBill[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('warga_bills')
      .select('*');
    if (error) throw error;
    return (data || []).map(row => mapWargaBillToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'warga_bills');
    return [];
  }
}

export async function saveWargaBill(w: WargaBill) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('warga_bills')
      .upsert({
        id: w.id,
        nama: w.nama,
        blok: w.blok,
        no_rumah: w.noRumah,
        no_wa: w.noWa || null,
        is_deleted: w.isDeleted || false,
        no_ktp: w.noKtp || null,
        no_kk: w.noKk || null,
        alamat_ktp_asal: w.alamatKtpAsal || null,
        ktp_base64: w.ktpBase64 || null,
        kk_base64: w.kkBase64 || null,
        ktp_nama_file: w.ktpNamaFile || null,
        kk_nama_file: w.kkNamaFile || null,
        foto_base64: w.fotoBase64 || null,
        foto_nama_file: w.fotoNamaFile || null,
        status_rumah: w.statusRumah || 'milik_sendiri',
        tgl_awal_sewa: w.tglAwalSewa || null,
        tgl_akhir_sewa: w.tglAkhirSewa || null,
        is_warga_baru: w.isWargaBaru || false,
        mulai_bulan: w.mulaiBulan || null,
        mulai_tahun: w.mulaiTahun || null,
        iuran_rt: w.iuranRT || [],
        anggota_keluarga: w.anggotaKeluarga || []
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'warga_bills');
  }
}

export async function deleteWargaBill(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('warga_bills')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'warga_bills');
  }
}

// 5. Rombong Bills Synchronization
export async function getRombongBills(): Promise<RombongBill[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('rombong_bills')
      .select('*');
    if (error) throw error;
    return (data || []).map(row => mapRombongBillToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'rombong_bills');
    return [];
  }
}

export async function saveRombongBill(r: RombongBill) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('rombong_bills')
      .upsert({
        id: r.id,
        nama_pemilik: r.namaPemilik,
        lokasi: r.lokasi,
        no_lapak: r.noLapak,
        no_wa: r.noWa || null,
        is_deleted: r.isDeleted || false,
        foto_base64: r.fotoBase64 || null,
        foto_nama_file: r.fotoNamaFile || null,
        iuran_rombong: r.iuranRombong || []
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'rombong_bills');
  }
}

export async function deleteRombongBill(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('rombong_bills')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'rombong_bills');
  }
}

// 6. Official Letters Synchronization
export async function getOfficialLetters(): Promise<OfficialLetter[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('official_letters')
      .select('*')
      .order('tanggal_surat', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => mapOfficialLetterToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'official_letters');
    return [];
  }
}

export async function saveOfficialLetter(letter: OfficialLetter) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('official_letters')
      .upsert({
        id: letter.id,
        nomor_surat: letter.nomorSurat,
        tanggal_surat: letter.tanggalSurat,
        jenis_surat: letter.jenisSurat,
        perihal: letter.perihal,
        penerima: letter.penerima,
        keperluan: letter.keperluan || null,
        warga_id: letter.wargaId || null,
        created_at_str: letter.createdAt,
        created_by: letter.createdBy
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'official_letters');
  }
}

export async function deleteOfficialLetter(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('official_letters')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'official_letters');
  }
}

// 7. Event Coupons Synchronization
export function mapEventCouponToClient(row: any): EventCoupon {
  return {
    id: row.id,
    namaAcara: row.nama_acara,
    deskripsi: row.deskripsi,
    hargaPerKupon: Number(row.harga_per_kupon),
    targetKupon: row.target_kupon ? Number(row.target_kupon) : undefined,
    prefixKupon: row.prefix_kupon || 'KPN-',
    nomorMulai: row.nomor_mulai ? Number(row.nomor_mulai) : 1,
    tanggalMulai: row.tanggal_mulai,
    tanggalSelesai: row.tanggal_selesai,
    status: row.status || 'aktif',
    hadiahDoorprize: row.hadiah_doorprize || [],
    kontakPanitia: row.kontak_panitia || undefined,
    rekeningPanitia: row.rekening_panitia || undefined,
    qrisBase64: row.qris_base64 || undefined,
    qrisNamaFile: row.qris_nama_file || undefined,
    createdAt: row.created_at_str || row.created_at || '',
    createdBy: row.created_by || ''
  };
}

export async function getEventCoupons(): Promise<EventCoupon[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('event_coupons')
      .select('*')
      .order('tanggal_mulai', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => mapEventCouponToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'event_coupons');
    return [];
  }
}

export async function saveEventCoupon(event: EventCoupon) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('event_coupons')
      .upsert({
        id: event.id,
        nama_acara: event.namaAcara,
        deskripsi: event.deskripsi,
        harga_per_kupon: event.hargaPerKupon,
        target_kupon: event.targetKupon || null,
        prefix_kupon: event.prefixKupon,
        nomor_mulai: event.nomorMulai,
        tanggal_mulai: event.tanggalMulai,
        tanggal_selesai: event.tanggalSelesai,
        status: event.status,
        hadiah_doorprize: event.hadiahDoorprize || [],
        kontak_panitia: event.kontakPanitia || null,
        rekening_panitia: event.rekeningPanitia || null,
        qris_base64: event.qrisBase64 || null,
        qris_nama_file: event.qrisNamaFile || null,
        created_at_str: event.createdAt,
        created_by: event.createdBy
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'event_coupons');
  }
}

export async function deleteEventCoupon(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('event_coupons')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'event_coupons');
  }
}

// 8. Coupon Orders Synchronization
export function mapCouponOrderToClient(row: any): CouponOrder {
  return {
    id: row.id,
    eventId: row.event_id,
    wargaId: row.warga_id || undefined,
    namaPembeli: row.nama_pembeli,
    blokRumah: row.blok_rumah || undefined,
    noWa: row.no_wa || undefined,
    jumlahKupon: Number(row.jumlah_kupon),
    hargaSatuan: Number(row.harga_satuan),
    totalBayar: Number(row.total_bayar),
    nomorKupon: row.nomor_kupon || [],
    tanggalBeli: row.tanggal_beli,
    jamBeli: row.jam_beli || undefined,
    metodeBayar: row.metode_bayar || 'tunai',
    statusBayar: row.status_bayar || 'lunas',
    petugas: row.petugas || '',
    catatan: row.catatan || undefined,
    fotoBuktiBase64: row.foto_bukti_base64 || undefined,
    fotoBuktiNamaFile: row.foto_bukti_nama_file || undefined,
    isPemenang: Boolean(row.is_pemenang),
    hadiahDimenangkan: row.hadiah_dimenangkan || undefined,
    nomorKuponMenang: row.nomor_kupon_menang || undefined,
    createdAt: row.created_at_str || row.created_at || ''
  };
}

export async function getCouponOrders(): Promise<CouponOrder[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('coupon_orders')
      .select('*')
      .order('tanggal_beli', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => mapCouponOrderToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'coupon_orders');
    return [];
  }
}

export async function saveCouponOrder(order: CouponOrder) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('coupon_orders')
      .upsert({
        id: order.id,
        event_id: order.eventId,
        warga_id: order.wargaId || null,
        nama_pembeli: order.namaPembeli,
        blok_rumah: order.blokRumah || null,
        no_wa: order.noWa || null,
        jumlah_kupon: order.jumlahKupon,
        harga_satuan: order.hargaSatuan,
        total_bayar: order.totalBayar,
        nomor_kupon: order.nomorKupon || [],
        tanggal_beli: order.tanggalBeli,
        jam_beli: order.jamBeli || null,
        metode_bayar: order.metodeBayar,
        status_bayar: order.statusBayar,
        petugas: order.petugas,
        catatan: order.catatan || null,
        foto_bukti_base64: order.fotoBuktiBase64 || null,
        foto_bukti_nama_file: order.fotoBuktiNamaFile || null,
        is_pemenang: order.isPemenang || false,
        hadiah_dimenangkan: order.hadiahDimenangkan || null,
        nomor_kupon_menang: order.nomorKuponMenang || null,
        created_at_str: order.createdAt
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'coupon_orders');
  }
}

export async function deleteCouponOrder(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('coupon_orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'coupon_orders');
  }
}

// 9. Event Ledger Synchronization
export function mapEventLedgerEntryToClient(row: any): EventLedgerEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    tanggal: row.tanggal,
    tipe: row.tipe as 'pemasukan' | 'pengeluaran',
    kategori: row.kategori,
    deskripsi: row.deskripsi,
    jumlah: Number(row.jumlah),
    petugas: row.petugas,
    orderId: row.order_id || undefined,
    fotoBase64: row.foto_base64 || undefined,
    fotoNamaFile: row.foto_nama_file || undefined,
    createdAt: row.created_at_str || row.created_at || ''
  };
}

export async function getEventLedger(): Promise<EventLedgerEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('event_ledger')
      .select('*')
      .order('tanggal', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => mapEventLedgerEntryToClient(row));
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.SELECT, 'event_ledger');
    return [];
  }
}

export async function saveEventLedgerEntry(entry: EventLedgerEntry) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('event_ledger')
      .upsert({
        id: entry.id,
        event_id: entry.eventId,
        tanggal: entry.tanggal,
        tipe: entry.tipe,
        kategori: entry.kategori,
        deskripsi: entry.deskripsi,
        jumlah: entry.jumlah,
        petugas: entry.petugas,
        order_id: entry.orderId || null,
        foto_base64: entry.fotoBase64 || null,
        foto_nama_file: entry.fotoNamaFile || null,
        created_at_str: entry.createdAt
      });
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.UPSERT, 'event_ledger');
  }
}

export async function deleteEventLedgerEntry(id: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('event_ledger')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    handleSupabaseError(err, SupabaseOpType.DELETE, 'event_ledger');
  }
}


