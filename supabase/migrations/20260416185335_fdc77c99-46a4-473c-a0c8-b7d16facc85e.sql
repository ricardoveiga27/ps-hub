-- ============================================
-- FIX 1: Privilege escalation em crm_usuarios
-- ============================================
DROP POLICY IF EXISTS self_insert ON public.crm_usuarios;

CREATE POLICY self_insert_no_roles
ON public.crm_usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND is_admin = false
  AND is_comercial = false
  AND is_financeiro = false
  AND is_operador = false
  AND is_ativo = false
);

-- Impede que usuários comuns alterem o próprio perfil para escalar privilégios.
-- (Admins continuam atualizando via policy admin_update_all.)
-- Nenhuma policy de UPDATE para self é criada.

-- ============================================
-- FIX 2: Acesso anônimo amplo a crm_proposta_links
-- ============================================
DROP POLICY IF EXISTS "Anon users can select crm_proposta_links by token" ON public.crm_proposta_links;
DROP POLICY IF EXISTS "Anon users can update crm_proposta_links for acceptance" ON public.crm_proposta_links;

-- Função pública para buscar UM link pelo token (usada na página pública)
CREATE OR REPLACE FUNCTION public.get_proposta_link_by_token(_token text)
RETURNS SETOF public.crm_proposta_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.crm_proposta_links WHERE token = _token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposta_link_by_token(text) TO anon, authenticated;

-- Função pública para registrar aceite de UM link específico (apenas se ainda aguardando)
CREATE OR REPLACE FUNCTION public.aceitar_proposta_link(
  _token text,
  _nome text,
  _cpf text,
  _cargo text,
  _ip text
)
RETURNS public.crm_proposta_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.crm_proposta_links;
BEGIN
  UPDATE public.crm_proposta_links
  SET aceite_nome = _nome,
      aceite_cpf  = _cpf,
      aceite_cargo = _cargo,
      ip_aceite   = _ip,
      aceite_em   = now(),
      status      = 'aceita'
  WHERE token = _token
    AND status = 'aguardando'
    AND expira_em > now()
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Link inválido, expirado ou já utilizado';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aceitar_proposta_link(text, text, text, text, text) TO anon, authenticated;