

## Exibir magic link do PS Cultura após envio do convite

A Edge Function `invite-rh` do PS Cultura retorna `{ success, link }` (e-mail automático não configurado). Hoje o link é descartado. Vou propagá-lo até a UI e exibi-lo num dialog copiável.

### 1. Edge Function — `supabase/functions/send-product-invite/index.ts`

- Atualizar `interface InviteResult`:
  ```ts
  interface InviteResult {
    enviado: boolean;
    motivo: string | null;
    link?: string | null;
  }
  ```
- Em `inviteCultura`, após `res.ok`, parsear o body com segurança e propagar `link`:
  ```ts
  let link: string | null = null;
  try {
    const parsed = JSON.parse(text);
    link = typeof parsed?.link === "string" ? parsed.link : null;
  } catch { /* body não-JSON, segue sem link */ }
  return { enviado: true, motivo: null, link };
  ```
  (mantém `text` já lido por `await res.text()`; não há segunda leitura do body).
- `inviteIndex` permanece inalterada (sem `link`).
- Inicializações de `result` e tipos agregados continuam compatíveis (campo `link` opcional).

### 2. Frontend — `src/components/clientes/AcessosTab.tsx`

- Atualizar `interface InviteResponse`:
  ```ts
  interface InviteResponse {
    ps_cultura: { enviado: boolean; motivo: string | null; link?: string | null } | null;
    ps_index: { enviado: boolean; motivo: string | null } | null;
  }
  ```
- Adicionar state:
  ```ts
  const [culturaLink, setCulturaLink] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  ```
- No `onSuccess` da `inviteMutation`, após os toasts existentes:
  ```ts
  if (data.ps_cultura?.enviado && data.ps_cultura.link) {
    setCulturaLink(data.ps_cultura.link);
    setShowLinkDialog(true);
  }
  ```
- Adicionar `<Dialog>` (shadcn `@/components/ui/dialog`) controlado por `showLinkDialog` ao final do componente, depois do bloco "Enviar todos os convites":
  - **Título**: "Link de acesso — PS Cultura"
  - **Descrição**: "O email automático não está configurado. Envie este link manualmente para o RH via WhatsApp ou email."
  - **Input readonly** com `value={culturaLink ?? ""}`, selectable.
  - Botão **"Copiar link"**: `navigator.clipboard.writeText(culturaLink!)` → `toast.success("Link copiado!")`. Fallback `try/catch` com `toast.error` caso a Clipboard API falhe.
  - Botão **"Fechar"** que fecha o dialog (não limpa `culturaLink` para evitar piscada durante a animação).
- Imports adicionais: `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` de `@/components/ui/dialog`; `Copy` de `lucide-react`.

### 3. Não será alterado

- Action `status` da Edge Function e queries de status no frontend.
- Cards PS Cultura/PS Index, badges, botões existentes e botão "Enviar todos os convites".
- `inviteIndex` e qualquer outro arquivo do projeto.

### Arquivos

- **Editar**: `supabase/functions/send-product-invite/index.ts` (tipo `InviteResult` + retorno de `inviteCultura`).
- **Editar**: `src/components/clientes/AcessosTab.tsx` (state, dialog, parsing do `link`).

