

# Integração Asaas — 5 Edge Functions + UI Financeiro (Revisado)

## Resumo

Criar 5 Edge Functions Deno para integração com a API Asaas e adicionar botões de ação na UI do módulo Financeiro.

---

## CORS — Regra Global

Todas as Edge Functions definem CORS headers inline, sem import externo:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Exceção: `pshub-webhook` inclui `asaas-webhook-token` no allow-headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-webhook-token',
}
```

Todas as respostas (sucesso e erro) incluem `...corsHeaders`. OPTIONS retorna 200 com corsHeaders.

---

## Padrão Comum (todas as funções)

- `SUPABASE_SERVICE_ROLE_KEY` para operações internas
- Base URL: `https://api-sandbox.asaas.com/v3`
- Headers Asaas: `access_token: config.api_key`, `User-Agent: PSHub-Veiga`
- Buscar `api_key` de `crm_asaas_config` onde `is_active = true`
- Try/catch com console.error

---

## Edge Functions

### 1. `supabase/functions/pshub-sync-asaas-customer/index.ts`
- POST `{ clienteId }` → busca cliente, verifica existência em `crm_asaas_customers`
- Novo: POST `/customers`; existente: PUT `/customers/{id}`
- Upsert em `crm_asaas_customers`, retorna `{ success, asaas_customer_id }`

### 2. `supabase/functions/pshub-create-payment/index.ts`
- POST `{ faturaId }` → busca fatura + cliente, busca `asaas_customer_id`
- Erro se cliente não sincronizado
- POST `/payments` com `billingType: 'UNDEFINED'`, `externalReference: fatura.id`
- Atualiza `crm_faturas` com `asaas_payment_id`, `boleto_url`, `pix_qr_code`, `pix_copy_paste`, `invoice_url`

### 3. `supabase/functions/pshub-webhook/index.ts`
- POST público, valida `asaas-webhook-token` contra `crm_asaas_config.webhook_token`
- Persiste em `crm_webhook_events` antes de processar
- Ignora payments com `subscription` preenchido
- Trata: PAYMENT_RECEIVED/CONFIRMED → RECEIVED, PAYMENT_OVERDUE → OVERDUE, PAYMENT_DELETED/REFUNDED → CANCELLED, INVOICE_AUTHORIZED → EMITIDA + pdf_url/numero_nfse, INVOICE_ERROR → ERRO
- Marca `processed_at`, sempre retorna 200

### 4. `supabase/functions/pshub-emit-nfse/index.ts`
- POST `{ faturaId }` → valida status RECEIVED, sem nota existente
- POST `/invoices` no Asaas, insere em `crm_notas_fiscais` com status PROCESSING

### 5. `supabase/functions/pshub-generate-monthly-invoices/index.ts`
- POST sem body (cron), busca assinaturas ACTIVE com `dia_vencimento = dia_atual`
- Verifica duplicidade por `assinatura_id` + `periodo_referencia`, insere com status PENDING

---

## Alterações na UI

### `src/components/financeiro/FaturasList.tsx`
- Coluna "Ações" com botão "Sincronizar" (chama sync-customer → create-payment em sequência) e "Emitir NF" (habilitado se status = RECEIVED)
- Loading states e toasts, stopPropagation para não abrir detalhe

### `src/components/financeiro/FaturaDetalhe.tsx`
- Mesmos botões "Sincronizar com Asaas" e "Emitir NF" no dialog
- Links de boleto/PIX já exibidos — sem alteração nessa seção

---

## Detalhes técnicos

- Invocação via `supabase.functions.invoke('pshub-...', { body })`
- Webhook não exige JWT — validação por token customizado
- Sem migração de banco — todas as tabelas já existem
- Botão "Sincronizar" executa sequencialmente com tratamento de erro entre passos

