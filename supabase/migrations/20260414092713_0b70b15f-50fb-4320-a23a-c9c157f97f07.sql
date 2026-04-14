
-- Create crm_pacotes table
CREATE TABLE public.crm_pacotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  preco_por_vida numeric(10,2),
  faixa_min_vidas integer,
  faixa_max_vidas integer,
  cobranca_tipo text NOT NULL DEFAULT 'mensal',
  ps_index_ativo boolean NOT NULL DEFAULT true,
  ps_escuta_ativo boolean NOT NULL DEFAULT true,
  ps_cultura_ativo boolean NOT NULL DEFAULT true,
  ciclos_index_ano integer DEFAULT 1,
  franquia_relatos_tipo text NOT NULL DEFAULT 'por_func',
  franquia_relatos_qtd integer,
  excedente_relato_valor numeric(10,2),
  iris_ativo boolean NOT NULL DEFAULT false,
  suporte_coleta boolean NOT NULL DEFAULT false,
  followup_90dias boolean NOT NULL DEFAULT false,
  acompanhamento_continuo boolean NOT NULL DEFAULT false,
  modulo_liderancas boolean NOT NULL DEFAULT false,
  catalogo_completo boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  descontinuado_em timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_crm_pacotes_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('ativo', 'legado', 'cancelado') THEN
    RAISE EXCEPTION 'Status inválido: %. Valores permitidos: ativo, legado, cancelado', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_crm_pacotes_status
  BEFORE INSERT OR UPDATE ON public.crm_pacotes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_crm_pacotes_status();

-- Apply existing updated_at trigger
CREATE TRIGGER update_crm_pacotes_updated_at
  BEFORE UPDATE ON public.crm_pacotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.crm_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select crm_pacotes"
  ON public.crm_pacotes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert crm_pacotes"
  ON public.crm_pacotes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update crm_pacotes"
  ON public.crm_pacotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete crm_pacotes"
  ON public.crm_pacotes FOR DELETE TO authenticated USING (true);

-- Seed initial packages
INSERT INTO public.crm_pacotes (codigo, nome, status, preco_por_vida, faixa_min_vidas, faixa_max_vidas, cobranca_tipo, ciclos_index_ano, franquia_relatos_tipo, franquia_relatos_qtd, excedente_relato_valor, iris_ativo, suporte_coleta, followup_90dias, acompanhamento_continuo, modulo_liderancas, catalogo_completo, ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo)
VALUES
  ('ESSENCIAL-2026', 'Essencial', 'ativo', 18.00, 1, 10, 'anual_12x', 1, 'fixo', 10, 150.00, false, false, false, false, false, false, true, true, true),
  ('ESSENCIAL-PLUS-2026', 'Essencial Plus', 'ativo', 10.00, 11, 49, 'anual_12x', 1, 'por_func', 1, 110.00, false, false, false, false, true, false, true, true, true),
  ('PROFISSIONAL-2026', 'Profissional', 'ativo', 8.00, 50, 199, 'mensal', 2, 'por_func', 1, 110.00, true, true, true, false, true, true, true, true, true),
  ('ENTERPRISE-2026', 'Enterprise', 'ativo', 6.00, 200, NULL, 'mensal', 999, 'por_func', 1, NULL, true, true, true, true, true, true, true, true, true);

-- Add pacote_id and snapshot_pacote to crm_contratos
ALTER TABLE public.crm_contratos
  ADD COLUMN pacote_id uuid REFERENCES public.crm_pacotes(id),
  ADD COLUMN snapshot_pacote jsonb;

-- Add pacote_id to crm_propostas
ALTER TABLE public.crm_propostas
  ADD COLUMN pacote_id uuid REFERENCES public.crm_pacotes(id);
