import mysql from "mysql2/promise";

// Pool koneksi dipakai ulang di semua API route, supaya tidak
// membuka koneksi baru setiap request.
let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "db_kasir_coffee",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
