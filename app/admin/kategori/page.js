"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/AdminSidebar";
import MenuIcon from "@/components/MenuIcon";
import { getImageCropTransform } from "@/lib/image-crop";

const ICON_OPTIONS = [
  { value: "coffee-hot", label: "Kopi panas" },
  { value: "coffee-cold", label: "Kopi dingin" },
  { value: "cup", label: "Minuman" },
  { value: "croissant", label: "Pastry" },
  { value: "snack", label: "Snack" },
];

export default function KategoriPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [menuCategoryId, setMenuCategoryId] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("cup");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [categoryResponse, productResponse] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/products"),
    ]);
    setCategories(await categoryResponse.json());
    setProducts(await productResponse.json());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(editingId ? `/api/categories/${editingId}` : "/api/categories", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Gagal menyimpan kategori.");
      return;
    }

    setName("");
    setIcon("cup");
    setEditingId(null);
    await load();
  }

  function startEdit(category) {
    setEditingId(category.id);
    setName(category.name);
    setIcon(category.icon || "cup");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setIcon("cup");
    setError("");
  }

  async function handleDelete(category) {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return;

    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Gagal menghapus kategori.");
      return;
    }

    if (editingId === category.id) cancelEdit();
    await load();
  }

  const normalizedSearch = categorySearch.trim().toLocaleLowerCase("id-ID");
  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.icon}`.toLocaleLowerCase("id-ID").includes(normalizedSearch)
  );
  const normalizedMenuSearch = menuSearch.trim().toLocaleLowerCase("id-ID");
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !menuCategoryId || String(product.category_id) === menuCategoryId;
    const matchesName = product.name.toLocaleLowerCase("id-ID").includes(normalizedMenuSearch);
    return matchesCategory && matchesName;
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <AdminSidebar />
      <main style={{ flex: 1, minWidth: 0, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Kelola Kategori</h2>
        {error && <p role="alert" style={{ color: "var(--danger)", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <form onSubmit={handleSubmit} className="card">
            <h3 style={{ marginBottom: 12 }}>{editingId ? "Edit Kategori" : "Tambah Kategori"}</h3>
            <div className="field">
              <label htmlFor="category-name">Nama Kategori</label>
              <input id="category-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
            </div>
            <div className="field">
              <label htmlFor="category-icon">Ikon Kategori</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MenuIcon type={icon} size={36} />
                <select id="category-icon" className="select" value={icon} onChange={(e) => setIcon(e.target.value)}>
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                  </option>
                ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {editingId && <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={cancelEdit}>Batal</button>}
              <button className="btn btn-block" style={{ flex: 1 }}>{editingId ? "Simpan Perubahan" : "Tambah Kategori"}</button>
            </div>
          </form>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <label htmlFor="category-search" style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                Cari kategori
              </label>
              <input
                id="category-search"
                className="input"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Ketik nama kategori atau ikon"
              />
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nama Kategori</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 20, color: "var(--text-muted)", textAlign: "center" }}>
                      Tidak ada kategori yang cocok.
                    </td>
                  </tr>
                ) : filteredCategories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <MenuIcon type={c.icon} size={30} />
                    </td>
                    <td>{c.name}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>
                        Edit
                      </button>{" "}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section style={{ marginTop: 28 }} aria-labelledby="category-menu-title">
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h3 id="category-menu-title" style={{ marginBottom: 4 }}>Menu berdasarkan kategori</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Pilih kategori untuk melihat makanan dan minuman di dalamnya.</p>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{filteredProducts.length} menu</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Kategori</span>
              <select className="select" value={menuCategoryId} onChange={(event) => setMenuCategoryId(event.target.value)}>
                <option value="">Semua kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Cari makanan/minuman</span>
              <input className="input" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Nama menu" />
            </label>
          </div>

          {filteredProducts.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
              {filteredProducts.map((product) => (
                <article key={product.id} style={{ overflow: "hidden", border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}>
                  <div style={{ display: "grid", height: 136, placeItems: "center", overflow: "hidden", background: "var(--cream-2)" }}>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={400}
                        height={272}
                        unoptimized
                        style={{ width: "100%", height: "100%", objectFit: "cover", transform: getImageCropTransform(product.image_x, product.image_y, product.image_zoom) }}
                      />
                    ) : (
                      <MenuIcon type={product.icon} size={54} />
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{product.category_name}</span>
                    <h4 style={{ margin: "4px 0 8px", fontSize: 15 }}>{product.name}</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                      <strong style={{ color: "var(--coffee)" }}>Rp{Number(product.price || 0).toLocaleString("id-ID")}</strong>
                      <span style={{ color: "var(--text-muted)" }}>Stok {product.stock}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ padding: "24px 0", color: "var(--text-muted)" }}>Tidak ada menu pada pencarian ini.</p>
          )}
        </section>
      </main>
    </div>
  );
}
