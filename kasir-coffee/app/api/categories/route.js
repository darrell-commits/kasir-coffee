import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { name, icon } = await request.json();
  if (!name) {
    return NextResponse.json({ message: "Nama kategori wajib diisi." }, { status: 400 });
  }

  const pool = getPool();
  const [result] = await pool.execute(
    "INSERT INTO categories (name, icon) VALUES (?, ?)",
    [name, icon || "cup"]
  );

  return NextResponse.json({ id: result.insertId, name, icon: icon || "cup" });
}
