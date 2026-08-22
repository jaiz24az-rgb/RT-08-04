import { Balance, LedgerEntry, WargaBill, RombongBill, AppUser, EventCoupon, CouponOrder, EventLedgerEntry } from './types';

export const INITIAL_BALANCES: Balance = {
  rtTunai: 0,
  rtPettyCash: 0,
  rtBank: 0,
  rombongTunai: 0,
  rombongBank: 0
};

export const INITIAL_LEDGER: LedgerEntry[] = [];

export const INITIAL_WARGA: WargaBill[] = [];

export const INITIAL_ROMBONG: RombongBill[] = [];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-1',
    username: 'admin',
    pin: '123456',
    role: 'admin',
    nama: 'Bp. Sutriadi (Ketua RT)'
  },
  {
    id: 'usr-2',
    username: 'bendahara',
    pin: '654321',
    role: 'bendahara',
    nama: 'Heri Gunawan (Bendahara)'
  },
  {
    id: 'usr-3',
    username: 'kolektor',
    pin: '112233',
    role: 'kolektor',
    nama: 'Bowo Santoso (Kolektor Iuran)'
  },
  {
    id: 'usr-4',
    username: 'audit',
    pin: '112233',
    role: 'audit',
    nama: 'Audit Internal (Pengawas)'
  }
];

export const INITIAL_EVENT_COUPONS: EventCoupon[] = [
  {
    id: 'ev-17-agustus-2026',
    namaAcara: 'Jalan Sehat & Doorprize HUT RI Ke-81 RT 08',
    deskripsi: 'Penjualan kupon jalan sehat berhadiah dan bazar kemerdekaan 17 Agustus 2026 lingkungan RT 08 RW 04.',
    hargaPerKupon: 5000,
    targetKupon: 1000,
    prefixKupon: 'RI-',
    nomorMulai: 1,
    tanggalMulai: '2026-08-01',
    tanggalSelesai: '2026-08-17',
    status: 'aktif',
    hadiahDoorprize: [
      'Hadiah Utama: Kulkas 1 Pintu',
      'Hadiah 2: Sepeda Gunung',
      'Hadiah 3: Mesin Cuci Portable',
      'Hadiah 4: Magic Com / Rice Cooker',
      'Hadiah 5: Kipas Angin Berdiri',
      'Hadiah 6: Kompor Gas 2 Tungku',
      'Puluhan Hadiah Hiburan & Sembako'
    ],
    kontakPanitia: '0812-3456-7890 (Panitia Agustusan RT 08)',
    rekeningPanitia: 'BCA 1234567890 a/n Panitia HUT RI RT 08',
    createdAt: '2026-08-01',
    createdBy: 'Panitia 17 Agustus'
  }
];

export const INITIAL_COUPON_ORDERS: CouponOrder[] = [];

export const INITIAL_EVENT_LEDGER: EventLedgerEntry[] = [];


