
-- 1. Trigger: auto-create crm_usuarios on auth.users insert
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

-- 2. Sync existing auth users missing from crm_usuarios
INSERT INTO public.crm_usuarios (id, nome, email, is_ativo)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)),
  au.email,
  true
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.crm_usuarios cu WHERE cu.id = au.id)
ON CONFLICT (id) DO NOTHING;
