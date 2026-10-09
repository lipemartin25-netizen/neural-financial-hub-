# Regras Globais para Agentes — Neurafin Hub

Este repositório segue estritamente as diretrizes de governança e divisão de papéis definidas na arquitetura do Neurafin Hub.

## Diretrizes de Execução
1. **Foco e Escopo Restrito**: Trabalhe apenas na tarefa atribuída e leia estritamente os arquivos necessários. Não recupere o histórico inteiro nem faça pesquisas externas sem necessidade explícita.
2. **Evidência e Honestidade Técnica**: Não afirme que algo foi implementado, testado ou publicado sem evidência verificável (saída de comandos, logs de teste, builds).
3. **Segurança e Privacidade**: Não imprima, copie para logs nem versione segredos, credenciais reais ou dados de documentos privados.
4. **Contratos Compartilhados**: Ao alterar qualquer comportamento compartilhado entre Web, Android e API, defina ou atualize primeiro os contratos (`packages/contracts`) e seus testes de compatibilidade.
5. **Compatibilidade e Migrações**: Preserve compatibilidade regressiva ou registre explicitamente o impacto e a migração necessária.
6. **Relato de Conclusão**: Toda tarefa deve ser concluída reportando:
   - Arquivos alterados/criados;
   - Testes executados;
   - Resultado verificado;
   - Pendências e riscos identificados.
7. **Escalação de Decisões**:
   - Divergência de escopo ou valor de produto -> Escalar ao **PO**.
   - Regra de cálculo, arredondamento ou fluxo financeiro -> Escalar ao **SME Financeiro**.
   - Risco de segurança, permissões ou infraestrutura -> Escalar ao **DevSecOps**.
   - Questões jurídicas ou LGPD -> Escalar ao **Consultor Jurídico**.
   - Bloqueios de integração -> Escalar ao **Arquiteto de Software** / **PM**.
