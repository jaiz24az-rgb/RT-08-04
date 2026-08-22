export interface Balance {
  rtTunai: number;
  rtPettyCash: number;
  rtBank: number;
  rombongTunai: number;
  rombongBank: number;
}

export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface LedgerEntry {
  id: string;
  tanggal: string; // Tanggal transaksi keuangan
  deskripsi: string;
  jumlah: number;
  tipe: TransactionType;
  sumberKas: keyof Balance;
  kategori: string;
  petugas: string;
  tanggalInput?: string; // Tanggal input/pencatatan transaksi
  fotoBase64?: string; // Transaction receipt photo
  fotoNamaFile?: string; // Transaction receipt filename
  fotoBase64s?: string[]; // Multiple transaction receipt photos
  fotoNamaFiles?: string[]; // Multiple transaction receipt filenames
  isCustomRombong?: boolean; // Flag to indicate custom payment
  approvedByAdmin?: boolean; // Approved by admin
  needApproval?: boolean; // Needs admin approval to count
  rombongId?: string; // Links to rombong
  bulan?: string; // Links to billing month
  tahun?: number; // Links to billing year
}

export interface FamilyMember {
  id: string;
  nama: string;
  hubungan: string;
  nik?: string;
  noHape?: string;
  fotoBase64?: string;
  fotoNamaFile?: string;
}

export interface WargaBill {
  id: string;
  nama: string;
  blok: string;
  noRumah: string;
  noWa?: string; // WhatsApp number for billing
  isDeleted?: boolean;
  statusKeaktifan?: 'aktif' | 'nonaktif' | 'pindah_sementara';
  noKtp?: string; // KTP Number (16 digits)
  noKk?: string;  // KK Number (16 digits)
  alamatKtpAsal?: string; // Original address as shown on KTP
  ktpBase64?: string; // Compressed KTP image Base64 data code
  kkBase64?: string;  // Compressed KK image Base64 data code
  ktpNamaFile?: string; // KTP original file name
  kkNamaFile?: string;  // KK original file name
  fotoBase64?: string; // Profile photo Base64 data code
  fotoNamaFile?: string; // Profile photo original file name
  statusRumah?: 'milik_sendiri' | 'sewa_kontrak' | 'lainnya'; // Status kepemilikan rumah (keluarga vs sewa/kontrak)
  tglAwalSewa?: string; // Tanggal awal kontrak (optional)
  tglAkhirSewa?: string; // Tanggal akhir kontrak (optional)
  isWargaBaru?: boolean; // Flag for new citizen (free bills before placement)
  mulaiBulan?: string; // Starting month for billing
  mulaiTahun?: number; // Starting year for billing
  defaultDiskon?: number; // Diskon default per bulan (Rp)
  isBebasIuranPermanen?: boolean; // Pembebasan iuran permanen
  alasanBebasIuranPermanen?: string; // Alasan pembebasan permanen (cth: Pengurus RT, Dhuafa/Yatim, Lansia)
  iuranRT: { 
    bulan: string; 
    lunas: boolean; 
    nominal: number; 
    tahun?: number; 
    tanggalBayar?: string; 
    jamBayar?: string; 
    noCashFlow?: boolean; 
    catatan?: string;
    fotoBase64?: string; // Payment receipt photo Base64
    fotoNamaFile?: string; // Payment receipt filename
    fotoBase64s?: string[]; // Multiple payment receipt photos
    fotoNamaFiles?: string[]; // Multiple payment receipt filenames
    manualKoreksi?: boolean; // User manual correction flag 2024-2026
    diskon?: number; // Nominal diskon/potongan (Rp)
    isPembebasan?: boolean; // Flag pembebasan iuran (100% gratis/bebas iuran)
    alasanDiskon?: string; // Alasan diskon atau pembebasan iuran
  }[];
  anggotaKeluarga?: FamilyMember[];
}

export interface RombongBill {
  id: string;
  namaPemilik: string;
  lokasi: string;
  noLapak: string;
  noWa?: string; // WhatsApp number for billing
  isDeleted?: boolean;
  statusKeaktifan?: 'aktif' | 'nonaktif' | 'pindah_sementara';
  fotoBase64?: string; // Rombong photo Base64 data code
  fotoNamaFile?: string; // Rombong photo original file name
  defaultDiskon?: number;
  isBebasIuranPermanen?: boolean;
  alasanBebasIuranPermanen?: string;
  iuranRombong: { 
    bulan: string; 
    lunas: boolean; 
    nominal: number; 
    tahun?: number; 
    tanggalBayar?: string; 
    jamBayar?: string; 
    noCashFlow?: boolean; 
    catatan?: string;
    fotoBase64?: string; // Payment receipt photo Base64
    fotoNamaFile?: string; // Payment receipt filename
    fotoBase64s?: string[]; // Multiple payment receipt photos
    fotoNamaFiles?: string[]; // Multiple payment receipt filenames
    manualKoreksi?: boolean; // User manual correction flag 2024-2026
    diskon?: number; // Nominal diskon/potongan (Rp)
    isPembebasan?: boolean; // Flag pembebasan iuran (100% gratis)
    alasanDiskon?: string; // Alasan diskon atau pembebasan iuran
  }[];
}

export interface AppUser {
  id: string;
  username: string;
  pin: string; // PIN or Password
  role: 'admin' | 'bendahara' | 'warga' | 'rombong' | 'kolektor' | 'sekretaris' | 'audit';
  nama: string;
  wargaId?: string;
  rombongId?: string;
}

export interface OfficialLetter {
  id: string;
  nomorSurat: string; // e.g. 012/RT-08/POPOH/VI/2026
  tanggalSurat: string; // YYYY-MM-DD
  jenisSurat: 'undangan_rapat' | 'undangan_kerja_bakti' | 'undangan_khusus' | 'custom';
  perihal: string;
  penerima: string; // e.g. Bp. Heri, Seluruh Warga RT 08
  keperluan?: string; // used for Surat Pengantar or specific notes
  wargaId?: string; // Optional links to citizen
  createdAt: string;
  createdBy: string; // role or name of creator
}

export interface EventCoupon {
  id: string;
  namaAcara: string; // e.g. "Kupon Jalan Sehat & Bazar 17 Agustus 2026"
  deskripsi: string;
  hargaPerKupon: number; // e.g. 5000
  targetKupon?: number; // e.g. 1000
  prefixKupon: string; // e.g. "JS-" or "17A-"
  nomorMulai: number; // e.g. 1
  tanggalMulai: string; // YYYY-MM-DD
  tanggalSelesai: string; // YYYY-MM-DD
  status: 'aktif' | 'selesai' | 'arsip';
  hadiahDoorprize?: string[]; // e.g. ["Kulkas 1 Pintu", "Sepeda Gunung", "Kipas Angin", "Setrika", "50 Hadiah Hiburan"]
  kontakPanitia?: string;
  rekeningPanitia?: string;
  qrisBase64?: string;
  qrisNamaFile?: string;
  createdAt: string;
  createdBy: string;
}

export interface CouponOrder {
  id: string;
  eventId: string;
  wargaId?: string;
  namaPembeli: string;
  blokRumah?: string; // e.g. "A4 / 12" or "Warga Luar RT"
  noWa?: string;
  jumlahKupon: number;
  hargaSatuan: number;
  totalBayar: number;
  nomorKupon: string[]; // e.g. ["JS-001", "JS-002", "JS-003"]
  tanggalBeli: string; // YYYY-MM-DD
  jamBeli?: string; // HH:mm
  metodeBayar: 'tunai' | 'transfer' | 'qris';
  statusBayar: 'lunas' | 'belum_bayar';
  petugas: string;
  catatan?: string;
  fotoBuktiBase64?: string;
  fotoBuktiNamaFile?: string;
  isPemenang?: boolean;
  hadiahDimenangkan?: string;
  nomorKuponMenang?: string;
  createdAt: string;
}

export interface EventLedgerEntry {
  id: string;
  eventId: string;
  tanggal: string; // YYYY-MM-DD
  tipe: 'pemasukan' | 'pengeluaran';
  kategori: string; // e.g. "Penjualan Kupon", "Donasi / Sponsor", "Hadiah Doorprize", "Sewa Tenda & Sound", "Konsumsi", "Operasional"
  deskripsi: string;
  jumlah: number;
  petugas: string;
  orderId?: string; // Links to CouponOrder if auto-generated
  fotoBase64?: string;
  fotoNamaFile?: string;
  createdAt: string;
}



