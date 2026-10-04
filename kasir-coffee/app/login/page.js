"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal.");
        setLoading(false);
        return;
      }

      router.push(data.role === "admin" ? "/admin/dashboard" : "/kasir");
    } catch (err) {
      setError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>☕</div>
        <h1 className={styles.title}>Kedai Kopi Senja</h1>
        <p className={styles.subtitle}>Masuk untuk mulai bertransaksi</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / kasir"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className="btn btn-block" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className={styles.hint}>
          Akun uji coba: <b>admin/admin</b> atau <b>kasir/kasir</b>
        </p>
      </div>
    </main>
  );
}
