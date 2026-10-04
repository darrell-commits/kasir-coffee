"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KasirTopbar from "@/components/KasirTopbar";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const PAYMENT_LABEL = { cash: "Cash", qris: "QRIS", debit: "Debit", ewallet: "E-Wallet" };

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions);
  }, []);

  return (
    <>
      <KasirTopbar active="riwayat" />
      <div style={{ padding: 20 }}>
        <h2 style={{ marginBottom: 16 }}>Riwayat Transaksi Saya</h2>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Tanggal</th>
                <th>Member</th>
                <th>Total</th>
                <th>Pembayaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.invoice_number}</td>
                    <td>{new Date(t.created_at).toLocaleString("id-ID")}</td>
                    <td>{t.member_name || "-"}</td>
                    <td>{formatRupiah(t.total)}</td>
                    <td>{PAYMENT_LABEL[t.payment_method]}</td>
                    <td>
                      <Link href={`/kasir/struk/${t.id}`} className="btn btn-outline btn-sm">
                        Lihat Struk
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
