
-- =============================================
-- crm_proposta_templates
-- =============================================
CREATE TABLE public.crm_proposta_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  html_content text NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_crm_proposta_templates_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('ativo', 'inativo') THEN
    RAISE EXCEPTION 'Status inválido: %. Valores permitidos: ativo, inativo', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_proposta_templates_status
  BEFORE INSERT OR UPDATE ON public.crm_proposta_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_crm_proposta_templates_status();

CREATE TRIGGER update_crm_proposta_templates_updated_at
  BEFORE UPDATE ON public.crm_proposta_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_proposta_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select crm_proposta_templates"
  ON public.crm_proposta_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert crm_proposta_templates"
  ON public.crm_proposta_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update crm_proposta_templates"
  ON public.crm_proposta_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete crm_proposta_templates"
  ON public.crm_proposta_templates FOR DELETE TO authenticated USING (true);

-- =============================================
-- crm_proposta_links
-- =============================================
CREATE TABLE public.crm_proposta_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id uuid NOT NULL REFERENCES public.crm_propostas(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.crm_proposta_templates(id),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'aguardando',
  aceite_nome text,
  aceite_cpf text,
  aceite_cargo text,
  aceite_em timestamptz,
  ip_aceite text,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  html_gerado text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_crm_proposta_links_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('aguardando', 'aceita', 'expirada', 'cancelada') THEN
    RAISE EXCEPTION 'Status inválido: %. Valores permitidos: aguardando, aceita, expirada, cancelada', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_proposta_links_status
  BEFORE INSERT OR UPDATE ON public.crm_proposta_links
  FOR EACH ROW EXECUTE FUNCTION public.validate_crm_proposta_links_status();

ALTER TABLE public.crm_proposta_links ENABLE ROW LEVEL SECURITY;

-- Authenticated full CRUD
CREATE POLICY "Authenticated users can select crm_proposta_links"
  ON public.crm_proposta_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert crm_proposta_links"
  ON public.crm_proposta_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update crm_proposta_links"
  ON public.crm_proposta_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete crm_proposta_links"
  ON public.crm_proposta_links FOR DELETE TO authenticated USING (true);

-- Anon SELECT for public proposal page
CREATE POLICY "Anon users can select crm_proposta_links by token"
  ON public.crm_proposta_links FOR SELECT TO anon USING (true);

-- Anon UPDATE for accepting proposals publicly
CREATE POLICY "Anon users can update crm_proposta_links for acceptance"
  ON public.crm_proposta_links FOR UPDATE TO anon USING (true) WITH CHECK (true);
