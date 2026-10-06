import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

function normalizeMemberInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (
    !name ||
    name.length > 100 ||
    phone.length > 20 ||
    !/^\+?\d{8,19}$/.test(phone) ||
    address.length > 255
  ) {
    return { error: "Nama, nomor HP, atau alamat tidak valid." };
  }

  return { name, phone, address: address || null };
}

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const parsedBody = await request.json();
  const body = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
  const member = normalizeMemberInput(body);
  if (member.error) {
    return NextResponse.json({ message: member.error }, { status: 400 });
  }

  const pool = getPool();
  const [memberRows] = await pool.execute("SELECT id FROM members WHERE id = ?", [params.id]);
  if (!memberRows.length) {
    return NextResponse.json({ message: "Member tidak ditemukan." }, { status: 404 });
  }
  const [existing] = await pool.execute(
    "SELECT id FROM members WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ? AND id <> ?",
    [member.phone, params.id]
  );
  if (existing.length) {
    return NextResponse.json({ message: "Nomor HP sudah digunakan member lain." }, { status: 409 });
  }

  try {
    await pool.execute(
      "UPDATE members SET name = ?, phone = ?, address = ? WHERE id = ?",
      [member.name, member.phone, member.address, params.id]
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ message: "Nomor HP sudah digunakan member lain." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ message: "Data member berhasil diperbarui." });
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const parsedBody = await request.json();
  const body = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
  if (!["aktif", "nonaktif"].includes(body.status)) {
    return NextResponse.json({ message: "Status member tidak valid." }, { status: 400 });
  }

  const pool = getPool();
  const [memberRows] = await pool.execute("SELECT id FROM members WHERE id = ?", [params.id]);
  if (!memberRows.length) {
    return NextResponse.json({ message: "Member tidak ditemukan." }, { status: 404 });
  }
  await pool.execute(
    "UPDATE members SET status = ? WHERE id = ?",
    [body.status, params.id]
  );

  return NextResponse.json({ message: `Member berhasil ${body.status === "aktif" ? "diaktifkan" : "dinonaktifkan"}.` });
}
