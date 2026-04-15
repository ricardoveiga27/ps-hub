

# Sistema de Precificação com Auditoria de Desconto

## Resumo

Substituir o desconto livre (percentual/fixo/nenhum) por 6 níveis estruturados com percentuais fixos, justificativa obrigatória para descontos altos e auditoria de aprovador. O valor é calculado automaticamente a partir de `vidas × preco_por_vida × (1 - desconto%)`.

## 1. Migration Supabase

Criar enum `desconto_nivel` e adicionar 3 colunas em `crm_propostas`:

```sql
CREATE TYPE desconto_nivel AS ENUM (
  'tabela','autonomia_10','autonomia_20','aprovacao_30','campanha_40','supremo_50'
);

ALTER TABLE crm_propostas
  ADD COLUMN IF NOT EXISTS valor_tabela numeric,
  ADD COLUMN IF NOT EXISTS nivel_desconto desconto_nivel DEFAULT 'tabela',
  ADD COLUMN IF NOT EXISTS justificativa_desconto text,
  ADD COLUMN IF NOT EXISTS aprovador text;
```

Campos antigos (`desconto_tipo`, `desconto_valor`) permanecem para compatibilidade.

## 2. `src/hooks/usePropostas.ts`

- Tipo `Proposta` já inclui os campos via `Tables<"crm_propostas">` (auto-gerado após migration)
- SELECT_QUERY já está correto com os joins necessários
- Nenhuma alteração manual de tipo necessária (os novos campos vêm do `*`)

## 3. `src/components/propostas/PropostaForm.tsx` — Substituir lógica de desconto

### Schema Zod
- Remover `desconto_tipo` e `desconto_valor`
- Adicionar `nivel_desconto` (enum dos 6 níveis), `justificativa_desconto` (obrigatória se >= 30%), `valor_tabela` (readonly)

### Constante de percentuais
```
tabela: 0%, autonomia_10: 10%, autonomia_20: 20%,
aprovacao_30: 30%, campanha_40: 40%, supremo_50: 50%
```

### useEffect de cálculo
Quando `pacote + vidas + nivelDesconto` mudam:
- `valor_tabela = preco_por_vida × vidas`
- `valor_mensal = valor_tabela × (1 - pct)`

### UI do select de desconto
Select com 6 opções mostrando: nível, percentual, valor calculado em tempo real, e tag de autorização.

### Justificativa condicional
Campo aparece apenas para níveis >= 30%, obrigatório com mínimo 10 caracteres.

### Aprovador automático
Para níveis >= 30%, preencher `aprovador = "Ricardo Veiga"` e exibir alerta visual.

## 4. `src/components/propostas/PropostaDetalhe.tsx` — Exibir novos campos

Na seção "Dados da Proposta":
- **Valor de tabela**: valor sem desconto
- **Nível de desconto**: badge colorido (cinza/verde/âmbar/laranja/roxo)
- **Desconto aplicado**: `valor_tabela − valor_final`
- **Justificativa**: bloco de citação (se preenchida)
- **Aprovador**: (se preenchido)

Atualizar `editDefaults` e `handleEdit` para usar os novos campos.

## 5. `src/components/propostas/PropostasList.tsx` — Atualizar handleCreate

Substituir cálculo de `valorFinal` para usar `DESCONTO_PCT[nivel_desconto]` e enviar `valor_tabela`, `nivel_desconto`, `justificativa_desconto`, `aprovador`.

## 6. `src/hooks/usePropostaLinks.ts` — buildPropostaVariables

Atualizar para usar `nivel_desconto` e `valor_tabela` do novo modelo:
- `proposta_desconto_pct`: derivado do nível
- `proposta_valor_tabela`: do campo direto
- `proposta_valor_desconto`: `valor_tabela - valor_final`

## Arquivos editados
1. `supabase/migrations/` — nova migration (enum + 4 colunas)
2. `src/components/propostas/PropostaForm.tsx` — nova lógica de desconto
3. `src/components/propostas/PropostaDetalhe.tsx` — exibir novos campos + edição
4. `src/components/propostas/PropostasList.tsx` — handleCreate atualizado
5. `src/hooks/usePropostaLinks.ts` — buildPropostaVariables atualizado

