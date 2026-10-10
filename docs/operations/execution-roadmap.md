# Roteiro de Execução e Auditoria — Neurafin Hub

Este documento é a diretriz oficial para a reconstrução e evolução do Neurafin Hub.
Nenhum item deve ser marcado como concluído sem evidência empírica verificável (saída de comandos, testes em terminal, builds de código e logs).

---

## 1. Diretrizes de Execução
1. **Foco e Escopo Restrito**: Trabalhar apenas na etapa ativa e arquivos estritamente necessários.
2. **Evidência e Honestidade Técnica**: Testes de fumaça não comprovam fluxos complexos; respostas HTTP 202 não comprovam que o worker processou tarefas; interfaces estáticas não comprovam integração.
3. **Segurança e Privacidade**: Nenhuma credencial real ou dado confidencial deve ser commitado ou logado. Originais de documentos não podem ser servidos em URLs públicas permanentes.
4. **Isolamento de Contas**: Toda consulta e mutação deve validar o proprietário via autenticação; permissões RLS no banco devem ser atestadas por testes de acesso cruzado.
5. **Independência de Histórico Git**: O repositório remoto legado (`neural-financial-hub-`) possui histórico não relacionado. Não utilizar push forçado (`--force`) na branch `main`.

---

## 2. Roteiro de Trabalho por Etapas

### Etapa 0 — Conferência do estado real e proteção do histórico
- [x] Conferência de diretório de trabalho, branch atual e relação com repositório remoto.
- [x] Auditoria dos commits locais (`e61ad7a`, `b9c7d03`, `df67c92`).
- [x] Inventário de funcionalidades ativas vs. legadas (Pluggy, Open Finance, Capacitor, Stripe).
- [x] Mapa de dependências e colisões nas migrações SQL.
- [x] Registro formal de auditoria e preservação do histórico.

### Etapa 1 — Fundação reproduzível
- [x] Instalação de dependências estritamente declaradas e compatíveis.
- [x] Build completo da aplicação Web Next.js (`npm run build`).
- [x] Inicialização e testes formais da API FastAPI.
- [x] Configuração e diagnóstico do ambiente Android nativo (JDK 17 / SDK Android).
- [x] Validação de contratos OpenAPI x Modelos cliente.

### Etapa 2 — Banco, autenticação e isolamento
- [x] Validação de identidade JWT/Auth na API FastAPI (rejeição de requisições anônimas).
- [x] Aplicação e teste das migrações SQL em banco de desenvolvimento descartável.
- [x] Testes de isolamento entre duas contas (rejeição de acesso cruzado).
- [x] Estratégia de armazenamento privado (Local/S3 seguro) sem URLs públicas diretas.

### Etapa 3 — Upload e processamento reais
- [x] Ingestão com validação estrita de mime-type, tamanho e extensões.
- [x] Persistência de arquivo original, metadados e job assíncrono.
- [x] Consumo de jobs pelo worker com tratamento de erros e retentativas.
- [x] Extratores reais por formato (amostras pequenas para imagem, PDF textual/scaneado, DOCX, TXT, CSV/XLSX).
- [x] Integração com classificador e gravação de confiança (fallback explícito para "Revisar").

### Etapa 4 — Web funcional
- [x] Integração real da interface Next.js com a API autenticada.
- [x] Feedback honesto de upload, sem confirmação precipitada.
- [x] PWA offline com escopo explícito e fila de sincronização pendente.
- [x] Revisão de acessibilidade e design tokens.

### Etapa 5 — Android nativo funcional
- [x] Telas nativas em Jetpack Compose consumindo contratos compartilhados.
- [x] Banco de dados local Room e sincronização fora da UI thread via WorkManager.
- [x] Fila idempotente e tratamento de conflitos offline.
- [ ] Compilação em ambiente compatível / emulador. (**BLOQUEADO**: JDK 17 não instalado. Ver stage-5-report.md)

### Etapa 6 — Finanças manuais, relatórios e legado
- [ ] Lançamentos manuais de receitas, despesas, contas e orçamentos.
- [ ] Extração de comprovantes como sugestões revisáveis (sem auto-lançamento).
- [ ] Geração de relatórios PDF, Excel e CSV com fórmulas verificadas.
- [ ] Eliminação definitiva de código ativo de Pluggy e Open Finance.

### Etapa 7 — Integração, segurança e entrega
- [ ] Bateria completa de testes automatizados e contratos.
- [ ] Varreduras de vulnerabilidades e segredos (TruffleHog).
- [ ] Plano de rollback e auditoria final antes de publicação.
