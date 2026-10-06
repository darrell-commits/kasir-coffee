"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import styles from "./member.module.css";

const EMPTY_FORM = { id: null, name: "", phone: "", address: "" };

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export default function AdminMemberPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setPageError("");
    try {
      const response = await fetch("/api/members");
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memuat data member.");
      setMembers(result);
    } catch (loadError) {
      setPageError(loadError.message || "Gagal memuat data member.");
    } finally {
      setLoading(false);
    }
  }

  const visibleMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        !normalizedSearch ||
        `${member.name} ${member.phone} ${member.member_code} ${member.address || ""}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus = statusFilter === "semua" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  function openAddForm() {
    setForm(EMPTY_FORM);
    setError("");
    setIsOpen(true);
  }

  function openEditForm(member) {
    setForm({
      id: member.id,
      name: member.name,
      phone: member.phone,
      address: member.address || "",
    });
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(form.id ? `/api/members/${form.id}` : "/api/members", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan data member.");
      setIsOpen(false);
      await loadMembers();
    } catch (saveError) {
      setError(saveError.message || "Gagal menyimpan data member.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMemberStatus(member) {
    const nextStatus = member.status === "aktif" ? "nonaktif" : "aktif";
    const confirmation = nextStatus === "nonaktif"
      ? `Nonaktifkan ${member.name}? Riwayat transaksinya tetap tersimpan, tetapi member tidak bisa dipakai untuk transaksi baru.`
      : `Aktifkan kembali ${member.name}?`;
    if (!window.confirm(confirmation)) return;

    setPageError("");
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengubah status member.");
      await loadMembers();
    } catch (statusError) {
      setPageError(statusError.message || "Gagal mengubah status member.");
    }
  }

  const activeCount = members.filter((member) => member.status === "aktif").length;

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>PELANGGAN</p>
            <h1>Member</h1>
            <p className={styles.subheading}>
              {members.length} terdaftar · {activeCount} aktif
            </p>
          </div>
          <button className="btn" type="button" onClick={openAddForm}>+ Tambah member</button>
        </header>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <span className={styles.visuallyHidden}>Cari member</span>
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, telepon, kode member"
            />
          </label>
          <label className={styles.statusField}>
            <span className={styles.visuallyHidden}>Filter status member</span>
            <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="semua">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
        </div>

        {pageError && <p className={styles.error} role="alert">{pageError}</p>}
        <div className={styles.tableCard}>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Telepon</th>
                <th>Transaksi</th>
                <th>Total belanja</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.empty}>Memuat data member...</td></tr>
              ) : visibleMembers.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>Tidak ada member yang cocok.</td></tr>
              ) : visibleMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                    <span className={styles.memberCode}>{member.member_code}</span>
                  </td>
                  <td>{member.phone}</td>
                  <td>{Number(member.transaction_count || 0)}</td>
                  <td className={styles.amount}>{formatRupiah(member.total_spent)}</td>
                  <td>
                    <span className={`${styles.status} ${member.status === "aktif" ? styles.active : styles.inactive}`}>
                      {member.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => openEditForm(member)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() => toggleMemberStatus(member)}
                      >
                        {member.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {isOpen && (
        <div className={styles.overlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setIsOpen(false);
        }}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <h2>{form.id ? "Edit member" : "Tambah member"}</h2>
            <label className={styles.field}>
              <span>Nama</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={100}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Nomor telepon</span>
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={24}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Alamat (opsional)</span>
              <textarea
                className="input"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                maxLength={255}
                rows={3}
              />
            </label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.modalActions}>
              <button className="btn btn-outline" type="button" onClick={() => setIsOpen(false)} disabled={saving}>
                Batal
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
