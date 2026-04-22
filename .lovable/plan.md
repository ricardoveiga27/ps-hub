

## Aba "Acessos" no detalhe do cliente

> Observação: o projeto não tem um `EmpresaDrawer.tsx`. O componente equivalente é `src/components/clientes/ClienteDetalhe.tsx` (Tabs Dados/Contatos/Funcionários/Propostas/Contratos/Financeiro). A aba **Acessos** será adicionada lá, após **Funcionários**.

### Arquitetura

```text
ClienteDetalhe (aba Acessos)
        │
        ├── Status: fetch direto (REST PostgREST) em PS Cultura/PS Index com anon key publicada *(ver pergunta abaixo)*
        │
        └── Botões "Enviar/Reenviar"
                  │ supabase.functions.invoke (JWT do admin)
                  ▼
        Edge Function: send-product-invite  (verify_jwt = true)
                  │ valida is_admin
                  │ resolve empresa_id por hub_id em cada produto
                  │ chama invite-rh / invite-user
                  ▼
        PS Cultura ── invite-rh   (Bearer PS_CULTURA_ANON_KEY + x-hub-secret)
        PS Index   ── invite-user (Bearer PS_INDEX_ANON_KEY)
```

### 1. Secrets necessários (Lovable Cloud)

Solicitarei via `add_secret`:
- `PS_CULTURA_ANON_KEY`
- `PS_INDEX_ANON_KEY`

`HUB_API_SECRET` já existe e será reutilizado.

### 2. Edge Function — `supabase/functions/send-product-invite/index.ts`

- `Deno.serve` com CORS (mesmo padrão da `get-empresa-funcionarios`).
- `OPTIONS` → 204.
- Lê `Authorization: Bearer <jwt>`. Cria cliente Supabase com o JWT do chamador, chama `auth.getUser()`. Sem user → 401.
- Consulta `crm_usuarios.is_admin` para o `user.id`. Não admin → 403.
- Body validado: `{ produto: 'ps_cultura' | 'ps_index' | 'todos', email: string, nome: string, cliente_hub_id: string }`. Inválido → 400.
- Para cada produto solicitado:
  1. `GET https://<projeto>.supabase.co/rest/v1/empresas?hub_id=eq.{cliente_hub_id}&select=id` com `apikey` + `Authorization: Bearer <ANON_KEY do produto>`.
  2. Se vazio → resultado `{ enviado: false, motivo: "empresa não importada no produto" }`.
  3. Senão `POST` para a Edge Function de convite do produto:
     - **PS Cultura**: `…/functions/v1/invite-rh` com `Authorization: Bearer PS_CULTURA_ANON_KEY` + `x-hub-secret: HUB_API_SECRET`, body `{ email, empresa_id, nome }`.
     - **PS Index**: `…/functions/v1/invite-user` com `Authorization: Bearer PS_INDEX_ANON_KEY`, body `{ email, nome, empresa_id }`.
  4. Capturar status HTTP e mensagem; nunca propagar exceção (uso de `try/catch` por produto).
- Resposta 200:
  ```json
  {
    "ps_cultura": { "enviado": true, "motivo": null },
    "ps_index":   { "enviado": false, "motivo": "empresa não importada no produto" }
  }
  ```
  Produtos não solicitados retornam `null` no campo correspondente.
- `console.log` de cada chamada (sem expor secret), `console.error` em falhas.
- `supabase/config.toml`: como `verify_jwt = true` é o padrão do Lovable e a função autentica via JWT, **não** adicionarei bloco para essa função.

### 3. Aba "Acessos" — `src/components/clientes/ClienteDetalhe.tsx`

Adicionar `<TabsTrigger value="acessos">Acessos</TabsTrigger>` após "Funcionários" e o respectivo `<TabsContent value="acessos">` renderizando um novo componente:

**Novo arquivo**: `src/components/clientes/AcessosTab.tsx`

Props: `{ clienteHubId: string; emailDefault: string | null }`.

Estado local:
- `email` (string, default `emailDefault ?? ""`, editável via `<Input />`).
- Mutations React Query: `enviarCultura`, `enviarIndex`, `enviarTodos`.

Queries de status (React Query, `staleTime` curto):
- **PS Cultura**: 
  1. `GET https://fyelzagqyyluuinheegn.supabase.co/rest/v1/empresas?hub_id=eq.{clienteHubId}&select=id` com `PS_CULTURA_ANON_KEY` *(ver questão crítica abaixo sobre como o frontend obtém esse anon key)*.
  2. Se existir, `GET …/rest/v1/perfis?empresa_id=eq.{id}&role=eq.cliente&select=invite_sent_at,invite_accepted_at,nome`.
  3. Derivar status:
     - sem registro → `sem_rh`
     - `invite_accepted_at` preenchido → `ativo`
     - `invite_sent_at` há > 7 dias e sem aceite → `expirado`
     - caso contrário → `pendente`
- **PS Index**: 
  1. mesma busca em `/rest/v1/empresas?hub_id=eq.{clienteHubId}`.
  2. `GET …/rest/v1/user_roles?empresa_id=eq.{id}&role=eq.admin_empresa&select=id,created_at`.
  3. Status: `configurado` se >0 linhas, senão `nao_configurado`.

Layout (light theme, padrão CRM):
- `<Card>` PS Cultura — badge verde `bg-emerald-500/15 text-emerald-700`, status badge dinâmico, email do RH (quando `ativo`), botão `"Enviar convite"` ou `"Reenviar convite"` conforme status.
- `<Card>` PS Index — badge violeta `bg-violet-500/15 text-violet-700`, status badge, botão idem.
- `<Input>` para email (label "Email do convite") com fallback no email do cliente.
- Botão principal verde `"Enviar todos os convites"` que dispara `produto: 'todos'`.
- Loading: `disabled` + spinner durante mutation.
- Toasts (`sonner`): um por produto com base na resposta (`success` se `enviado`, `error` com `motivo` caso contrário).
- Após sucesso, `queryClient.invalidateQueries` das queries de status.

Mutations chamam:
```ts
supabase.functions.invoke("send-product-invite", {
  body: { produto, email, nome: cliente.razao_social, cliente_hub_id: id }
});
```

### 4. Pergunta crítica antes de implementar

O plano original diz "consultar via fetch as tabelas de perfis de cada produto" diretamente do **navegador**. Isso exige expor `PS_CULTURA_ANON_KEY` e `PS_INDEX_ANON_KEY` no bundle do PS Hub (anon key é pública por design no Supabase, mas amplia a superfície de ataque permitindo qualquer pessoa fazer leituras autenticadas como `anon` nesses projetos).

Preciso decidir como o frontend obtém o status dos produtos:
- **A. Adicionar uma rota `GET status` na Edge Function `send-product-invite`** (ou criar `get-product-access-status`) que faz as consultas server-side usando os secrets. Frontend chama só essa função autenticado como admin. **Recomendado**: secrets ficam server-side, RLS dos produtos não precisa permitir anon, e o status já vem normalizado (`sem_rh | pendente | expirado | ativo` / `configurado | nao_configurado`).
- **B. Expor PS_CULTURA_ANON_KEY e PS_INDEX_ANON_KEY como `VITE_*` no frontend** e fazer fetch direto. Mais simples, porém anon key precisa estar publicada e o RLS dos produtos precisa permitir SELECT em `empresas`/`perfis`/`user_roles` para `anon` (provavelmente não permite hoje).

Se você confirmar **A** (recomendado), eu:
- Mudo a Edge Function para aceitar `{ action: 'status' | 'invite', ... }` (ou crio função separada).
- Frontend faz tudo via `supabase.functions.invoke`, sem expor anon keys de outros projetos.

### 5. Não será alterado

- Outras abas do `ClienteDetalhe` (Dados/Contatos/Funcionários/Propostas/Contratos/Financeiro) permanecem intactas.
- `pshub-invite-user` (convite interno do CRM) intocada.
- Edge Functions já existentes (`get-clientes-hub`, `get-empresa-funcionarios`, `sync-to-products`) intocadas.
- Tabelas, RLS, autenticação do CRM.

### Arquivos

- **Criar**: `supabase/functions/send-product-invite/index.ts`
- **Criar**: `src/components/clientes/AcessosTab.tsx`
- **Editar**: `src/components/clientes/ClienteDetalhe.tsx` (adicionar `TabsTrigger` + `TabsContent`)
- **Secrets**: `PS_CULTURA_ANON_KEY`, `PS_INDEX_ANON_KEY` (via `add_secret` após sua confirmação da abordagem A vs B)

