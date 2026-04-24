
-- 1. Tabela de auditoria de exclusões
CREATE TABLE IF NOT EXISTS public.crm_propostas_excluidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL,
  numero_proposta text,
  cliente_id uuid,
  motivo text NOT NULL,
  excluida_por uuid,
  excluida_por_nome text,
  excluida_em timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL
);

ALTER TABLE public.crm_propostas_excluidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY perfil_select_propostas_excluidas ON public.crm_propostas_excluidas
  FOR SELECT USING (has_perfil(ARRAY['comercial'::text]));

CREATE POLICY perfil_insert_propostas_excluidas ON public.crm_propostas_excluidas
  FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial'::text]));

-- 2. RPC aceitar_proposta_link com propagação completa
CREATE OR REPLACE FUNCTION public.aceitar_proposta_link(_token text, _nome text, _cpf text, _cargo text, _ip text)
RETURNS public.crm_proposta_links
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_link  public.crm_proposta_links;
  v_prop  public.crm_propostas;
  v_contrato_id uuid;
  v_dia_venc int;
BEGIN
  PERFORM set_config('app.allow_aceite_update', 'on', true);

  UPDATE public.crm_proposta_links
  SET aceite_nome=_nome, aceite_cpf=_cpf, aceite_cargo=_cargo,
      ip_aceite=_ip, aceite_em=now(), status='aceita'
  WHERE token=_token AND status='aguardando' AND expira_em>now()
  RETURNING * INTO v_link;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Link inválido, expirado ou já utilizado';
  END IF;

  SELECT * INTO v_prop FROM public.crm_propostas WHERE id = v_link.proposta_id FOR UPDATE;

  IF v_prop.status <> 'aceita' THEN
    UPDATE public.crm_propostas
    SET status='aceita', aceita_em=now(), updated_at=now()
    WHERE id=v_prop.id;
  END IF;

  UPDATE public.crm_clientes SET status='ativo', updated_at=now()
  WHERE id=v_prop.cliente_id AND status<>'ativo';

  IF NOT EXISTS (SELECT 1 FROM public.crm_contratos WHERE proposta_id=v_prop.id) THEN
    v_dia_venc := COALESCE((v_prop.snapshot_condicoes->>'dia_vencimento')::int, 10);
    INSERT INTO public.crm_contratos (
      cliente_id, proposta_id, pacote_id, vidas, valor_mensal,
      dia_vencimento, data_inicio, status, indice_reajuste,
      ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo, snapshot_pacote
    )
    SELECT v_prop.cliente_id, v_prop.id, v_prop.pacote_id, v_prop.vidas, v_prop.valor_final,
           v_dia_venc, CURRENT_DATE, 'ativo', 'IGPM',
           true, true, true,
           CASE WHEN p.id IS NOT NULL THEN to_jsonb(p.*) ELSE NULL END
    FROM (SELECT 1) x
    LEFT JOIN public.crm_pacotes p ON p.id = v_prop.pacote_id
    RETURNING id INTO v_contrato_id;

    IF v_contrato_id IS NOT NULL THEN
      INSERT INTO public.crm_assinaturas (
        cliente_id, contrato_id, valor, dia_vencimento, data_inicio, status
      ) VALUES (
        v_prop.cliente_id, v_contrato_id, v_prop.valor_final, v_dia_venc, CURRENT_DATE, 'ACTIVE'
      );
    END IF;
  END IF;

  RETURN v_link;
END;
$$;

-- 3. Realtime para crm_propostas
ALTER TABLE public.crm_propostas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_propostas;
