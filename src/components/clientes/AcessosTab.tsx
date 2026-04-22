import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, RefreshCw, CheckCircle2, XCircle, Clock, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type CulturaStatus = "sem_rh" | "pendente" | "expirado" | "ativo";
type IndexStatus = "configurado" | "nao_configurado";

interface StatusResponse {
  ps_cultura: {
    status: CulturaStatus;
    email: string | null;
    nome: string | null;
    empresa_importada: boolean;
  };
  ps_index: {
    status: IndexStatus;
    empresa_importada: boolean;
  };
}

interface InviteResponse {
  ps_cultura: { enviado: boolean; motivo: string | null; link?: string | null } | null;
  ps_index: { enviado: boolean; motivo: string | null } | null;
}

const CULTURA_BADGE: Record<CulturaStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ativo: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
  pendente: { label: "Convite pendente", className: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock },
  expirado: { label: "Convite expirado", className: "bg-red-500/15 text-red-700 border-red-500/30", icon: XCircle },
  sem_rh: { label: "Sem RH", className: "bg-white/10 text-white/60 border-white/20", icon: XCircle },
};

const INDEX_BADGE: Record<IndexStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  configurado: { label: "Configurado", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
  nao_configurado: { label: "Não configurado", className: "bg-white/10 text-white/60 border-white/20", icon: XCircle },
};

interface AcessosTabProps {
  clienteHubId: string;
  emailDefault: string | null;
  nomeCliente: string;
}

export default function AcessosTab({ clienteHubId, emailDefault, nomeCliente }: AcessosTabProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(emailDefault ?? "");
  const [culturaLink, setCulturaLink] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: status, isLoading: loadingStatus, refetch } = useQuery({
    queryKey: ["product-access-status", clienteHubId],
    enabled: !!clienteHubId,
    staleTime: 30_000,
    queryFn: async (): Promise<StatusResponse> => {
      const { data, error } = await supabase.functions.invoke("send-product-invite", {
        body: { action: "status", cliente_hub_id: clienteHubId },
      });
      if (error) throw error;
      return data as StatusResponse;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (produto: "ps_cultura" | "ps_index" | "todos") => {
      if (!email.trim()) throw new Error("Informe um email");
      const { data, error } = await supabase.functions.invoke("send-product-invite", {
        body: {
          action: "invite",
          produto,
          email: email.trim(),
          nome: nomeCliente,
          cliente_hub_id: clienteHubId,
        },
      });
      if (error) throw error;
      return data as InviteResponse;
    },
    onSuccess: (data) => {
      if (data.ps_cultura) {
        if (data.ps_cultura.enviado) toast.success("PS Cultura: convite enviado");
        else toast.error(`PS Cultura: ${data.ps_cultura.motivo ?? "falha"}`);
      }
      if (data.ps_index) {
        if (data.ps_index.enviado) toast.success("PS Index: convite enviado");
        else toast.error(`PS Index: ${data.ps_index.motivo ?? "falha"}`);
      }
      if (data.ps_cultura?.enviado && data.ps_cultura.link) {
        setCulturaLink(data.ps_cultura.link);
        setShowLinkDialog(true);
      }
      queryClient.invalidateQueries({ queryKey: ["product-access-status", clienteHubId] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  const culturaStatus = status?.ps_cultura.status ?? "sem_rh";
  const indexStatus = status?.ps_index.status ?? "nao_configurado";
  const culturaBadge = CULTURA_BADGE[culturaStatus];
  const indexBadge = INDEX_BADGE[indexStatus];
  const CulturaIcon = culturaBadge.icon;
  const IndexIcon = indexBadge.icon;

  const culturaButtonLabel = culturaStatus === "ativo" || culturaStatus === "pendente"
    ? "Reenviar convite"
    : "Enviar convite";
  const indexButtonLabel = indexStatus === "configurado"
    ? "Reenviar convite"
    : "Enviar convite";

  const sendingProduto = inviteMutation.isPending ? inviteMutation.variables : null;

  return (
    <div className="space-y-4">
      {/* Email */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6 space-y-2">
          <Label htmlFor="invite-email" className="text-white/70">Email do convite</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rh@empresa.com.br"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-white/40">
            Endereço usado para receber o convite de acesso aos produtos do ecossistema.
          </p>
        </CardContent>
      </Card>

      {/* PS Cultura */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                  PS Cultura
                </span>
                {loadingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                ) : (
                  <Badge className={`${culturaBadge.className} border gap-1`}>
                    <CulturaIcon className="h-3 w-3" />
                    {culturaBadge.label}
                  </Badge>
                )}
                {status && !status.ps_cultura.empresa_importada && (
                  <Badge className="bg-white/10 text-white/50 border border-white/20">Empresa não importada</Badge>
                )}
              </div>
              {status?.ps_cultura.status === "ativo" && status.ps_cultura.email && (
                <p className="text-sm text-white/60">
                  RH: <span className="text-white">{status.ps_cultura.nome ?? "—"}</span>
                  {" · "}
                  <span className="text-white/70">{status.ps_cultura.email}</span>
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => inviteMutation.mutate("ps_cultura")}
              disabled={
                !email.trim() ||
                inviteMutation.isPending ||
                (status && !status.ps_cultura.empresa_importada)
              }
            >
              {sendingProduto === "ps_cultura" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : culturaStatus === "ativo" || culturaStatus === "pendente" ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {culturaButtonLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PS Index */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-500/15 text-violet-700 border border-violet-500/30">
                  PS Index
                </span>
                {loadingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                ) : (
                  <Badge className={`${indexBadge.className} border gap-1`}>
                    <IndexIcon className="h-3 w-3" />
                    {indexBadge.label}
                  </Badge>
                )}
                {status && !status.ps_index.empresa_importada && (
                  <Badge className="bg-white/10 text-white/50 border border-white/20">Empresa não importada</Badge>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => inviteMutation.mutate("ps_index")}
              disabled={
                !email.trim() ||
                inviteMutation.isPending ||
                (status && !status.ps_index.empresa_importada)
              }
            >
              {sendingProduto === "ps_index" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : indexStatus === "configurado" ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {indexButtonLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enviar todos */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loadingStatus || inviteMutation.isPending}
          className="border-white/20 text-white/80 hover:bg-white/10"
        >
          {loadingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar status
        </Button>
        <Button
          onClick={() => inviteMutation.mutate("todos")}
          disabled={!email.trim() || inviteMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {sendingProduto === "todos" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar todos os convites
        </Button>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso — PS Cultura</DialogTitle>
            <DialogDescription>
              O email automático não está configurado. Envie este link manualmente para o RH via WhatsApp ou email.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={culturaLink ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={async () => {
                if (!culturaLink) return;
                try {
                  await navigator.clipboard.writeText(culturaLink);
                  toast.success("Link copiado!");
                } catch {
                  toast.error("Não foi possível copiar. Selecione e copie manualmente.");
                }
              }}
              aria-label="Copiar link"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={async () => {
                if (!culturaLink) return;
                try {
                  await navigator.clipboard.writeText(culturaLink);
                  toast.success("Link copiado!");
                } catch {
                  toast.error("Não foi possível copiar. Selecione e copie manualmente.");
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar link
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowLinkDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
