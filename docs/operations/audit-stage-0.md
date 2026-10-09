# Registro de Auditoria Técnica — Etapa 0

**Data**: 2026-10-09  
**Responsáveis**: PM, Arquiteto de Software, DevSecOps e QA

---

## 1. Estado do Git e Relação com o Repositório Remoto
- **Branch local ativa**: `master`.
- **Árvore de trabalho**: Limpa (`nothing to commit, working tree clean`).
- **Remoto configurado**: `origin` -> `https://github.com/lipemartin25-netizen/neural-financial-hub-.git`.
- **Relação de Histórico**:
  - Remoto (`origin/main`): Contém o projeto legado (último commit `bf8b2f3 Fix: improve Pluggy sync robustness...`).
  - Local (`master`): Monorepositório reestruturado com raiz independente (3 commits locais).
  - Verificação de ancestralidade (`git merge-base master origin/main`): Falhou com código 1. **Os históricos são independentes (unrelated histories).**
  - **Decisão DevSecOps**: Fica expressamente vedado qualquer `push --force` na branch `main` remota para não destruir o histórico legado. Qualquer publicação remota futura deverá ocorrer em branch separada (ex.: `refactor/monorepo-v4`).

---

## 2. Auditoria dos Commits Locais
1. **`e61ad7a`** (`feat(bootstrap): inicializacao do monorepositorio Neurafin Hub (Fase 0)`):
   - Adicionou 46 arquivos: AGENTS.md, README.md, .env.example, workflows do GitHub Actions, papéis de agentes (.agents/roles/), skills da Fase 0 (.agents/skills/), esqueletos de FastAPI (`services/api`), Next.js (`apps/web`) e Android Compose (`apps/android`).
2. **`b9c7d03`** (`feat(core): incorporar schemas legados, modulo documental privado e classificador assincrono`):
   - Adicionou 17 arquivos: 13 migrações herdadas do projeto anterior em `database/migrations/`, a nova migração de documentos e jobs `20261009_documents_and_jobs_module.sql`, esquemas Pydantic `schemas.py`, engine de classificação por regras versionadas e testes unitários do classificador.
3. **`df67c92`** (`feat(design-and-docs): artes visuais, design tokens, pagina documental e endpoints de upload assincrono`):
   - Adicionou 8 arquivos: `logo.jpg`, `apps/web/src/app/documents/page.tsx`, `packages/design-tokens/tokens.json`, router de documentos com upload assíncrono em `services/api/app/documents/router.py` e testes com `python-multipart`.

---

## 3. Retificação da Identidade Visual
- **Arquivo**: `apps/web/public/logo.jpg`.
- **Formato real**: Assinatura binária `FF D8 FF E0` (JPEG/raster).
- **Correção técnica**: O relatório anterior citou incorretamente a arte como "vetorial". A imagem atual é um arquivo rasterizado (JPEG de alta resolução). Para uso escalável sem perda, deve-se manter o JPEG para prévia e providenciar um SVG legítimo quando requerido.

---

## 4. Inventário de Funcionalidades e Código
- **Pluggy / Open Finance**: Presente nas migrações SQL herdadas (`008_sprint8.sql`, `010_pluggy_integration.sql`). **Status**: Inativo no monorepositório novo. Não há chamadas de SDK, nem dependências instaladas na API FastAPI ou Web atual. As tabelas herdadas serão mantidas para preservação de dados legados, mas isoladas do fluxo de execução.
- **Capacitor**: Presente apenas no repositório remoto legado. No monorepositório atual, o módulo móvel é 100% nativo em `apps/android` (Kotlin/Compose/Gradle).
- **Módulo Documental e Upload**:
  - O endpoint `POST /api/v1/documents/upload` atualmente simula recebimento em memória e retorna HTTP 202 com `pending_processing`.
  - **Evidência honesta**: Ainda não há persistência em disco seguro nem worker em processo separado consumindo a fila `processing_jobs`. Trata-se de esqueleto de rota, a ser implementado concretamente na Etapa 3.

---

## 5. Mapa de Migrações SQL e Dependências
- **Migrações herdadas**:
  - `001_complete_schema.sql` até `recurring_transactions.sql`: Requerem PostgreSQL com extensões `uuid-ossp`, `pgcrypto`, `pg_trgm` e esquema `auth.users` (Supabase).
- **Nova migração**:
  - `20261009_documents_and_jobs_module.sql`: Cria `sectors`, `documents`, `document_versions`, `extracted_content`, `document_tags`, `processing_jobs` e `sync_operations`, com RLS habilitado e políticas por `auth.uid()`.
- **Risco identificado**: As migrações dependem de funções e tabelas do ecossistema Supabase (`auth.users`, `auth.uid()`). A validação em banco de testes exigirá emulação do esquema `auth` ou instância local Supabase/PostgreSQL configurada.

---

## 6. Lista Objetiva de Bloqueios no Ambiente Local
1. **Ambiente Android**: JDK 17 e ferramentas do SDK/Gradle não estão no PATH do Windows (`java` e `gradlew` não reconhecidos). Compilação móvel só pode ser auditada via CI do GitHub Actions (`.github/workflows/android.yml`).
2. **Banco de Dados Real**: O PostgreSQL/Supabase ainda não está rodando localmente; a API FastAPI atualmente utiliza armazenamento simulado para validação rápida de rotas.
