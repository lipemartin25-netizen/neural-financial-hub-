# Skill: release-check

## Quando Usar
Utilizar antes de promover qualquer alteração para staging ou produção, ou ao concluir uma fase de entrega.

## Procedimento
1. Verificar evidências de testes automatizados (unitários, integração e contrato).
2. Validar que nenhuma credencial ou segredo está embutido no código ou nos commits.
3. Verificar a presença de planos de migração e rollback para alterações de banco de dados.
4. Garantir que procedimentos de backup e testes de restauração estejam documentados.
