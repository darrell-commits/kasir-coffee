"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menu = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/produk", label: "Produk", icon: "☕" },
  { href: "/admin/kategori", label: "Kategori", icon: "🗂️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#3e2723",
        color: "#fbf3e7",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, paddingLeft: 8 }}>
        ☕ Admin Panel
      </div>

      {menu.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              background: active ? "#6f4e37" : "transparent",
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        style={{
          marginTop: "auto",
          background: "transparent",
          color: "#fbf3e7",
          border: "1px solid #6f4e37",
          borderRadius: 8,
          padding: "10px 12px",
          textAlign: "left",
          fontWeight: 600,
        }}
      >
        🚪 Logout
      </button>
    </aside>
  );
}
