

# Sistema de Perfis e Permissoes — PS Hub

## Resumo

Implementar controle de acesso baseado em perfis booleanos (`is_comercial`, `is_financeiro`, `is_operador`, `is_admin`) com tabela `crm_usuarios`, RLS nas tabelas existentes, menu dinamico no sidebar, tela de "acesso pendente" e pagina de gestao de usuarios (admin only).

## Correcoes necessarias no SQL proposto

O SQL do prompt tem 3 problemas que serao corrigidos:

1. **Recursao RLS**: As policies de `crm_usuarios` referenciam a propria tabela (`EXISTS (SELECT 1 FROM crm_usuarios WHERE ...)`). Sera usada a funcao `get_meu_perfil()` (SECURITY DEFINER) em todas as policies para evitar recursao infinita.

2. **Trigger em auth.users**: Criar trigger em `auth.users` nao e permitido (schema reservado). Em vez disso, o perfil sera criado automaticamente no `useAuth.ts` — apos login, se nao existir registro em `crm_usuarios`, insere com valores default. A policy de INSERT permitira que o proprio usuario crie seu registro.

3. **Nome da funcao de updated_at**: O projeto usa `update_updated_at_column()`, nao `update_updated_at()`.

## 1. Migration Supabase

```sql
-- Tabela crm_usuarios
CREATE TABLE crm_usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  is_ativo boolean NOT NULL DEFAULT true,
  is_comercial boolean NOT NULL DEFAULT false,
  is_financeiro boolean NOT NULL DEFAULT false,
  is_operador boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_crm_usuarios_updated_at
  BEFORE UPDATE ON crm_usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE crm_usuarios ENABLE ROW LEVEL SECURITY;

-- Security definer helper (evita recursao RLS)
CREATE OR REPLACE FUNCTION get_meu_perfil()
RETURNS TABLE(is_admin boolean, is_comercial boolean, is_financeiro boolean, is_operador boolean, is_ativo boolean)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT is_admin, is_comercial, is_financeiro, is_operador, is_ativo
  FROM crm_usuarios WHERE id = auth.uid();
$$;

-- Helper booleano para policies
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM crm_usuarios WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION is_active_with_any_role()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((
    SELECT is_ativo AND (is_admin OR is_comercial OR is_financeiro OR is_operador)
    FROM crm_usuarios WHERE id = auth.uid()
  ), false);
$$;

CREATE OR REPLACE FUNCTION has_perfil(_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((
    SELECT is_ativo AND (
      is_admin
      OR ('comercial' = ANY(_roles) AND is_comercial)
      OR ('financeiro' = ANY(_roles) AND is_financeiro)
      OR ('operador' = ANY(_roles) AND is_operador)
    )
    FROM crm_usuarios WHERE id = auth.uid()
  ), false);
$$;

-- RLS crm_usuarios
CREATE POLICY "self_select" ON crm_usuarios FOR SELECT USING (id = auth.uid());
CREATE POLICY "self_insert" ON crm_usuarios FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "admin_select_all" ON crm_usuarios FOR SELECT USING (is_admin_user());
CREATE POLICY "admin_update_all" ON crm_usuarios FOR UPDATE USING (is_admin_user());

-- Drop existing permissive policies on CRM tables, replace with role-based
-- (for each table: drop old "Authenticated users can ..." policies, create new ones)

-- crm_clientes
DROP POLICY IF EXISTS "Authenticated users can select crm_clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can insert crm_clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can update crm_clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can delete crm_clientes" ON crm_clientes;
CREATE POLICY "perfil_select_clientes" ON crm_clientes FOR SELECT USING (has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_clientes" ON crm_clientes FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_clientes" ON crm_clientes FOR UPDATE USING (has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_clientes" ON crm_clientes FOR DELETE USING (has_perfil(ARRAY['comercial']));

-- crm_propostas (same pattern)
DROP POLICY IF EXISTS "Authenticated users can select crm_propostas" ON crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_propostas" ON crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can update crm_propostas" ON crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_propostas" ON crm_propostas;
CREATE POLICY "perfil_select_propostas" ON crm_propostas FOR SELECT USING (has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_insert_propostas" ON crm_propostas FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_propostas" ON crm_propostas FOR UPDATE USING (has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_propostas" ON crm_propostas FOR DELETE USING (has_perfil(ARRAY['comercial']));

-- crm_contratos
DROP POLICY IF EXISTS "Authenticated users can select crm_contratos" ON crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can insert crm_contratos" ON crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can update crm_contratos" ON crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can delete crm_contratos" ON crm_contratos;
CREATE POLICY "perfil_select_contratos" ON crm_contratos FOR SELECT USING (has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_contratos" ON crm_contratos FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_contratos" ON crm_contratos FOR UPDATE USING (has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_contratos" ON crm_contratos FOR DELETE USING (has_perfil(ARRAY['comercial','operador']));

-- crm_faturas
DROP POLICY IF EXISTS "Authenticated users can select crm_faturas" ON crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_faturas" ON crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can update crm_faturas" ON crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_faturas" ON crm_faturas;
CREATE POLICY "perfil_select_faturas" ON crm_faturas FOR SELECT USING (has_perfil(ARRAY['financeiro','comercial']));
CREATE POLICY "perfil_insert_faturas" ON crm_faturas FOR INSERT WITH CHECK (has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_update_faturas" ON crm_faturas FOR UPDATE USING (has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_delete_faturas" ON crm_faturas FOR DELETE USING (has_perfil(ARRAY['financeiro']));

-- crm_assinaturas
DROP POLICY IF EXISTS "Authenticated users can select crm_assinaturas" ON crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_assinaturas" ON crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can update crm_assinaturas" ON crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_assinaturas" ON crm_assinaturas;
CREATE POLICY "perfil_select_assinaturas" ON crm_assinaturas FOR SELECT USING (has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_assinaturas" ON crm_assinaturas FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_assinaturas" ON crm_assinaturas FOR UPDATE USING (has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_assinaturas" ON crm_assinaturas FOR DELETE USING (has_perfil(ARRAY['comercial','operador']));

-- crm_pacotes
DROP POLICY IF EXISTS "Authenticated users can select crm_pacotes" ON crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can insert crm_pacotes" ON crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can update crm_pacotes" ON crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can delete crm_pacotes" ON crm_pacotes;
CREATE POLICY "perfil_select_pacotes" ON crm_pacotes FOR SELECT USING (is_active_with_any_role());
CREATE POLICY "perfil_write_pacotes" ON crm_pacotes FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY "perfil_update_pacotes" ON crm_pacotes FOR UPDATE USING (is_admin_user());
CREATE POLICY "perfil_delete_pacotes" ON crm_pacotes FOR DELETE USING (is_admin_user());

-- crm_contatos, crm_proposta_links, crm_proposta_templates,
-- crm_notas_fiscais, crm_asaas_config, crm_asaas_customers,
-- crm_reajustes, crm_webhook_events, licencas_ativas
-- (same drop + recreate pattern, using has_perfil with appropriate roles)
```

All helper functions use SECURITY DEFINER to avoid RLS recursion.

## 2. `src/hooks/useAuth.ts` — Adicionar perfil

- Add `PerfilUsuario` interface and `perfil` state
- After auth state resolves, fetch from `crm_usuarios`
- If no record exists, auto-insert with `{ id, nome: email.split('@')[0], email }` (replaces the trigger on auth.users)
- Export `perfil` and `temAcesso` boolean

## 3. `src/components/app/AppLayout.tsx` — Guard de acesso

- Use `temAcesso` from `useAuth()`
- If authenticated but `!temAcesso`, show "Acesso pendente" screen with sign-out button
- Otherwise render normal layout

## 4. `src/components/app/AppSidebar.tsx` — Menu dinamico

- Replace static `menuItems` with filtered array based on `perfil` flags
- Add "Usuarios" item visible only when `is_admin`
- Show profile badges in footer (comercial, financeiro, operador)
- `is_admin` badge NOT shown (per spec)

## 5. `src/pages/app/Usuarios.tsx` — Nova pagina (admin only)

- Table listing all `crm_usuarios` with nome, email, badges, ativo toggle
- Inline Switch toggles for `is_comercial`, `is_financeiro`, `is_operador`, `is_ativo`
- `is_admin` never shown
- "Convidar usuario" button calling edge function
- React Query for data fetching and invalidation

## 6. `supabase/functions/pshub-invite-user/index.ts` — Edge Function

- Validates caller is admin via `getClaims()` + query `crm_usuarios`
- Uses service role client to call `auth.admin.inviteUserByEmail()`
- CORS headers, input validation

## 7. `src/App.tsx` — Nova rota

- Add `<Route path="usuarios" element={<Usuarios />} />` inside `/app`

## Arquivos criados/editados

1. `supabase/migrations/` — nova migration (tabela + funcoes SECURITY DEFINER + RLS completo)
2. `src/hooks/useAuth.ts` — perfil + auto-create + temAcesso
3. `src/components/app/AppLayout.tsx` — guard de acesso pendente
4. `src/components/app/AppSidebar.tsx` — menu dinamico + badges
5. `src/pages/app/Usuarios.tsx` — pagina de gestao (nova)
6. `supabase/functions/pshub-invite-user/index.ts` — edge function (nova)
7. `src/App.tsx` — rota /app/usuarios

## Nota importante

Apos a migration, o usuario master atual precisara ter seu registro em `crm_usuarios` com `is_admin = true` via SQL direto (INSERT ou UPDATE). Isso sera feito automaticamente pelo `useAuth` na proxima autenticacao (cria registro com defaults), e depois o admin flag sera setado manualmente via banco.

