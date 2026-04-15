

# Exibir convites pendentes e reenviar convites

## Problema
Usuários convidados que ainda não aceitaram o convite não aparecem na tabela `crm_usuarios` (são criados apenas no primeiro login). Não há como ver convites pendentes nem reenviá-los.

## Solução

### 1. Nova Edge Function: `pshub-list-pending-invites`
Lista usuários do `auth.users` que têm `invited_at` preenchido mas `email_confirmed_at` nulo. Usa service role para consultar `auth.users`. Retorna `[{ id, email, nome, invited_at }]`.

- Valida que o chamador é admin (mesmo padrão do `pshub-invite-user`)
- Query: `SELECT id, email, raw_user_meta_data->>'nome', invited_at FROM auth.users WHERE invited_at IS NOT NULL AND email_confirmed_at IS NULL`

### 2. Atualizar Edge Function: `pshub-invite-user`
Adicionar suporte a reenvio: se o body incluir `resend: true`, em vez de `inviteUserByEmail`, chamar `adminClient.auth.admin.generateLink({ type: 'invite', email })` ou simplesmente re-invocar `inviteUserByEmail` (que reenvia o email se o usuário já existe mas não confirmou).

### 3. Atualizar `src/pages/app/Usuarios.tsx`
- Adicionar query para buscar convites pendentes via `pshub-list-pending-invites`
- Exibir seção "Convites Pendentes" abaixo da tabela de usuários ativos
- Cada linha mostra: nome, email, data do convite, badge "pendente", botão "Reenviar"
- Botão "Reenviar" chama `pshub-invite-user` com `{ email, nome, resend: true }`
- Invalidar query de pendentes após reenvio ou novo convite

## Arquivos
1. `supabase/functions/pshub-list-pending-invites/index.ts` — nova edge function
2. `supabase/functions/pshub-invite-user/index.ts` — adicionar suporte a reenvio
3. `src/pages/app/Usuarios.tsx` — seção de convites pendentes + botão reenviar

