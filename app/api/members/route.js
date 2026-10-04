import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  const pool = getPool();

  if (phone) {
    const [rows] = await pool.execute(
      "SELECT * FROM members WHERE phone = ? AND status = 'aktif'",
      [phone]
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: "Member tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  }

  const [rows] = await pool.query("SELECT * FROM members ORDER BY created_at DESC");
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Silakan login." }, { status: 401 });
  }

  const { name, phone, address } = await request.json();
  if (!name || !phone) {
    return NextResponse.json({ message: "Nama dan nomor HP wajib diisi." }, { status: 400 });
  }

  const pool = getPool();

  const [existing] = await pool.execute("SELECT id FROM members WHERE phone = ?", [phone]);
  if (existing.length > 0) {
    return NextResponse.json({ message: "Nomor HP sudah terdaftar." }, { status: 409 });
  }

  const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM members");
  const nextCode = "MBR" + String(countRows[0].total + 1).padStart(3, "0");

  const [result] = await pool.execute(
    "INSERT INTO members (member_code, name, phone, address) VALUES (?, ?, ?, ?)",
    [nextCode, name, phone, address || null]
  );

  return NextResponse.json({ id: result.insertId, member_code: nextCode, name, phone });
}
