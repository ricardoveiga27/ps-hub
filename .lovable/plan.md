

# Sistema de Templates de Proposta Comercial + Links Públicos + Aceite Online

## Resumo
Criar duas tabelas (`crm_proposta_templates` e `crm_proposta_links`), hooks CRUD, modal de geração de link na PropostaDetalhe, seção de templates em Configurações, e rota pública `/proposta/:token` com formulário de aceite online.

---

## 1. Migração de Banco

Uma migration SQL que:

- **crm_proposta_templates**: id, nome, descricao, html_content, status (validation trigger: ativo/inativo), criado_em, updated_at. Trigger `update_updated_at_column`. RLS: authenticated SELECT/INSERT/UPDATE/DELETE.

- **crm_proposta_links**: id, proposta_id (FK crm_propostas), template_id (FK crm_proposta_templates), token (UNIQUE, DEFAULT `encode(gen_random_bytes(32), 'hex')`), status (validation trigger: aguardando/aceita/expirada/cancelada), aceite_nome, aceite_cpf, aceite_cargo, aceite_em, ip_aceite, expira_em (DEFAULT now() + 30 days), html_gerado, criado_em. RLS: authenticated full CRUD + **anon SELECT filtrado por token** (policy: `USING (token = current_setting('request.headers')::json->>'x-token' IS NOT NULL)` — na prática, policy simples `true` para SELECT anon, pois o filtro é feito via `.eq('token', token)` no client).

Nota: para a rota pública funcionar com anon key, a policy anon SELECT precisa ser permissiva. Como o token é um hash de 32 bytes (64 hex chars), a segurança está na entropia do token, não no RLS filtering.

## 2. Hook `src/hooks/usePropostaTemplates.ts` (novo)

- `usePropostaTemplates()` — lista todos, order by criado_em desc
- `usePropostaTemplate(id)` — busca único
- `useCreatePropostaTemplate()` — mutation INSERT
- `useUpdatePropostaTemplate()` — mutation UPDATE
- Tipos: `PropostaTemplate`, `PropostaTemplateInsert`

## 3. Hook `src/hooks/usePropostaLinks.ts` (novo)

- `usePropostaLinks(propostaId)` — lista links com join `crm_proposta_templates(nome)`
- `useCreatePropostaLink()` — mutation que recebe `proposta_id`, `template_id`, variáveis, faz replace no html_content, insere com html_gerado
- `useUpdatePropostaLink()` — mutation UPDATE (cancelar link)
- Função utilitária `substituirVariaveis(html, vars)` com `replaceAll`
- Montagem do objeto de variáveis a partir de proposta + cliente + pacote (todas as 18+ variáveis especificadas)

## 4. Componente `src/components/propostas/GerarLinkModal.tsx` (novo)

Dialog com:
- Select de template (filtro status='ativo')
- Preview colapsável das variáveis (key: value)
- Campo validade em dias (default 30)
- Botão "Gerar Link" → chama `useCreatePropostaLink`
- Exibe link gerado com botão "Copiar Link"
- Toast de sucesso

## 5. Componente `src/components/configuracoes/PropostaTemplateForm.tsx` (novo)

Dialog com React Hook Form:
- nome (obrigatório), descricao (textarea), html_content (textarea monospace, min-h 300px), status (ativo/inativo)

## 6. Ajuste em `src/pages/app/Configuracoes.tsx`

Adicionar sistema de abas (Tabs): "Asaas" (conteúdo atual) e "Propostas" (nova aba).

Aba Propostas contém:
- **Sub-seção Templates**: lista de templates com nome, badge status, ações (Editar, Ativar/Desativar, Excluir com AlertDialog). Botão "Novo Template".
- **Sub-seção Variáveis disponíveis**: tabela estática documentando todas as `{{variáveis}}` disponíveis.

## 7. Página `src/pages/PropostaPublica.tsx` (nova)

Rota `/proposta/:token` — pública, sem AppLayout.

- Busca `crm_proposta_links` por token (anon key)
- Estados: não encontrado, expirada, cancelada, aceita (com banner verde), aguardando (com formulário)
- Formulário de aceite: nome_completo, CPF (máscara XXX.XXX.XXX-XX), cargo, checkbox de aceite
- Ao submeter: UPDATE status='aceita' + dados do aceite
- Layout claro/profissional (não dark theme)
- React Hook Form + Zod com validação de CPF

## 8. Ajuste em `src/components/propostas/PropostaDetalhe.tsx`

- Botão "Gerar Link" no header de ações (status rascunho, enviada ou aceita) → abre GerarLinkModal
- Nova seção "Links gerados" abaixo dos cards existentes com tabela: Template, Status (badge), Criado em, Expira em, Ações (Copiar, Cancelar)
- Badges: aguardando (azul), aceita (verde), expirada (cinza), cancelada (vermelho)

## 9. Ajuste em `src/App.tsx`

Adicionar rota `/proposta/:token` → `PropostaPublica` **antes** das rotas `/app` (fora do AppLayout, acesso público)

---

## Arquivos criados/editados

| Ação | Arquivo |
|------|---------|
| Criar | Migration SQL |
| Criar | `src/hooks/usePropostaTemplates.ts` |
| Criar | `src/hooks/usePropostaLinks.ts` |
| Criar | `src/components/propostas/GerarLinkModal.tsx` |
| Criar | `src/components/configuracoes/PropostaTemplateForm.tsx` |
| Criar | `src/pages/PropostaPublica.tsx` |
| Editar | `src/pages/app/Configuracoes.tsx` (abas + templates) |
| Editar | `src/components/propostas/PropostaDetalhe.tsx` (botão + seção links) |
| Editar | `src/App.tsx` (rota pública) |

Total: 6 arquivos novos, 3 editados.

