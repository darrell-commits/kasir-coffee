"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./struk.module.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const PAYMENT_LABEL = {
  cash: "Cash",
  qris: "QRIS",
  debit: "Debit",
  ewallet: "E-Wallet",
};

export default function StrukPage() {
  const router = useRouter();
  const params = useParams();
  const [trx, setTrx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/transactions/${params.id}`);
      if (!res.ok) {
        setError("Transaksi tidak ditemukan.");
        return;
      }
      setTrx(await res.json());
    }
    load();
  }, [params.id]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>{error}</p>
        <button className="btn" onClick={() => router.push("/kasir")}>
          Kembali ke Kasir
        </button>
      </div>
    );
  }

  if (!trx) {
    return <div style={{ padding: 40, textAlign: "center" }}>Memuat struk...</div>;
  }

  const tanggal = new Date(trx.created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const waktu = new Date(trx.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.receipt} id="receipt">
        <h2 className={styles.storeName}>Kedai Kopi Senja</h2>
        <p className={styles.center}>Jl. Kopi Nikmat No. 1</p>
        <div className={styles.divider} />

        <p>No: {trx.invoice_number}</p>
        <p>Kasir: {trx.cashier_name}</p>
        <p>Tanggal: {tanggal}</p>
        <p>Waktu: {waktu}</p>

        {trx.member_name && (
          <>
            <div className={styles.divider} />
            <p>Member: {trx.member_name}</p>
            <p>{trx.member_phone}</p>
          </>
        )}

        <div className={styles.divider} />

        {trx.items.map((item) => (
          <div key={item.id} className={styles.itemRow}>
            <div>{item.product_name}</div>
            <div className={styles.itemDetail}>
              <span>
                {item.quantity} x {formatRupiah(item.unit_price)}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}

        <div className={styles.divider} />

        <div className={styles.summaryLine}>
          <span>Subtotal</span>
          <span>{formatRupiah(trx.subtotal)}</span>
        </div>
        <div className={styles.summaryLine}>
          <span>Diskon</span>
          <span>{formatRupiah(trx.discount)}</span>
        </div>
        <div className={`${styles.summaryLine} ${styles.bold}`}>
          <span>Total</span>
          <span>{formatRupiah(trx.total)}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.summaryLine}>
          <span>Pembayaran</span>
          <span>{PAYMENT_LABEL[trx.payment_method]}</span>
        </div>
        <div className={styles.summaryLine}>
          <span>Bayar</span>
          <span>{formatRupiah(trx.paid_amount)}</span>
        </div>
        <div className={styles.summaryLine}>
          <span>Kembalian</span>
          <span>{formatRupiah(trx.change_amount)}</span>
        </div>

        <div className={styles.divider} />
        <p className={styles.center}>Terima kasih! ☕</p>
      </div>

      <div className={`${styles.actions} no-print`}>
        <button className="btn btn-outline" onClick={() => window.print()}>
          Cetak Struk
        </button>
        <button className="btn" onClick={() => router.push("/kasir")}>
          Transaksi Baru
        </button>
      </div>
    </div>
  );
}
