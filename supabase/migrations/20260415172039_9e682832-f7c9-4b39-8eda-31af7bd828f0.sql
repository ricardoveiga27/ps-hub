
CREATE TYPE desconto_nivel AS ENUM (
  'tabela',
  'autonomia_10',
  'autonomia_20',
  'aprovacao_30',
  'campanha_40',
  'supremo_50'
);

ALTER TABLE crm_propostas
  ADD COLUMN IF NOT EXISTS valor_tabela numeric,
  ADD COLUMN IF NOT EXISTS nivel_desconto desconto_nivel DEFAULT 'tabela',
  ADD COLUMN IF NOT EXISTS justificativa_desconto text,
  ADD COLUMN IF NOT EXISTS aprovador text;
