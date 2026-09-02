import { LedgerEntry } from '../types';

/**
 * Universal helper to detect internal non-operational transfers (mutasi bank, setor bank, petty cash, alokasi dana internal, etc.)
 * This ensures internal money movements between physical cash and bank accounts do not inflate operational income or expenses,
 * while strictly preserving all genuine operational income (iuran warga, pendapatan rombong, donasi, sewa) and operational expenses.
 */
export const isInternalMutationOrTransfer = (e: Partial<LedgerEntry> | any): boolean => {
  if (!e) return false;

  const orig = ((e.originalKategori || e.kategori) || '').toLowerCase().trim();
  const cat = (e.kategori || '').toLowerCase().trim();
  const desc = (e.deskripsi || '').toLowerCase().trim();

  // 1. Check for explicit internal transfer markers in description first
  const isExplicitTransferTag =
    desc.includes('(debet tunai)') ||
    desc.includes('(kredit bank)') ||
    desc.includes('(debet bank)') ||
    desc.includes('(kredit tunai)') ||
    desc.includes('(debet pengirim)') ||
    desc.includes('(kredit penerima)') ||
    desc.startsWith('setor bank:') ||
    desc.startsWith('mutasi:') ||
    desc.startsWith('pemindahbukuan:');

  if (isExplicitTransferTag) {
    return true;
  }

  // 2. Explicit Operational Whitelist (NEVER an internal mutation if it's real citizen/rombong payment)
  const isOperationalIncome =
    orig.includes('iuran') ||
    orig.includes('pendapatan') ||
    orig.includes('sewa') ||
    orig.includes('warga') ||
    orig.includes('lapak') ||
    orig.includes('donasi') ||
    orig.includes('sumbangan') ||
    orig.includes('penjualan') ||
    cat.includes('iuran') ||
    cat.includes('pendapatan') ||
    cat.includes('sewa') ||
    cat.includes('lapak') ||
    cat.includes('donasi') ||
    cat.includes('sumbangan') ||
    desc.includes('iuran') ||
    desc.includes('sewa lapak') ||
    desc.includes('sewa rombong') ||
    desc.includes('lapak') ||
    desc.includes('bulan januari') ||
    desc.includes('bulan februari') ||
    desc.includes('bulan maret') ||
    desc.includes('bulan april') ||
    desc.includes('bulan mei') ||
    desc.includes('bulan juni') ||
    desc.includes('bulan juli') ||
    desc.includes('bulan agustus') ||
    desc.includes('bulan september') ||
    desc.includes('bulan oktober') ||
    desc.includes('bulan november') ||
    desc.includes('bulan desember') ||
    desc.includes('kolektif iuran') ||
    desc.includes('tagihan');

  if (isOperationalIncome) {
    return false;
  }

  // 3. Exact or specific internal categories
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

  // 4. Explicit keywords in Category
  if (
    orig.includes('mutasi bank') ||
    orig.includes('setor bank') ||
    orig.includes('pemindahbukuan') ||
    orig.includes('penarikan dana kolektor') ||
    orig.includes('alokasi dana') ||
    orig.includes('pengalihan dana') ||
    cat.includes('mutasi bank') ||
    cat.includes('setor bank') ||
    cat.includes('pemindahbukuan') ||
    cat.includes('penarikan dana kolektor') ||
    cat.includes('alokasi dana') ||
    cat.includes('pengalihan dana')
  ) {
    return true;
  }

  // 5. Explicit transfer phrases in Description
  if (
    desc.includes('setor bank') ||
    desc.includes('pemindahbukuan') ||
    desc.includes('penarikan dana kolektor') ||
    desc.includes('mutasi kas') ||
    desc.includes('mutasi bank') ||
    desc.includes('transfer antar kas') ||
    desc.includes('transfer antar rekening') ||
    desc.includes('pindah buku') ||
    desc.includes('pindah kas') ||
    desc.includes('pindah dana') ||
    desc.includes('pindah saldo') ||
    desc.includes('petty cash ke') ||
    desc.includes('ke petty cash') ||
    desc.includes('pengisian petty cash') ||
    desc.includes('isi petty cash') ||
    desc.includes('isi kas kecil') ||
    desc.includes('pengisian kas kecil') ||
    desc.includes('tarik kas bank') ||
    desc.includes('tarik dari bank') ||
    desc.includes('penyesuaian saldo') ||
    desc.includes('saldo opname') ||
    desc.includes('koreksi saldo')
  ) {
    return true;
  }

  return false;
};

export const isMutasiTx = isInternalMutationOrTransfer;
