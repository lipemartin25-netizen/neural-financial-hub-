import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neurafin Hub",
  description: "Gestão inteligente de documentos, OCR e finanças pessoais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
