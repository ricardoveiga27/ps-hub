import { useState } from "react";
import { Plus, Search, Copy, Archive, XCircle, Edit, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePacotes, useCreatePacote, useUpdatePacote, useClonePacote, type Pacote } from "@/hooks/usePacotes";
import PacoteForm, { type PacoteFormValues } from "@/components/pacotes/PacoteForm";

const STATUS_BADGE: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400",
  legado: "bg-amber-500/20 text-amber-400",
  cancelado: "bg-white/10 text-white/40",
};

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Pacotes() {
  const [statusFilter, setStatusFilter] = useState("sem_cancelado");
  const { data: pacotes, isLoading } = usePacotes();
  const createMutation = useCreatePacote();
  const updateMutation = useUpdatePacote();
  const cloneMutation = useClonePacote();

  const [formOpen, setFormOpen] = useState(false);
  const [editPacote, setEditPacote] = useState<Pacote | null>(null);
  const [descontinuarId, setDescontinuarId] = useState<string | null>(null);
  const [cancelarId, setCancelarId] = useState<string | null>(null);

  const filtered = pacotes?.filter((p) => {
    if (statusFilter === "sem_cancelado") return p.status !== "cancelado";
    if (statusFilter === "todos") return true;
    return p.status === statusFilter;
  }) || [];

  function handleCreate(values: PacoteFormValues) {
    createMutation.mutate(
      {
        ...values,
        faixa_max_vidas: values.faixa_max_vidas || null,
        excedente_relato_valor: values.excedente_relato_valor || null,
      },
      {
        onSuccess: () => { toast.success("Pacote criado"); setFormOpen(false); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleEdit(values: PacoteFormValues) {
    if (!editPacote) return;
    updateMutation.mutate(
      {
        id: editPacote.id,
        ...values,
        faixa_max_vidas: values.faixa_max_vidas || null,
        excedente_relato_valor: values.excedente_relato_valor || null,
      },
      {
        onSuccess: () => { toast.success("Pacote atualizado"); setEditPacote(null); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleDescontinuar() {
    if (!descontinuarId) return;
    updateMutation.mutate(
      { id: descontinuarId, status: "legado", descontinuado_em: new Date().toISOString() },
      {
        onSuccess: () => { toast.success("Pacote descontinuado"); setDescontinuarId(null); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleCancelar() {
    if (!cancelarId) return;
    updateMutation.mutate(
      { id: cancelarId, status: "cancelado" },
      {
        onSuccess: () => { toast.success("Pacote cancelado"); setCancelarId(null); },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  const ProductDots = ({ p }: { p: Pacote }) => (
    <div className="flex gap-1.5">
      {p.ps_index_ativo && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} title="PS Index" />}
      {p.ps_escuta_ativo && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} title="PS Escuta" />}
      {p.ps_cultura_ativo && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#10B981" }} title="PS Cultura" />}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Pacotes</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Pacote
        </Button>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a2e] border-white/10">
          <SelectItem value="sem_cancelado" className="text-white">Todos (exceto cancelado)</SelectItem>
          <SelectItem value="todos" className="text-white">Todos</SelectItem>
          <SelectItem value="ativo" className="text-white">Ativo</SelectItem>
          <SelectItem value="legado" className="text-white">Legado</SelectItem>
          <SelectItem value="cancelado" className="text-white">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <p className="text-white/40 text-center py-12">Carregando...</p>
      ) : !filtered.length ? (
        <div className="text-center py-12">
          <Package className="h-10 w-10 text-white/20 mx-auto mb-2" />
          <p className="text-white/40">Nenhum pacote encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`border-white/10 bg-white/5 transition-opacity ${p.status === "legado" ? "opacity-50" : ""}`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono text-white/40">{p.codigo}</p>
                    <p className="text-lg font-bold text-white">{p.nome}</p>
                  </div>
                  <Badge className={STATUS_BADGE[p.status] || ""}>{p.status}</Badge>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">{formatCurrency(p.preco_por_vida)}</span>
                  <span className="text-white/40 text-sm">/vida</span>
                </div>

                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>{p.faixa_min_vidas}–{p.faixa_max_vidas ?? "∞"} vidas</span>
                  <ProductDots p={p} />
                </div>

                <div className="flex gap-1 pt-2 border-t border-white/10">
                  <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5" onClick={() => setEditPacote(p)}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5" onClick={() => cloneMutation.mutate(p)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Clonar
                  </Button>
                  {p.status === "ativo" && (
                    <Button size="sm" variant="ghost" className="text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10" onClick={() => setDescontinuarId(p.id)}>
                      <Archive className="h-3.5 w-3.5 mr-1" /> Descontinuar
                    </Button>
                  )}
                  {p.status !== "cancelado" && (
                    <Button size="sm" variant="ghost" className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10" onClick={() => setCancelarId(p.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create form */}
      <PacoteForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={createMutation.isPending} />

      {/* Edit form */}
      {editPacote && (
        <PacoteForm
          open={!!editPacote}
          onOpenChange={(o) => !o && setEditPacote(null)}
          onSubmit={handleEdit}
          loading={updateMutation.isPending}
          defaultValues={{
            codigo: editPacote.codigo,
            nome: editPacote.nome,
            descricao: editPacote.descricao || "",
            status: editPacote.status as any,
            preco_por_vida: editPacote.preco_por_vida ?? 0,
            faixa_min_vidas: editPacote.faixa_min_vidas ?? 1,
            faixa_max_vidas: editPacote.faixa_max_vidas,
            cobranca_tipo: (editPacote.cobranca_tipo as any) || "mensal",
            ps_index_ativo: editPacote.ps_index_ativo,
            ciclos_index_ano: editPacote.ciclos_index_ano ?? 1,
            suporte_coleta: editPacote.suporte_coleta,
            followup_90dias: editPacote.followup_90dias,
            acompanhamento_continuo: editPacote.acompanhamento_continuo,
            ps_escuta_ativo: editPacote.ps_escuta_ativo,
            iris_ativo: editPacote.iris_ativo,
            franquia_relatos_tipo: (editPacote.franquia_relatos_tipo as any) || "por_func",
            franquia_relatos_qtd: editPacote.franquia_relatos_qtd ?? 1,
            excedente_relato_valor: editPacote.excedente_relato_valor,
            ps_cultura_ativo: editPacote.ps_cultura_ativo,
            modulo_liderancas: editPacote.modulo_liderancas,
            catalogo_completo: editPacote.catalogo_completo,
          }}
        />
      )}

      {/* Descontinuar dialog */}
      <AlertDialog open={!!descontinuarId} onOpenChange={(o) => !o && setDescontinuarId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Descontinuar pacote?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Este pacote ficará indisponível para novas vendas. Contratos existentes não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDescontinuar} className="bg-amber-600 hover:bg-amber-700">Descontinuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancelar dialog */}
      <AlertDialog open={!!cancelarId} onOpenChange={(o) => !o && setCancelarId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pacote?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O pacote será marcado como cancelado e não aparecerá na listagem padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelar} className="bg-red-600 hover:bg-red-700">Cancelar pacote</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
