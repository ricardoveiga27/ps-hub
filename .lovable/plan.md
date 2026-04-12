

# Fase 4 — Gestão de Propostas (Revisado)

## Arquivos a criar

### 1. `src/hooks/usePropostas.ts`
- `usePropostas(filters)` — lista com join em `crm_clientes`, filtros por status e busca por título/número
- `useProposta(id)` — busca única com dados do cliente
- `useCreateProposta()`, `useUpdateProposta()`, `useDeleteProposta()` — mutations com invalidação

### 2. `src/components/propostas/PropostasList.tsx`
- Tabela: Nº, Cliente, Título, Vidas, Valor Final, Status, Data
- Filtro por status (rascunho, enviada, aceita, recusada, expirada)
- Busca por título ou número
- Botão "Nova Proposta", linha clicável para detalhe

### 3. `src/components/propostas/PropostaForm.tsx`
- Dialog com React Hook Form + Zod
- Campos: cliente_id (select), titulo, vidas, valor_mensal, desconto_tipo (percentual/fixo), desconto_valor, **dia_vencimento (1–28, default 10)**, validade_dias, observacoes
- Cálculo automático em tempo real: `valor_final = valor_mensal × vidas - desconto`
- Desconto percentual: `valor_mensal × vidas × (1 - desconto/100)`; fixo: `valor_mensal × vidas - desconto_valor`

### 4. `src/components/propostas/PropostaDetalhe.tsx`
- Dados completos com badges de status coloridos
- Ações por status:
  - **Rascunho**: Editar, Enviar (→ enviada, seta `enviada_em`), Excluir
  - **Enviada**: Aceitar (→ aceita, conversão em contrato), Recusar (pede `motivo_recusa`)
  - **Aceita**: Visualizar contrato gerado
  - **Recusada**: Visualizar motivo

### 5. `src/pages/app/PropostaDetalhe.tsx`
- Página wrapper para rota `/app/propostas/:id`

### 6. Arquivos a modificar
- `src/pages/app/Propostas.tsx` — substituir placeholder por `PropostasList`
- `src/App.tsx` — adicionar rota `propostas/:id`

## Conversão proposta → contrato (ao aceitar)

Ordem de operações:
1. **INSERT em `crm_contratos`** — com `cliente_id`, `proposta_id`, `vidas`, `valor_mensal=valor_final`, `dia_vencimento` (capturado da proposta), `data_inicio=hoje`, `ps_index/escuta/cultura=true`. O trigger `trg_sync_licencas_contratos` executa automaticamente o upsert em `licencas_ativas`.
2. **INSERT em `crm_assinaturas`** — vinculada ao contrato recém-criado, com `cliente_id`, `contrato_id`, `valor=valor_final`, `dia_vencimento`, `data_inicio=hoje`, `status=ACTIVE`.
3. **UPDATE em `crm_propostas`** — `status=aceita`, `aceita_em=now()`.

Não é necessário código extra para `licencas_ativas` — o trigger cuida disso ao inserir o contrato.

## Campo dia_vencimento na proposta

O campo `dia_vencimento` (inteiro, 1–28, default 10) será adicionado ao `PropostaForm` com validação Zod `z.number().min(1).max(28)`. Valor sugerido de 10 e editável. Limitado a 28 para evitar problemas com fevereiro. Este valor é persistido no `snapshot_condicoes` (JSON) da proposta e usado diretamente na criação do contrato e assinatura.

**Nota:** A tabela `crm_propostas` não tem coluna `dia_vencimento` — o valor será armazenado dentro de `snapshot_condicoes` (campo JSONB existente), evitando necessidade de migração.

## Detalhes técnicos

- Status badges: rascunho (cinza), enviada (azul), aceita (verde), recusada (vermelho), expirada (amarelo)
- Toast em todas as operações CRUD
- AlertDialog antes de excluir, aceitar e recusar
- Dark theme consistente (bg-white/5, text-white, border-white/10)
- Sem migração de banco necessária — tabelas e triggers já existem

