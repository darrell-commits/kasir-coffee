import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ICON_OPTIONS = new Set(["coffee-hot", "coffee-cold", "cup", "croissant", "snack"]);

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin";
}

export async function PUT(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { name, icon } = await request.json();
  const categoryName = typeof name === "string" ? name.trim() : "";
  if (!categoryName || !ICON_OPTIONS.has(icon)) {
    return NextResponse.json(
      { message: "Nama kategori wajib diisi dan ikon harus valid." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const [duplicates] = await pool.execute(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?",
    [categoryName, params.id]
  );
  if (duplicates.length) {
    return NextResponse.json({ message: "Nama kategori sudah digunakan." }, { status: 409 });
  }

  const [[category]] = await pool.execute("SELECT id FROM categories WHERE id = ?", [params.id]);
  if (!category) {
    return NextResponse.json({ message: "Kategori tidak ditemukan." }, { status: 404 });
  }

  await pool.execute(
    "UPDATE categories SET name = ?, icon = ? WHERE id = ?",
    [categoryName, icon, params.id]
  );

  return NextResponse.json({ message: "Kategori berhasil diperbarui." });
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const pool = getPool();
  const [[usage]] = await pool.execute(
    "SELECT COUNT(*) AS product_count FROM products WHERE category_id = ?",
    [params.id]
  );
  if (Number(usage.product_count) > 0) {
    return NextResponse.json(
      { message: "Kategori masih dipakai produk. Pindahkan produk ke kategori lain sebelum menghapusnya." },
      { status: 409 }
    );
  }

  const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [params.id]);
  if (!result.affectedRows) {
    return NextResponse.json({ message: "Kategori tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ message: "Kategori berhasil dihapus." });
}