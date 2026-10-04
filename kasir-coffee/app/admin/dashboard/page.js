import AdminSidebar from "@/components/AdminSidebar";
import { getPool } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

async function getStats() {
  const pool = getPool();

  const [[{ total_products }]] = await pool.query(
    "SELECT COUNT(*) AS total_products FROM products WHERE status = 'aktif'"
  );
  const [[{ total_members }]] = await pool.query(
    "SELECT COUNT(*) AS total_members FROM members WHERE status = 'aktif'"
  );
  const [[{ total_kasir }]] = await pool.query(
    "SELECT COUNT(*) AS total_kasir FROM users WHERE role = 'kasir' AND status = 'aktif'"
  );
  const [[{ trx_today, revenue_today }]] = await pool.query(
    `SELECT COUNT(*) AS trx_today, COALESCE(SUM(total), 0) AS revenue_today
     FROM transactions WHERE DATE(created_at) = CURDATE()`
  );
  const [lowStock] = await pool.execute(
    "SELECT name, stock FROM products WHERE stock <= ? AND status = 'aktif' ORDER BY stock ASC LIMIT 5",
    [LOW_STOCK_THRESHOLD]
  );
  const [recentTx] = await pool.query(
    `SELECT t.invoice_number, t.total, t.created_at, u.name AS cashier_name
     FROM transactions t JOIN users u ON u.id = t.cashier_id
     ORDER BY t.created_at DESC LIMIT 5`
  );

  return {
    total_products,
    total_members,
    total_kasir,
    trx_today,
    revenue_today,
    lowStock,
    recentTx,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Produk", value: stats.total_products },
    { label: "Total Member", value: stats.total_members },
    { label: "Total Kasir", value: stats.total_kasir },
    { label: "Transaksi Hari Ini", value: stats.trx_today },
    { label: "Pendapatan Hari Ini", value: formatRupiah(stats.revenue_today) },
  ];

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {cards.map((c) => (
            <div className="card" key={c.label}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--coffee-dark)" }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Produk Stok Menipis</h3>
            {stats.lowStock.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Semua stok aman.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStock.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>
                        <span className="badge badge-warning">{p.stock}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Transaksi Terbaru</h3>
            {stats.recentTx.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Belum ada transaksi.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Kasir</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTx.map((t) => (
                    <tr key={t.invoice_number}>
                      <td>{t.invoice_number}</td>
                      <td>{t.cashier_name}</td>
                      <td>{formatRupiah(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
