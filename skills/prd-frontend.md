# 🚀 PRD Frontend — MetaFin Nexus v3.0

## 📝 Resumo do Produto

A interface do Nexus v3.0 expande o sistema de design 3D Premium do MetaFin, adicionando um centro de comando Spotlight (Cmd+K) e uma sidebar de insights proativos ("Nexus Drawer") que age como um Advisor financeiro em tempo real.

## 🛸 Principais Componentes

### 1. `NexusSpotlight.jsx` (Command Center)

- **Atalho**: `Cmd+K` ou `Ctrl+K`.
- **Interface**: Modal centralizado estilo Spotlight, glassmorphism profundo.
- **Recursos**: Chat Advisor em tempo real, seletor de modelos (GPT/Claude), histórico de conversas.

### 2. `NexusInsightDrawer.jsx` (Sidebar Proativa)

- **UX**: Sidebar colapsável à direita do Dashboard.
- **Briefing**: Cartões 3D elevados com o "Resumo Financeiro do Dia".
- **Widgets**: Gráficos de progresso FIRE atualizados pelo Advisor.

### 3. `NexusDropzone.jsx` (Vision Input)

- **UX**: Drag & Drop persistente (ícone flutuante ou no topo).
- **Ação**: Upload instantâneo para processamento via `/api/nexus/vision`.

## 🎨 Design System (Nexus Extension)

### Tokens IA

- **Border**: `border-violet-500/30` ou `border-brand-primary/40`.
- **Glow**: Efeito de brilho pulsante nas bordas de cards sugeridos pela IA.
- **Fundo**: `bg-slate-900/60 backdrop-blur-xl`.

### Animações (Framer Motion)

- **Spotlight**: `initial={{ opacity: 0, scale: 0.95 }}` ao abrir.
- **Sidebar**: Entrada lateral suave (`x: 0`) com mola (spring).

## 🔄 Fluxo de Usuário (User Journey)

1. **Login**: O usuário entra no Dashboard e o `NexusInsightDrawer` abre automaticamente (ou via ícone) com o briefing matinal.
2. **Consulta**: Usuário abre o `NexusSpotlight` (Cmd+K) para perguntar: "Quanto falta para minha meta FIRE se eu economizar 2k hoje?".
3. **Análise de Arquivo**: Usuário arrasta um extrato PDF para o `NexusDropzone`. A IA lê, categoriza e exibe um resumo para confirmação.

## 🔒 Security (Frontend Side)

- **Tier Checking**: Bloqueia visualmente o seletor de GPT-4o/Claude-3.5 para usuários "Free".
- **Privacy Modal**: Exibe aviso de que arquivos são processados mas não armazenados.
