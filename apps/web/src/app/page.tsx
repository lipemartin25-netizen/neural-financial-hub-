export default function HomePage() {
  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
          Neurafin Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Plataforma Segura de Gestão Documental, OCR e Finanças
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-semibold mb-2 text-slate-200">
            Módulo de Documentos
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Importação múltipla, extração textual, OCR privado, organização por setores (Financeiro, Pessoal, Saúde, etc.) e revisão humana.
          </p>
          <div className="mt-4 text-xs font-mono text-emerald-400 bg-slate-900/50 p-2 rounded">
            Status: Fase 0 (Bootstrap)
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-semibold mb-2 text-slate-200">
            Módulo Financeiro
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Lançamentos manuais, orçamentos, gráficos e relatórios. Sem conexões bancárias frágeis ou sandboxes externas.
          </p>
          <div className="mt-4 text-xs font-mono text-emerald-400 bg-slate-900/50 p-2 rounded">
            Status: Lançamentos manuais & anexos
          </div>
        </div>
      </section>

      <footer className="text-xs text-slate-500 pt-6 border-t border-slate-800">
        Neurafin Hub — Arquitetura desacoplada (Web PWA + Android Nativo + FastAPI).
      </footer>
    </main>
  );
}
