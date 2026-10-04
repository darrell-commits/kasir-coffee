// Jalankan dengan: node database/seed-users.js
// Membuat akun admin & kasir default dengan password ter-hash (bcrypt).
// Aman dijalankan berkali-kali (akan update password jika user sudah ada).

require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "db_kasir_coffee",
  });

  const accounts = [
    { username: "admin", password: "admin", role: "admin", name: "Administrator" },
    { username: "kasir", password: "kasir", role: "kasir", name: "Kasir Satu" },
  ];

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE username = ?",
      [acc.username]
    );

    if (existing.length > 0) {
      await connection.execute("UPDATE users SET password = ? WHERE username = ?", [
        hashed,
        acc.username,
      ]);
      console.log(`Password untuk '${acc.username}' diperbarui.`);
    } else {
      await connection.execute(
        "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        [acc.username, hashed, acc.role, acc.name]
      );
      console.log(`Akun '${acc.username}' (${acc.role}) dibuat.`);
    }
  }

  await connection.end();
  console.log("Selesai. Login dengan admin/admin atau kasir/kasir.");
}

main().catch((err) => {
  console.error("Gagal seed users:", err.message);
  process.exit(1);
});
