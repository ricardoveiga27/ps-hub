

# Módulo Financeiro Completo — Assinaturas + Fila de Aprovação + NFS-e Automática

## Resumo

3 entregas: nova página de Assinaturas, fila de aprovação de faturas no Financeiro, e automação NFS-e no webhook.

---

## 1. Página /app/assinaturas

### `src/hooks/useAssinaturas.ts` (novo)
- `useAssinaturas()` — lista com join `crm_clientes(razao_social, nome_fantasia)` e `crm_contratos(codigo_contrato, ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo)`
- `useUpdateAssinatura()` — mutation que atualiza `crm_assinaturas` (vidas, valor) E também `crm_contratos.vidas` e `crm_contratos.valor_mensal` do contrato vinculado (sequencial)

### `src/pages/app/Assinaturas.tsx` (novo)
- Tabela: Cliente, Contrato, Vidas, Valor Mensal, Dia Vencimento, Próximo Reajuste, Status
- Badges: ACTIVE (verde), SUSPENDED (amarelo), CANCELED (cinza)
- Dots coloridos dos produtos (Index azul, Escuta roxo, Cultura verde) do contrato
- Botão "Editar" → Dialog com campos vidas (number) e valor (R$), salva nos dois locais

### `src/App.tsx` — rota `/app/assinaturas`

### `src/components/app/AppSidebar.tsx` — item "Assinaturas" com ícone `Repeat` entre Contratos e Financeiro

---

## 2. Fila de aprovação no Financeiro

### `src/hooks/useFaturas.ts` — adicionar:
- `useFaturasPendentes()` — faturas com status `PENDENTE_APROVACAO`, join `crm_clientes(razao_social, nome_fantasia)` e join em `crm_assinaturas(vidas)` via `assinatura_id`
- `useAprovarFatura()` — mutation sequencial: `pshub-sync-asaas-customer` → `pshub-create-payment`, invalida queries

### `src/components/financeiro/FilaAprovacao.tsx` (novo)
- Card com badge de contagem ("N faturas aguardando aprovação")
- Tabela: Cliente, Vidas, Valor, Vencimento, Período
- Botão "Aprovar" por linha (loading + toast)
- Botão "Editar Vidas" por linha → Dialog com campo vidas (number) e campo valor (editável, pré-calculado proporcionalmente: `novo_valor = (novas_vidas / vidas_atuais) * valor_atual`). O operador pode sobrescrever o valor antes de salvar.
- Ao salvar: atualiza `crm_assinaturas.vidas` e `crm_faturas.vidas` + `crm_faturas.valor`

### `src/pages/app/Financeiro.tsx` — `FilaAprovacao` acima do resumo, sempre visível

### `FaturasList.tsx` e `FaturaDetalhe.tsx` — adicionar `PENDENTE_APROVACAO` ao statusMap (âmbar/laranja, label "Aguardando Aprovação")

---

## 3. Webhook — NFS-e automática

### `supabase/functions/pshub-webhook/index.ts`
- No bloco `PAYMENT_RECEIVED/PAYMENT_CONFIRMED`, após atualizar status para RECEIVED:
  - Select a fatura atualizada pelo `asaas_payment_id` para obter o `id`
  - Chamar `pshub-emit-nfse` via `fetch()` interno:
    ```
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/pshub-emit-nfse`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ faturaId })
    })
    ```
  - Try/catch — se falhar, apenas logar, não bloquear retorno 200

---

## 4. Geração mensal — ajustes

### `supabase/functions/pshub-generate-monthly-invoices/index.ts`
- Alterar select para incluir `vidas` da assinatura
- Status de inserção: `PENDENTE_APROVACAO` (não `PENDING`)
- Copiar `vidas` para `crm_faturas.vidas`

---

## Detalhes técnicos

- Badge `PENDENTE_APROVACAO`: `bg-amber-500/20 text-amber-300 border-amber-500/30`, label "Aguardando Aprovação"
- Filtro de status no `FaturasList` ganha opção "Aguardando Aprovação"
- Dark theme consistente (bg-white/5, text-white, border-white/10)
- Sem migração de banco — todas as tabelas e campos já existem
- 9 arquivos criados/editados

