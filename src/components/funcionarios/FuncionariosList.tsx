import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, RefreshCw, Pencil, Trash2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/hooks/useClientes";
import {
  useFuncionarios, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario,
  type Funcionario,
} from "@/hooks/useFuncionarios";
import FuncionarioForm, { type FuncionarioFormValues } from "./FuncionarioForm";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400",
  inativo: "bg-white/10 text-white/60",
  afastado: "bg-yellow-500/20 text-yellow-400",
};

const ORIGEM_BADGE: Record<string, { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-white/10 text-white/60" },
  importacao: { label: "Importado", className: "bg-blue-500/20 text-blue-400" },
  ps_index: { label: "PS Index", className: "bg-purple-500/20 text-purple-400" },
};

function maskCpf(cpf: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `***.***.***-${d.slice(9)}`;
}

function formatPhone(phone: string | null) {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return phone;
}

export default function FuncionariosList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast: hookToast } = useToast();

  const initialClienteId = searchParams.get("cliente_id") ?? "todos";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [clienteId, setClienteId] = useState<string>(initialClienteId);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clientes } = useClientes({ status: "ativo" });
  const { data: funcionarios, isLoading } = useFuncionarios({
    search,
    status,
    cliente_id: clienteId !== "todos" ? clienteId : undefined,
  });

  const createMutation = useCreateFuncionario();
  const updateMutation = useUpdateFuncionario();
  const deleteMutation = useDeleteFuncionario();

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, status, clienteId]);

  // Sync URL filter
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (clienteId && clienteId !== "todos") sp.set("cliente_id", clienteId);
    else sp.delete("cliente_id");
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const total = funcionarios?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = useMemo(() => {
    if (!funcionarios) return [];
    const start = (page - 1) * PAGE_SIZE;
    return funcionarios.slice(start, start + PAGE_SIZE);
  }, [funcionarios, page]);

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(f: Funcionario) {
    setEditing(f);
    setFormOpen(true);
  }

  function handleSubmit(values: FuncionarioFormValues & { origem?: string }) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...(values as any) }, {
        onSuccess: () => { hookToast({ title: "Funcionário atualizado" }); setFormOpen(false); },
        onError: (e) => hookToast({ title: "Erro", description: e.message, variant: "destructive" }),
      });
    } else {
      createMutation.mutate(values as any, {
        onSuccess: () => { hookToast({ title: "Funcionário criado" }); setFormOpen(false); },
        onError: (e) => hookToast({ title: "Erro", description: e.message, variant: "destructive" }),
      });
    }
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { hookToast({ title: "Funcionário excluído" }); setDeleteId(null); },
      onError: (e) => hookToast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-white">Funcionários</h2>
          <p className="text-white/50 text-sm">Base centralizada de colaboradores por cliente</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info("Integração com PS Index em breve")}
            className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Importar do PS Index
          </Button>
          <Button onClick={handleNew}>
            <UserPlus className="h-4 w-4 mr-2" /> Adicionar funcionário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {(clientes ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="afastado">Afastado</SelectItem>
          </SelectContent>
        </Select>

        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por nome, CPF ou email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      <div className="text-white/50 text-sm">
        {isLoading ? "Carregando..." : `${total} funcionário${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Nome</TableHead>
              <TableHead className="text-white/50">CPF</TableHead>
              <TableHead className="text-white/50">Cliente</TableHead>
              <TableHead className="text-white/50">Cargo / Setor</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Origem</TableHead>
              <TableHead className="text-white/50 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-white/40 py-8">Carregando...</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-white/40 py-8">Nenhum funcionário encontrado</TableCell></TableRow>
            ) : paginated.map((f) => {
              const origem = ORIGEM_BADGE[f.origem] ?? ORIGEM_BADGE.manual;
              return (
                <TableRow key={f.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">{f.nome}</TableCell>
                  <TableCell className="text-white/60 font-mono text-xs">{maskCpf(f.cpf)}</TableCell>
                  <TableCell className="text-white/60">{f.crm_clientes?.razao_social ?? "—"}</TableCell>
                  <TableCell className="text-white/60">
                    {f.cargo || "—"}
                    {f.setor ? <span className="text-white/40"> / {f.setor}</span> : null}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[f.status] ?? STATUS_BADGE.inativo}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={origem.className}>{origem.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(f)} className="text-white/60 hover:text-white h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)} className="text-white/60 hover:text-red-400 h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <FuncionarioForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editing ?? undefined}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
