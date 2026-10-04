"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import KasirTopbar from "@/components/KasirTopbar";
import MenuIcon from "@/components/MenuIcon";
import { MEMBER_DISCOUNT_PERCENT } from "@/lib/config";
import { getImageCropTransform } from "@/lib/image-crop";
import styles from "./kasir.module.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const DRINK_REQUEST_OPTIONS = [
  { label: "Less Sugar", value: "Less Sugar", group: "sugar" },
  { label: "Less Ice", value: "Less Ice", group: "ice" },
  { label: "Extra Sugar", value: "Extra Sugar", group: "sugar" },
  { label: "Extra Ice", value: "Extra Ice", group: "ice" },
  { label: "No Sugar", value: "No Sugar", group: "sugar" },
  { label: "No Ice", value: "No Ice", group: "ice" },
];

function splitRequestNotes(value) {
  return String(value || "").split(" · ").filter(Boolean);
}

function getRequestOptions(item) {
  const category = String(item.category_name || "").toLocaleLowerCase("id-ID");
  const categoryIcon = item.category_icon;

  if (category.includes("coffee") || ["coffee-hot", "coffee-cold", "cup"].includes(categoryIcon)) {
    return {
      label: "Permintaan minuman",
      options: DRINK_REQUEST_OPTIONS,
    };
  }

  if (category.includes("snack") || categoryIcon === "snack") {
    return {
      label: "Tingkat pedas",
      options: [
        { label: "Tidak pedas", value: "Tidak pedas" },
        { label: "Pedas", value: "Pedas" },
      ],
    };
  }

  return null;
}

export default function KasirPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");

  const [cart, setCart] = useState([]); // { product_id, name, price, stock, quantity }
  const [orderType, setOrderType] = useState("dine-in");
  const [buyerType, setBuyerType] = useState("non-member"); // "member" | "non-member"
  const [memberPhone, setMemberPhone] = useState("");
  const [member, setMember] = useState(null);
  const [memberError, setMemberError] = useState("");
  const [findingMember, setFindingMember] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [toast, setToast] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, search]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }

  async function loadProducts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeCategory) params.set("category_id", activeCategory);
    const res = await fetch("/api/products?" + params.toString());
    const data = await res.json();
    setProducts(data);
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      showToast("Produk sedang habis.", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          showToast("Jumlah stok tidak mencukupi.", "error");
          return prev;
        }
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category_name: product.category_name,
          category_icon: product.category_icon,
          quantity: 1,
          request_notes: product.category_icon === "snack" ? "Tidak pedas" : "",
        },
      ];
    });
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product_id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty > i.stock) {
            showToast("Jumlah stok tidak mencukupi.", "error");
            return i;
          }
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function updateItemNote(productId, requestNotes) {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, request_notes: requestNotes } : item
      )
    );
  }

  function updateDrinkPreference(productId, option) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        const currentNotes = splitRequestNotes(item.request_notes);
        const groupValues = DRINK_REQUEST_OPTIONS
          .filter((requestOption) => requestOption.group === option.group)
          .map((requestOption) => requestOption.value);
        const alreadySelected = currentNotes.includes(option.value);
        const otherNotes = currentNotes.filter((note) => !groupValues.includes(note));
        const requestNotes = alreadySelected
          ? otherNotes
          : [...otherNotes, option.value];

        return { ...item, request_notes: requestNotes.join(" · ") };
      })
    );
  }

  function updateSnackPreference(productId, value) {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, request_notes: item.request_notes === value ? "" : value }
          : item
      )
    );
  }

  function handleBarcodeSubmit(e) {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const found = products.find(
      (p) => String(p.id) === code || p.name.toLowerCase() === code.toLowerCase()
    );

    if (!found) {
      showToast("Tidak ada produk dengan kode tersebut.", "error");
    } else {
      addToCart(found);
      showToast(`${found.name} ditambahkan.`);
    }
    setBarcodeInput("");
  }

  async function handleFindMember(e) {
    e.preventDefault();
    setMemberError("");
    setMember(null);

    if (!memberPhone.trim()) return;

    setFindingMember(true);
    try {
      const res = await fetch("/api/members?phone=" + encodeURIComponent(memberPhone.trim()));
      const data = await res.json();
      if (!res.ok) {
        setMemberError(data.message || "Member tidak ditemukan.");
        return;
      }
      setMember(data);
    } catch (error) {
      setMemberError("Tidak bisa mencari member. Periksa koneksi lalu coba lagi.");
    } finally {
      setFindingMember(false);
    }
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart]
  );

  const discount =
    buyerType === "member" && member ? Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100) : 0;
  const total = subtotal - discount;

  const change =
    paymentMethod === "cash" && paidAmount ? Number(paidAmount) - total : 0;

  async function handlePay() {
    if (cart.length === 0) {
      showToast("Keranjang masih kosong.", "error");
      return;
    }
    if (buyerType === "member" && !member) {
      showToast("Cari dan pilih member terlebih dahulu.", "error");
      return;
    }
    if (paymentMethod === "cash" && (!paidAmount || Number(paidAmount) < total)) {
      showToast("Uang pembayaran tidak mencukupi.", "error");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            request_notes: i.request_notes,
          })),
          member_id: buyerType === "member" && member ? member.id : null,
          order_type: orderType,
          payment_method: paymentMethod,
          paid_amount: paymentMethod === "cash" ? Number(paidAmount) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Gagal menyimpan transaksi.", "error");
        setPaying(false);
        return;
      }

      router.push(`/kasir/struk/${data.id}`);
    } catch (err) {
      showToast("Tidak bisa terhubung ke server.", "error");
      setPaying(false);
    }
  }

  return (
    <>
      <KasirTopbar active="kasir" />
      <div className={styles.layout}>
        {/* KIRI: produk */}
        <div>
          <form onSubmit={handleBarcodeSubmit} className={styles.toolbar}>
            <input
              className="input"
              placeholder="Scan barcode / ketik kode / nama produk lalu Enter"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              autoFocus
            />
            <input
              className="input"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 220 }}
            />
          </form>

          <div className={styles.categoryRow}>
            <button
              className={`${styles.categoryBtn} ${!activeCategory ? styles.categoryBtnActive : ""}`}
              onClick={() => setActiveCategory(null)}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`${styles.categoryBtn} ${
                  activeCategory === c.id ? styles.categoryBtnActive : ""
                }`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Tidak ada produk ditemukan.</p>
          ) : (
            <div className={styles.productGrid}>
              {products.map((p) => (
                <button
                  key={p.id}
                  className={styles.productCard}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                >
                  <div className={styles.productIconWrap}>
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={160}
                        height={100}
                        className={styles.productPhoto}
                        style={{ transform: getImageCropTransform(p.image_x, p.image_y, p.image_zoom) }}
                        unoptimized
                      />
                    ) : (
                      <MenuIcon type={p.icon} />
                    )}
                  </div>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productPrice}>{formatRupiah(p.price)}</span>
                  <span className={styles.productStock}>
                    {p.stock <= 0 ? "Habis" : `Stok: ${p.stock}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* KANAN: keranjang & pembayaran */}
        <div className={styles.cartPanel}>
          <h3>Keranjang</h3>

          {cart.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Belum ada produk.</p>
          ) : (
            cart.map((item) => {
              const requestPreference = getRequestOptions(item);
              return (
              <div key={item.product_id} className={styles.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {formatRupiah(item.price)} × {item.quantity} ={" "}
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                  {requestPreference ? (
                    <div className={styles.preferenceField}>
                      <span className={styles.preferenceLabel}>{requestPreference.label}</span>
                      <div className={styles.preferenceOptions}>
                        {requestPreference.options.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            className={`${styles.preferenceButton} ${splitRequestNotes(item.request_notes).includes(option.value) ? styles.preferenceActive : ""}`}
                            aria-pressed={requestPreference.label === "Tingkat pedas"
                              ? item.request_notes === option.value
                              : splitRequestNotes(item.request_notes).includes(option.value)}
                            onClick={() => requestPreference.label === "Tingkat pedas"
                              ? updateSnackPreference(item.product_id, option.value)
                              : updateDrinkPreference(item.product_id, option)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input
                      className={`input ${styles.cartNote}`}
                      aria-label={`Permintaan untuk ${item.name}`}
                      placeholder="Permintaan khusus"
                      maxLength={255}
                      value={item.request_notes || ""}
                      onChange={(event) => updateItemNote(item.product_id, event.target.value)}
                    />
                  )}
                </div>
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => changeQty(item.product_id, -1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button className={styles.qtyBtn} onClick={() => changeQty(item.product_id, 1)}>
                    +
                  </button>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => removeItem(item.product_id)}
                >
                  ✕
                </button>
              </div>
              );
            })
          )}

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Member */}
          <div>
            <div className="field">
              <label>Pembeli</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`btn ${buyerType === "non-member" ? "" : "btn-outline"}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setBuyerType("non-member");
                    setMember(null);
                    setMemberPhone("");
                    setMemberError("");
                  }}
                >
                  Non-Member
                </button>
                <button
                  className={`btn ${buyerType === "member" ? "" : "btn-outline"}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setBuyerType("member");
                    setMember(null);
                    setMemberError("");
                  }}
                >
                  Member
                </button>
              </div>
            </div>

            {buyerType === "member" && (
              <form onSubmit={handleFindMember} className="field">
                <label>Nomor HP Member</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    placeholder="08xxxxxxxxxx"
                    value={memberPhone}
                    onChange={(e) => {
                      setMemberPhone(e.target.value);
                      setMember(null);
                      setMemberError("");
                    }}
                  />
                  <button className="btn btn-outline" disabled={findingMember}>
                    {findingMember ? "Mencari..." : "Cari"}
                  </button>
                </div>
                {member && (
                  <p style={{ color: "var(--success)", fontSize: 13, marginTop: 6 }}>
                    ✓ {member.name} ({member.member_code})
                  </p>
                )}
                {memberError && (
                  <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>
                    {memberError}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className={styles.orderTypeField}>
            <span className={styles.preferenceLabel}>Tipe pesanan</span>
            <div className={styles.orderTypeOptions} role="group" aria-label="Tipe pesanan">
              <button
                type="button"
                className={`${styles.orderTypeButton} ${orderType === "dine-in" ? styles.orderTypeActive : ""}`}
                aria-pressed={orderType === "dine-in"}
                onClick={() => setOrderType("dine-in")}
              >
                Dine In
              </button>
              <button
                type="button"
                className={`${styles.orderTypeButton} ${orderType === "take-away" ? styles.orderTypeActive : ""}`}
                aria-pressed={orderType === "take-away"}
                onClick={() => setOrderType("take-away")}
              >
                Take Away
              </button>
            </div>
          </div>

          {/* Ringkasan */}
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Diskon Member</span>
            <span>{formatRupiah(discount)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          {/* Pembayaran */}
          <div className="field">
            <label>Metode Pembayaran</label>
            <select
              className="select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
              <option value="debit">Debit</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>

          {paymentMethod === "cash" && (
            <div className="field">
              <label>Uang Diterima</label>
              <input
                className="input"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
              />
              {paidAmount && (
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Kembalian:{" "}
                  <b style={{ color: change < 0 ? "var(--danger)" : "var(--success)" }}>
                    {formatRupiah(Math.max(change, 0))}
                  </b>
                </p>
              )}
            </div>
          )}

          <button className="btn btn-block" onClick={handlePay} disabled={paying}>
            {paying ? "Memproses..." : "Bayar"}
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
