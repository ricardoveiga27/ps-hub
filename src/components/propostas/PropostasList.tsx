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
import { usePropostas, useCreateProposta, useDeleteProposta } from "@/hooks/usePropostas";
import PropostaForm, { type PropostaFormValues, DESCONTO_PCT } from "./PropostaForm";
import DeletePropostaDialog from "./DeletePropostaDialog";

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
    const pct = DESCONTO_PCT[values.nivel_desconto] || 0;
    const valorTabela = values.valor_tabela || values.valor_mensal;
    const valorFinal = Math.round(valorTabela * (1 - pct) * 100) / 100;
    const aprovador = ["aprovacao_30", "campanha_40", "supremo_50"].includes(values.nivel_desconto)
      ? "Ricardo Veiga"
      : null;

    createMutation.mutate(
      {
        cliente_id: values.cliente_id,
        pacote_id: values.pacote_id && values.pacote_id !== "nenhum" ? values.pacote_id : null,
        titulo: values.titulo,
        vidas: values.vidas,
        valor_mensal: values.valor_mensal,
        valor_final: Math.max(0, valorFinal),
        valor_tabela: valorTabela,
        nivel_desconto: values.nivel_desconto as any,
        justificativa_desconto: values.justificativa_desconto || null,
        aprovador,
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

  const propostaToDelete = propostas?.find((p) => p.id === deleteId) || null;

  function handleDelete(motivo: string) {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId, motivo }, {
      onSuccess: () => {
        toast.success("Proposta excluída");
        setDeleteId(null);
      },
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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

      <DeletePropostaDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        numeroProposta={propostaToDelete?.numero_proposta || "(sem número)"}
        clienteNome={propostaToDelete?.crm_clientes?.razao_social}
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
