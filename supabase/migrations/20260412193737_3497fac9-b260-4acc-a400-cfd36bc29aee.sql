
-- ============================================
-- PS Hub CRM — Fase 1: Banco de Dados Completo
-- ============================================

-- 1. crm_clientes
CREATE TABLE public.crm_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text UNIQUE,
  segmento text,
  porte text,
  email text,
  telefone text,
  cidade text,
  uf text,
  status text NOT NULL DEFAULT 'prospecto',
  responsavel_comercial text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. crm_contatos
CREATE TABLE public.crm_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text,
  email text,
  telefone text,
  celular text,
  whatsapp text,
  principal boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. crm_propostas
CREATE TABLE public.crm_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  numero_proposta text UNIQUE,
  titulo text,
  vidas integer NOT NULL,
  valor_mensal numeric(10,2) NOT NULL,
  desconto_tipo text,
  desconto_valor numeric(10,2),
  valor_final numeric(10,2) NOT NULL,
  validade_dias integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'rascunho',
  snapshot_condicoes jsonb,
  enviada_em timestamptz,
  aceita_em timestamptz,
  recusada_em timestamptz,
  motivo_recusa text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. crm_contratos
CREATE TABLE public.crm_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid REFERENCES public.crm_propostas(id),
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  codigo_contrato text UNIQUE,
  vidas integer NOT NULL,
  valor_mensal numeric(10,2) NOT NULL,
  dia_vencimento integer NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  status text NOT NULL DEFAULT 'ativo',
  indice_reajuste text NOT NULL DEFAULT 'IGPM',
  percentual_reajuste_fixo numeric(5,2),
  data_proximo_reajuste date,
  ps_index_ativo boolean NOT NULL DEFAULT true,
  ps_escuta_ativo boolean NOT NULL DEFAULT true,
  ps_cultura_ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. crm_assinaturas
CREATE TABLE public.crm_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.crm_contratos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  asaas_customer_id text,
  valor numeric(10,2) NOT NULL,
  dia_vencimento integer NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  status text NOT NULL DEFAULT 'ACTIVE',
  ultimo_reajuste_em date,
  proximo_reajuste_em date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. crm_faturas
CREATE TABLE public.crm_faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL REFERENCES public.crm_assinaturas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  numero_fatura text UNIQUE,
  descricao text NOT NULL DEFAULT 'Licença PS Hub',
  valor numeric(10,2) NOT NULL,
  data_emissao date,
  data_vencimento date NOT NULL,
  periodo_referencia text,
  status text NOT NULL DEFAULT 'PENDING',
  asaas_payment_id text,
  asaas_customer_id text,
  boleto_url text,
  pix_qr_code text,
  pix_copy_paste text,
  invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. crm_notas_fiscais
CREATE TABLE public.crm_notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid UNIQUE NOT NULL REFERENCES public.crm_faturas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  asaas_invoice_id text,
  numero_nfse text,
  status text,
  valor numeric(10,2),
  data_emissao timestamptz,
  pdf_url text,
  xml_url text,
  codigo_verificacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. crm_asaas_customers
CREATE TABLE public.crm_asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid UNIQUE NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  asaas_customer_id text UNIQUE NOT NULL,
  name text,
  cpf_cnpj text,
  email text,
  synchronized_at timestamptz NOT NULL DEFAULT now()
);

-- 9. crm_asaas_config
CREATE TABLE public.crm_asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'PS Hub - Veiga Perícias',
  api_key text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  is_active boolean NOT NULL DEFAULT true,
  nfse_enabled boolean NOT NULL DEFAULT false,
  webhook_token text,
  wallet_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. crm_webhook_events
CREATE TABLE public.crm_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_notes text
);

-- 11. crm_reajustes
CREATE TABLE public.crm_reajustes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL REFERENCES public.crm_assinaturas(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES public.crm_contratos(id) ON DELETE CASCADE,
  indice text,
  percentual_aplicado numeric(5,2),
  valor_anterior numeric(10,2),
  valor_novo numeric(10,2),
  observacao text,
  aplicado_em timestamptz NOT NULL DEFAULT now()
);

-- 12. licencas_ativas (tabela materializada)
CREATE TABLE public.licencas_ativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid UNIQUE NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  cnpj text NOT NULL,
  razao_social text,
  ps_index_ativo boolean NOT NULL DEFAULT false,
  ps_escuta_ativo boolean NOT NULL DEFAULT false,
  ps_cultura_ativo boolean NOT NULL DEFAULT false,
  vidas integer,
  status_assinatura text,
  data_inicio date,
  data_fim date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_crm_clientes_cnpj ON public.crm_clientes(cnpj);
CREATE INDEX idx_crm_clientes_status ON public.crm_clientes(status);
CREATE INDEX idx_crm_contatos_cliente ON public.crm_contatos(cliente_id);
CREATE INDEX idx_crm_propostas_cliente ON public.crm_propostas(cliente_id);
CREATE INDEX idx_crm_propostas_status ON public.crm_propostas(status);
CREATE INDEX idx_crm_contratos_cliente ON public.crm_contratos(cliente_id);
CREATE INDEX idx_crm_contratos_status ON public.crm_contratos(status);
CREATE INDEX idx_crm_assinaturas_contrato ON public.crm_assinaturas(contrato_id);
CREATE INDEX idx_crm_assinaturas_cliente ON public.crm_assinaturas(cliente_id);
CREATE INDEX idx_crm_assinaturas_status ON public.crm_assinaturas(status);
CREATE INDEX idx_crm_faturas_assinatura ON public.crm_faturas(assinatura_id);
CREATE INDEX idx_crm_faturas_cliente ON public.crm_faturas(cliente_id);
CREATE INDEX idx_crm_faturas_status ON public.crm_faturas(status);
CREATE INDEX idx_crm_faturas_vencimento ON public.crm_faturas(data_vencimento);
CREATE INDEX idx_crm_notas_fiscais_fatura ON public.crm_notas_fiscais(fatura_id);
CREATE INDEX idx_crm_webhook_events_type ON public.crm_webhook_events(event_type);
CREATE INDEX idx_licencas_ativas_cnpj ON public.licencas_ativas(cnpj);

-- ============================================
-- FUNCTIONS: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER trg_crm_clientes_updated_at BEFORE UPDATE ON public.crm_clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_propostas_updated_at BEFORE UPDATE ON public.crm_propostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_contratos_updated_at BEFORE UPDATE ON public.crm_contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_assinaturas_updated_at BEFORE UPDATE ON public.crm_assinaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_faturas_updated_at BEFORE UPDATE ON public.crm_faturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTIONS: Numeração sequencial
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_numero_proposta()
RETURNS TRIGGER AS $$
DECLARE
  ano text;
  seq integer;
BEGIN
  ano := EXTRACT(YEAR FROM now())::text;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(SPLIT_PART(numero_proposta, '-', 2), '-', 1) AS integer)
  ), 0) + 1
  INTO seq
  FROM public.crm_propostas
  WHERE numero_proposta LIKE 'PROP-%-' || ano;
  
  NEW.numero_proposta := 'PROP-' || LPAD(seq::text, 3, '0') || '-' || ano;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_numero_proposta
BEFORE INSERT ON public.crm_propostas
FOR EACH ROW
WHEN (NEW.numero_proposta IS NULL)
EXECUTE FUNCTION public.generate_numero_proposta();

CREATE OR REPLACE FUNCTION public.generate_numero_contrato()
RETURNS TRIGGER AS $$
DECLARE
  ano text;
  seq integer;
BEGIN
  ano := EXTRACT(YEAR FROM now())::text;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(SPLIT_PART(codigo_contrato, '-', 2), '-', 1) AS integer)
  ), 0) + 1
  INTO seq
  FROM public.crm_contratos
  WHERE codigo_contrato LIKE 'CONT-%-' || ano;
  
  NEW.codigo_contrato := 'CONT-' || LPAD(seq::text, 3, '0') || '-' || ano;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_numero_contrato
BEFORE INSERT ON public.crm_contratos
FOR EACH ROW
WHEN (NEW.codigo_contrato IS NULL)
EXECUTE FUNCTION public.generate_numero_contrato();

CREATE OR REPLACE FUNCTION public.generate_numero_fatura()
RETURNS TRIGGER AS $$
DECLARE
  ano text;
  seq integer;
BEGIN
  ano := EXTRACT(YEAR FROM now())::text;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(SPLIT_PART(numero_fatura, '-', 2), '-', 1) AS integer)
  ), 0) + 1
  INTO seq
  FROM public.crm_faturas
  WHERE numero_fatura LIKE 'FAT-%-' || ano;
  
  NEW.numero_fatura := 'FAT-' || LPAD(seq::text, 3, '0') || '-' || ano;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_numero_fatura
BEFORE INSERT ON public.crm_faturas
FOR EACH ROW
WHEN (NEW.numero_fatura IS NULL)
EXECUTE FUNCTION public.generate_numero_fatura();

-- ============================================
-- FUNCTION: Sync licencas_ativas
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_licencas_ativas()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_id uuid;
  v_cnpj text;
  v_razao text;
BEGIN
  -- Determine cliente_id from the triggering table
  IF TG_TABLE_NAME = 'crm_contratos' THEN
    v_cliente_id := NEW.cliente_id;
  ELSIF TG_TABLE_NAME = 'crm_assinaturas' THEN
    v_cliente_id := NEW.cliente_id;
  END IF;

  -- Get cliente info
  SELECT cnpj, razao_social INTO v_cnpj, v_razao
  FROM public.crm_clientes WHERE id = v_cliente_id;

  -- Skip if no CNPJ
  IF v_cnpj IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert licencas_ativas from latest active contract + subscription
  INSERT INTO public.licencas_ativas (cliente_id, cnpj, razao_social, ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo, vidas, status_assinatura, data_inicio, data_fim, updated_at)
  SELECT
    c.cliente_id,
    v_cnpj,
    v_razao,
    c.ps_index_ativo,
    c.ps_escuta_ativo,
    c.ps_cultura_ativo,
    c.vidas,
    COALESCE(a.status, 'INACTIVE'),
    c.data_inicio,
    c.data_fim,
    now()
  FROM public.crm_contratos c
  LEFT JOIN public.crm_assinaturas a ON a.contrato_id = c.id
  WHERE c.cliente_id = v_cliente_id AND c.status = 'ativo'
  ORDER BY c.created_at DESC
  LIMIT 1
  ON CONFLICT (cliente_id)
  DO UPDATE SET
    cnpj = EXCLUDED.cnpj,
    razao_social = EXCLUDED.razao_social,
    ps_index_ativo = EXCLUDED.ps_index_ativo,
    ps_escuta_ativo = EXCLUDED.ps_escuta_ativo,
    ps_cultura_ativo = EXCLUDED.ps_cultura_ativo,
    vidas = EXCLUDED.vidas,
    status_assinatura = EXCLUDED.status_assinatura,
    data_inicio = EXCLUDED.data_inicio,
    data_fim = EXCLUDED.data_fim,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sync_licencas_contratos
AFTER INSERT OR UPDATE ON public.crm_contratos
FOR EACH ROW EXECUTE FUNCTION public.sync_licencas_ativas();

CREATE TRIGGER trg_sync_licencas_assinaturas
AFTER INSERT OR UPDATE ON public.crm_assinaturas
FOR EACH ROW EXECUTE FUNCTION public.sync_licencas_ativas();

-- ============================================
-- RLS: Enable + policies for authenticated users
-- ============================================
ALTER TABLE public.crm_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_asaas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_reajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas_ativas ENABLE ROW LEVEL SECURITY;

-- Macro: create full CRUD policy for authenticated users
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'crm_clientes', 'crm_contatos', 'crm_propostas', 'crm_contratos',
    'crm_assinaturas', 'crm_faturas', 'crm_notas_fiscais', 'crm_asaas_customers',
    'crm_asaas_config', 'crm_reajustes', 'licencas_ativas'
  ] LOOP
    EXECUTE format('CREATE POLICY "Authenticated users can select %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Authenticated users can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "Authenticated users can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "Authenticated users can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (true)', tbl);
  END LOOP;
END $$;

-- Webhook events: select/insert for authenticated, plus service_role for edge functions
CREATE POLICY "Authenticated users can select webhook_events" ON public.crm_webhook_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert webhook_events" ON public.crm_webhook_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role full access webhook_events" ON public.crm_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
