import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session || !["admin", "kasir"].includes(session.role)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { id } = params;
  const {
    name,
    category_id,
    price,
    stock,
    description,
    icon,
    status,
    image_x = 50,
    image_y = 50,
    image_zoom = 1,
  } = await request.json();

  const validName = typeof name === "string" && name.trim().length > 0;
  const validCategory = Number.isInteger(Number(category_id)) && Number(category_id) > 0;
  const validPrice = Number.isInteger(Number(price)) && Number(price) >= 0;
  const validStock = Number.isInteger(Number(stock)) && Number(stock) >= 0;
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
  await pool.execute(
    `UPDATE products
     SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, icon = ?, status = ?,
         image_x = ?, image_y = ?, image_zoom = ?
     WHERE id = ?`,
    [
      name,
      category_id,
      price,
      stock,
      description || null,
      icon || "cup",
      status || "aktif",
      image_x,
      image_y,
      image_zoom,
      id,
    ]
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
