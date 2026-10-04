import AdminSidebar from "@/components/AdminSidebar";
import { getPool } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";
import styles from "./dashboard.module.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function getSalesWeek(rows) {
  const salesByDay = new Map(rows.map((row) => [row.day, row]));
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const row = salesByDay.get(key);

    return {
      key,
      label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      revenue: Number(row?.revenue || 0),
      transactions: Number(row?.transactions || 0),
    };
  });
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
  const [salesRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
            SUM(total) AS revenue, COUNT(*) AS transactions
     FROM transactions
     WHERE created_at >= CURDATE() - INTERVAL 6 DAY
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')`
  );

  return {
    total_products,
    total_members,
    total_kasir,
    trx_today,
    revenue_today,
    lowStock,
    recentTx,
    salesWeek: getSalesWeek(salesRows),
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
  const maxRevenue = Math.max(...stats.salesWeek.map((day) => day.revenue), 1);

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>RINGKASAN KEDAI</p>
            <h1>Dashboard</h1>
          </div>
          <span className={styles.dateLabel}>
            {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </header>

        <div className={styles.statsGrid}>
          {cards.map((c) => (
            <div className={styles.stat} key={c.label}>
              <span>{c.label}</span>
              <strong>{c.value}</strong>
            </div>
          ))}
        </div>

        <section className={styles.chartSection} aria-labelledby="sales-chart-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>7 HARI TERAKHIR</p>
              <h2 id="sales-chart-title">Tren penjualan</h2>
            </div>
            <span className={styles.chartLegend}><i /> Pendapatan</span>
          </div>
          <div className={styles.chart} role="img" aria-label="Grafik pendapatan penjualan selama tujuh hari terakhir">
            {stats.salesWeek.map((day) => (
              <div className={styles.chartDay} key={day.key} title={`${day.transactions} transaksi, ${formatRupiah(day.revenue)}`}>
                <span className={styles.chartValue}>
                  {day.revenue ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(day.revenue) : "-"}
                </span>
                <div className={styles.barTrack}>
                  <div className={styles.bar} style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, day.revenue ? 5 : 0)}%` }} />
                </div>
                <span className={styles.chartLabel}>{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.tablesGrid}>
          <section className={styles.tableSection}>
            <h2>Produk stok menipis</h2>
            {stats.lowStock.length === 0 ? (
              <p className={styles.empty}>Semua stok aman.</p>
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
          </section>

          <section className={styles.tableSection}>
            <h2>Transaksi terbaru</h2>
            {stats.recentTx.length === 0 ? (
              <p className={styles.empty}>Belum ada transaksi.</p>
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
          </section>
        </div>
      </main>
    </div>
  );
}
