CREATE OR REPLACE FUNCTION public.prevent_aceite_tamper()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_flag text;
BEGIN
  -- Permite quando a função aceitar_proposta_link sinalizou via GUC local
  BEGIN
    v_flag := current_setting('app.allow_aceite_update', true);
  EXCEPTION WHEN OTHERS THEN
    v_flag := NULL;
  END;
  IF v_flag = 'on' THEN
    RETURN NEW;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.aceitar_proposta_link(_token text, _nome text, _cpf text, _cargo text, _ip text)
 RETURNS crm_proposta_links
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.crm_proposta_links;
BEGIN
  -- Sinaliza ao trigger prevent_aceite_tamper que este UPDATE é autorizado
  PERFORM set_config('app.allow_aceite_update', 'on', true);

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
$function$;