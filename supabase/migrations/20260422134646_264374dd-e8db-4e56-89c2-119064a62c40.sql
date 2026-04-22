-- 1) Extensão pg_net (HTTP a partir do banco)
create extension if not exists pg_net with schema extensions;

-- 2) Função privada que devolve o HUB_API_SECRET para os triggers
create or replace function public._get_hub_secret()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select 'A4nUFnMHGi8XZ4n'::text;
$$;

revoke all on function public._get_hub_secret() from public;
revoke all on function public._get_hub_secret() from anon;
revoke all on function public._get_hub_secret() from authenticated;

-- 3) Trigger function: empresas
create or replace function public.notify_empresa_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
  evento text;
begin
  evento := 'empresa.atualizada';
  payload := jsonb_build_object(
    'evento', evento,
    'dados', jsonb_build_object(
      'hub_id',        NEW.id,
      'razao_social',  NEW.razao_social,
      'nome_fantasia', NEW.nome_fantasia,
      'cnpj',          NEW.cnpj,
      'email',         NEW.email,
      'telefone',      NEW.telefone,
      'status',        NEW.status
    )
  );

  perform net.http_post(
    url     := 'https://ixitjycjcgcfxwqduuit.supabase.co/functions/v1/sync-to-products',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hub-secret', public._get_hub_secret()
    ),
    body    := payload
  );

  return NEW;
end;
$$;

drop trigger if exists trg_empresa_sync on public.crm_clientes;
create trigger trg_empresa_sync
  after insert or update on public.crm_clientes
  for each row execute function public.notify_empresa_sync();

-- 4) Trigger function: funcionários
create or replace function public.notify_funcionario_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
  evento  text;
begin
  if TG_OP = 'INSERT' then
    evento := 'funcionario.criado';
  elsif NEW.status = 'inativo' and OLD.status is distinct from 'inativo' then
    evento := 'funcionario.desativado';
  else
    evento := 'funcionario.atualizado';
  end if;

  payload := jsonb_build_object(
    'evento', evento,
    'dados', jsonb_build_object(
      'hub_id',         NEW.id,
      'cliente_hub_id', NEW.cliente_id,
      'nome',           NEW.nome,
      'cpf',            NEW.cpf,
      'email',          NEW.email,
      'telefone',       NEW.telefone,
      'cargo',          NEW.cargo,
      'setor',          NEW.setor,
      'data_admissao',  NEW.data_admissao,
      'status',         NEW.status
    )
  );

  perform net.http_post(
    url     := 'https://ixitjycjcgcfxwqduuit.supabase.co/functions/v1/sync-to-products',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hub-secret', public._get_hub_secret()
    ),
    body    := payload
  );

  return NEW;
end;
$$;

drop trigger if exists trg_funcionario_sync on public.crm_funcionarios;
create trigger trg_funcionario_sync
  after insert or update on public.crm_funcionarios
  for each row execute function public.notify_funcionario_sync();