
-- 1) Corrigir handle_new_auth_user: novos signups inativos por padrão
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.crm_usuarios (id, nome, email, is_ativo, is_admin, is_comercial, is_financeiro, is_operador)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    false, false, false, false, false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) prevent_aceite_tamper: usar auth.role() em vez de claim manual
CREATE OR REPLACE FUNCTION public.prevent_aceite_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  BEGIN
    v_role := auth.role();
  EXCEPTION WHEN OTHERS THEN
    v_role := NULL;
  END;

  IF v_role = 'service_role' OR session_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF NEW.aceite_nome  IS DISTINCT FROM OLD.aceite_nome
  OR NEW.aceite_cpf   IS DISTINCT FROM OLD.aceite_cpf
  OR NEW.aceite_cargo IS DISTINCT FROM OLD.aceite_cargo
  OR NEW.aceite_em    IS DISTINCT FROM OLD.aceite_em
  OR NEW.ip_aceite    IS DISTINCT FROM OLD.ip_aceite
  OR NEW.status       IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Campos de aceite só podem ser alterados via função aceitar_proposta_link';
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Policy explícita de DELETE em crm_usuarios apenas para admin
DROP POLICY IF EXISTS admin_delete_usuarios ON public.crm_usuarios;
CREATE POLICY admin_delete_usuarios
ON public.crm_usuarios
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- 4) Grants explícitos nas funções públicas de proposta
REVOKE ALL ON FUNCTION public.get_proposta_link_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proposta_link_by_token(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.aceitar_proposta_link(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aceitar_proposta_link(text, text, text, text, text) TO anon, authenticated;
