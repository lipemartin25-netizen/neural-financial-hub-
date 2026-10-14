# 🛡️ PRD Backend — MetaFin Nexus v3.0

## 📝 Resumo do Produto

O Backend do MetaFin Nexus v3.0 é o cérebro que permite o Advisor multimodelo (GPT-4o, Claude-3.5-Sonnet, Gemini-1.5-Pro) funcionar com contexto financeiro real do usuário, processar arquivos via Visão (Gemini Flash) e gerar insights proativos (Briefings Diários).

## 📊 Database Schema (Nexus Core)

### `nexus_chat_history`

- Memória persistente por usuário.
- Campos: `id`, `user_id`, `role`, `content`, `model`, `metadata`.
- **Policy (RLS)**: Isolamento total por `user_id`.

### `nexus_insights`

- Motor da Sidebar Proativa.
- Campos: `id`, `user_id`, `type`, `title`, `message`, `relevance_score`, `is_read`.
- Lógica: Regenerado 1x ao dia no primeiro login (Batch).

### `nexus_multimodal_tasks`

- Rastreamento volátil de processamento de Visão.
- Campos: `id`, `user_id`, `file_url`, `task_type`, `status`, `result_json`.

## 📌 Endpoints da API (Vercel Serverless)

### `POST /api/nexus/chat`

- **Auth**: Autenticado via JWT Supabase.
- **In**: `{ message, model, contextFlags }`.
- **Logic**: Injeta dados financeiros (Saldos/Metas) no prompt do sistema.
- **Out**: SSE Stream (Streaming de resposta).

### `POST /api/nexus/vision`

- **Auth**: Autenticado.
- **In**: `multipart/form-data` (PDF/Image).
- **Logic**: Gemini 1.5 Flash (OCR) -> Extrai Texto/Dados -> Injeta no contexto do Advisor.
- **Privacy**: Não persiste o arquivo no storage após o processamento.

## 🤖 Nexus AI Graph (Linear Flow)

1. **Context Loader**: Carrega histórico e perfil do usuário do `profiles`.
2. **Data Enricher**: Busca dados dinâmicos em `transactions` e `wealth_goals`.
3. **LLM Execute**: Seleciona o modelo (Tier Pro) e executa o prompt.
4. **Formatter**: Filtra e sanitiza a resposta para o frontend.

## 🔒 Security & Performance

- **Rate Limit**: Estrito de **8 requisições/min** via header de controle.
- **Auth Proxy**: Chaves LLM em variáveis de ambiente protegidas.
- **Privacy First**: OCR em memória volátil, sem persistência binária.
