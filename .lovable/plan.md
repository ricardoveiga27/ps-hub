

## Causa raiz

A página pública `/proposta/:token` chama `supabase.rpc("aceitar_proposta_link", ...)` como cliente **anônimo**. A função RPC é `SECURITY DEFINER` e tem permissão `EXECUTE` para `anon`, certo. Porém ao executar o `UPDATE` em `crm_proposta_links`, dispara o trigger **`crm_proposta_links_block_aceite_edit`** → função `prevent_aceite_tamper()`, que só libera se:

```sql
v_role = 'service_role' OR session_user = 'postgres'
```

`auth.role()` dentro de uma função `SECURITY DEFINER` ainda retorna o **role do chamador** (`anon`), e `session_user` em chamadas via PostgREST é `authenticator`, não `postgres`. Resultado: o trigger sempre dispara e a função joga a exceção `Campos de aceite só podem ser alterados via função aceitar_proposta_link` — a própria função que está rodando. Por isso o aceite "dá erro".

A intenção do trigger é boa (impedir UPDATE direto via REST por usuários autenticados), mas a heurística está errada: ele bloqueia inclusive a função autorizada quando chamada por anon.

## Correção

Sinalizar dentro da função `aceitar_proposta_link` que o UPDATE foi feito por ela, e o trigger detecta esse sinal usando uma GUC de sessão.

### Migration (1 arquivo)

1. **Atualizar `aceitar_proposta_link`** para setar uma GUC local antes do UPDATE:

   ```sql
   PERFORM set_config('app.allow_aceite_update', 'on', true);  -- true = LOCAL à transação
   UPDATE public.crm_proposta_links SET ... ;
   ```

2. **Atualizar `prevent_aceite_tamper`** para liberar quando a GUC estiver setada:

   ```sql
   IF current_setting('app.allow_aceite_update', true) = 'on' THEN
     RETURN NEW;
   END IF;
   -- ... mantém checagens existentes (service_role / postgres / campos imutáveis)
   ```

   `current_setting(name, true)` retorna `NULL` quando a GUC não existe (não levanta erro). Como `set_config(..., true)` é local à transação, atacantes que façam UPDATE direto via REST não conseguem ativar a flag — apenas a função `SECURITY DEFINER` consegue.

3. Manter as checagens originais para `service_role`/`postgres` como fallback (não muda nada do comportamento já existente).

### Não alterar

- RLS de `crm_proposta_links` (continua exigindo `has_perfil(...)` para acesso direto via REST).
- `get_proposta_link_by_token` (continua funcionando para anon, é SECURITY DEFINER e só lê).
- Frontend `src/pages/PropostaPublica.tsx` — a chamada já está correta; nenhuma mudança necessária.
- Outros triggers da tabela.

### Validação após o fix

- Chamar `aceitar_proposta_link` como `anon` com um token válido → deve gravar `aceite_nome/cpf/cargo/aceite_em/status='aceita'` e retornar a row.
- Tentativa de UPDATE direto na tabela como `authenticated` sem perfil comercial → continua bloqueada por RLS.
- Tentativa de `UPDATE` direto como usuário comercial → ainda bloqueada pelo trigger (a GUC não está setada), preservando a regra "aceite só via função".

### Arquivo

- **Criar**: nova migration SQL aplicando as duas substituições `CREATE OR REPLACE FUNCTION` acima.

