## Modal de celebração ao aceitar a proposta

Substituir o feedback sóbrio (cartão verde inline) por um **modal full-screen de celebração** que aparece imediatamente após o RPC `aceitar_proposta_link` retornar sucesso.

### Comportamento

1. Usuário preenche nome/CPF/cargo, marca o checkbox e clica "Confirmar Aceite".
2. RPC é chamado normalmente (sem alteração).
3. Em sucesso:
   - State React `accepted = { nome, dataISO }` é setado → modal abre com animação.
   - O cartão verde inline continua sendo injetado no DOM da proposta (registro permanente caso o cliente feche o modal e role a página).
   - CustomEvent `aceite_proposta` continua sendo disparado (compatibilidade).

### Conteúdo do modal

- **Confete CSS puro** caindo do topo por ~4s (sem dependência nova; ~30 spans com `animation` aleatória de translate+rotate).
- **Ícone grande de check** (Lucide `CheckCircle2`) com animação `scale-in` e gradiente verde/teal de fundo.
- **Headline**: "🎉 Parabéns pela sua compra!"
- **Subtítulo personalizado**: "Obrigado, **{nome}**! Sua adesão ao PS Hub foi confirmada."
- **Mensagem principal**:
  > "Em breve nossa equipe de implantação entrará em contato para dar continuidade com seu onboarding. Nos vemos do outro lado! 🚀"
- **Cartão "Próximos passos"** com 3 itens (ícone + label):
  1. 👋 Nossa equipe entrará em contato em até 1 dia útil
  2. 📋 Vamos agendar uma call de kickoff do onboarding
  3. 🚀 Implantação personalizada da sua empresa
- **Rodapé pequeno**: "Aceite registrado em {data/hora} por {nome}."
- **Botão "Fechar"** (o cartão inline permanece visível por baixo).

### Implementação técnica (em `src/pages/PropostaPublica.tsx`)

- Adicionar state: `const [accepted, setAccepted] = useState<{ nome: string; dataISO: string } | null>(null);`
- No `handleAccept`, após o RPC sem erro:
  ```ts
  setAccepted({ nome, dataISO: new Date().toISOString() });
  ```
  (antes da injeção do cartão inline atual, que é mantida).
- Renderizar o modal como JSX irmão do `<div ref={containerRef} dangerouslySetInnerHTML={...}>`:
  - Overlay fixo `fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`.
  - Container do modal `bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-scale-in`.
  - Confete em `<div class="absolute inset-0 overflow-hidden pointer-events-none">` com spans gerados via `Array.from({length:30})`.
- **Acessibilidade**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco no botão Fechar via `useEffect`, ESC fecha.
- **Estilos inline** (não Tailwind no body de proposta — a página pública roda fora do shell do CRM, mas Tailwind está disponível globalmente via `index.css`). Usar Tailwind normal.
- **Confete keyframes**: adicionar bloco `<style>` local no JSX do modal com `@keyframes confetti-fall` (translateY + rotate) e cores aleatórias inline por span — evita poluir `tailwind.config.ts`/`index.css`.
- **Responsivo**: modal vira full-width no mobile, centrado no desktop. Confete cobre a tela.

### O que NÃO muda

- RPC `aceitar_proposta_link` (já corrigido na migration anterior).
- Validação de CPF/checkbox/máscara.
- Substituição do bloco do formulário pelo cartão verde inline (continua como fallback).
- CustomEvent `aceite_proposta`.
- Hooks de fetch, print, title.

### Fora de escopo (combinado com o usuário)

- Envio de e-mail automático para o signatário com a mensagem de boas-vindas → deixar para uma próxima iteração.

### Arquivos

- **Editar**: `src/pages/PropostaPublica.tsx` (state `accepted`, modal JSX, keyframes de confete, foco/ESC).