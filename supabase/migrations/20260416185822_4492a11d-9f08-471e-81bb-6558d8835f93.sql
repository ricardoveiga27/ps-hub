-- ============================================================
-- 1) Bloquear UPDATE do próprio registro em crm_usuarios
-- ============================================================
-- Não existe policy de UPDATE para "self", mas vamos adicionar trigger
-- defensivo caso alguém adicione no futuro ou via service_role mal-uso.

CREATE OR REPLACE FUNCTION public.prevent_self_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o usuário autenticado está tentando alterar o PRÓPRIO registro
  IF auth.uid() IS NOT NULL AND NEW.id = auth.uid() THEN
    -- E está mudando QUALQUER flag de papel ou ativação
    IF NEW.is_admin     IS DISTINCT FROM OLD.is_admin
    OR NEW.is_comercial IS DISTINCT FROM OLD.is_comercial
    OR NEW.is_financeiro IS DISTINCT FROM OLD.is_financeiro
    OR NEW.is_operador  IS DISTINCT FROM OLD.is_operador
    OR NEW.is_ativo     IS DISTINCT FROM OLD.is_ativo THEN
      -- Permite somente se ele já é admin (admin pode editar qualquer um, inclusive a si mesmo)
      IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Usuário não pode alterar os próprios papéis ou status de ativação';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_usuarios_prevent_self_role_update ON public.crm_usuarios;
CREATE TRIGGER crm_usuarios_prevent_self_role_update
BEFORE UPDATE ON public.crm_usuarios
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_update();

-- ============================================================
-- 2) Proteger campos de aceite em crm_proposta_links
-- ============================================================
-- Trigger que impede qualquer UPDATE direto nos campos de aceite,
-- exceto quando vier do service_role (usado pelas funções SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.prevent_aceite_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- service_role e postgres podem tudo (usado pelas funções definer)
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

DROP TRIGGER IF EXISTS crm_proposta_links_block_aceite_edit ON public.crm_proposta_links;
CREATE TRIGGER crm_proposta_links_block_aceite_edit
BEFORE UPDATE ON public.crm_proposta_links
FOR EACH ROW
EXECUTE FUNCTION public.prevent_aceite_tamper();