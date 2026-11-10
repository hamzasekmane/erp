import "@fontsource-variable/inter";
import "./globals.css";
import Providers from "./providers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Valora | Gestion d'entreprise intelligente",
  description: "Plateforme de gestion moderne pour les entreprises",
  keywords: "ERP, gestion, entreprise, facturation, RH, dashboard",
  authors: [{ name: "Velora Team" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  // maximumScale removed to allow zooming
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr">
      <body className="antialiased bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}