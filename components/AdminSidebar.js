"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const menu = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/produk", label: "Produk", icon: "☕" },
  { href: "/admin/kategori", label: "Kategori", icon: "🗂️" },
  { href: "/admin/transaksi", label: "Transaksi", icon: "🧾" },
  { href: "/admin/member", label: "Member", icon: "👥" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Image
          className={styles.brandLogo}
          src="/LOGO%20KASIR.png"
          alt="Logo DR Coffee"
          width={48}
          height={48}
        />
        <span>DR COFFEE<small>ADMINISTRASI</small></span>
      </div>

      <nav className={styles.nav} aria-label="Navigasi admin">
        {menu.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${active ? styles.active : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        className={styles.logout}
        onClick={handleLogout}
      >
        Keluar
      </button>
    </aside>
  );
}
