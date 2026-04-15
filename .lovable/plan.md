

# Fix: Usuários auth sem registro em crm_usuarios

## Diagnóstico

Os 2 usuários (michelle, ricardo.veiga27) **foram** criados por convite (`invited_at` preenchido) e confirmaram email. Porém o `fetchOrCreatePerfil` no cliente falhou silenciosamente — provavelmente por timing: o token do convite foi consumido no `/verify`, mas a sessão pode não ter sido estabelecida a tempo para a inserção funcionar via RLS.

## Solução (3 partes)

### 1. Trigger automático no banco (prevenção definitiva)

Criar trigger `AFTER INSERT ON auth.users` que auto-cria o registro em `crm_usuarios`. Isso garante que **todo** usuário criado no auth (convite, signup, etc.) tenha registro no CRM, independente do cliente.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.crm_usuarios (id, nome, email, is_ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

### 2. Sincronizar os 2 usuários existentes agora

Inserir via migration os registros faltantes:

```sql
INSERT INTO public.crm_usuarios (id, nome, email, is_ativo)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)),
  au.email,
  true
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.crm_usuarios cu WHERE cu.id = au.id)
ON CONFLICT (id) DO NOTHING;
```

### 3. Melhorar log de erro no `fetchOrCreatePerfil`

Em `src/hooks/useAuth.ts`, adicionar `console.error` quando a inserção falha, para não engolir erros silenciosamente.

## Arquivos

1. **Migração SQL** — trigger + sync dos usuários existentes
2. `src/hooks/useAuth.ts` — log de erro na inserção

