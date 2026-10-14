# Neurafin Hub — Monorepo

> Plataforma financeira pessoal de nível premium com IA, Open Finance, gamificação e PWA.
> Stack: **Next.js 14** · **FastAPI (Python)** · **Supabase** · **Stripe** · **Gemini AI**

---

## Estrutura do Projeto

```
neurafin-hub/
├── src/                        # Frontend Next.js 14 (App Router)
│   ├── app/                    # Páginas e API routes
│   │   ├── (app)/              # Área autenticada (dashboard, transações, etc.)
│   │   ├── (auth)/             # Login / Registro
│   │   ├── api/                # API routes Next.js (Stripe, IA, Pluggy, etc.)
│   │   └── page.tsx            # Landing page pública
│   ├── components/             # Componentes React reutilizáveis
│   ├── hooks/                  # Custom hooks (useDashboard, useTransactions, etc.)
│   ├── lib/                    # Supabase, AI (Gemini), Stripe, Pluggy, utilitários
│   ├── contexts/               # AppContext (tema / i18n)
│   └── types/                  # Tipagens TypeScript globais
├── services/
│   ├── api/                    # Backend FastAPI (Python 3.12)
│   │   └── app/                # Routers: auth, documents, finance, sync
│   └── worker/                 # Pipeline OCR + classificação de documentos
├── database/
│   └── migrations/             # SQL canônico (fonte de verdade para scripts)
├── supabase/
│   └── migrations/             # Migrations sincronizadas com Supabase CLI
├── packages/
│   ├── contracts/openapi.json  # Contrato OpenAPI (shared frontend ↔ backend)
│   └── design-tokens/          # Tokens de design (cores, tipografia)
├── docs/                       # Decisões arquiteturais e relatórios de stage
├── skills/                     # PRDs, guias e auditorias de segurança
└── public/                     # Assets estáticos, PWA manifest, ícones
```

---

## Funcionalidades

| Módulo | Status |
|---|---|
| 🏠 Dashboard com IA Preditiva | ✅ |
| 💸 Transações (manual + import PDF/OFX) | ✅ |
| 🏦 Patrimônio (ativos + passivos) | ✅ |
| 🎯 Metas financeiras | ✅ |
| 💳 Cartões de crédito | ✅ |
| 📊 Orçamentos e limites | ✅ |
| 🔐 Open Finance via Pluggy | ✅ |
| 🤖 Chat IA (Gemini) | ✅ |
| 👨‍👩‍👧 Finanças em família | ✅ |
| 🏆 Gamificação (badges, XP) | ✅ |
| 🧪 WealthLab (calculadoras) | ✅ |
| 📄 Gestão de Documentos (OCR) | ✅ |
| 💰 Boletos (OCR + DDA) | ✅ |
| 💹 Investimentos (recomendações IA) | ✅ |
| 🛡️ Fundo de Emergência | ✅ |
| 📅 Aposentadoria | ✅ |
| 🔔 Push Notifications (PWA) | ✅ |
| 💳 Stripe (assinatura Pro/Família) | ✅ |
| 🌍 i18n (PT-BR / EN) | ✅ |

---

## Setup Rápido

### Pré-requisitos

- Node.js 20+
- Python 3.12+
- Conta Supabase
- Conta Stripe
- Chave Gemini AI

### 1. Variáveis de Ambiente

```bash
cp .env.example .env.local
# Editar .env.local com suas chaves
```

### 2. Frontend (Next.js)

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Build de produção
```

### 3. Backend Python (FastAPI)

```bash
cd services/api
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Database (Supabase)

```bash
# Aplicar todas as migrations via Supabase CLI
supabase db push

# OU manualmente via psql na ordem numérica dos arquivos em database/migrations/
```

---

## Arquitetura

```
Browser / PWA
      │
      ▼
Next.js (Vercel)
├── Frontend React (Tailwind + Framer Motion)
├── API Routes (/api/*) → Supabase / Stripe / Pluggy / Gemini
│
Python FastAPI (Railway / Fly.io)
├── /api/v1/auth
├── /api/v1/documents  ← OCR Pipeline (Tesseract + Gemini Vision)
├── /api/v1/finance    ← Transações manuais, categorias, orçamentos
└── /api/v1/sync       ← Sincronização offline idempotente
      │
      ▼
Supabase (PostgreSQL + Auth + Storage + Realtime)
```

---

## Testes

```bash
# Backend Python (28 testes)
services\api\venv\Scripts\python.exe -m pytest services/api/tests services/worker/tests -v

# Frontend (TypeScript check)
npx tsc --noEmit
```

---

## Planos e Preços

| Plano | Preço | Recursos |
|---|---|---|
| Free | R\$ 0 | Funcionalidades básicas |
| Pro | R\$ 19,90/mês | IA Avançada, Open Finance, relatórios |
| Família | R\$ 39,90/mês | Tudo do Pro + até 5 membros |

---

## Segurança

- Row Level Security (RLS) ativo em todas as tabelas Supabase
- CORS restritivo na API Python
- CSP headers configurados no `next.config.mjs`
- Secrets nunca expostos no bundle do cliente
- Auditorias documentadas em `docs/operations/`

---

## Skills e PRDs

A pasta `skills/` contém PRDs, guias de arquitetura e auditorias de segurança usados durante o desenvolvimento. Consultar antes de implementar novos módulos.
