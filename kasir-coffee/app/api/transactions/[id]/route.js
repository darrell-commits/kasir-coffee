import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Silakan login." }, { status: 401 });
  }

  const { id } = params;
  const pool = getPool();

  const [txRows] = await pool.execute(
    `SELECT t.*, u.name AS cashier_name, m.name AS member_name, m.phone AS member_phone
     FROM transactions t
     JOIN users u ON u.id = t.cashier_id
     LEFT JOIN members m ON m.id = t.member_id
     WHERE t.id = ?`,
    [id]
  );

  const transaction = txRows[0];
  if (!transaction) {
    return NextResponse.json({ message: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  // Kasir hanya boleh melihat struk transaksinya sendiri.
  if (session.role === "kasir" && transaction.cashier_id !== session.id) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const [items] = await pool.execute(
    "SELECT * FROM transaction_items WHERE transaction_id = ?",
    [id]
  );

  return NextResponse.json({ ...transaction, items });
}
