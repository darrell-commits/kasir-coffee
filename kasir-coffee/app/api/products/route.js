import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";

  const pool = getPool();
  let sql = `
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'aktif'
  `;
  const params = [];

  if (search) {
    sql += " AND p.name LIKE ?";
    params.push(`%${search}%`);
  }
  if (categoryId) {
    sql += " AND p.category_id = ?";
    params.push(categoryId);
  }

  sql += " ORDER BY p.name ASC";

  const [rows] = await pool.execute(sql, params);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { name, category_id, price, stock, description, icon } = await request.json();

  if (!name || !category_id || !price) {
    return NextResponse.json(
      { message: "Nama, kategori, dan harga wajib diisi." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO products (name, category_id, price, stock, description, icon)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, category_id, price, stock || 0, description || null, icon || "cup"]
  );

  return NextResponse.json({ id: result.insertId, message: "Produk berhasil ditambahkan." });
}
