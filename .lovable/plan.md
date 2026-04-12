

# Fase 6 — Módulo Financeiro (Revisado)

## Resumo

Substituir o placeholder do Financeiro por módulo completo com cards de resumo, listagem de faturas com filtros (período, status, busca), detalhamento individual e exportação CSV.

## Arquivos a criar

### 1. `src/hooks/useFaturas.ts`
- `useFaturas(filters)` — lista faturas com join em `crm_clientes(razao_social, nome_fantasia)`, filtros por status, período (`data_vencimento` entre datas), busca por número ou cliente
- `useUpdateFatura()` — mutation para marcar como paga/cancelada
- Tipos: `FaturaFilters { status, dataInicio, dataFim, busca }`

### 2. `src/components/financeiro/FinanceiroResumo.tsx`
- 4 cards: Total Faturado, Recebido, Pendente, Vencido
- **Recebe o array de faturas já filtrado como prop** — não faz query própria
- Calcula totais localmente com `reduce` sobre o array recebido
- Garante que os valores refletem exatamente o período/status selecionado pelo usuário

### 3. `src/components/financeiro/FaturasList.tsx`
- Filtros: Select de status, DatePicker para período (início/fim), busca
- Tabela: Número, Cliente, Valor, Vencimento, Status, Período Ref.
- Linhas clicáveis → abre dialog de detalhe
- Botão "Exportar CSV"

### 4. `src/components/financeiro/FaturaDetalhe.tsx`
- Dialog com dados completos da fatura
- Ações: Marcar como Paga, Cancelar (AlertDialog)

### 5. `src/components/financeiro/ExportarCSV.ts`
- Função utilitária: gera download CSV via `Blob` + `URL.createObjectURL`

## Arquivos a modificar

### `src/pages/app/Financeiro.tsx`
- Estado de filtros no nível da página
- Chama `useFaturas(filters)` uma única vez
- Passa `faturas` filtradas como prop para `FinanceiroResumo` e `FaturasList`
- Fluxo de dados:
```text
Financeiro (page)
  ├─ filters state
  ├─ useFaturas(filters) → faturas[]
  ├─ <FinanceiroResumo faturas={faturas} />   ← calcula totais via reduce
  └─ <FaturasList faturas={faturas} filters={...} onFilterChange={...} />
```

## Detalhes técnicos

- Status badges: PENDING (amarelo), RECEIVED (verde), OVERDUE (vermelho), CANCELLED (cinza)
- DatePicker com `pointer-events-auto` no Popover
- Dark theme consistente
- Sem migração de banco — `crm_faturas` já existe

