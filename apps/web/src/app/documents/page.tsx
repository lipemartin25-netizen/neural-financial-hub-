"use client";

import { useState } from "react";
import Image from "next/image";

interface Sector {
  id: string;
  name: string;
  color: string;
  count: number;
}

export default function DocumentHubPage() {
  const [sectors, setSectors] = useState<Sector[]>([
    { id: "1", name: "Financeiro", color: "#10b981", count: 14 },
    { id: "2", name: "Comprovantes", color: "#c9a858", count: 28 },
    { id: "3", name: "Contratos", color: "#3b82f6", count: 6 },
    { id: "4", name: "Saúde", color: "#ec4899", count: 4 },
    { id: "5", name: "Pessoal", color: "#8b5cf6", count: 9 },
    { id: "6", name: "Revisar", color: "#f97316", count: 3 },
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(null);

    // Simula envio assíncrono para o backend
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(`Arquivo "${file.name}" recebido com sucesso! Enfileirado para OCR.`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f8fafc] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#12151a]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#c9a858]/30">
            <Image
              src="/logo.jpg"
              alt="Neurafin Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#dfc07a] via-[#c9a858] to-[#10b981] bg-clip-text text-transparent">
              Neurafin Hub
            </h1>
            <p className="text-xs text-slate-400">Hub Documental & Gestão Segura</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sincronizado & Seguro
          </div>
          <div className="px-3 py-1 rounded-full text-xs bg-[#c9a858]/10 text-[#dfc07a] border border-[#c9a858]/20">
            Armazenamento Privado
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Upload Zone */}
        <section className="bg-gradient-to-b from-[#161920] to-[#12151a] border border-dashed border-[#c9a858]/40 hover:border-[#10b981]/60 transition-all rounded-2xl p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#c9a858]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#1c202a] flex items-center justify-center text-[#dfc07a] border border-white/10 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">
                Arraste comprovantes, notas ou documentos aqui
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Suporte para PDF, JPG, PNG, DOCX e TXT. Processamento assíncrono sem travar a interface.
              </p>
            </div>

            <label className="cursor-pointer mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a858] to-[#9a7d3a] text-black font-semibold text-sm hover:brightness-110 shadow-lg shadow-[#c9a858]/10 transition-all">
              <span>{isUploading ? "Enviando arquivo..." : "Selecionar do Dispositivo"}</span>
              <input
                type="file"
                className="hidden"
                disabled={isUploading}
                onChange={handleSimulatedUpload}
              />
            </label>

            {uploadSuccess && (
              <div className="mt-3 text-sm text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-lg">
                {uploadSuccess}
              </div>
            )}
          </div>
        </section>

        {/* Sectors Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Setores e Organização
              </h2>
              <p className="text-xs text-slate-400">
                Classificação automática com revisão humana prioritária
              </p>
            </div>
            <button className="text-xs text-[#dfc07a] hover:underline font-medium">
              + Novo Setor
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map((sec) => (
              <div
                key={sec.id}
                className="bg-[#12151a] hover:bg-[#161920] border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: sec.color }}
                    />
                    <span className="font-semibold text-sm text-slate-200">
                      {sec.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                    {sec.count} docs
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>Atualizado hoje</span>
                  <span className="text-[#dfc07a] group-hover:translate-x-1 transition-transform">
                    Abrir →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offline & Privacy Governance Banner */}
        <section className="bg-[#12151a] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
              🛡️
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">
                Privacidade & Armazenamento Isolado
              </span>
              Nenhum dado financeiro é integrado a Open Finance ou Pluggy. Os arquivos originais ficam salvos exclusivamente no seu cofre privado.
            </div>
          </div>
          <div className="text-slate-500 font-mono">
            Arquitetura Neurafin v4.0
          </div>
        </section>
      </main>
    </div>
  );
}
