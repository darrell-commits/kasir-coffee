"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import MenuIcon from "@/components/MenuIcon";

const ICON_OPTIONS = ["coffee-hot", "coffee-cold", "cup", "croissant", "snack"];

export default function KategoriPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("cup");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Gagal menambah kategori.");
      return;
    }

    setName("");
    load();
  }

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Kelola Kategori</h2>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
          <form onSubmit={handleSubmit} className="card">
            <h3 style={{ marginBottom: 12 }}>Tambah Kategori</h3>
            <div className="field">
              <label>Nama Kategori</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Ikon</label>
              <select className="select" value={icon} onChange={(e) => setIcon(e.target.value)}>
                {ICON_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            {error && <p style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-block">Tambah</button>
          </form>

          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nama Kategori</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <MenuIcon type={c.icon} size={30} />
                    </td>
                    <td>{c.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
