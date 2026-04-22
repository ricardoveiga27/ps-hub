

## Criar Edge Function `get-empresa-funcionarios`

Função pública (sem JWT) protegida por secret header, para o PS Index e PS Cultura consumirem dados de empresa + funcionários do PS Hub.

### 1. Secret necessário
Solicitar via `add_secret` o secret **`HUB_API_SECRET`** (valor forte, ex.: UUID v4). Sem ele a função não pode validar requisições.

### 2. Novo arquivo — `supabase/functions/get-empresa-funcionarios/index.ts`

**CORS dinâmico** com whitelist de origens (echo do `Origin` quando permitido, evitando `*` para conviver com header customizado):
```ts
const ALLOWED = [
  "https://psindex.app.br",
  "https://pscultura.app.br",
  "https://pshub.app.br",
];
function corsHeaders(origin: string | null) {
  const ok = origin && (
    ALLOWED.includes(origin) ||
    /\.lovableproject\.com$/.test(new URL(origin).hostname) ||
    /\.lovable\.app$/.test(new URL(origin).hostname)
  );
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
```

**Fluxo do handler** (`Deno.serve`):
1. `OPTIONS` → 204 com `corsHeaders(origin)`.
2. Validar `x-hub-secret` contra `Deno.env.get("HUB_API_SECRET")`. Mismatch → `401 { error: "Unauthorized" }`.
3. Parsear JSON; se `cliente_id` ausente → `400 { error: "cliente_id obrigatório" }`.
4. Criar `supabase` client com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass intencional, acesso já controlado pelo secret).
5. `from("crm_clientes").select("id, razao_social, nome_fantasia, cnpj, email, telefone, cidade, uf, segmento, porte").eq("id", cliente_id).eq("status", "ativo").maybeSingle()` → ausente → `404 { error: "Cliente não encontrado" }`.
6. `from("crm_funcionarios").select("id, nome, cpf, email, telefone, cargo, setor, data_admissao, status").eq("cliente_id", cliente_id).eq("status", "ativo").order("nome")`.
7. Retornar `200` no formato:
```json
{
  "empresa": { "hub_id": "...", "razao_social": "...", ... },
  "funcionarios": [ { "hub_id": "...", "nome": "...", ... } ],
  "total": 12
}
```
8. `try/catch` global → `500 { error: "Erro interno" }` com log via `console.error`.

### 3. Configuração — `supabase/config.toml`
Adicionar bloco para tornar a função pública:
```toml
[functions.get-empresa-funcionarios]
verify_jwt = false
```

### 4. Deploy
Após criar os arquivos, deploy via `deploy_edge_functions(["get-empresa-funcionarios"])`.

### 5. Validação
- Curl com header válido + cliente real → 200 com payload.
- Curl sem header / com header errado → 401.
- Curl sem `cliente_id` → 400.

### Endpoint final
`POST https://ixitjycjcgcfxwqduuit.supabase.co/functions/v1/get-empresa-funcionarios`

Headers:
```
Content-Type: application/json
x-hub-secret: <valor do HUB_API_SECRET>
```

### Não será alterado
- Nenhuma tabela, RLS, ou função existente.
- Nenhum outro arquivo do projeto.
- Fluxo de autenticação do CRM (`/app`) permanece intacto.

