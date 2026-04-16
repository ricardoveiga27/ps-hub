

## Auditoria de Segurança — Resultado

### ✅ O que JÁ está corrigido (não precisa ação)
- Policies permissivas `USING (true)` mencionadas no arquivo `prompt_rls_fix_emergencial.md` **não existem mais**. Todas as 11 tabelas críticas (`crm_clientes`, `crm_contratos`, `crm_faturas` etc.) já têm apenas policies `perfil_*` baseadas em `has_perfil()`/`is_admin_user()`.
- Trigger `prevent_self_role_update` bloqueia auto-promoção em `crm_usuarios`.
- Trigger `prevent_aceite_tamper` protege campos de aceite em `crm_proposta_links`.
- `self_insert_no_roles` impede signup com flags `true`.
- Acesso público à proposta agora vai por RPC `SECURITY DEFINER` (token-only).

### ⚠️ Riscos REAIS encontrados que precisam ação

**1. Usuários suspeitos no banco** (CRÍTICO — ação manual)
```
- michelle@veigasaude.com.br → ativo, comercial+financeiro+operador
- ricardo.veiga27@gmail.com  → ativo, comercial+financeiro+operador, nome "JOAO tESTE" (suspeito)
- rveiga.dev@gmail.com       → admin
```
A conta "JOAO tESTE" com email do Ricardo parece ter sido criada por terceiro, ou Ricardo testou e ganhou todos os papéis. **Você precisa decidir** se desativa pela tela `/app/usuarios`.

**2. Função `handle_new_auth_user` insere com `is_ativo=true`** (BUG de segurança)
A função trigger `handle_new_auth_user` ainda faz `INSERT ... is_ativo=true`. Isso é incoerente com a política nova (`useAuth.ts` insere `is_ativo=false`). Se essa trigger estiver ativa em `auth.users`, novos signups ficam ativos automaticamente — anulando o gate "Acesso pendente".  
**Correção:** alterar a função para inserir `is_ativo=false`.

**3. `crm_webhook_events` tem policy de INSERT/UPDATE faltante** 
Apenas `service_role` (ALL) e admin (SELECT). OK — nenhum usuário consegue gravar. Mantém.

**4. HIBP (senhas vazadas) não está habilitado**
Permite signup com senhas comprometidas. Precisa ser habilitado via ferramenta de auth.

**5. Function `prevent_aceite_tamper` usa claim errado**
Usa `current_setting('request.jwt.claim.role')` — no Supabase atual o caminho correto é `request.jwt.claims` (json) e o role efetivo está em `auth.role()`. O fallback `session_user='postgres'` cobre quando rodando como definer, mas vale corrigir para `auth.role() = 'service_role'` para robustez.

**6. Tabela `licencas_ativas` — SELECT amplo**
Hoje qualquer perfil ativo lê tudo (`is_active_with_any_role()`). É o desejado para um CRM interno; manter.

---

## Plano de correção

### Migration nova
1. **Corrigir `handle_new_auth_user`** — inserir `is_ativo=false` para forçar gate admin.
2. **Corrigir `prevent_aceite_tamper`** — trocar checagem por `auth.role()='service_role'`.
3. **(Defensiva)** Adicionar policy explícita de DELETE em `crm_usuarios` apenas para admin (hoje não existe nenhuma → ninguém deleta, mas deixar explícito).
4. **(Defensiva)** Revogar `EXECUTE` público em `aceitar_proposta_link` / `get_proposta_link_by_token` para `authenticated` e conceder apenas a `anon` + `authenticated` (já SECURITY DEFINER, mas grants explícitos evitam exposição acidental).

### Habilitar HIBP
Via ferramenta `configure_auth` com `password_hibp_enabled: true`.

### Ações que VOCÊ precisa fazer manualmente
- Abrir `/app/usuarios` e:
  - Desativar/excluir `ricardo.veiga27@gmail.com` se "JOAO tESTE" não for legítimo.
  - Confirmar se `michelle@veigasaude.com.br` deve ter os 3 papéis.
- Trocar a senha do admin `rveiga.dev@gmail.com` se houver suspeita de vazamento.

### Arquivos
- `supabase/migrations/<nova>.sql` — itens 1-4 acima.
- Configuração de auth (HIBP) — via tool, sem arquivo.

