import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  const session = await getSession();
  if (!session || !["admin", "kasir"].includes(session.role)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  const pool = getPool();

  if (phone) {
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    const [rows] = await pool.execute(
      "SELECT * FROM members WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ? AND status = 'aktif'",
      [normalizedPhone]
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: "Member tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  }

  const [rows] = await pool.query(
    `SELECT m.*,
            COUNT(t.id) AS transaction_count,
            COALESCE(SUM(t.total), 0) AS total_spent
     FROM members m
     LEFT JOIN transactions t ON t.member_id = m.id
     GROUP BY m.id
     ORDER BY m.created_at DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !["admin", "kasir"].includes(session.role)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const parsedBody = await request.json();
  const body = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!name || !phone) {
    return NextResponse.json({ message: "Nama dan nomor HP wajib diisi." }, { status: 400 });
  }
  if (name.length > 100 || phone.length > 20 || !/^\+?\d{8,19}$/.test(phone) || address.length > 255) {
    return NextResponse.json({ message: "Nama, nomor HP, atau alamat tidak valid." }, { status: 400 });
  }

  const pool = getPool();

  const [existing] = await pool.execute(
    "SELECT id FROM members WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ?",
    [phone]
  );
  if (existing.length > 0) {
    return NextResponse.json({ message: "Nomor HP sudah terdaftar." }, { status: 409 });
  }

  const memberCode = `MBR${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  let result;
  try {
    [result] = await pool.execute(
      "INSERT INTO members (member_code, name, phone, address) VALUES (?, ?, ?, ?)",
      [memberCode, name, phone, address || null]
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ message: "Nomor HP sudah terdaftar. Muat ulang data lalu coba lagi." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ id: result.insertId, member_code: memberCode, name, phone }, { status: 201 });
}
