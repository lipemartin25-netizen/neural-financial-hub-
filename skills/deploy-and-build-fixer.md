---
name: Deploy and Build Fixer
description: Skill focada em diagnosticar e corrigir erros de deploy/execução multilinguagem, realizando limpeza profunda de caches e builds antigos que causam travamentos e "falsos positivos", preservando todo o código-fonte.
---

# Deploy & Execution Fixer

Esta skill define o procedimento padrão para resolver erros de "build engasgado", caches corrompidos e falhas de deploy misteriosas que ocorrem em projetos Next.js, Node, Python, Java/.NET, e outras linguagens mobile ou backend.

## 🛠️ O Problema

Muitas vezes, erros catastróficos de compilação ou execução local (tais como `ERR_CONNECTION_REFUSED`, `Module not found`, falhas inexplicáveis de TypeScript em arquivos que já foram corrigidos, ou conflito de versões) ocorrem devido a:

- Arquivos de cache zumbis
- Pastas de build defasadas de rotas antigas
- Módulos (como `node_modules` ou `__pycache__`) mal instalados

A solução não é reescrever o código do projeto, e sim **limpar a sujeira gerada pela transpilação**.

## 🚀 Como e Quando Ativar esta Skill

Quando o usuário reportar erros esquisitos de dependências, ou do servidor local não subindo mais de repente (sendo que não houve quebra de código direta), a Inteligência Artificial deve adotar esta estratégia:

1. Executar o **Script de Limpeza Universal** (veja abaixo).
2. Derrubar processos zumbis rodando na porta alvo (Ex: `npx kill-port 3000`).
3. Promover a instalação limpa (`npm install` ou equivalente).
4. Subir a aplicação a frio para validar a correção.

---

## 🧹 Script de Limpeza Universal (`clean-builds.js`)

Crie ou utilize este script na raiz do projeto para realizar uma varredura veloz que limpa os diretórios sintéticos e dinâmicos, **NUNCA DELETANDO ARQUIVOS DE CÓDIGO FONTE OU DE CONFIGURAÇÃO**.

Você pode gerar este arquivo para o usuário executando via Node.

```javascript
// clean-builds.js
// Rode com: node clean-builds.js
const fs = require('fs');
const path = require('path');

// Mapeamento de pastas geradas por compilers/package managers a serem deletadas
const DIRS_TO_REMOVE = [
  // Ambiente JS/TS (Node, Next.js, React, Vite)
  'node_modules', '.next', 'dist', 'build', 'out', '.cache',
  
  // Python
  '__pycache__', '.pytest_cache', '.venv',
  
  // Java / Android / Gradle
  'target', '.gradle', 'app/build',
  
  // .NET
  'bin', 'obj',
  
  // iOS / React Native / Flutter
  'Pods', '.dart_tool'
];

function cleanRecursively(currentPath) {
  if (!fs.existsSync(currentPath)) return;
  
  const items = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(currentPath, item.name);
    
    if (item.isDirectory()) {
      if (DIRS_TO_REMOVE.includes(item.name)) {
        console.log(`🗑️ Removendo sujeira: ${fullPath}`);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (e) {
          console.error(`⚠️ Erro ao remover ${fullPath}: ${e.message}`);
        }
      } else {
        // Ignora pastas ocultas cruciais como .git para acelerar a busca
        if (item.name !== '.git') {
          cleanRecursively(fullPath);
        }
      }
    }
  }
}

console.log("🧹 Iniciando limpeza profunda e universal do projeto...");
const startTime = Date.now();

cleanRecursively(process.cwd());

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n✅ Limpeza concluída com sucesso em ${elapsed}s! Todo o código-fonte foi mantido intacto.`);
console.log("💡 Próximos passos:");
console.log("  1) npm install (ou seu gerenciador de pacotes equivalente)");
console.log("  2) npm run dev (ou seu script de execução local)\n");
```

## 🧠 Instruções de Manuseamento Específico

1. **Locks (`package-lock.json`, `yarn.lock`)**: Evite deletar arquivos de lock na primeira tentativa de limpeza para não bagunçar a árvore nativa de dependências. Só os delete se a limpeza de pastas sozinhas NÃO resolver o problema de pacotes.
2. **Next.js & React**: Deleções do diretório `.next` tendem a consertar 90% dos problemas de "páginas com erro estático" ou problemas de roteamento (App Router) fantasma onde alterações não refletem no localhost.
3. **Portas travadas no Windows**: Se houver um erro como "EADDRINUSE" ou "ERR_CONNECTION_REFUSED" no final do processo, use comandos para derrubar a velha aba travada na memória: `npx kill-port <numero-da-porta>`.
