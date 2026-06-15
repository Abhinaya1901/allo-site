import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allo Store — Inventory Reservations",
  description: "Multi-warehouse inventory reservation system",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('allo-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}