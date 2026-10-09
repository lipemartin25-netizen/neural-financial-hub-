# Skill: api-contract

## Quando Usar
Utilizar ao criar ou alterar qualquer endpoint, payload ou contrato compartilhado entre serviços e clientes (Web e Android).

## Procedimento
1. Atualizar ou definir o esquema OpenAPI em `packages/contracts/openapi.json` (ou `.yaml`).
2. Garantir consistência dos tipos compartilhados com os clientes (TypeScript / Kotlin).
3. Adicionar/executar testes de schema e de regressão para assegurar que alterações não quebrem clientes legados ou gerem desserializações inválidas.
