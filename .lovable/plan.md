

# Fase 1 + Fase 2 — Banco de Dados + Autenticação e Layout

## Fase 1 — Banco de Dados

Uma única migration SQL criando toda a infraestrutura:

**12 tabelas** com prefixo `crm_`:
- `crm_clientes`, `crm_contatos`, `crm_propostas`, `crm_contratos`, `crm_assinaturas`, `crm_faturas`, `crm_notas_fiscais`, `crm_asaas_customers`, `crm_asaas_config`, `crm_webhook_events`, `crm_reajustes`
- `licencas_ativas` (tabela materializada com trigger automático)

**Funções SQL**:
- `generate_numero_proposta()`, `generate_numero_contrato()`, `generate_numero_fatura()` — numeração PROP/CONT/FAT-NNN-AAAA sequencial por ano
- `update_updated_at()` — trigger para atualizar `updated_at` automaticamente
- `sync_licencas_ativas()` — trigger que faz upsert em `licencas_ativas` quando contratos ou assinaturas mudam

**RLS**: Habilitado em todas as tabelas com policy de acesso para usuários autenticados (sistema interno).

---

## Fase 2 — Autenticação e Layout

### Arquivos novos:

1. **`src/pages/app/Login.tsx`** — Página de login com email/senha, visual dark com cores PS Hub. Sem signup (usuários cadastrados manualmente).

2. **`src/hooks/useAuth.ts`** — Hook de autenticação com `onAuthStateChange` + `getSession`, expõe `user`, `loading`, `signIn`, `signOut`.

3. **`src/components/app/AppLayout.tsx`** — Layout com `SidebarProvider` + sidebar + header com `SidebarTrigger`. Verifica autenticação e redireciona para login se não logado.

4. **`src/components/app/AppSidebar.tsx`** — Sidebar com itens: Dashboard, Clientes, Propostas, Contratos, Financeiro, Configurações. Usa `NavLink` para highlight ativo. Logo PS Hub no topo.

5. **Páginas placeholder** (6 arquivos):
   - `src/pages/app/Dashboard.tsx`
   - `src/pages/app/Clientes.tsx`
   - `src/pages/app/Propostas.tsx`
   - `src/pages/app/Contratos.tsx`
   - `src/pages/app/Financeiro.tsx`
   - `src/pages/app/Configuracoes.tsx`

6. **`src/App.tsx`** — Adicionar rotas `/app/login` e `/app/*` (Dashboard, Clientes, etc.) sem alterar a rota `/` da landing page.

### Detalhes técnicos:
- Layout do app usa tema claro (override das CSS vars dark da landing) para o painel administrativo
- Sidebar com ícones Lucide: `LayoutDashboard`, `Building2`, `FileText`, `ScrollText`, `Wallet`, `Settings`
- Proteção de rotas via check de sessão no `AppLayout` — redireciona para `/app/login` se não autenticado
- Páginas placeholder com título e card vazio, prontas para implementação nas próximas fases

