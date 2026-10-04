import "./globals.css";

export const metadata = {
  title: "Kasir - Kedai Kopi Senja",
  description: "Sistem kasir coffee shop",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
