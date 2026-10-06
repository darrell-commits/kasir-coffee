"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import styles from "./transaksi.module.css";

const PAYMENT_LABEL = {
  cash: "Tunai",
  qris: "QRIS",
  debit: "Debit",
  ewallet: "E-Wallet",
};

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function formatDate(value) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransaksiPage() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setError("");
      const query = new URLSearchParams();
      if (appliedFilters.search) query.set("search", appliedFilters.search);
      if (appliedFilters.from) query.set("from", appliedFilters.from);
      if (appliedFilters.to) query.set("to", appliedFilters.to);

      try {
        const response = await fetch(`/api/transactions?${query.toString()}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat transaksi.");
        setTransactions(result);
      } catch (loadError) {
        setError(loadError.message || "Gagal memuat transaksi.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [appliedFilters]);

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({ search: search.trim(), from, to });
  }

  function resetFilters() {
    setSearch("");
    setFrom("");
    setTo("");
    setAppliedFilters({ search: "", from: "", to: "" });
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>PENJUALAN</p>
            <h1>Riwayat transaksi</h1>
            <p className={styles.subheading}>{transactions.length} transaksi ditampilkan</p>
          </div>
        </header>

        <form className={styles.filters} onSubmit={applyFilters}>
          <label className={styles.searchField}>
            <span className={styles.visuallyHidden}>Cari transaksi</span>
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari invoice, kasir, atau member"
            />
          </label>
          <label>
            <span className={styles.visuallyHidden}>Tanggal dari</span>
            <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            <span className={styles.visuallyHidden}>Tanggal sampai</span>
            <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button className="btn" type="submit">Filter</button>
          <button className="btn btn-outline" type="button" onClick={resetFilters}>Reset</button>
        </form>

        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.tableCard}>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Member</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Status</th>
                <th>Struk</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.empty}>Memuat transaksi...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>Tidak ada transaksi yang cocok.</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className={styles.invoice}>{transaction.invoice_number}</td>
                  <td>{formatDate(transaction.created_at)}</td>
                  <td>{transaction.cashier_name}</td>
                  <td>{transaction.member_name || "-"}</td>
                  <td>{PAYMENT_LABEL[transaction.payment_method] || transaction.payment_method}</td>
                  <td className={styles.amount}>{formatRupiah(transaction.total)}</td>
                  <td><span className={styles.paid}>Lunas</span></td>
                  <td>
                    <Link
                      className={styles.receiptLink}
                      href={`/kasir/struk/${transaction.id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Buka struk ${transaction.invoice_number}`}
                    >
                      Cetak
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>Menampilkan maksimal 500 transaksi terbaru. Gunakan filter tanggal untuk mencari transaksi lama.</p>
      </main>
    </div>
  );
}
