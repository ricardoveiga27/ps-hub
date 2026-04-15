

# Corrigir envio de email de reset + customizar conteúdo

## Problema atual
A edge function `pshub-reset-password` usa `adminClient.auth.admin.generateLink()` que **apenas gera o link** mas NÃO envia nenhum email. O usuário nunca recebe nada.

## Solução em 2 passos

### Passo 1: Corrigir a edge function para enviar email
Trocar `generateLink` por `resetPasswordForEmail` no admin client, que de fato dispara o email de recovery pelo sistema do Supabase.

```typescript
// DE:
await adminClient.auth.admin.generateLink({ type: "recovery", email, ... });

// PARA:
await adminClient.auth.resetPasswordForEmail(email, {
  redirectTo: `${publicAppUrl}/app/login`,
});
```

Isso resolve o envio imediato — o email chega usando o template padrão.

### Passo 2: Customizar o conteúdo do email (requer domínio de email)
Para alterar o texto do email para PT-BR com visual bonito do PS Hub, precisamos:
1. Configurar um domínio de email (botão abaixo)
2. Criar os templates de auth email customizados com:
   - Texto em português BR
   - Cores do PS Hub (violeta primário, verde accent)
   - Botão CTA "Redefinir minha senha"
   - Logo e nome "PS Hub"
3. Deploy do template

**Sem o domínio configurado, o email será enviado com o template padrão (em inglês).** O remetente NÃO muda — continua sendo o padrão do sistema.

## Arquivos
1. `supabase/functions/pshub-reset-password/index.ts` — corrigir para enviar email de fato

