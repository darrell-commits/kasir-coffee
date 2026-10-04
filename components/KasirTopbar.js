"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./KasirTopbar.module.css";

export default function KasirTopbar({ active }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/kasir" className={styles.brand}>
          <Image
            className={styles.brandLogo}
            src="/LOGO%20KASIR.png"
            alt="Logo DR Coffee"
            width={44}
            height={44}
          />
          DR COFFEE
        </Link>
        <nav className={styles.nav} aria-label="Navigasi kasir">
          <Link href="/kasir" className={`${styles.link} ${active === "kasir" ? styles.active : ""}`} aria-current={active === "kasir" ? "page" : undefined}>
            Kasir
          </Link>
          <Link href="/kasir/menu" className={`${styles.link} ${active === "menu" ? styles.active : ""}`} aria-current={active === "menu" ? "page" : undefined}>
            Kelola Menu
          </Link>
          <Link href="/kasir/riwayat" className={`${styles.link} ${active === "riwayat" ? styles.active : ""}`} aria-current={active === "riwayat" ? "page" : undefined}>
            Riwayat Transaksi
          </Link>
        </nav>
      </div>
      <button className={styles.logout} onClick={handleLogout}>
        Keluar
      </button>
    </header>
  );
}
