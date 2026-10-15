"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DocumentsApiClient,
  Sector,
  DocumentItem,
  DocumentStatus,
} from "../../lib/api/documents";
import {
  OfflineSyncManager,
  OfflineQueueItem,
} from "../../lib/offline/sync-manager";

const DEMO_ACCOUNTS = [
  { label: "Usuário A (Titular Principal)", email: "usuario.a@neurafin.com" },
  { label: "Usuário B (Conta Isolada)", email: "usuario.b@neurafin.com" },
];

export default function DocumentHubPage() {
  const fileInputId = useId();
  // Estado de Autenticação e Multi-Tenant
  const [selectedEmail, setSelectedEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<DocumentsApiClient | null>(null);

  // Estados de Dados da API
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de Upload
  const [uploadSectorId, setUploadSectorId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    description: string;
  } | null>(null);

  // Estados do Worker Assíncrono
  const [isProcessingJobs, setIsProcessingJobs] = useState(false);
  const [workerFeedback, setWorkerFeedback] = useState<string | null>(null);

  // Estados de Conexão Offline e Fila PWA
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Monitoramento de rede
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setPendingQueue(OfflineSyncManager.getPendingQueue());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Autenticação ao alterar usuário
  useEffect(() => {
    let isCancelled = false;

    async function authenticate() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const authData = await DocumentsApiClient.requestAuthToken(selectedEmail);
        if (isCancelled) return;
        setToken(authData.access_token);
        const newClient = new DocumentsApiClient(authData.access_token);
        setClient(newClient);
      } catch (err: any) {
        if (isCancelled) return;
        setErrorMsg(`Falha ao autenticar com a API: ${err.message}. Verifique se o servidor backend está em execução.`);
        setLoading(false);
      }
    }

    authenticate();
    return () => {
      isCancelled = true;
    };
  }, [selectedEmail]);

  // Carregamento de setores e documentos
  const refreshData = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedSectors, fetchedDocs] = await Promise.all([
        client.getSectors(),
        client.getDocuments(selectedSectorFilter || undefined),
      ]);
      setSectors(fetchedSectors);
      setDocuments(fetchedDocs);
      setPendingQueue(OfflineSyncManager.getPendingQueue());
    } catch (err: any) {
      setErrorMsg(`Erro ao sincronizar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [client, selectedSectorFilter]);

  useEffect(() => {
    if (client) {
      refreshData();
    }
  }, [client, refreshData]);

  // Manipulação de Upload com Honestidade Técnica
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação estrita de tamanho local (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadFeedback({
        type: "error",
        title: "Limite de Tamanho Excedido",
        description: `O arquivo possui ${(file.size / (1024 * 1024)).toFixed(1)}MB. O limite máximo permitido é 25MB.`,
      });
      e.target.value = "";
      return;
    }

    if (file.size === 0) {
      setUploadFeedback({
        type: "error",
        title: "Arquivo Inválido",
        description: "Arquivos vazios de 0 bytes não são aceitos para processamento.",
      });
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    // Se estiver offline ou sem cliente, armazena na fila offline PWA
    if (!navigator.onLine || !client) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          OfflineSyncManager.enqueue("upload_document", {
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || "application/octet-stream",
            sectorId: uploadSectorId || undefined,
          });
          setPendingQueue(OfflineSyncManager.getPendingQueue());
          setIsUploading(false);
          setUploadFeedback({
            type: "info",
            title: "Salvo na Fila Offline (PWA)",
            description: `Você está sem conexão de rede. "${file.name}" foi enfileirado localmente e será enviado quando a conexão retornar.`,
          });
          e.target.value = "";
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        setIsUploading(false);
        setUploadFeedback({
          type: "error",
          title: "Falha no Enfileiramento Offline",
          description: err.message,
        });
      }
      return;
    }

    // Envio real para a API FastAPI
    try {
      const doc = await client.uploadDocument(file, uploadSectorId || undefined);
      setIsUploading(false);
      setUploadFeedback({
        type: "success",
        title: "Documento Recebido (HTTP 202 Accepted)",
        description: `Arquivo "${doc.file_name}" persistido no cofre privado e enfileirado para o pipeline assíncrono. O processamento ocorrerá em segundo plano.`,
      });
      e.target.value = "";
      refreshData();
    } catch (err: any) {
      setIsUploading(false);
      setUploadFeedback({
        type: "error",
        title: "Falha na Transmissão",
        description: err.message || "Erro desconhecido ao enviar arquivo.",
      });
      e.target.value = "";
    }
  };

  // Disparo manual do ciclo do Worker
  const handleRunWorkerCycle = async () => {
    if (!client) return;
    setIsProcessingJobs(true);
    setWorkerFeedback(null);
    try {
      const res = await client.processPendingJobs();
      setWorkerFeedback(
        res.processed_jobs > 0
          ? `Worker concluiu o ciclo: ${res.processed_jobs} job(s) analisado(s) com regras e pontuações de confiança atualizadas.`
          : "Nenhum job pendente na fila assíncrona."
      );
      await refreshData();
    } catch (err: any) {
      setWorkerFeedback(`Falha ao executar ciclo do worker: ${err.message}`);
    } finally {
      setIsProcessingJobs(false);
    }
  };

  // Reatribuição de setor de documento
  const handleUpdateSector = async (docId: string, newSectorId: string) => {
    if (!client) return;
    try {
      await client.updateDocumentSector(docId, newSectorId);
      await refreshData();
    } catch (err: any) {
      alert(`Falha ao alterar setor: ${err.message}`);
    }
  };

  // Download seguro de arquivo binário original
  const handleDownloadOriginal = async (docId: string) => {
    if (!client) return;
    try {
      const { blob, fileName } = await client.downloadDocumentBlob(docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Falha ao baixar arquivo: ${err.message}`);
    }
  };

  // Sincronização manual da fila offline PWA
  const handleSyncOfflineQueue = async () => {
    if (!client) return;
    setIsSyncingOffline(true);
    try {
      const result = await OfflineSyncManager.syncQueue(client);
      setPendingQueue(OfflineSyncManager.getPendingQueue());
      setWorkerFeedback(
        `Sincronização offline: ${result.synced} itens enviados com sucesso, ${result.failed} falhas.`
      );
      await refreshData();
    } catch (err: any) {
      alert(`Erro na sincronização da fila offline: ${err.message}`);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Formatação de status e cores de design tokens
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "ready":
        return {
          label: "Classificado & Pronto",
          classes: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
        };
      case "review_required":
        return {
          label: "Revisão Necessária",
          classes: "bg-orange-950/60 text-orange-400 border-orange-500/30",
        };
      case "read_unavailable":
        return {
          label: "Leitura Indisponível",
          classes: "bg-red-950/60 text-red-400 border-red-500/30",
        };
      case "pending_processing":
        return {
          label: "Enfileirado p/ OCR",
          classes: "bg-amber-950/60 text-amber-400 border-amber-500/30",
        };
      case "processing":
        return {
          label: "Processando",
          classes: "bg-blue-950/60 text-blue-400 border-blue-500/30 animate-pulse",
        };
      case "error":
        return {
          label: "Erro no Pipeline",
          classes: "bg-rose-950/60 text-rose-400 border-rose-500/30",
        };
      default:
        return {
          label: "Recebido",
          classes: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f8fafc] flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151a]">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#c9a858]/30 flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt="Neurafin Logo"
              fill
              className="object-cover"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#dfc07a] via-[#c9a858] to-[#10b981] bg-clip-text text-transparent hover:opacity-90">
                Neurafin Hub
              </Link>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#c9a858]/10 text-[#dfc07a] border border-[#c9a858]/20">
                Web PWA v4.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Hub Documental & Cofre Privado Isolado</p>
          </div>
        </div>

        {/* Tenant Selector & Connection Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tenant Switcher */}
          <div className="flex items-center gap-2 bg-[#161920] border border-white/10 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 text-[11px]">Conta Ativa:</span>
            <select
              aria-label="Conta Ativa"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              {DEMO_ACCOUNTS.map((acc) => (
                <option key={acc.email} value={acc.email} className="bg-[#161920] text-slate-200">
                  {acc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Online/Offline Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
              isOnline
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                : "bg-amber-950/50 text-amber-400 border-amber-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {isOnline ? "Online (Conectado)" : "Offline (Modo Local)"}
          </div>

          {/* Pending Offline Queue Indicator */}
          {pendingQueue.length > 0 && (
            <button
              onClick={handleSyncOfflineQueue}
              disabled={isSyncingOffline || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
              title="Clique para sincronizar fila offline com o servidor"
            >
              <span>🔄</span>
              <span>{pendingQueue.length} na fila offline</span>
              {isSyncingOffline && <span className="animate-spin text-[10px]">⏳</span>}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Banner de Erro Geral se API cair */}
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 text-sm text-red-200 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-100">Falha de Comunicação com a API</p>
                <p className="text-xs text-red-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-xs rounded font-medium border border-red-500/30"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Upload Zone & Worker Control */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Dropzone */}
          <div className="lg:col-span-2 bg-gradient-to-b from-[#161920] to-[#12151a] border border-dashed border-[#c9a858]/40 hover:border-[#10b981]/60 transition-all rounded-2xl p-6 md:p-8 text-center relative overflow-hidden group">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1c202a] flex items-center justify-center text-[#dfc07a] border border-white/10 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-lg text-slate-100">
                  Ingestão de Comprovantes, Faturas e Contratos
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  Suporte nativo para PDF, TXT, CSV, DOCX e imagens. O arquivo original é salvo no seu cofre criptografado privado com ingestão assíncrona.
                </p>
              </div>

              {/* Setor Alvo Opcional */}
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-slate-400">Classificação Prévia (Opcional):</span>
                <select
                  aria-label="Setor de destino"
                  value={uploadSectorId}
                  onChange={(e) => setUploadSectorId(e.target.value)}
                  className="bg-[#1c202a] text-slate-200 border border-white/10 px-2.5 py-1 rounded focus:outline-none focus:border-[#c9a858]"
                >
                  <option value="">Deixar para o Classificador Automático</option>
                  {sectors.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão de Arquivo */}
              <label
                htmlFor={fileInputId}
                className="cursor-pointer mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a858] to-[#9a7d3a] text-black font-semibold text-sm hover:brightness-110 shadow-lg shadow-[#c9a858]/10 transition-all"
              >
                <span>{isUploading ? "Gravando Cópia Privada..." : "Selecionar do Dispositivo"}</span>
                <input
                  id={fileInputId}
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
              </label>

              {/* Feedback Honesto de Upload */}
              {uploadFeedback && (
                <div
                  className={`mt-4 w-full max-w-lg text-left text-xs p-3.5 rounded-xl border ${
                    uploadFeedback.type === "success"
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                      : uploadFeedback.type === "error"
                      ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                      : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                  }`}
                >
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{uploadFeedback.type === "success" ? "✓" : uploadFeedback.type === "error" ? "✕" : "ℹ"}</span>
                    <span>{uploadFeedback.title}</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{uploadFeedback.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Painel do Pipeline Assíncrono */}
          <div className="bg-[#12151a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Pipeline de OCR & Worker</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Desacoplado
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                No Neurafin Hub, uploads respondem <strong>HTTP 202</strong> imediatamente para manter a interface ágil. O extrator textual e o classificador de confiança executam de forma assíncrona no worker.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-[#161920] border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total de Documentos:</span>
                  <span className="font-mono font-semibold text-[#dfc07a]">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Aguardando Processamento:</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {documents.filter((d) => d.status === "pending_processing").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Requerem Revisão:</span>
                  <span className="font-mono font-semibold text-orange-400">
                    {documents.filter((d) => d.status === "review_required").length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {workerFeedback && (
                <div className="text-xs text-slate-300 bg-[#1c202a] p-2.5 rounded-lg border border-white/10 mb-3">
                  {workerFeedback}
                </div>
              )}

              <button
                onClick={handleRunWorkerCycle}
                disabled={isProcessingJobs}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1c202a] hover:bg-[#252b38] text-slate-200 text-xs font-semibold border border-white/10 transition-colors shadow-sm"
              >
                <span>{isProcessingJobs ? "Processando Jobs da Fila..." : "Executar Ciclo do Worker Agora"}</span>
                {isProcessingJobs ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : (
                  <span>⚡</span>
                )}
              </button>
            </div>
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
                Filtre os documentos cadastrados ou visualize os setores configurados
              </p>
            </div>
            {selectedSectorFilter && (
              <button
                onClick={() => setSelectedSectorFilter(null)}
                className="text-xs text-[#dfc07a] hover:underline"
              >
                Limpar Filtro ({sectors.find((s) => s.id === selectedSectorFilter)?.name})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {sectors.map((sec) => {
              const count = documents.filter((d) => d.sector_id === sec.id).length;
              const isSelected = selectedSectorFilter === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectorFilter(isSelected ? null : sec.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#1c202a] border-[#c9a858] shadow-md shadow-[#c9a858]/10"
                      : "bg-[#12151a] hover:bg-[#161920] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sec.color }}
                    />
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {count}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-xs text-slate-200 block truncate">
                      {sec.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Documents Listing Table */}
        <section className="bg-[#12151a] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Documentos no Cofre
              </h3>
              <p className="text-xs text-slate-400">
                {documents.length} arquivo(s) registrado(s) no cofre deste usuário
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <span>Atualizar</span>
              {loading && <span className="animate-spin text-[10px]">⏳</span>}
            </button>
          </div>

          {loading && documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Carregando documentos do cofre privado...
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-2xl">📂</span>
              <p className="text-sm font-medium text-slate-300">Nenhum documento neste setor</p>
              <p className="text-xs text-slate-500">
                Envie um arquivo pelo formulário acima para testar o pipeline assíncrono.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-3">Arquivo</th>
                    <th className="py-3 px-3">Tamanho</th>
                    <th className="py-3 px-3">Status do Pipeline</th>
                    <th className="py-3 px-3">Confiança OCR</th>
                    <th className="py-3 px-3">Setor Atribuído</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => {
                    const badge = getStatusBadge(doc.status);
                    const currentSector = sectors.find((s) => s.id === doc.sector_id);
                    const suggestedSector = sectors.find((s) => s.id === doc.suggested_sector_id);

                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-3 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>📄</span>
                            <span className="max-w-[200px] truncate" title={doc.file_name}>
                              {doc.file_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono">
                          {doc.confidence_score > 0 ? (
                            <span
                              className={
                                doc.confidence_score >= 0.6
                                  ? "text-emerald-400"
                                  : "text-orange-400"
                              }
                            >
                              {(doc.confidence_score * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <select
                            aria-label={`Alterar setor de ${doc.file_name}`}
                            value={doc.sector_id || ""}
                            onChange={(e) => handleUpdateSector(doc.id, e.target.value)}
                            className="bg-[#161920] text-slate-200 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#c9a858]"
                          >
                            <option value="">Não definido</option>
                            {sectors.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {suggestedSector && doc.sector_id !== suggestedSector.id && (
                            <span className="block text-[10px] text-amber-400 mt-1">
                              Sugestão OCR: {suggestedSector.name}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleDownloadOriginal(doc.id)}
                            className="px-2.5 py-1 rounded bg-[#1c202a] hover:bg-[#252b38] text-[#dfc07a] border border-[#c9a858]/30 hover:border-[#c9a858]/60 transition text-xs font-medium"
                            title="Baixar binário original do cofre isolado"
                          >
                            Baixar Original
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Offline & Privacy Governance Banner */}
        <section className="bg-[#12151a] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
              🛡️
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">
                Privacidade & Armazenamento Isolado
              </span>
              Nenhum dado financeiro ou documento é integrado a serviços Open Finance de terceiros (Pluggy ou agregadores). Seus arquivos originais são protegidos em cofre criptografado com acesso estritamente restrito à sua identidade.
            </div>
          </div>
          <div className="text-slate-500 font-mono text-[11px] whitespace-nowrap">
            Neurafin Hub PWA v4.0
          </div>
        </section>
      </main>
    </div>
  );
}
