

# Fase 3 — CRUD Completo de Clientes e Contatos (Revisado)

## Arquivos a criar

### Hooks

1. **`src/hooks/useClientes.ts`** — React Query:
   - `useClientes(filters)` — lista com filtros (status, segmento, porte) e busca por razão social/CNPJ. A busca por CNPJ deve **limpar a máscara do input** (remover `.`, `/`, `-`) antes de comparar com `.ilike()` no banco, já que o CNPJ é armazenado apenas como dígitos.
   - `useCliente(id)` — busca único
   - `useCreateCliente()`, `useUpdateCliente()`, `useDeleteCliente()` — mutations com invalidação

2. **`src/hooks/useContatos.ts`** — React Query:
   - `useContatos(clienteId)`, `useCreateContato()`, `useUpdateContato()`, `useDeleteContato()`

### Componentes

3. **`src/components/clientes/ClientesList.tsx`** — Tabela com busca, filtros (status, segmento, porte), badges coloridos, botão "Novo Cliente", linha clicável → detalhe

4. **`src/components/clientes/ClienteForm.tsx`** — React Hook Form + Zod:
   - CNPJ com máscara `XX.XXX.XXX/XXXX-XX` no input (exibição), mas **salvo no banco apenas como dígitos** (14 chars) para facilitar busca e sincronização com Asaas
   - Validação de formato CNPJ (14 dígitos após limpeza)
   - Campos: razao_social (obrigatório), nome_fantasia, cnpj, segmento (select), porte (select), email, telefone, cidade, uf (select 27 estados), status, responsavel_comercial, observacoes

5. **`src/components/clientes/ClienteDetalhe.tsx`** — Tabs:
   - **Dados** — exibe/edita dados do cliente
   - **Contatos** — CRUD de contatos
   - **Propostas** — lista read-only de `crm_propostas` por `cliente_id`
   - **Contratos** — lista read-only de `crm_contratos` por `cliente_id`
   - **Financeiro** — busca diretamente `crm_faturas` filtrando por `cliente_id`. Sem join com assinaturas.

6. **`src/components/clientes/ContatoForm.tsx`** — Formulário: nome, cargo, email, telefone, celular, whatsapp, principal (switch), ativo (switch)

7. **`src/components/clientes/ContatosList.tsx`** — Lista de contatos com ações editar/excluir

### Páginas e Rotas

8. **`src/pages/app/Clientes.tsx`** — Reescrever para renderizar `ClientesList`
9. **`src/pages/app/ClienteDetalhe.tsx`** — Nova página
10. **`src/App.tsx`** — Adicionar rota `clientes/:id`

## Detalhes técnicos

- Badges de status: prospecto (cinza), ativo (verde), inativo (amarelo), churned (vermelho)
- Segmentos: transportes, saúde, indústria, logística, varejo, outros
- Porte: micro, pequena, média, grande
- Tema dark consistente (bg-white/5, text-white, border-white/10)
- Toast em todas as operações CRUD
- AlertDialog de confirmação antes de excluir
- CNPJ: máscara visual no form, armazenamento sem formatação, busca com limpeza de máscara do input

