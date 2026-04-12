

# Fase 7 — Dashboard + Configurações (Revisado)

## Resumo

Substituir os dois últimos placeholders por módulos funcionais: Dashboard com KPIs reais e gráficos, e Configurações para gerenciar a integração Asaas.

---

## Parte 1: Dashboard

### `src/hooks/useDashboard.ts`
Queries paralelas via Supabase client (sem RPC):
- **KPIs**: counts/sums de `crm_clientes` (status=ativo), `crm_contratos` (status=ativo → sum valor_mensal, sum vidas), `crm_faturas` (status=OVERDUE → sum valor)
- **Faturamento mensal**: busca todas as faturas com `data_vencimento >= primeiroDiaHa6Meses`, seleciona apenas `valor, status, data_vencimento`. **Agregação por mês feita no frontend com `reduce`**, gerando array `[{ mes: 'Nov/25', recebido: 0, pendente: 0 }, ...]` passado diretamente ao BarChart. Sem RPC.
- **Propostas abertas**: top 5 com status=enviada, join `crm_clientes(razao_social)`
- **Faturas vencidas**: top 5 com status=OVERDUE, join `crm_clientes(razao_social)`

### `src/pages/app/Dashboard.tsx`
- **Linha 1 — 4 KPI Cards**: Clientes Ativos, MRR (R$), Vidas Totais, Inadimplência (R$)
- **Linha 2 — BarChart** (recharts via `ChartContainer`): barras empilhadas Recebido (verde) vs Pendente+Vencido (amarelo), últimos 6 meses
- **Linha 3 — 2 tabelas lado a lado**: Propostas Abertas e Faturas Vencidas, linhas clicáveis com `navigate()`

---

## Parte 2: Configurações

### `src/hooks/useAsaasConfig.ts`
- `useAsaasConfig()` — busca primeira linha de `crm_asaas_config`
- `useUpdateAsaasConfig()` — mutation para upsert

### `src/pages/app/Configuracoes.tsx`
- **Card "Integração Asaas"**: API Key (password + toggle), Ambiente (select sandbox/production), Wallet ID, Webhook Token, NFS-e (switch), badge Ativo/Inativo
- **Card "Informações do Sistema"**: nome da instância (readonly), versão
- Carrega dados via `useAsaasConfig`, salva com upsert

---

## Detalhes técnicos

- Gráficos usam `ChartContainer` + recharts (já disponível)
- Dark theme consistente (bg-white/5, border-white/10, text-white)
- API Key nunca exibida em texto plano por padrão
- Sem migração de banco — todas as tabelas já existem
- Agregação de faturamento mensal 100% no frontend via reduce

