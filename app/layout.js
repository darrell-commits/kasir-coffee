import "./globals.css";

export const metadata = {
  title: "DR COFFEE | Sistem Kasir",
  description: "Sistem kasir DR COFFEE",
  icons: {
    icon: "/LOGO%20KASIR.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
