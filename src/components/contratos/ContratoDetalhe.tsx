import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContrato, useUpdateContrato } from "@/hooks/useContratos";
import { useReajustes, useCreateReajuste } from "@/hooks/useReajustes";
import ContratoForm, { type ContratoFormValues } from "./ContratoForm";
import ReajusteForm from "./ReajusteForm";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_BADGE: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400",
  cancelado: "bg-red-500/20 text-red-400",
  encerrado: "bg-white/10 text-white/60",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function ProductDots({ index, escuta, cultura }: { index: boolean; escuta: boolean; cultura: boolean }) {
  return (
    <div className="flex gap-1.5">
      {index && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} title="PS Index" />}
      {escuta && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} title="PS Escuta" />}
      {cultura && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10B981" }} title="PS Cultura" />}
    </div>
  );
}

interface Props {
  id: string;
}

export default function ContratoDetalheComponent({ id }: Props) {
  const navigate = useNavigate();
  const { data: contrato, isLoading } = useContrato(id);
  const updateMutation = useUpdateContrato();
  const { data: reajustes } = useReajustes(id);
  const createReajusteMutation = useCreateReajuste();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reajusteOpen, setReajusteOpen] = useState(false);

  // Fetch linked subscription
  const { data: assinatura } = useQuery({
    queryKey: ["assinatura-contrato", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_assinaturas")
        .select("*")
        .eq("contrato_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  function handleEdit(values: ContratoFormValues) {
    updateMutation.mutate(
      { id, ...values },
      {
        onSuccess: () => { toast.success("Contrato atualizado"); setEditOpen(false); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleCancel() {
    updateMutation.mutate(
      { id, status: "cancelado", data_fim: new Date().toISOString().slice(0, 10) },
      {
        onSuccess: () => { toast.success("Contrato cancelado"); setCancelOpen(false); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleReajuste(values: { percentual_aplicado: number; observacao: string }) {
    if (!contrato || !assinatura) return;
    const valorNovo = contrato.valor_mensal * (1 + values.percentual_aplicado / 100);
    createReajusteMutation.mutate(
      {
        contrato_id: id,
        assinatura_id: assinatura.id,
        percentual_aplicado: values.percentual_aplicado,
        valor_anterior: contrato.valor_mensal,
        valor_novo: Math.round(valorNovo * 100) / 100,
        indice: contrato.indice_reajuste,
        observacao: values.observacao || null,
      },
      {
        onSuccess: () => { toast.success("Reajuste aplicado"); setReajusteOpen(false); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  if (isLoading) return <div className="text-white/40 py-12 text-center">Carregando...</div>;
  if (!contrato) return <div className="text-white/40 py-12 text-center">Contrato não encontrado</div>;

  const rows: [string, string][] = [
    ["Código", contrato.codigo_contrato ?? "—"],
    ["Cliente", contrato.crm_clientes?.razao_social ?? "—"],
    ["Vidas", String(contrato.vidas)],
    ["Valor Mensal", formatCurrency(contrato.valor_mensal)],
    ["Dia Vencimento", String(contrato.dia_vencimento)],
    ["Índice Reajuste", contrato.indice_reajuste],
    ["Data Início", formatDate(contrato.data_inicio)],
    ["Data Fim", formatDate(contrato.data_fim)],
    ["Próximo Reajuste", formatDate(contrato.data_proximo_reajuste)],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/contratos")} className="text-white/60 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-white">{contrato.codigo_contrato ?? "Contrato"}</h1>
          <p className="text-white/50 text-sm">{contrato.crm_clientes?.razao_social}</p>
        </div>
        <Badge className={STATUS_BADGE[contrato.status] || "bg-white/10 text-white/60"}>
          {contrato.status.charAt(0).toUpperCase() + contrato.status.slice(1)}
        </Badge>
        {contrato.status === "ativo" && (
          <>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} className="text-white/60 hover:text-white">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCancelOpen(true)} className="text-white/60 hover:text-red-400">
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Details Card */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {rows.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-white/40 mb-1">{label}</p>
                <p className="text-white/80 text-sm">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs text-white/40 mb-1">Produtos</p>
              <ProductDots index={contrato.ps_index_ativo} escuta={contrato.ps_escuta_ativo} cultura={contrato.ps_cultura_ativo} />
            </div>
            {contrato.observacoes && (
              <div className="col-span-full">
                <p className="text-xs text-white/40 mb-1">Observações</p>
                <p className="text-white/80 text-sm whitespace-pre-wrap">{contrato.observacoes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reajustes */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Histórico de Reajustes</CardTitle>
          {contrato.status === "ativo" && assinatura && (
            <Button size="sm" onClick={() => setReajusteOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar Reajuste
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Data</TableHead>
                  <TableHead className="text-white/50">Percentual</TableHead>
                  <TableHead className="text-white/50">Valor Anterior</TableHead>
                  <TableHead className="text-white/50">Valor Novo</TableHead>
                  <TableHead className="text-white/50">Índice</TableHead>
                  <TableHead className="text-white/50">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!reajustes?.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-6">Nenhum reajuste registrado</TableCell></TableRow>
                ) : reajustes.map((r) => (
                  <TableRow key={r.id} className="border-white/10">
                    <TableCell className="text-white/60">{formatDate(r.aplicado_em)}</TableCell>
                    <TableCell className="text-white/60">{r.percentual_aplicado != null ? `${r.percentual_aplicado}%` : "—"}</TableCell>
                    <TableCell className="text-white/60">{r.valor_anterior != null ? formatCurrency(r.valor_anterior) : "—"}</TableCell>
                    <TableCell className="text-white font-medium">{r.valor_novo != null ? formatCurrency(r.valor_novo) : "—"}</TableCell>
                    <TableCell className="text-white/60">{r.indice ?? "—"}</TableCell>
                    <TableCell className="text-white/60 max-w-[200px] truncate">{r.observacao ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ContratoForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        loading={updateMutation.isPending}
        defaultValues={{
          vidas: contrato.vidas,
          valor_mensal: contrato.valor_mensal,
          dia_vencimento: contrato.dia_vencimento,
          indice_reajuste: contrato.indice_reajuste,
          ps_index_ativo: contrato.ps_index_ativo,
          ps_escuta_ativo: contrato.ps_escuta_ativo,
          ps_cultura_ativo: contrato.ps_cultura_ativo,
          observacoes: contrato.observacoes ?? "",
        }}
      />

      <ReajusteForm
        open={reajusteOpen}
        onOpenChange={setReajusteOpen}
        onSubmit={handleReajuste}
        loading={createReajusteMutation.isPending}
        valorAtual={contrato.valor_mensal}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancelar contrato?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              O contrato será marcado como cancelado e a data de fim será definida como hoje. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">Cancelar Contrato</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
