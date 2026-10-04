"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function KasirTopbar({ active }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const linkStyle = (name) => ({
    padding: "8px 14px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    background: active === name ? "#fff" : "transparent",
    color: active === name ? "#3e2723" : "#f3e6d3",
  });

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        background: "#4e342e",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <strong style={{ fontSize: 16 }}>☕ Kedai Kopi Senja</strong>
        <nav style={{ display: "flex", gap: 6 }}>
          <Link href="/kasir" style={linkStyle("kasir")}>
            Kasir
          </Link>
          <Link href="/kasir/riwayat" style={linkStyle("riwayat")}>
            Riwayat Transaksi
          </Link>
        </nav>
      </div>
      <button className="btn btn-outline btn-sm" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}
