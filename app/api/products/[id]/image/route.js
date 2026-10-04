import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
      { message: "Pilih gambar JPG, PNG, atau WebP maksimal 5 MB." },
      { status: 400 }
    );
  }

  const pool = getPool();
  const [products] = await pool.execute(
    "SELECT image_url FROM products WHERE id = ?",
    [params.id]
  );
  if (!products.length) {
    return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
  }

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
  const filename = `${randomUUID()}.${extension}`;
  const imageUrl = `/uploads/products/${filename}`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(
    path.join(uploadDirectory, filename),
    Buffer.from(await image.arrayBuffer())
  );

  try {
    await pool.execute("UPDATE products SET image_url = ? WHERE id = ?", [imageUrl, params.id]);

    const oldImageUrl = products[0].image_url;
    if (oldImageUrl?.startsWith("/uploads/products/")) {
      await unlink(path.join(uploadDirectory, path.basename(oldImageUrl))).catch(() => {});
    }

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    await unlink(path.join(uploadDirectory, filename)).catch(() => {});
    return NextResponse.json({ message: "Gagal menyimpan foto produk." }, { status: 500 });
  }
}