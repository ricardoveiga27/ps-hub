

# Fase 5 — Gestão de Contratos (Revisado)

## Resumo

Substituir o placeholder de Contratos por módulo completo com listagem, detalhe, edição, registro de reajustes e histórico. Integrar contratos clicáveis no ClienteDetalhe.

## Arquivos a criar

### 1. `src/hooks/useContratos.ts`
- `useContratos(filters)` — lista com join em `crm_clientes`, filtros por status e busca
- `useContrato(id)` — busca única com dados do cliente
- `useUpdateContrato()` — mutation para editar

### 2. `src/hooks/useReajustes.ts`
- `useReajustes(contratoId)` — lista reajustes ordenados por `aplicado_em desc`
- `useCreateReajuste()` — insere em `crm_reajustes`, atualiza `crm_contratos.valor_mensal` e `crm_assinaturas.valor`

### 3. `src/components/contratos/ContratosList.tsx`
- Tabela: Código, Cliente, Vidas, Valor Mensal, Produtos (dots coloridos), Status, Início
- Filtro por status (ativo/cancelado/encerrado), busca por código ou cliente
- Linhas clicáveis → `/app/contratos/:id`

### 4. `src/components/contratos/ContratoDetalhe.tsx`
- Cards com dados completos do contrato
- Ações: Editar (dialog), Cancelar (AlertDialog)
- Seção "Reajustes": tabela histórico + botão "Registrar Reajuste"

### 5. `src/components/contratos/ContratoForm.tsx`
- Dialog de edição: vidas, valor_mensal, dia_vencimento, produtos ativos, indice_reajuste, observacoes
- Usado apenas para edição (criação via aceitação de proposta)

### 6. `src/components/contratos/ReajusteForm.tsx`
- Dialog para registrar reajuste com campos:
  - `percentual_aplicado` — editável pelo usuário
  - `valor_anterior` — **readonly**, preenchido automaticamente com `contrato.valor_mensal` atual, não editável
  - `valor_novo` — **calculado em tempo real**: `valor_anterior × (1 + percentual/100)`, exibido formatado em R$ enquanto o usuário digita o percentual
  - `observacao` — texto livre
- Ambos `valor_anterior` e `valor_novo` são apenas visuais — o valor submetido é calculado no `onSubmit` para evitar discrepâncias
- Ao submeter: insere `crm_reajustes`, atualiza `crm_contratos.valor_mensal` e `crm_assinaturas.valor` vinculada

### 7. `src/pages/app/ContratoDetalhe.tsx`
- Página wrapper para rota `/app/contratos/:id`

## Arquivos a modificar

### `src/pages/app/Contratos.tsx`
- Substituir placeholder por `ContratosList`

### `src/App.tsx`
- Adicionar rota `contratos/:id`

### `src/components/clientes/ClienteDetalhe.tsx`
- Linhas de contratos clicáveis → `navigate(/app/contratos/${c.id})`
- Dots coloridos de produtos: Index (#3B82F6), Escuta (#8B5CF6), Cultura (#10B981)

## Detalhes técnicos

- Status badges: ativo (verde), cancelado (vermelho), encerrado (cinza)
- Reajuste atualiza em cascata: `crm_contratos.valor_mensal` + `crm_assinaturas.valor`
- Trigger `sync_licencas_ativas` já cuida de `licencas_ativas` automaticamente
- Dark theme consistente
- Sem migração de banco necessária

