

# Reset de Senha com Email Customizado em PT-BR

## Contexto
Os usuários Michele e JOAO tESTE foram criados por convite mas nunca definiram senha. Precisamos:
1. Botão "Redefinir Senha" na tabela de usuários
2. Email customizado e bonito em português BR (não o padrão do Supabase)

## Pré-requisito: Domínio de Email
O projeto ainda não tem domínio de email configurado. Para enviar emails personalizados (não o template padrão), é necessário configurar um domínio primeiro. Sem isso, os emails de reset usarão o template genérico do sistema.

**Primeiro passo:** Configurar o domínio de email no Lovable Cloud. Você verá um botão para iniciar essa configuração.

## Implementação

### 1. Nova Edge Function: `pshub-reset-password`
- Recebe `{ email }` do admin autenticado
- Valida que o chamador é admin (mesmo padrão das outras functions)
- Usa `adminClient.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })` para gerar o link de recovery
- Retorna sucesso

### 2. Configuração de Email Personalizado
Após configurar o domínio:
- Scaffold dos templates de auth email
- Customizar o template de **recovery** em português BR com a identidade visual do PS Hub:
  - Cores: primária `hsl(235, 85%, 42%)` → violeta/azul, accent verde `hsl(142, 100%, 42%)`
  - Fonte: DM Sans / Syne
  - Logo e nome "PS Hub"
  - Texto: "Olá, [nome]! Recebemos uma solicitação para redefinir sua senha..."
  - Botão CTA: "Redefinir minha senha"
  - Fundo do email: branco (#ffffff)

### 3. Botão na Tela de Usuários (`Usuarios.tsx`)
- Adicionar coluna "Ações" na tabela de usuários ativos
- Botão com ícone `Mail` → "Enviar reset de senha"
- Ao clicar, chama a edge function `pshub-reset-password`
- Feedback via toast: "Email de redefinição enviado para {email}"

### Arquivos
1. `supabase/functions/pshub-reset-password/index.ts` — nova edge function
2. `src/pages/app/Usuarios.tsx` — botão de reset na tabela
3. Templates de auth email (após configuração do domínio)

## Fluxo do Usuário
1. Admin clica "Redefinir Senha" ao lado do usuário
2. Edge function dispara email de recovery via Supabase Auth
3. Usuário recebe email bonito em PT-BR com botão "Redefinir minha senha"
4. Link redireciona para `/app/login` onde o formulário de "Definir senha" aparece automaticamente (já implementado)

