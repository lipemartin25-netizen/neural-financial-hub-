import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f8fafc] flex flex-col font-sans">
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
            <p className="text-xs text-slate-400">Plataforma Soberana de Gestão Financeira & Documentos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Operacional & Isolado
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#c9a858]/10 text-[#dfc07a] border border-[#c9a858]/20">
            <span>🛡️</span>
            <span>Zero Dependências de APIs Bancárias Externas (Sem Open Finance / Pluggy)</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent max-w-3xl mx-auto">
            Seus documentos e finanças sob seu controle estrito e privado.
          </h2>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Arquitetura moderna com cofre criptografado privado, OCR assíncrono com pontuações honestas de confiança e suporte completo a PWA offline.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/documents"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a858] to-[#9a7d3a] text-black font-semibold text-sm hover:brightness-110 shadow-lg shadow-[#c9a858]/15 transition-all flex items-center gap-2"
            >
              <span>Acessar Hub de Documentos</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Documentos */}
          <div className="bg-[#12151a] border border-white/10 hover:border-[#c9a858]/50 rounded-2xl p-6 transition-all flex flex-col justify-between group shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1c202a] flex items-center justify-center text-[#dfc07a] border border-white/5 mb-4 group-hover:scale-105 transition-transform">
                📄
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                Módulo de Documentos & OCR
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingestão assíncrona HTTP 202 com extratores nativos multi-formato (PDF com suporte a proteção por senha, CSV estruturado, TXT, imagens). Classificação preditiva com pontuação de confiança e fallback honesto para revisão humana.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/20">
                Ativo & Integrado (Etapa 4)
              </span>
              <Link
                href="/documents"
                className="text-xs font-semibold text-[#dfc07a] hover:underline flex items-center gap-1"
              >
                <span>Abrir Módulo</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card Financeiro */}
          <div className="bg-[#12151a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1c202a] flex items-center justify-center text-emerald-400 border border-white/5 mb-4">
                💰
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                Módulo Financeiro Manual
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gestão financeira determinística: contas manuais, orçamentos mensais, lançamentos de receitas e despesas vinculados a comprovantes do cofre. Geração de relatórios com fórmulas matemáticas auditáveis.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                Roteiro Etapa 6
              </span>
              <span className="text-xs text-slate-500">
                Lançamentos Soberanos
              </span>
            </div>
          </div>
        </section>

        {/* Architecture & Governance Footer */}
        <section className="bg-[#12151a]/60 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-200">
              Arquitetura Neurafin Hub v4.0
            </h4>
            <p className="text-slate-500">
              Frontend Web Next.js PWA + Serviços Backend FastAPI + Worker Assíncrono com extração multi-formato.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#c9a858]">
            <span>FastAPI: Online</span>
            <span>•</span>
            <span>JWT Multi-Tenant: Ativo</span>
          </div>
        </section>
      </main>
    </div>
  );
}
