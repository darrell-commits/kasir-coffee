import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";

  const pool = getPool();
  let sql = `
    SELECT p.*, c.name AS category_name, c.icon AS category_icon
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
  if (!session || !["admin", "kasir"].includes(session.role)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const {
    name,
    category_id,
    price,
    stock,
    description,
    icon,
    image_x = 50,
    image_y = 50,
    image_zoom = 1,
  } = await request.json();

  const validName = typeof name === "string" && name.trim().length > 0;
  const validCategory = Number.isInteger(Number(category_id)) && Number(category_id) > 0;
  const validPrice = Number.isInteger(Number(price)) && Number(price) >= 0;
  const validStock = Number.isInteger(Number(stock ?? 0)) && Number(stock ?? 0) >= 0;
  const validImagePosition = [image_x, image_y].every(
    (position) => Number.isInteger(Number(position)) && Number(position) >= 0 && Number(position) <= 100
  );
  const validImageZoom = Number.isFinite(Number(image_zoom)) && Number(image_zoom) >= 1 && Number(image_zoom) <= 2;
  if (!validName || !validCategory || !validPrice || !validStock || !validImagePosition || !validImageZoom) {
    return NextResponse.json(
      { message: "Nama, kategori, harga, dan stok harus valid." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO products
      (name, category_id, price, stock, description, icon, image_x, image_y, image_zoom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category_id, price, stock || 0, description || null, icon || "cup", image_x, image_y, image_zoom]
  );

  return NextResponse.json({ id: result.insertId, message: "Produk berhasil ditambahkan." });
}
