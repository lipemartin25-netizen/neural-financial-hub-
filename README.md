# Neurafin Hub

Monorepositório do Neurafin Hub — Gestão de documentos, OCR, organização inteligente e finanças pessoais (Web PWA + Android nativo + FastAPI).

## Estrutura do Projeto
- `apps/web`: Frontend Next.js (TypeScript, PWA, Tailwind CSS).
- `apps/android`: Aplicativo nativo Android (Kotlin, Jetpack Compose, Room).
- `services/api`: Backend FastAPI (Python, contratos OpenAPI, autenticação, finanças e sync).
- `services/worker`: Processamento assíncrono (OCR, extração e relatórios).
- `packages/contracts`: Especificações OpenAPI e esquemas compartilhados.
- `packages/classification-rules`: Regras de classificação de documentos versionadas.
- `packages/design-tokens`: Tokens de identidade visual compartilhados.
- `database/`: Migrações, políticas RLS e sementes de desenvolvimento.
- `docs/`: Documentação de produto, arquitetura, segurança, jurídico e decisões.
- `.agents/`: Papéis, skills e tarefas dos agentes de IA.

## Requisitos de Desenvolvimento
- Node.js >= 20.x e npm
- Python >= 3.11
- Android Studio / JDK 17+ / Android SDK (para compilação do app móvel)

## Execução Rápida dos Módulos

### API (FastAPI)
```bash
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Acesse a documentação interativa em: `http://localhost:8000/docs`

### Web (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
Acesse em: `http://localhost:3000`

### Android
Abra o diretório `apps/android` no Android Studio ou compile via linha de comando:
```bash
cd apps/android
./gradlew test
```

## Estado Real do Projeto
- Fase 0 (Fundação e Esqueletos) inicializada.
- Consulte `docs/decisions/` e `AGENTS.md` para regras de governança e desenvolvimento.
