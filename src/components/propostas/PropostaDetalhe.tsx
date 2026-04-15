import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, Send, Check, X, FileText, Link2, Copy, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useProposta, useUpdateProposta, useDeleteProposta } from "@/hooks/usePropostas";
import { usePropostaLinks, useUpdatePropostaLink } from "@/hooks/usePropostaLinks";
import { supabase } from "@/integrations/supabase/client";
import PropostaForm, { type PropostaFormValues } from "./PropostaForm";
import GerarLinkModal from "./GerarLinkModal";

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-white/10 text-white/60",
  enviada: "bg-blue-500/20 text-blue-400",
  aceita: "bg-emerald-500/20 text-emerald-400",
  recusada: "bg-red-500/20 text-red-400",
  expirada: "bg-yellow-500/20 text-yellow-400",
};

const LINK_STATUS_BADGE: Record<string, string> = {
  aguardando: "bg-blue-500/20 text-blue-400",
  aceita: "bg-emerald-500/20 text-emerald-400",
  expirada: "bg-white/10 text-white/50",
  cancelada: "bg-red-500/20 text-red-400",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

interface Props {
  id: string;
}

export default function PropostaDetalheComponent({ id }: Props) {
  const navigate = useNavigate();
  const { data: proposta, isLoading, refetch } = useProposta(id);
  const updateMutation = useUpdateProposta();
  const deleteMutation = useDeleteProposta();
  const { data: links } = usePropostaLinks(id);
  const updateLink = useUpdatePropostaLink();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recusaOpen, setRecusaOpen] = useState(false);
  const [aceitarOpen, setAceitarOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [converting, setConverting] = useState(false);

  if (isLoading) return <p className="text-white/40 text-center py-12">Carregando...</p>;
  if (!proposta) return <p className="text-white/40 text-center py-12">Proposta não encontrada</p>;

  const snapshot = proposta.snapshot_condicoes as Record<string, unknown> | null;
  const diaVencimento = (snapshot?.dia_vencimento as number) || 10;
  const pacoteNome = (proposta as any).crm_pacotes?.nome as string | undefined;
  const cliente = (proposta as any).crm_clientes;
  const pacote = (proposta as any).crm_pacotes;

  function handleEdit(values: PropostaFormValues) {
    const bruto = values.valor_mensal * values.vidas;
    let valorFinal = bruto;
    if (values.desconto_tipo === "percentual" && values.desconto_valor > 0) {
      valorFinal = bruto * (1 - values.desconto_valor / 100);
    } else if (values.desconto_tipo === "fixo" && values.desconto_valor > 0) {
      valorFinal = bruto - values.desconto_valor;
    }

    updateMutation.mutate(
      {
        id,
        cliente_id: values.cliente_id,
        pacote_id: values.pacote_id && values.pacote_id !== "nenhum" ? values.pacote_id : null,
        titulo: values.titulo,
        vidas: values.vidas,
        valor_mensal: values.valor_mensal,
        valor_final: Math.max(0, valorFinal),
        desconto_tipo: values.desconto_tipo === "nenhum" ? null : values.desconto_tipo,
        desconto_valor: values.desconto_tipo === "nenhum" ? null : values.desconto_valor,
        validade_dias: values.validade_dias,
        observacoes: values.observacoes || null,
        snapshot_condicoes: { dia_vencimento: values.dia_vencimento },
      },
      {
        onSuccess: () => { toast.success("Proposta atualizada"); setEditOpen(false); refetch(); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => { toast.success("Proposta excluída"); navigate("/app/propostas"); },
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  function handleEnviar() {
    updateMutation.mutate(
      { id, status: "enviada", enviada_em: new Date().toISOString() },
      {
        onSuccess: () => { toast.success("Proposta enviada"); refetch(); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleRecusar() {
    if (!motivoRecusa.trim()) { toast.error("Informe o motivo da recusa"); return; }
    updateMutation.mutate(
      { id, status: "recusada", recusada_em: new Date().toISOString(), motivo_recusa: motivoRecusa },
      {
        onSuccess: () => { toast.success("Proposta recusada"); setRecusaOpen(false); refetch(); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  async function handleAceitar() {
    setConverting(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      let snapshotPacote = null;
      const pacoteId = (proposta as any).pacote_id as string | null;
      if (pacoteId) {
        const { data: pacoteData } = await supabase
          .from("crm_pacotes").select("*").eq("id", pacoteId).maybeSingle();
        if (pacoteData) snapshotPacote = pacoteData;
      }

      const { data: contrato, error: errContrato } = await supabase
        .from("crm_contratos")
        .insert({
          cliente_id: proposta.cliente_id,
          proposta_id: proposta.id,
          pacote_id: pacoteId,
          snapshot_pacote: snapshotPacote,
          vidas: proposta.vidas,
          valor_mensal: proposta.valor_final,
          dia_vencimento: diaVencimento,
          data_inicio: hoje,
          ps_index_ativo: snapshotPacote?.ps_index_ativo ?? true,
          ps_escuta_ativo: snapshotPacote?.ps_escuta_ativo ?? true,
          ps_cultura_ativo: snapshotPacote?.ps_cultura_ativo ?? true,
          status: "ativo",
        })
        .select().single();
      if (errContrato) throw errContrato;

      const { error: errAss } = await supabase.from("crm_assinaturas").insert({
        cliente_id: proposta.cliente_id,
        contrato_id: contrato.id,
        valor: proposta.valor_final,
        dia_vencimento: diaVencimento,
        data_inicio: hoje,
        status: "ACTIVE",
      });
      if (errAss) throw errAss;

      const { error: errProp } = await supabase
        .from("crm_propostas")
        .update({ status: "aceita", aceita_em: new Date().toISOString() })
        .eq("id", id);
      if (errProp) throw errProp;

      await supabase.from("crm_clientes").update({ status: "ativo" }).eq("id", proposta.cliente_id);

      toast.success("Proposta aceita! Contrato e assinatura criados.");
      setAceitarOpen(false);
      refetch();
    } catch (e: any) {
      toast.error("Erro na conversão: " + e.message);
    } finally {
      setConverting(false);
    }
  }

  function handleCopyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/proposta/${token}`);
    toast.success("Link copiado!");
  }

  function handleCancelLink(linkId: string) {
    updateLink.mutate({ id: linkId, status: "cancelada" }, {
      onSuccess: () => toast.success("Link cancelado"),
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  const canGenerateLink = ["rascunho", "enviada", "aceita"].includes(proposta.status);

  const editDefaults: Partial<PropostaFormValues> = {
    cliente_id: proposta.cliente_id,
    pacote_id: (proposta as any).pacote_id || "",
    titulo: proposta.titulo || "",
    vidas: proposta.vidas,
    valor_mensal: proposta.valor_mensal,
    desconto_tipo: (proposta.desconto_tipo as any) || "nenhum",
    desconto_valor: proposta.desconto_valor || 0,
    dia_vencimento: diaVencimento,
    validade_dias: proposta.validade_dias,
    observacoes: proposta.observacoes || "",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/propostas")} className="text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-white">
              {proposta.numero_proposta || "Proposta"}
            </h1>
            <Badge className={STATUS_BADGE[proposta.status]}>{proposta.status}</Badge>
          </div>
          <p className="text-white/50 text-sm mt-1">
            {proposta.crm_clientes?.razao_social || "Cliente não encontrado"}
          </p>
        </div>
        <div className="flex gap-2">
          {canGenerateLink && (
            <Button variant="outline" onClick={() => setLinkModalOpen(true)} className="border-white/10 text-white hover:bg-white/5">
              <Link2 className="h-4 w-4 mr-2" /> Gerar Link
            </Button>
          )}
          {["rascunho", "enviada"].includes(proposta.status) && (
            <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} className="border-white/10 text-white hover:bg-white/5">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {proposta.status === "rascunho" && (
            <>
              <Button variant="outline" onClick={handleEnviar} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                <Send className="h-4 w-4 mr-2" /> Enviar
              </Button>
              <Button variant="outline" size="icon" onClick={() => setDeleteOpen(true)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {proposta.status === "enviada" && (
            <>
              <Button variant="outline" onClick={() => setAceitarOpen(true)} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <Check className="h-4 w-4 mr-2" /> Aceitar
              </Button>
              <Button variant="outline" onClick={() => setRecusaOpen(true)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <X className="h-4 w-4 mr-2" /> Recusar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white text-base">Dados da Proposta</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Título" value={proposta.titulo || "—"} />
            {pacoteNome && <Row label="Pacote" value={pacoteNome} />}
            <Row label="Vidas" value={String(proposta.vidas)} />
            <Row label="Valor/vida" value={formatCurrency(proposta.valor_mensal)} />
            <Row label="Desconto" value={
              proposta.desconto_tipo === "percentual" ? `${proposta.desconto_valor}%` :
              proposta.desconto_tipo === "fixo" ? formatCurrency(proposta.desconto_valor || 0) : "Nenhum"
            } />
            <Row label="Valor final mensal" value={formatCurrency(proposta.valor_final)} highlight />
            <Row label="Dia vencimento" value={String(diaVencimento)} />
            <Row label="Validade" value={`${proposta.validade_dias} dias`} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Criada em" value={formatDate(proposta.created_at)} />
            <Row label="Enviada em" value={formatDate(proposta.enviada_em)} />
            <Row label="Aceita em" value={formatDate(proposta.aceita_em)} />
            <Row label="Recusada em" value={formatDate(proposta.recusada_em)} />
            {proposta.motivo_recusa && <Row label="Motivo recusa" value={proposta.motivo_recusa} />}
            {proposta.observacoes && <Row label="Observações" value={proposta.observacoes} />}
          </CardContent>
        </Card>
      </div>

      {proposta.status === "aceita" && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <FileText className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-300 text-sm">Contrato gerado automaticamente a partir desta proposta.</span>
            <Button variant="link" className="text-emerald-400 ml-auto" onClick={() => navigate("/app/contratos")}>Ver contratos →</Button>
          </CardContent>
        </Card>
      )}

      {/* Links gerados */}
      {links && links.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white text-base">Links gerados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/50">Template</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Criado em</TableHead>
                  <TableHead className="text-white/50">Expira em</TableHead>
                  <TableHead className="text-white/50 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => (
                  <TableRow key={l.id} className="border-white/10">
                    <TableCell className="text-white">{l.crm_proposta_templates?.nome || "—"}</TableCell>
                    <TableCell>
                      <Badge className={LINK_STATUS_BADGE[l.status] || "bg-white/10 text-white/50"}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">{formatDate(l.criado_em)}</TableCell>
                    <TableCell className="text-white/60 text-sm">{formatDate(l.expira_em)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyLink(l.token)} className="text-white/50 hover:text-white h-8 w-8">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {l.status === "aguardando" && (
                        <Button variant="ghost" size="icon" onClick={() => handleCancelLink(l.id)} className="text-red-400/60 hover:text-red-400 h-8 w-8">
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <PropostaForm open={editOpen} onOpenChange={setEditOpen} onSubmit={handleEdit} defaultValues={editDefaults} loading={updateMutation.isPending} />

      <GerarLinkModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        proposta={proposta}
        cliente={cliente}
        pacote={pacote}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={aceitarOpen} onOpenChange={setAceitarOpen}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Aceitar proposta e gerar contrato?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Será criado um contrato ativo com assinatura para o cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAceitar} disabled={converting} className="bg-emerald-600 hover:bg-emerald-700">
              {converting ? "Convertendo..." : "Aceitar e gerar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={recusaOpen} onOpenChange={setRecusaOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader><DialogTitle>Recusar proposta</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da recusa..." value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} className="bg-white/5 border-white/10 text-white" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusaOpen(false)} className="border-white/10 text-white hover:bg-white/5">Cancelar</Button>
            <Button onClick={handleRecusar} disabled={updateMutation.isPending} className="bg-red-600 hover:bg-red-700">Recusar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className={highlight ? "text-emerald-400 font-bold" : "text-white"}>{value}</span>
    </div>
  );
}
