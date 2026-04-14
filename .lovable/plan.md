

# Módulo de Gestão de Pacotes Comerciais (revisado)

## Resumo
Criar tabela `crm_pacotes`, CRUD completo com UI em cards, vincular pacotes a propostas e contratos, popular com 4 pacotes iniciais. Inclui `pacote_id` em `crm_propostas` para rastreabilidade comercial.

---

## 1. Migração de Banco

Uma migration SQL que:

- Cria `crm_pacotes` com todos os campos (codigo UNIQUE, preco_por_vida, flags booleanas, faixas de vidas, etc.)
- Validation trigger para status (ativo/legado/cancelado) em vez de CHECK constraint
- Aplica trigger `update_updated_at_column`
- RLS + 4 policies (SELECT/INSERT/UPDATE/DELETE para authenticated)
- INSERT dos 4 pacotes iniciais (ESSENCIAL-2026, ESSENCIAL-PLUS-2026, PROFISSIONAL-2026, ENTERPRISE-2026)
- `ALTER TABLE crm_contratos ADD COLUMN pacote_id uuid REFERENCES crm_pacotes(id), ADD COLUMN snapshot_pacote jsonb`
- `ALTER TABLE crm_propostas ADD COLUMN pacote_id uuid REFERENCES crm_pacotes(id)`

## 2. Hook `src/hooks/usePacotes.ts` (novo)

- `usePacotes(status?)` — lista com filtro opcional
- `usePacote(id)` — busca único
- `useCreatePacote()`, `useUpdatePacote()` — mutations com invalidação
- `useClonePacote()` — copia campos, sufixo "-CLONE" no codigo, toast informativo
- Tipos exportados: `Pacote`, `PacoteInsert`, `PacoteUpdate`

## 3. Componente `src/components/pacotes/PacoteForm.tsx` (novo)

Dialog com React Hook Form + Zod, 5 seções:
- **Identificação**: codigo (uppercase auto), nome, descricao, status
- **Precificação**: preco_por_vida, faixa_min/max_vidas, cobranca_tipo
- **PS Index**: switch + campos condicionais (ciclos, suporte_coleta, followup, acompanhamento)
- **PS Escuta**: switch + campos condicionais (iris, franquia tipo/qtd, excedente)
- **PS Cultura**: switch + campos condicionais (modulo_liderancas, catalogo_completo)

## 4. Página `src/pages/app/Pacotes.tsx` (nova)

- Grid de cards (não tabela)
- Cada card: código, nome, badge status, preço/vida, faixa vidas, dots produtos
- Filtro por status (padrão: todos exceto cancelado)
- Ações: Editar, Clonar, Descontinuar (AlertDialog → legado), Cancelar (AlertDialog)
- Legado: opacidade 50%. Cancelado: oculto exceto no filtro "cancelado"

## 5. Ajustes em arquivos existentes

### `src/components/propostas/PropostaForm.tsx`
- Adicionar select de pacote (filtro status='ativo') via `usePacotes`
- Ao selecionar pacote + vidas → calcula `valor_mensal = preco_por_vida × vidas`
- Resumo do pacote abaixo do select (dots produtos, ciclos, franquia)
- Campo valor_mensal continua editável para descontos

### `src/hooks/usePropostas.ts`
- Adicionar `pacote_id` ao tipo Proposta (já vem do DB)
- Incluir join `crm_pacotes(codigo, nome)` nas queries de lista e detalhe

### `src/components/propostas/PropostaDetalhe.tsx`
- Exibir nome do pacote vinculado nos dados da proposta
- No `handleAceitar()`: buscar pacote via `proposta.pacote_id` do banco, incluir `pacote_id` e `snapshot_pacote` (JSON completo) no INSERT de `crm_contratos`

### `src/components/propostas/PropostasList.tsx`
- Exibir coluna "Pacote" na tabela de propostas

### `src/App.tsx`
- Rota `/app/pacotes` → componente `Pacotes`

### `src/components/app/AppSidebar.tsx`
- Item "Pacotes" com ícone `Package` entre Dashboard e Clientes

---

## Detalhes técnicos

- Badges: ativo (verde), legado (âmbar), cancelado (cinza)
- Dark theme consistente (bg-white/5, text-white, border-white/10)
- Toast em todas operações CRUD
- `pacote_id` em `crm_propostas` permite rastrear origem comercial e recuperar dados do pacote no `handleAceitar()` direto do banco, sem depender de estado local
- 10 arquivos criados/editados

