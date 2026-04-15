

# Correção: PropostaPublica standalone sem herança de estilos

## Problema
A rota `/proposta/:token` já está fora do `AppLayout` no `App.tsx` (linha 33), mas dois problemas causam interferência visual:

1. **CSS global** (`index.css`) define `--background: 226 60% 8%` (azul escuro) no `:root`, que é aplicado ao `body` pelo Tailwind base layer
2. **Componente `Page`** envolve o `html_gerado` em containers com `bg-gray-50`, `bg-white`, `p-8`, `max-w-4xl` — sobrescrevendo os estilos do template HTML

## Correções

### `src/pages/PropostaPublica.tsx`

1. **Adicionar `useEffect`** para resetar estilos do `body` ao montar e restaurar ao desmontar:
   - `document.body.style.background = 'transparent'`
   - `document.body.style.margin = '0'`
   - `document.body.style.padding = '0'`
   - `document.documentElement.style.background = 'transparent'`
   - Cleanup: restaura valores originais no return do useEffect

2. **Estado "aguardando"** — renderizar `html_gerado` diretamente em `<div>` sem wrapper `Page`. O formulário de aceite fica abaixo, dentro de seu próprio container estilizado (max-w, padding) mas sem afetar o HTML acima.

3. **Estado "aceita"** — mesmo approach: banner verde + `html_gerado` direto, sem `Page`.

4. **Estados de erro** (não encontrado, expirada, cancelada) — manter `Page` wrapper pois são telas próprias do sistema.

5. **Loading state** — resetar body styles também neste estado.

### Nenhuma alteração em `App.tsx` ou `index.html`
A rota já está correta. O reset via `useEffect` é suficiente e reversível.

## Arquivos editados
- `src/pages/PropostaPublica.tsx` (1 arquivo)

