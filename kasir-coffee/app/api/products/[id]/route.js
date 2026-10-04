import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { id } = params;
  const { name, category_id, price, stock, description, icon, status } = await request.json();

  const pool = getPool();
  await pool.execute(
    `UPDATE products
     SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, icon = ?, status = ?
     WHERE id = ?`,
    [name, category_id, price, stock, description || null, icon || "cup", status || "aktif", id]
  );

  return NextResponse.json({ message: "Produk berhasil diperbarui." });
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { id } = params;
  const pool = getPool();
  await pool.execute("DELETE FROM products WHERE id = ?", [id]);

  return NextResponse.json({ message: "Produk berhasil dihapus." });
}
