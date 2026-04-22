

## Criar Edge Function `get-clientes-hub`

Endpoint público (sem JWT) protegido por `x-hub-secret`, espelhando o padrão de `get-empresa-funcionarios`, para PS Index e PS Cultura listarem clientes ativos do PS Hub.

### 1. Novo arquivo — `supabase/functions/get-clientes-hub/index.ts`

**Reusa o mesmo padrão da função existente:**
- Mesma whitelist de CORS (`psindex.app.br`, `pscultura.app.br`, `pshub.app.br` + `*.lovableproject.com` + `*.lovable.app`).
- Mesmo helper `corsHeaders(origin)` com echo do `Origin`.
- Mesmo header customizado `x-hub-secret` validado contra `HUB_API_SECRET` (já configurado).
- `SUPABASE_SERVICE_ROLE_KEY` usado server-side para bypass de RLS.

**Fluxo do handler** (`Deno.serve`):
1. `OPTIONS` → 204 com CORS.
2. Validar `x-hub-secret`. Mismatch ou ausente → `401 { error: "Unauthorized" }`.
3. Aceitar `POST` (mantém consistência com a outra função). Body é opcional; futuramente aceitará `{ search?: string }`, mas nesta versão não filtra.
4. Query:
```ts
supabase
  .from("crm_clientes")
  .select("id, razao_social, nome_fantasia, cnpj")
  .eq("status", "ativo")
  .order("razao_social")
  .limit(1000); // proteção defensiva
```
5. Retornar `200`:
```json
{
  "clientes": [
    { "hub_id": "uuid", "razao_social": "...", "nome_fantasia": "...", "cnpj": "..." }
  ],
  "total": 42
}
```
6. `try/catch` global → `500 { error: "Erro interno" }` com `console.error` incluindo origin e tamanho do resultado (sem PII).

### 2. Configuração — `supabase/config.toml`

Adicionar bloco para tornar a função pública (preserva o bloco existente de `get-empresa-funcionarios`):
```toml
[functions.get-clientes-hub]
verify_jwt = false
```

### 3. Deploy
Deploy via `deploy_edge_functions(["get-clientes-hub"])`.

### 4. Validação
- `curl` com header válido → `200` com lista de clientes ativos.
- `curl` sem header / header errado → `401`.
- `curl` com método `GET` → tratado pelo CORS (sem POST handler explícito retorna fluxo padrão; vai cair no `try` e responder normalmente já que body é opcional). **Nota**: vou aceitar qualquer método não-OPTIONS para simplificar, validando apenas o secret.

### Endpoint final
`POST https://ixitjycjcgcfxwqduuit.supabase.co/functions/v1/get-clientes-hub`

Headers:
```
Content-Type: application/json
x-hub-secret: <HUB_API_SECRET>
```

### Não será alterado
- `get-empresa-funcionarios` (mantida intacta).
- Nenhuma tabela, RLS ou função SQL.
- Nenhum código do CRM (`/app`).
- Secret `HUB_API_SECRET` é reaproveitado (já configurado).

