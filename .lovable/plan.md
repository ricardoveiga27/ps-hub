
## Causa raiz (PROP-010-2026 ainda como "enviada")

A função RPC `aceitar_proposta_link` atualiza apenas `crm_proposta_links` (status='aceita', dados do signatário). Ela **não** propaga para `crm_propostas` nem cria contrato/assinatura. Por isso o painel mostra "enviada" enquanto o detalhe (que lê o link) mostra "aceita".

Hoje a criação de contrato/assinatura está em `PropostaDetalhe.handleAceitar()` no frontend — que **só roda quando alguém comercial clica em "Aceitar" no painel interno**. Quando o cliente aceita pelo link público, esse caminho nunca é executado.

## Plano

### 1. Backend — migration SQL

**1.1. Tabela de auditoria de exclusão**
```sql
CREATE TABLE public.crm_propostas_excluidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL,
  numero_proposta text,
  cliente_id uuid,
  motivo text NOT NULL,
  excluida_por uuid REFERENCES auth.users(id),
  excluida_por_nome text,
  excluida_em timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL
);
ALTER TABLE public.crm_propostas_excluidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY perfil_select_propostas_excluidas ON public.crm_propostas_excluidas
  FOR SELECT USING (has_perfil(ARRAY['comercial'::text]));
CREATE POLICY perfil_insert_propostas_excluidas ON public.crm_propostas_excluidas
  FOR INSERT WITH CHECK (has_perfil(ARRAY['comercial'::text]));
```

**1.2. Atualizar `aceitar_proposta_link`** para propagar status e gerar contrato/assinatura de forma idempotente:
```sql
CREATE OR REPLACE FUNCTION public.aceitar_proposta_link(_token text, _nome text, _cpf text, _cargo text, _ip text)
RETURNS crm_proposta_links
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_link  public.crm_proposta_links;
  v_prop  public.crm_propostas;
  v_contrato_id uuid;
  v_dia_venc int;
BEGIN
  PERFORM set_config('app.allow_aceite_update', 'on', true);

  UPDATE public.crm_proposta_links
  SET aceite_nome=_nome, aceite_cpf=_cpf, aceite_cargo=_cargo,
      ip_aceite=_ip, aceite_em=now(), status='aceita'
  WHERE token=_token AND status='aguardando' AND expira_em>now()
  RETURNING * INTO v_link;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Link inválido, expirado ou já utilizado';
  END IF;

  SELECT * INTO v_prop FROM public.crm_propostas WHERE id = v_link.proposta_id FOR UPDATE;

  -- Propaga status na proposta
  IF v_prop.status <> 'aceita' THEN
    UPDATE public.crm_propostas
    SET status='aceita', aceita_em=now(), updated_at=now()
    WHERE id=v_prop.id;
  END IF;

  -- Atualiza status do cliente
  UPDATE public.crm_clientes SET status='ativo', updated_at=now()
  WHERE id=v_prop.cliente_id AND status<>'ativo';

  -- Cria contrato + assinatura idempotente
  IF NOT EXISTS (SELECT 1 FROM public.crm_contratos WHERE proposta_id=v_prop.id) THEN
    v_dia_venc := COALESCE((v_prop.snapshot_condicoes->>'dia_vencimento')::int, 10);
    INSERT INTO public.crm_contratos (
      cliente_id, proposta_id, pacote_id, vidas, valor_mensal,
      dia_vencimento, data_inicio, status, indice_reajuste,
      ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo, snapshot_pacote
    )
    SELECT v_prop.cliente_id, v_prop.id, v_prop.pacote_id, v_prop.vidas, v_prop.valor_final,
           v_dia_venc, CURRENT_DATE, 'ativo', 'IGPM',
           true, true, true,
           to_jsonb(p.*)
    FROM public.crm_pacotes p WHERE p.id = v_prop.pacote_id
    RETURNING id INTO v_contrato_id;

    IF v_contrato_id IS NOT NULL THEN
      INSERT INTO public.crm_assinaturas (
        cliente_id, contrato_id, valor, dia_vencimento, data_inicio, status
      ) VALUES (
        v_prop.cliente_id, v_contrato_id, v_prop.valor_final, v_dia_venc, CURRENT_DATE, 'ACTIVE'
      );
    END IF;
  END IF;

  RETURN v_link;
END;
$$;
```

**1.3. Habilitar Realtime em `crm_propostas`**
```sql
ALTER TABLE public.crm_propostas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_propostas;
```

**1.4. Backfill PROP-010-2026** (executado via insert tool após a migration):
```sql
UPDATE crm_propostas SET status='aceita',
  aceita_em = COALESCE(aceita_em, (SELECT aceite_em FROM crm_proposta_links WHERE proposta_id=crm_propostas.id AND status='aceita' LIMIT 1))
WHERE numero_proposta='PROP-010-2026';
-- + insert idempotente em crm_contratos/crm_assinaturas se não existir
```

### 2. Frontend — `src/components/propostas/PropostaDetalhe.tsx`

**2.1. Quando `proposta.status === 'aceita'`:**
- **Esconder** botões: Editar, Enviar, Aceitar, Recusar, Gerar Link.
- **Mostrar bloco "Proposta Aceita"** (card verde) com:
  - Nome do signatário
  - CPF mascarado: `218.***.***-20` (helper local: mantém 3 primeiros e 2 últimos dígitos)
  - Cargo
  - Data/hora do aceite (formatado pt-BR)
  - IP (se houver) — em texto pequeno cinza
  - Link para o contrato gerado (já existe lógica)
- **Mostrar apenas botão "Excluir"** (vermelho, com `Trash2`).

**2.2. Fluxo de exclusão dupla camada (substitui o atual `AlertDialog` simples):**

Novo componente local `<DeletePropostaDialog>` baseado em `Dialog` (não AlertDialog, p/ permitir formulário multi-step):

- **Etapa 1 — Motivo:**
  - `<Textarea>` "Motivo da exclusão" (obrigatório, min 10 chars).
  - Aviso amarelo: "⚠️ Esta ação é irreversível. O motivo será registrado para auditoria."
  - Botões: Cancelar | Continuar (disabled enquanto motivo < 10 chars).

- **Etapa 2 — Confirmação:**
  - Mostra resumo: "Você está excluindo a proposta **PROP-XXX-AAAA** do cliente **{razao_social}**."
  - `<Input>` com placeholder: `Digite "PROP-XXX-AAAA" para confirmar`.
  - Botões: Voltar | Excluir definitivamente (vermelho, disabled até match exato).

- **Ao confirmar:**
  1. `INSERT` em `crm_propostas_excluidas` com snapshot completo (`select * from crm_propostas where id=...` serializado), `motivo`, `excluida_por=auth.uid()`, `excluida_por_nome` (do perfil).
  2. `DELETE` da `crm_propostas` (cascade leva os links via FK… **verificar**: tabela não tem FK declarada — vou deletar links primeiro: `DELETE FROM crm_proposta_links WHERE proposta_id=...`).
  3. Toast sucesso + `navigate('/app/propostas')`.

**2.3. Atualizar `useDeleteProposta` hook** para receber `{ id, motivo, snapshot }` e fazer as 3 operações em sequência (auditoria → links → proposta). Manter assinatura antiga por compatibilidade não é necessário (só `PropostasList` usa, e lá só se pode excluir rascunhos — vou unificar para sempre exigir motivo).

### 3. Frontend — `src/components/propostas/PropostasList.tsx`

- Botão de excluir (lixeira na linha) hoje só aparece em `status === 'rascunho'`. Mantém assim, mas troca o `AlertDialog` simples pelo mesmo `<DeletePropostaDialog>` (mesmo fluxo de motivo + digitar número).
- Lista vai atualizar automaticamente quando o RPC propagar status (graças ao realtime + invalidação no hook). Como bônus, adicionar subscription realtime opcional em `usePropostas` — **não vou fazer agora**, basta `queryClient.invalidateQueries(["propostas"])` quando o usuário voltar à listagem (já é o comportamento padrão do React Query com `refetchOnWindowFocus`).

### 4. Helper utilitário

`src/lib/format.ts` (criar se não existir) ou inline em `PropostaDetalhe`:
```ts
export function maskCpf(cpf: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.***.***-${d.slice(9)}`;
}
```

## O que NÃO muda

- RPC `aceitar_proposta_link` mantém assinatura (mesmos parâmetros) — só ganha lógica adicional.
- Modal de celebração na `PropostaPublica.tsx` — intacto.
- Trigger `prevent_aceite_tamper` — intacto (a função usa o GUC).
- `crm_proposta_links`, `crm_clientes`, `crm_contratos`, `crm_assinaturas` schemas — intactos.
- Geração de número (`generate_numero_contrato`) — intacto, dispara no INSERT.

## Arquivos

- **Nova migration**: tabela `crm_propostas_excluidas` + RLS + `CREATE OR REPLACE FUNCTION aceitar_proposta_link` + realtime para `crm_propostas`.
- **Backfill via insert tool** (após migration): sincronizar PROP-010-2026 + criar contrato/assinatura faltantes.
- **Editar**: `src/components/propostas/PropostaDetalhe.tsx` — esconder ações quando aceita, bloco de signatário, novo dialog de exclusão.
- **Editar**: `src/components/propostas/PropostasList.tsx` — usar mesmo dialog de exclusão.
- **Editar**: `src/hooks/usePropostas.ts` — `useDeleteProposta` recebe `{ id, motivo, snapshot, numero, clienteId, usuarioNome }`.
