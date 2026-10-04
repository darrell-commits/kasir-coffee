"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ username, password, role }),
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
      <div className={styles.panel}>
        <section className={styles.visual} aria-label="DR COFFEE" />

        <section className={styles.formSide}>
          <div className={styles.card}>
          <div className={styles.eyebrow}>
            <Image
              src="/LOGO%20KASIR.png"
              alt="Logo DR Coffee"
              width={180}
              height={180}
            />
          </div>
          <h2 className={styles.title}>Masuk untuk mulai<br />bertransaksi</h2>

          <div className={styles.roleSwitch} role="group" aria-label="Jenis akun">
            <button
              className={role === "admin" ? styles.roleActive : styles.roleButton}
              type="button"
              aria-pressed={role === "admin"}
              onClick={() => {
                setRole("admin");
                setError("");
              }}
            >
              ADMIN
            </button>
            <button
              className={role === "kasir" ? styles.roleActive : styles.roleButton}
              type="button"
              aria-pressed={role === "kasir"}
              onClick={() => {
                setRole("kasir");
                setError("");
              }}
            >
              KASIR
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button className={styles.submit} disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>
          </div>
        </section>
      </div>
    </main>
  );
}
