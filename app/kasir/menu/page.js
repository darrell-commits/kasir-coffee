"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import KasirTopbar from "@/components/KasirTopbar";
import MenuIcon from "@/components/MenuIcon";
import { getImageCropTransform } from "@/lib/image-crop";
import { formatPriceInput, parsePriceInput } from "@/lib/price-format";
import styles from "./menu.module.css";

const EMPTY_FORM = {
  id: null,
  name: "",
  category_id: "",
  price: "",
  stock: "",
  description: "",
  icon: "coffee-hot",
  image_x: 50,
  image_y: 50,
  image_zoom: 1,
};

const ICON_OPTIONS = ["coffee-hot", "coffee-cold", "cup", "croissant", "snack"];

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

async function readApiResponse(response, fallbackMessage) {
  const body = await response.text();
  let result;

  try {
    result = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(
      `Respons server tidak valid (HTTP ${response.status}). Periksa terminal localhost.`
    );
  }

  if (!response.ok) {
    throw new Error(result?.message || `${fallbackMessage} (HTTP ${response.status}).`);
  }
  if (!result || typeof result !== "object") {
    throw new Error(
      `Server tidak mengirim data yang diharapkan (HTTP ${response.status}).`
    );
  }

  return result;
}

export default function KasirMenuPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const imageDrag = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview(form.image_url || "");
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo, form.image_url]);

  async function loadData() {
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (!productResponse.ok || !categoryResponse.ok) {
        throw new Error("Gagal memuat data menu.");
      }
      setProducts(await productResponse.json());
      setCategories(await categoryResponse.json());
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data menu.");
    }
  }

  function openAddForm() {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || "" });
    setPhoto(null);
    setError("");
    setIsOpen(true);
  }

  function openEditForm(product) {
    setForm({
      id: product.id,
      name: product.name,
      category_id: product.category_id,
      price: formatPriceInput(product.price),
      stock: product.stock,
      description: product.description || "",
      icon: product.icon || "cup",
      image_url: product.image_url || "",
      image_x: product.image_x ?? 50,
      image_y: product.image_y ?? 50,
      image_zoom: Number(product.image_zoom || 1),
    });
    setPhoto(null);
    setError("");
    setIsOpen(true);
  }

  function startImageDrag(event) {
    if (!preview) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const zoom = Math.max(Number(form.image_zoom), 1.5);
    imageDrag.current = {
      startX: event.clientX,
      startY: event.clientY,
      imageX: Number(form.image_x),
      imageY: Number(form.image_y),
      width: event.currentTarget.clientWidth,
      height: event.currentTarget.clientHeight,
    };
    setForm((current) => ({ ...current, image_zoom: zoom }));
  }

  function moveImage(event) {
    const drag = imageDrag.current;
    if (!drag) return;

    setForm((current) => {
      const zoom = Math.max(Number(current.image_zoom), 1.5);
      const travel = zoom - 1;
      const imageX = drag.imageX - ((event.clientX - drag.startX) / drag.width) * (100 / travel);
      const imageY = drag.imageY - ((event.clientY - drag.startY) / drag.height) * (100 / travel);

      return {
        ...current,
        image_x: Math.round(Math.min(100, Math.max(0, imageX))),
        image_y: Math.round(Math.min(100, Math.max(0, imageY))),
      };
    });
  }

  function endImageDrag(event) {
    imageDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        price: parsePriceInput(form.price),
        stock: Number(form.stock),
        description: form.description.trim(),
        icon: form.icon,
        image_x: Number(form.image_x),
        image_y: Number(form.image_y),
        image_zoom: Number(form.image_zoom),
      };
      const response = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse(response, "Gagal menyimpan menu.");

      const productId = form.id || result.id;
      if (!form.id) {
        setForm((current) => ({ ...current, id: productId }));
      }
      if (photo) {
        const imageForm = new FormData();
        imageForm.append("image", photo);
        const imageResponse = await fetch(`/api/products/${productId}/image`, {
          method: "POST",
          body: imageForm,
        });
        await readApiResponse(imageResponse, "Gagal mengunggah foto.");
      }

      setIsOpen(false);
      setPhoto(null);
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.category_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <KasirTopbar active="menu" />
      <main className={styles.page}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>KATALOG PRODUK</p>
            <h1>Kelola Menu</h1>
          </div>
          <button className="btn" type="button" onClick={openAddForm}>
            + Tambah Menu
          </button>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchLabel} htmlFor="menu-search">Cari menu</label>
          <input
            id="menu-search"
            className={`input ${styles.search}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama menu atau kategori"
          />
          <span className={styles.count}>{visibleProducts.length} menu</span>
        </div>

        {error && !isOpen && <p className={styles.notice} role="alert">{error}</p>}

        {visibleProducts.length ? (
          <div className={styles.grid}>
            {visibleProducts.map((product) => (
              <article className={styles.product} key={product.id}>
                <div className={styles.photo}>
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={480}
                      height={320}
                      className={styles.productImage}
                      style={{ transform: getImageCropTransform(product.image_x, product.image_y, product.image_zoom) }}
                      unoptimized
                    />
                  ) : (
                    <MenuIcon type={product.icon} size={54} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.category}>{product.category_name}</span>
                  <h2>{product.name}</h2>
                  <div className={styles.details}>
                    <strong>{formatRupiah(product.price)}</strong>
                    <span>Stok {product.stock}</span>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-outline ${styles.editButton}`}
                    onClick={() => openEditForm(product)}
                  >
                    Edit menu
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Tidak ada menu yang cocok dengan pencarian.</div>
        )}
      </main>

      {isOpen && (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setIsOpen(false);
        }}>
          <form className={styles.modal} onSubmit={handleSave}>
            <div className={styles.modalHeading}>
              <div>
                <p className={styles.eyebrow}>{form.id ? "PERBARUI PRODUK" : "PRODUK BARU"}</p>
                <h2>{form.id ? "Edit menu" : "Tambah menu"}</h2>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Tutup form"
                onClick={() => setIsOpen(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className={styles.formBody}>
              <div className={styles.photoField}>
                <div
                  className={`${styles.preview} ${preview ? styles.draggable : ""}`}
                  aria-label={preview ? "Pratinjau foto, geser untuk mengatur posisi" : undefined}
                  onPointerDown={startImageDrag}
                  onPointerMove={moveImage}
                  onPointerUp={endImageDrag}
                  onPointerCancel={endImageDrag}
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Pratinjau foto menu"
                      width={360}
                      height={256}
                      style={{ transform: getImageCropTransform(form.image_x, form.image_y, form.image_zoom) }}
                      unoptimized
                    />
                  ) : (
                    <MenuIcon type={form.icon} size={42} />
                  )}
                </div>
                <label className={styles.fileLabel} htmlFor="product-photo">
                  Pilih foto
                  <input
                    id="product-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setPhoto(event.target.files?.[0] || null)}
                  />
                </label>
                <span className={styles.helpText}>JPG, PNG, WebP · maks. 4 MB</span>
              </div>

              {preview && (
                <div className={styles.adjustments}>
                  <label className={styles.adjustment}>
                    <span>Zoom <strong>{Math.round(Number(form.image_zoom) * 100)}%</strong></span>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={form.image_zoom}
                      onChange={(event) => setForm({ ...form, image_zoom: event.target.value })}
                    />
                  </label>
                  <button
                    className={styles.resetAdjustment}
                    type="button"
                    onClick={() => setForm({ ...form, image_x: 50, image_y: 50, image_zoom: 1 })}
                  >
                    Reset framing
                  </button>
                </div>
              )}

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Nama menu</span>
                  <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={100} />
                </label>
                <label className={styles.field}>
                  <span>Kategori</span>
                  <select className="select" value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} required>
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Harga (Rp)</span>
                  <input className="input" type="text" inputMode="numeric" value={form.price} onChange={(event) => setForm({ ...form, price: formatPriceInput(event.target.value) })} required />
                </label>
                <label className={styles.field}>
                  <span>Stok</span>
                  <input className="input" type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
                </label>
                <label className={styles.field}>
                  <span>Ikon cadangan</span>
                  <select className="select" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>
                    {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Deskripsi</span>
                  <input className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={255} />
                </label>
              </div>

              {error && <p className={styles.formError} role="alert">{error}</p>}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)} disabled={saving}>Batal</button>
              <button className="btn" disabled={saving}>{saving ? "Menyimpan..." : "Simpan menu"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}