

## Sincronização automática Hub → PS Cultura / PS Index

Sempre que `crm_clientes` ou `crm_funcionarios` for inserido/atualizado, o banco dispara um trigger que chama a Edge Function `sync-to-products`, que faz fan-out HTTP para os endpoints `receive-hub-sync` dos dois produtos.

### Arquitetura

```text
crm_clientes / crm_funcionarios
        │ (AFTER INSERT/UPDATE)
        ▼
notify_empresa_sync / notify_funcionario_sync   (SECURITY DEFINER)
        │ pg_net.http_post  + x-hub-secret
        ▼
Edge Function: sync-to-products
        │ Promise.allSettled  + x-hub-secret
        ├──► PS Cultura  /functions/v1/receive-hub-sync
        └──► PS Index    /functions/v1/receive-hub-sync
```

### 1. Edge Function — `supabase/functions/sync-to-products/index.ts`

- `Deno.serve` com CORS restrito (apenas `pshub.app.br`, domínios Lovable e chamadas server-to-server sem origem).
- `OPTIONS` → 204.
- Validar header `x-hub-secret` contra `HUB_API_SECRET`. Mismatch → 401.
- Parse do body `{ evento: string, dados: object }`. Validar `evento` contra whitelist:
  `empresa.atualizada`, `funcionario.criado`, `funcionario.atualizado`, `funcionario.desativado`. Inválido → 400.
- Lista de produtos hardcoded:
  ```ts
  const PRODUTOS = [
    { nome: "ps-cultura", url: "https://fyelzagqyyluuinheegn.supabase.co/functions/v1/receive-hub-sync" },
    { nome: "ps-index",   url: "https://apdsugxhkuwpllzdnpof.supabase.co/functions/v1/receive-hub-sync" },
  ];
  ```
- `Promise.allSettled` repassando o mesmo payload `{ evento, dados }` com header `x-hub-secret` (lido de `HUB_API_SECRET`).
- Para cada resultado: `console.log("sync-to-products", { produto, status, ok })`. Não falhar o request principal.
- Sempre responder `200 { success: true, evento, resultados: [{ produto, status }] }` para que o trigger nunca quebre o INSERT/UPDATE.
- `try/catch` global → 500 com log; mesmo assim, qualquer erro pré-validação retorna o status apropriado.

### 2. Configuração — `supabase/config.toml`

Adicionar bloco (preserva os existentes de `get-clientes-hub` e `get-empresa-funcionarios`):

```toml
[functions.sync-to-products]
verify_jwt = false
```

### 3. Migration — extensão + triggers

**a) Habilitar `pg_net`** (extensão oficial do Supabase para HTTP a partir de funções SQL):
```sql
create extension if not exists pg_net with schema extensions;
```
> O Supabase expõe `net.http_post` via search_path quando `pg_net` está em `extensions`. Vou usar `net.http_post(...)` como na especificação. Caso o linter alerte, troco para `extensions.http_post` na migration.

**b) Armazenar o secret no Postgres** para que os triggers possam montar o header sem hardcode:
```sql
-- usado em current_setting('app.hub_api_secret', true)
alter database postgres set "app.hub_api_secret" = '<HUB_API_SECRET>';
```
> O valor real será lido de `HUB_API_SECRET` (já configurado em Secrets) e injetado pela migration via SQL literal. Como `ALTER DATABASE postgres` não é permitido em migrations Lovable, usarei alternativa:  
> **Plano final**: criar GUC apenas na sessão da função via `set_config('app.hub_api_secret', <valor>, false)` **não funciona em trigger**. Solução robusta → embutir o secret diretamente em uma função SQL `SECURITY DEFINER` privada `_get_hub_secret()` retornando o texto, criada pela migration. O secret entra na migration uma única vez. Triggers chamam `_get_hub_secret()` em vez de `current_setting`.

```sql
create or replace function public._get_hub_secret()
returns text language sql security definer set search_path = public as $$
  select '<HUB_API_SECRET>'::text;
$$;
revoke all on function public._get_hub_secret() from public, anon, authenticated;
```

**c) Trigger de empresas** — `notify_empresa_sync()` + `trg_empresa_sync` em `crm_clientes` (AFTER INSERT OR UPDATE), evento fixo `empresa.atualizada`, payload conforme spec, `net.http_post` para `https://ixitjycjcgcfxwqduuit.supabase.co/functions/v1/sync-to-products` com header `x-hub-secret = public._get_hub_secret()`.

**d) Trigger de funcionários** — `notify_funcionario_sync()` + `trg_funcionario_sync` em `crm_funcionarios` (AFTER INSERT OR UPDATE):
- `TG_OP = 'INSERT'` → `funcionario.criado`
- `NEW.status = 'inativo' AND OLD.status <> 'inativo'` → `funcionario.desativado`
- caso contrário → `funcionario.atualizado`

Ambos os triggers usam `SECURITY DEFINER`, `search_path = public, extensions` e `RETURN NEW`. `pg_net` é assíncrono — não bloqueia o INSERT/UPDATE.

### 4. Validação pós-deploy

1. `update crm_clientes set telefone = telefone where id = '<algum-id>'` → log da Edge Function deve mostrar 2 chamadas (ps-cultura, ps-index).
2. Insert em `crm_funcionarios` → evento `funcionario.criado`.
3. `update crm_funcionarios set status = 'inativo' where id = ...` → evento `funcionario.desativado`.
4. `curl -X POST .../sync-to-products` sem header → 401.

### 5. Não será alterado

- Tabelas (`crm_clientes`, `crm_funcionarios`) — schema intocado.
- Edge Functions existentes (`get-clientes-hub`, `get-empresa-funcionarios`).
- RLS, autenticação do CRM, hooks/UI.

### Arquivos

- **Criar**: `supabase/functions/sync-to-products/index.ts`
- **Criar**: migration SQL (extensão `pg_net` + função `_get_hub_secret` + 2 funções de trigger + 2 triggers).
- **Alterar**: `supabase/config.toml` (bloco `[functions.sync-to-products]`).

