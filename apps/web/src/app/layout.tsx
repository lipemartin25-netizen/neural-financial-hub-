import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neurafin Hub — Gestão Documental & OCR Privado",
  description: "Plataforma segura e independente para armazenamento privado, OCR inteligente e finanças pessoais.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0b0d10] text-[#f8fafc] min-h-screen antialiased selection:bg-[#c9a858]/30 selection:text-[#dfc07a]">
        {children}
      </body>
    </html>
  );
}
