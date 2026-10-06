import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

function databaseErrorResponse(error) {
  console.error("Product image storage failed:", error);
  if (error?.code === "ER_BAD_FIELD_ERROR") {
    return NextResponse.json(
      { message: "Penyimpanan foto belum disiapkan. Jalankan migrasi database 001_product_image_storage.sql." },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { message: "Gagal menyimpan foto ke database. Periksa koneksi database." },
    { status: 500 }
  );
}

export async function GET(request, { params }) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT image_data, image_mime FROM products WHERE id = ?",
      [params.id]
    );
    const product = rows[0];

    if (!product?.image_data || !product.image_mime) {
      return NextResponse.json({ message: "Foto produk tidak ditemukan." }, { status: 404 });
    }

    return new NextResponse(product.image_data, {
      headers: {
        "Content-Type": product.image_mime,
        "Content-Length": String(product.image_data.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session || !["admin", "kasir"].includes(session.role)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const extension = image && IMAGE_TYPES.get(image.type);

  if (!extension || image.size <= 0 || image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { message: "Pilih gambar JPG, PNG, atau WebP maksimal 4 MB." },
      { status: 400 }
    );
  }

  try {
    const pool = getPool();
    const imageUrl = `/api/products/${params.id}/image`;
    const [result] = await pool.execute(
      `UPDATE products
       SET image_url = ?, image_data = ?, image_mime = ?
       WHERE id = ?`,
      [imageUrl, Buffer.from(await image.arrayBuffer()), image.type, params.id]
    );
    if (!result.affectedRows) {
      return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}