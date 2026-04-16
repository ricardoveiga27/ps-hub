

# Nova Página Comercial — Simulador de Preços

## Resumo
Criar a página `/app/comercial` com simulador de preços interativo e tabela de planos, acessível apenas para `is_comercial` e `is_admin`.

## Implementação

### 1. `src/pages/app/Comercial.tsx` (novo)
- Página com todo o HTML do simulador embedado via `dangerouslySetInnerHTML`
- CSS variables do tema dark definidas no escopo `.sim-painel`
- Script do simulador re-executado via `useEffect` + `querySelectorAll("script")`
- Guard de acesso: redireciona para `/app/dashboard` se não for comercial/admin
- Modal "Desconto Supremo" sem senha — clique direto desbloqueia (conforme restrição linha 1060)
- Conteúdo completo: simulador, tabela de preços, matriz de inclusões, régua de descontos, estudos de caso

### 2. `src/App.tsx`
- Adicionar import e rota `<Route path="comercial" element={<Comercial />} />`

### 3. `src/components/app/AppSidebar.tsx`
- Novo item no menu após Dashboard: `{ title: "Comercial", url: "/app/comercial", icon: TrendingUp, show: perfil.is_admin || perfil.is_comercial }`

## Detalhes técnicos
- Tudo em um único arquivo `Comercial.tsx` (conforme restrição)
- CSS com namespace `.sim-painel` para não conflitar com o dashboard
- CSS variables (`--bg`, `--text`, `--blue`, etc.) definidas inline no escopo
- Fontes Syne e DM Sans já carregadas pelo dashboard
- Não modifica CSS global

## Arquivos
1. `src/pages/app/Comercial.tsx` — novo (página completa)
2. `src/App.tsx` — adicionar rota
3. `src/components/app/AppSidebar.tsx` — adicionar item de menu

