// Ikon SVG sederhana untuk tiap jenis menu, dipakai sebagai "gambar"
// produk supaya tidak bergantung pada file foto/upload.
// key: coffee-hot, coffee-cold, cup, croissant, snack

export default function MenuIcon({ type = "cup", size = 56 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (type === "coffee-hot") {
    return (
      <svg {...common}>
        <path d="M14 26h32v16a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12V26z" fill="#a9744f" />
        <path d="M46 30h4a6 6 0 0 1 0 12h-4v-4h4a2 2 0 0 0 0-4h-4v-4z" fill="#a9744f" />
        <rect x="14" y="22" width="32" height="6" rx="2" fill="#8a5a3b" />
        <path d="M22 12c-2 3 2 4 0 8" stroke="#c99a6f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M32 12c-2 3 2 4 0 8" stroke="#c99a6f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M42 12c-2 3 2 4 0 8" stroke="#c99a6f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "coffee-cold") {
    return (
      <svg {...common}>
        <path d="M18 18h28l-3 34a4 4 0 0 1-4 3.6H25a4 4 0 0 1-4-3.6L18 18z" fill="#c7a17a" />
        <rect x="15" y="13" width="34" height="6" rx="2" fill="#7a4b2e" />
        <path d="M24 24l2 20M32 24v20M40 24l-2 20" stroke="#5c3b25" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "croissant") {
    return (
      <svg {...common}>
        <path
          d="M10 40c6-18 20-24 30-20 10 4 14 16 8 24-4 5-10 4-12 0-3 5-9 6-13 2-4 4-10 3-13-6z"
          fill="#d99a4e"
        />
        <path d="M18 34c4-3 8-3 10 0M28 38c4-3 8-3 10 0" stroke="#a5641e" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "snack") {
    return (
      <svg {...common}>
        <path d="M16 24h24l-4 24a4 4 0 0 1-4 3.4h-8a4 4 0 0 1-4-3.4L16 24z" fill="#e3b04b" />
        <path d="M14 18h28l-2 6H16l-2-6z" fill="#c98a2f" />
        <rect x="20" y="28" width="4" height="14" rx="2" fill="#c98a2f" />
        <rect x="30" y="28" width="4" height="14" rx="2" fill="#c98a2f" />
      </svg>
    );
  }

  // default: cup (non-coffee: matcha, chocolate, tea)
  return (
    <svg {...common}>
      <path d="M16 24h28v18a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10V24z" fill="#8fae6b" />
      <path d="M44 28h4a5 5 0 0 1 0 10h-4v-4h4a1 1 0 0 0 0-2h-4v-4z" fill="#8fae6b" />
      <rect x="16" y="20" width="28" height="6" rx="2" fill="#6c8f4d" />
    </svg>
  );
}
