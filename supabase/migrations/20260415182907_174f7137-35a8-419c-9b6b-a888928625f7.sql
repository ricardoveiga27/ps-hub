
-- Tabela crm_usuarios
CREATE TABLE public.crm_usuarios (
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
  BEFORE UPDATE ON public.crm_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_usuarios ENABLE ROW LEVEL SECURITY;

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.get_meu_perfil()
RETURNS TABLE(is_admin boolean, is_comercial boolean, is_financeiro boolean, is_operador boolean, is_ativo boolean)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT u.is_admin, u.is_comercial, u.is_financeiro, u.is_operador, u.is_ativo
  FROM crm_usuarios u WHERE u.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((SELECT u.is_admin FROM crm_usuarios u WHERE u.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_active_with_any_role()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((
    SELECT u.is_ativo AND (u.is_admin OR u.is_comercial OR u.is_financeiro OR u.is_operador)
    FROM crm_usuarios u WHERE u.id = auth.uid()
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.has_perfil(_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT COALESCE((
    SELECT u.is_ativo AND (
      u.is_admin
      OR ('comercial' = ANY(_roles) AND u.is_comercial)
      OR ('financeiro' = ANY(_roles) AND u.is_financeiro)
      OR ('operador' = ANY(_roles) AND u.is_operador)
    )
    FROM crm_usuarios u WHERE u.id = auth.uid()
  ), false);
$$;

-- RLS crm_usuarios
CREATE POLICY "self_select" ON public.crm_usuarios FOR SELECT USING (id = auth.uid());
CREATE POLICY "self_insert" ON public.crm_usuarios FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "admin_select_all" ON public.crm_usuarios FOR SELECT USING (public.is_admin_user());
CREATE POLICY "admin_update_all" ON public.crm_usuarios FOR UPDATE USING (public.is_admin_user());

-- crm_clientes
DROP POLICY IF EXISTS "Authenticated users can select crm_clientes" ON public.crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can insert crm_clientes" ON public.crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can update crm_clientes" ON public.crm_clientes;
DROP POLICY IF EXISTS "Authenticated users can delete crm_clientes" ON public.crm_clientes;
CREATE POLICY "perfil_select_clientes" ON public.crm_clientes FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_clientes" ON public.crm_clientes FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_clientes" ON public.crm_clientes FOR UPDATE USING (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_clientes" ON public.crm_clientes FOR DELETE USING (public.has_perfil(ARRAY['comercial']));

-- crm_propostas
DROP POLICY IF EXISTS "Authenticated users can select crm_propostas" ON public.crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_propostas" ON public.crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can update crm_propostas" ON public.crm_propostas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_propostas" ON public.crm_propostas;
CREATE POLICY "perfil_select_propostas" ON public.crm_propostas FOR SELECT USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_insert_propostas" ON public.crm_propostas FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_propostas" ON public.crm_propostas FOR UPDATE USING (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_propostas" ON public.crm_propostas FOR DELETE USING (public.has_perfil(ARRAY['comercial']));

-- crm_contratos
DROP POLICY IF EXISTS "Authenticated users can select crm_contratos" ON public.crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can insert crm_contratos" ON public.crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can update crm_contratos" ON public.crm_contratos;
DROP POLICY IF EXISTS "Authenticated users can delete crm_contratos" ON public.crm_contratos;
CREATE POLICY "perfil_select_contratos" ON public.crm_contratos FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_contratos" ON public.crm_contratos FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_contratos" ON public.crm_contratos FOR UPDATE USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_contratos" ON public.crm_contratos FOR DELETE USING (public.has_perfil(ARRAY['comercial','operador']));

-- crm_faturas
DROP POLICY IF EXISTS "Authenticated users can select crm_faturas" ON public.crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_faturas" ON public.crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can update crm_faturas" ON public.crm_faturas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_faturas" ON public.crm_faturas;
CREATE POLICY "perfil_select_faturas" ON public.crm_faturas FOR SELECT USING (public.has_perfil(ARRAY['financeiro','comercial']));
CREATE POLICY "perfil_insert_faturas" ON public.crm_faturas FOR INSERT WITH CHECK (public.has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_update_faturas" ON public.crm_faturas FOR UPDATE USING (public.has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_delete_faturas" ON public.crm_faturas FOR DELETE USING (public.has_perfil(ARRAY['financeiro']));

-- crm_assinaturas
DROP POLICY IF EXISTS "Authenticated users can select crm_assinaturas" ON public.crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can insert crm_assinaturas" ON public.crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can update crm_assinaturas" ON public.crm_assinaturas;
DROP POLICY IF EXISTS "Authenticated users can delete crm_assinaturas" ON public.crm_assinaturas;
CREATE POLICY "perfil_select_assinaturas" ON public.crm_assinaturas FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_assinaturas" ON public.crm_assinaturas FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_assinaturas" ON public.crm_assinaturas FOR UPDATE USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_assinaturas" ON public.crm_assinaturas FOR DELETE USING (public.has_perfil(ARRAY['comercial','operador']));

-- crm_pacotes
DROP POLICY IF EXISTS "Authenticated users can select crm_pacotes" ON public.crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can insert crm_pacotes" ON public.crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can update crm_pacotes" ON public.crm_pacotes;
DROP POLICY IF EXISTS "Authenticated users can delete crm_pacotes" ON public.crm_pacotes;
CREATE POLICY "perfil_select_pacotes" ON public.crm_pacotes FOR SELECT USING (public.is_active_with_any_role());
CREATE POLICY "perfil_insert_pacotes" ON public.crm_pacotes FOR INSERT WITH CHECK (public.is_admin_user());
CREATE POLICY "perfil_update_pacotes" ON public.crm_pacotes FOR UPDATE USING (public.is_admin_user());
CREATE POLICY "perfil_delete_pacotes" ON public.crm_pacotes FOR DELETE USING (public.is_admin_user());

-- crm_contatos
DROP POLICY IF EXISTS "Authenticated users can select crm_contatos" ON public.crm_contatos;
DROP POLICY IF EXISTS "Authenticated users can insert crm_contatos" ON public.crm_contatos;
DROP POLICY IF EXISTS "Authenticated users can update crm_contatos" ON public.crm_contatos;
DROP POLICY IF EXISTS "Authenticated users can delete crm_contatos" ON public.crm_contatos;
CREATE POLICY "perfil_select_contatos" ON public.crm_contatos FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_contatos" ON public.crm_contatos FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_contatos" ON public.crm_contatos FOR UPDATE USING (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_contatos" ON public.crm_contatos FOR DELETE USING (public.has_perfil(ARRAY['comercial']));

-- crm_proposta_links (keep anon policies, replace authenticated)
DROP POLICY IF EXISTS "Authenticated users can select crm_proposta_links" ON public.crm_proposta_links;
DROP POLICY IF EXISTS "Authenticated users can insert crm_proposta_links" ON public.crm_proposta_links;
DROP POLICY IF EXISTS "Authenticated users can update crm_proposta_links" ON public.crm_proposta_links;
DROP POLICY IF EXISTS "Authenticated users can delete crm_proposta_links" ON public.crm_proposta_links;
CREATE POLICY "perfil_select_proposta_links" ON public.crm_proposta_links FOR SELECT USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_insert_proposta_links" ON public.crm_proposta_links FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_update_proposta_links" ON public.crm_proposta_links FOR UPDATE USING (public.has_perfil(ARRAY['comercial']));
CREATE POLICY "perfil_delete_proposta_links" ON public.crm_proposta_links FOR DELETE USING (public.has_perfil(ARRAY['comercial']));

-- crm_proposta_templates
DROP POLICY IF EXISTS "Authenticated users can select crm_proposta_templates" ON public.crm_proposta_templates;
DROP POLICY IF EXISTS "Authenticated users can insert crm_proposta_templates" ON public.crm_proposta_templates;
DROP POLICY IF EXISTS "Authenticated users can update crm_proposta_templates" ON public.crm_proposta_templates;
DROP POLICY IF EXISTS "Authenticated users can delete crm_proposta_templates" ON public.crm_proposta_templates;
CREATE POLICY "perfil_select_proposta_templates" ON public.crm_proposta_templates FOR SELECT USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_insert_proposta_templates" ON public.crm_proposta_templates FOR INSERT WITH CHECK (public.is_admin_user());
CREATE POLICY "perfil_update_proposta_templates" ON public.crm_proposta_templates FOR UPDATE USING (public.is_admin_user());
CREATE POLICY "perfil_delete_proposta_templates" ON public.crm_proposta_templates FOR DELETE USING (public.is_admin_user());

-- crm_notas_fiscais
DROP POLICY IF EXISTS "Authenticated users can select crm_notas_fiscais" ON public.crm_notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can insert crm_notas_fiscais" ON public.crm_notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can update crm_notas_fiscais" ON public.crm_notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can delete crm_notas_fiscais" ON public.crm_notas_fiscais;
CREATE POLICY "perfil_select_notas_fiscais" ON public.crm_notas_fiscais FOR SELECT USING (public.has_perfil(ARRAY['financeiro','comercial']));
CREATE POLICY "perfil_insert_notas_fiscais" ON public.crm_notas_fiscais FOR INSERT WITH CHECK (public.has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_update_notas_fiscais" ON public.crm_notas_fiscais FOR UPDATE USING (public.has_perfil(ARRAY['financeiro']));
CREATE POLICY "perfil_delete_notas_fiscais" ON public.crm_notas_fiscais FOR DELETE USING (public.has_perfil(ARRAY['financeiro']));

-- crm_asaas_config
DROP POLICY IF EXISTS "Authenticated users can select crm_asaas_config" ON public.crm_asaas_config;
DROP POLICY IF EXISTS "Authenticated users can insert crm_asaas_config" ON public.crm_asaas_config;
DROP POLICY IF EXISTS "Authenticated users can update crm_asaas_config" ON public.crm_asaas_config;
DROP POLICY IF EXISTS "Authenticated users can delete crm_asaas_config" ON public.crm_asaas_config;
CREATE POLICY "perfil_select_asaas_config" ON public.crm_asaas_config FOR SELECT USING (public.is_admin_user());
CREATE POLICY "perfil_insert_asaas_config" ON public.crm_asaas_config FOR INSERT WITH CHECK (public.is_admin_user());
CREATE POLICY "perfil_update_asaas_config" ON public.crm_asaas_config FOR UPDATE USING (public.is_admin_user());
CREATE POLICY "perfil_delete_asaas_config" ON public.crm_asaas_config FOR DELETE USING (public.is_admin_user());

-- crm_asaas_customers
DROP POLICY IF EXISTS "Authenticated users can select crm_asaas_customers" ON public.crm_asaas_customers;
DROP POLICY IF EXISTS "Authenticated users can insert crm_asaas_customers" ON public.crm_asaas_customers;
DROP POLICY IF EXISTS "Authenticated users can update crm_asaas_customers" ON public.crm_asaas_customers;
DROP POLICY IF EXISTS "Authenticated users can delete crm_asaas_customers" ON public.crm_asaas_customers;
CREATE POLICY "perfil_select_asaas_customers" ON public.crm_asaas_customers FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro']));
CREATE POLICY "perfil_insert_asaas_customers" ON public.crm_asaas_customers FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial','financeiro']));
CREATE POLICY "perfil_update_asaas_customers" ON public.crm_asaas_customers FOR UPDATE USING (public.has_perfil(ARRAY['comercial','financeiro']));
CREATE POLICY "perfil_delete_asaas_customers" ON public.crm_asaas_customers FOR DELETE USING (public.is_admin_user());

-- crm_reajustes
DROP POLICY IF EXISTS "Authenticated users can select crm_reajustes" ON public.crm_reajustes;
DROP POLICY IF EXISTS "Authenticated users can insert crm_reajustes" ON public.crm_reajustes;
DROP POLICY IF EXISTS "Authenticated users can update crm_reajustes" ON public.crm_reajustes;
DROP POLICY IF EXISTS "Authenticated users can delete crm_reajustes" ON public.crm_reajustes;
CREATE POLICY "perfil_select_reajustes" ON public.crm_reajustes FOR SELECT USING (public.has_perfil(ARRAY['comercial','financeiro','operador']));
CREATE POLICY "perfil_insert_reajustes" ON public.crm_reajustes FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_reajustes" ON public.crm_reajustes FOR UPDATE USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_reajustes" ON public.crm_reajustes FOR DELETE USING (public.has_perfil(ARRAY['comercial','operador']));

-- crm_webhook_events (keep service_role, replace authenticated)
DROP POLICY IF EXISTS "Authenticated users can select webhook_events" ON public.crm_webhook_events;
DROP POLICY IF EXISTS "Authenticated users can insert webhook_events" ON public.crm_webhook_events;
CREATE POLICY "perfil_select_webhook_events" ON public.crm_webhook_events FOR SELECT USING (public.is_admin_user());

-- licencas_ativas
DROP POLICY IF EXISTS "Authenticated users can select licencas_ativas" ON public.licencas_ativas;
DROP POLICY IF EXISTS "Authenticated users can insert licencas_ativas" ON public.licencas_ativas;
DROP POLICY IF EXISTS "Authenticated users can update licencas_ativas" ON public.licencas_ativas;
DROP POLICY IF EXISTS "Authenticated users can delete licencas_ativas" ON public.licencas_ativas;
CREATE POLICY "perfil_select_licencas" ON public.licencas_ativas FOR SELECT USING (public.is_active_with_any_role());
CREATE POLICY "perfil_insert_licencas" ON public.licencas_ativas FOR INSERT WITH CHECK (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_update_licencas" ON public.licencas_ativas FOR UPDATE USING (public.has_perfil(ARRAY['comercial','operador']));
CREATE POLICY "perfil_delete_licencas" ON public.licencas_ativas FOR DELETE USING (public.has_perfil(ARRAY['comercial','operador']));
