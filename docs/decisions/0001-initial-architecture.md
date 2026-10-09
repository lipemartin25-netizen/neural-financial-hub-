# ADR 0001: Arquitetura Inicial do Neurafin Hub

- **Data**: 2026-10-09
- **Status**: Aprovado

## Contexto
O projeto foi reconstruído do zero. É necessária uma fundação desacoplada, segura e expansível que atenda aos clientes Web (Next.js/PWA) e Android (Kotlin/Compose), suportando operação online/offline e processamento de documentos com OCR sem gargalos de interface.

## Decisão
1. **API Central Compartilhada**: Desenvolvida com FastAPI (Python), responsável por expor contratos OpenAPI versionados (`/api/v1`), autenticação, lógica financeira e sincronização idempotente.
2. **Separação API vs Worker**: O upload de documentos e as chamadas da API respondem imediatamente; extração de texto e OCR são delegados a processos de workers dedicados para garantir estabilidade e tempos de resposta rápidos.
3. **Contratos como Fonte de Verdade**: Clientes Web e Android compartilham especificações formalizadas na pasta `packages/contracts/`.
4. **Clientes Nativos e Independentes**:
   - Web com Next.js e suporte a PWA com sincronização local.
   - Android com aplicação nativa em Jetpack Compose, Room DB e arquivos em sandbox local do app.
   - O app Android não é WebView.
5. **Sem Open Finance / Sandbox de terceiros**: Lançamentos financeiros são manuais; extrações geram sugestões revisáveis pelo usuário.
