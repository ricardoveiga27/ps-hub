

# Criar usuário master para acesso ao painel

## O que será feito

Criar um usuário de autenticação com as credenciais fornecidas para permitir login no PS Hub.

- **Email:** rveiga.dev@gmail.com
- **Senha:** Apto$1102$

## Passos técnicos

1. Usar a edge function ou o cliente Supabase Admin para criar o usuário via `supabase.auth.admin.createUser()` — como não temos acesso admin direto, vamos criar uma edge function temporária que cria o usuário e depois removê-la.

**Alternativa mais simples:** Habilitar auto-confirm temporariamente, fazer signup via código, e depois desabilitar auto-confirm. Ou usar o signup normal e confirmar o email manualmente via SQL.

2. **Abordagem escolhida:**
   - Criar o usuário via SQL direto usando a função `auth.create_user()` ou inserindo na tabela `auth.users` — porém isso não é permitido via `read_query`.
   - **Melhor caminho:** Criar uma edge function `create-admin-user` que usa o service role key para criar o usuário com email confirmado, executá-la uma vez, e depois deletá-la.

3. Criar edge function `supabase/functions/create-admin-user/index.ts`:
   - Usa `createClient` com service role key
   - Chama `auth.admin.createUser({ email, password, email_confirm: true })`
   - Retorna sucesso/erro

4. Fazer deploy automático, chamar a function uma vez via curl, e depois deletar a function.

