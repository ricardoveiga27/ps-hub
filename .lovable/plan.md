

# Correções: CNPJ no select + lógica de aceite no PropostaPublica

## 1. `src/hooks/usePropostas.ts` — Expandir selects

Alterar o join de `crm_clientes` e `crm_pacotes` em `usePropostas()` e `useProposta()` para incluir todos os campos usados por `buildPropostaVariables`:

- `crm_clientes(razao_social, nome_fantasia, cnpj, responsavel_comercial)`
- `crm_pacotes(codigo, nome, preco_por_vida, ciclos_index_ano, franquia_relatos_qtd, franquia_relatos_tipo, iris_ativo, modulo_liderancas, catalogo_completo)`

Atualizar o tipo `Proposta` para refletir os novos campos nos joins.

## 2. `src/pages/PropostaPublica.tsx` — Lógica de aceite via useEffect

Após renderizar o `html_gerado`, adicionar um `useEffect` (dependência: `html`) que:

1. Busca `#aceite_cpf` no DOM e aplica máscara de CPF (XXX.XXX.XXX-XX) via event listener `input`
2. Busca `#aceite_check` e `#aceite_btn` — conecta toggle de habilitação do botão
3. Busca `#aceite_nome`, `#aceite_cpf`, `#aceite_cargo` para ler os valores
4. Intercepta clique no `#aceite_btn`:
   - Valida campos obrigatórios (nome, CPF com regex `^\d{3}\.\d{3}\.\d{3}-\d{2}$`)
   - Chama `supabase.from('crm_proposta_links').update({ status: 'aceita', aceite_nome, aceite_cpf, aceite_cargo, aceite_em: new Date().toISOString() }).eq('token', token)`
   - Em caso de sucesso: substitui a seção de aceite por mensagem de confirmação no DOM
   - Dispara `window.dispatchEvent(new CustomEvent('aceite_proposta', { detail: { nome, cpf, cargo } }))` para compatibilidade futura
5. Cleanup: remove todos os event listeners no return do useEffect

Também buscar `status` e `expira_em` do link (expandir o select atual) para validar expiração/cancelamento antes de renderizar.

## Arquivos editados
- `src/hooks/usePropostas.ts` (expandir selects e tipo)
- `src/pages/PropostaPublica.tsx` (useEffect com lógica de aceite)

