import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePropostas, useCreateProposta, useDeleteProposta } from "@/hooks/usePropostas";
import PropostaForm, { type PropostaFormValues } from "./PropostaForm";

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-white/10 text-white/60",
  enviada: "bg-blue-500/20 text-blue-400",
  aceita: "bg-emerald-500/20 text-emerald-400",
  recusada: "bg-red-500/20 text-red-400",
  expirada: "bg-yellow-500/20 text-yellow-400",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function PropostasList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: propostas, isLoading } = usePropostas({
    search: search || undefined,
    status: status || undefined,
  });
  const createMutation = useCreateProposta();
  const deleteMutation = useDeleteProposta();

  function handleCreate(values: PropostaFormValues) {
    const bruto = values.valor_mensal * values.vidas;
    let valorFinal = bruto;
    if (values.desconto_tipo === "percentual" && values.desconto_valor > 0) {
      valorFinal = bruto * (1 - values.desconto_valor / 100);
    } else if (values.desconto_tipo === "fixo" && values.desconto_valor > 0) {
      valorFinal = bruto - values.desconto_valor;
    }

    createMutation.mutate(
      {
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
        onSuccess: () => {
          toast.success("Proposta criada com sucesso");
          setFormOpen(false);
        },
        onError: (e) => toast.error("Erro ao criar proposta: " + e.message),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Proposta excluída");
        setDeleteId(null);
      },
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Propostas</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Proposta
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por título ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10">
            <SelectItem value="todos" className="text-white">Todos</SelectItem>
            <SelectItem value="rascunho" className="text-white">Rascunho</SelectItem>
            <SelectItem value="enviada" className="text-white">Enviada</SelectItem>
            <SelectItem value="aceita" className="text-white">Aceita</SelectItem>
            <SelectItem value="recusada" className="text-white">Recusada</SelectItem>
            <SelectItem value="expirada" className="text-white">Expirada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Nº</TableHead>
              <TableHead className="text-white/50">Cliente</TableHead>
              <TableHead className="text-white/50">Pacote</TableHead>
              <TableHead className="text-white/50">Título</TableHead>
              <TableHead className="text-white/50 text-center">Vidas</TableHead>
              <TableHead className="text-white/50 text-right">Valor Final</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-white/40 py-8">Carregando...</TableCell></TableRow>
            ) : !propostas?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <FileText className="h-10 w-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40">Nenhuma proposta encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              propostas.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-white/10 cursor-pointer hover:bg-white/5"
                  onClick={() => navigate(`/app/propostas/${p.id}`)}
                >
                  <TableCell className="text-white/70 font-mono text-sm">{p.numero_proposta || "—"}</TableCell>
                  <TableCell className="text-white">
                    {p.crm_clientes?.razao_social || "—"}
                  </TableCell>
                  <TableCell className="text-white/60 text-sm">{(p as any).crm_pacotes?.nome || "—"}</TableCell>
                  <TableCell className="text-white/80">{p.titulo || "—"}</TableCell>
                  <TableCell className="text-white/70 text-center">{p.vidas}</TableCell>
                  <TableCell className="text-white text-right font-medium">{formatCurrency(p.valor_final)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[p.status] || ""}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === "rascunho" && (
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PropostaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
