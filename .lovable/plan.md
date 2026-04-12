

# Integrar Propostas no ClienteDetalhe

## O que será feito

1. **Aba Propostas no ClienteDetalhe** — Adicionar botão "Nova Proposta" acima da tabela, tornar linhas clicáveis (navega para `/app/propostas/:id`), e usar badges coloridos por status (mesmos do PropostasList).

2. **PropostaForm com cliente pré-selecionado** — Adicionar estado para controlar o formulário dentro do ClienteDetalhe, passando `defaultValues: { cliente_id: id }` ao PropostaForm. A lógica de criação (cálculo de desconto + mutation) será replicada do PropostasList.

3. **PropostaForm: desabilitar select de cliente quando pré-selecionado** — Quando `defaultValues.cliente_id` é fornecido, o campo de seleção de cliente fica desabilitado (visual cinza) para evitar troca acidental.

## Arquivos a modificar

### `src/components/clientes/ClienteDetalhe.tsx`
- Importar `PropostaForm`, `useCreateProposta`, `Plus`, `toast` (sonner)
- Adicionar estados `propostaFormOpen` e handler `handleCreateProposta` com lógica de cálculo de valor final
- Na aba Propostas: botão "Nova Proposta" no topo, linhas clicáveis com `navigate`, badges coloridos por status
- Renderizar `PropostaForm` com `defaultValues={{ cliente_id: id }}`

### `src/components/propostas/PropostaForm.tsx`
- Aceitar prop opcional `lockedClienteId?: string`
- Quando definido, desabilitar o `Select` de cliente (disabled + opacity reduzida)

## Detalhes técnicos
- Reutiliza o mesmo `STATUS_BADGE` map do PropostasList para consistência visual
- A query `propostas-cliente` já existe no componente — apenas melhora a apresentação
- Sem migração de banco necessária

