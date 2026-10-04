import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ICON_OPTIONS = new Set(["coffee-hot", "coffee-cold", "cup", "croissant", "snack"]);

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
  const categoryName = typeof name === "string" ? name.trim() : "";
  const categoryIcon = icon || "cup";
  if (!categoryName || !ICON_OPTIONS.has(categoryIcon)) {
    return NextResponse.json(
      { message: "Nama kategori wajib diisi dan ikon harus valid." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const [duplicates] = await pool.execute(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
    [categoryName]
  );
  if (duplicates.length) {
    return NextResponse.json({ message: "Nama kategori sudah digunakan." }, { status: 409 });
  }

  const [result] = await pool.execute(
    "INSERT INTO categories (name, icon) VALUES (?, ?)",
    [categoryName, categoryIcon]
  );

  return NextResponse.json({ id: result.insertId, name: categoryName, icon: categoryIcon });
}
