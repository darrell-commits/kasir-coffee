"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import MenuIcon from "@/components/MenuIcon";

const emptyForm = {
  id: null,
  name: "",
  category_id: "",
  price: "",
  stock: "",
  description: "",
  icon: "coffee-hot",
  status: "aktif",
};

const ICON_OPTIONS = ["coffee-hot", "coffee-cold", "cup", "croissant", "snack"];

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  function openAddModal() {
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(p) {
    setForm({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      stock: p.stock,
      description: p.description || "",
      icon: p.icon,
      status: p.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      category_id: Number(form.category_id),
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description,
      icon: form.icon,
      status: form.status,
    };

    const url = form.id ? `/api/products/${form.id}` : "/api/products";
    const method = form.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Gagal menyimpan produk.");
      return;
    }

    setShowModal(false);
    loadProducts();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2>Kelola Produk</h2>
          <button className="btn" onClick={openAddModal}>
            + Tambah Produk
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <MenuIcon type={p.icon} size={32} />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.category_name}</td>
                    <td>{formatRupiah(p.price)}</td>
                    <td>
                      {p.stock === 0 ? (
                        <span className="badge badge-danger">Habis</span>
                      ) : p.stock <= 10 ? (
                        <span className="badge badge-warning">{p.stock} (menipis)</span>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.status === "aktif" ? "badge-success" : "badge-danger"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(p)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "grid",
              placeItems: "center",
              zIndex: 50,
            }}
          >
            <form onSubmit={handleSubmit} className="card" style={{ width: 420 }}>
              <h3 style={{ marginBottom: 16 }}>{form.id ? "Edit Produk" : "Tambah Produk"}</h3>

              <div className="field">
                <label>Nama Produk</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Kategori</label>
                <select
                  className="select"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Harga</label>
                  <input
                    className="input"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Stok</label>
                  <input
                    className="input"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Ikon Menu</label>
                <select
                  className="select"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Deskripsi</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {form.id && (
                <div className="field">
                  <label>Status</label>
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}

              {error && <p style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button className="btn" style={{ flex: 1 }}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
