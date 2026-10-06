import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MEMBER_DISCOUNT_PERCENT } from "@/lib/config";

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}${d}-${rand}`;
}

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Silakan login." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pool = getPool();
  let sql = `
    SELECT t.*, u.name AS cashier_name, m.name AS member_name, m.phone AS member_phone
    FROM transactions t
    JOIN users u ON u.id = t.cashier_id
    LEFT JOIN members m ON m.id = t.member_id
  `;
  const conditions = [];
  const params = [];

  // Kasir hanya boleh melihat transaksinya sendiri.
  if (session.role === "kasir") {
    conditions.push("t.cashier_id = ?");
    params.push(session.id);
  } else if (session.role !== "admin") {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  const search = searchParams.get("search")?.trim();
  if (search) {
    conditions.push("(t.invoice_number LIKE ? OR m.name LIKE ? OR u.name LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  if (from && !isValidDate(from)) {
    return NextResponse.json({ message: "Tanggal awal tidak valid." }, { status: 400 });
  }
  if (to && !isValidDate(to)) {
    return NextResponse.json({ message: "Tanggal akhir tidak valid." }, { status: 400 });
  }
  if (from && to && from > to) {
    return NextResponse.json({ message: "Tanggal awal tidak boleh melewati tanggal akhir." }, { status: 400 });
  }
  if (from) {
    conditions.push("t.created_at >= ?");
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    conditions.push("t.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(`${to} 00:00:00`);
  }
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += " ORDER BY t.created_at DESC LIMIT 500";

  const [rows] = await pool.execute(sql, params);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Silakan login." }, { status: 401 });
  }

  const body = await request.json();
  const {
    items,
    member_id,
    payment_method,
    paid_amount,
    order_type = "dine-in",
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: "Keranjang kosong." }, { status: 400 });
  }
  const seenProductIds = new Set();
  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.product_id) ||
      item.product_id <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      seenProductIds.has(item.product_id)
    ) {
      return NextResponse.json(
        { message: "Produk dan jumlah barang harus valid dan tidak boleh duplikat." },
        { status: 400 }
      );
    }
    seenProductIds.add(item.product_id);
  }
  if (!["cash", "qris", "debit", "ewallet"].includes(payment_method)) {
    return NextResponse.json({ message: "Metode pembayaran tidak valid." }, { status: 400 });
  }
  if (!["dine-in", "take-away"].includes(order_type)) {
    return NextResponse.json({ message: "Tipe pesanan tidak valid." }, { status: 400 });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Ambil data produk terbaru (harga & stok) langsung dari DB,
    // JANGAN percaya harga yang dikirim dari client.
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const [rows] = await connection.execute(
        "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
        [item.product_id]
      );
      const product = rows[0];

      if (!product) {
        throw { code: 400, message: `Produk dengan id ${item.product_id} tidak ditemukan.` };
      }
      if (product.stock <= 0) {
        throw { code: 400, message: `${product.name} sedang habis.` };
      }
      if (product.stock < item.quantity) {
        throw { code: 400, message: `Stok ${product.name} tidak mencukupi.` };
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        request_notes:
          typeof item.request_notes === "string" ? item.request_notes.trim().slice(0, 255) : null,
      });
    }

    // Diskon member.
    let discount = 0;
    let memberIdToSave = null;
    if (member_id !== undefined && member_id !== null) {
      if (!Number.isSafeInteger(member_id) || member_id <= 0) {
        throw { code: 400, message: "Member tidak valid." };
      }
      const [memberRows] = await connection.execute(
        "SELECT id FROM members WHERE id = ? AND status = 'aktif'",
        [member_id]
      );
      if (memberRows.length === 0) {
        throw { code: 400, message: "Member tidak ditemukan atau tidak aktif." };
      }
      memberIdToSave = memberRows[0].id;
      discount = Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100);
    }

    const total = subtotal - discount;

    // Validasi pembayaran tunai.
    let paidAmountToSave = paid_amount || 0;
    let changeAmount = 0;

    if (payment_method === "cash") {
      if (!Number.isSafeInteger(paid_amount) || paid_amount < total) {
        throw { code: 400, message: "Uang pembayaran tidak mencukupi." };
      }
      changeAmount = paid_amount - total;
    } else {
      // Non-cash: dianggap dibayar pas, tidak ada kembalian.
      paidAmountToSave = total;
      changeAmount = 0;
    }

    const invoiceNumber = generateInvoiceNumber();

    const [txResult] = await connection.execute(
      `INSERT INTO transactions
        (invoice_number, cashier_id, member_id, subtotal, discount, total, payment_method, paid_amount, change_amount, order_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [
        invoiceNumber,
        session.id,
        memberIdToSave,
        subtotal,
        discount,
        total,
        payment_method,
        paidAmountToSave,
        changeAmount,
        order_type,
      ]
    );

    const transactionId = txResult.insertId;

    for (const item of validatedItems) {
      await connection.execute(
        `INSERT INTO transaction_items
          (transaction_id, product_id, product_name, quantity, unit_price, subtotal, request_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          item.product_id,
          item.name,
          item.quantity,
          item.price,
          item.subtotal,
          item.request_notes,
        ]
      );

      await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    return NextResponse.json({
      id: transactionId,
      invoice_number: invoiceNumber,
      order_type,
      subtotal,
      discount,
      total,
      paid_amount: paidAmountToSave,
      change_amount: changeAmount,
    });
  } catch (err) {
    await connection.rollback();
    const status = err.code && typeof err.code === "number" ? err.code : 500;
    const message = err.message || "Gagal menyimpan transaksi.";
    console.error(err);
    return NextResponse.json({ message }, { status });
  } finally {
    connection.release();
  }
}
