import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useClientes, useCreateCliente, useDeleteCliente } from "@/hooks/useClientes";
import ClienteForm, { type ClienteFormValues } from "./ClienteForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const STATUS_BADGE: Record<string, string> = {
  prospecto: "bg-white/10 text-white/60",
  ativo: "bg-emerald-500/20 text-emerald-400",
  inativo: "bg-yellow-500/20 text-yellow-400",
  churned: "bg-red-500/20 text-red-400",
};

function formatCnpjDisplay(cnpj: string | null) {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

export default function ClientesList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [segmento, setSegmento] = useState("");
  const [porte, setPorte] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clientes, isLoading } = useClientes({
    search, status: status || undefined, segmento: segmento || undefined, porte: porte || undefined,
  });
  const createMutation = useCreateCliente();
  const deleteMutation = useDeleteCliente();

  function handleCreate(values: ClienteFormValues) {
    createMutation.mutate(values as any, {
      onSuccess: () => {
        toast({ title: "Cliente criado com sucesso" });
        setFormOpen(false);
      },
      onError: (e) => toast({ title: "Erro ao criar cliente", description: e.message, variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast({ title: "Cliente excluído" });
        setDeleteId(null);
      },
      onError: (e) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por razão social ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="prospecto">Prospecto</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={segmento} onValueChange={setSegmento}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="transportes">Transportes</SelectItem>
            <SelectItem value="saúde">Saúde</SelectItem>
            <SelectItem value="indústria">Indústria</SelectItem>
            <SelectItem value="logística">Logística</SelectItem>
            <SelectItem value="varejo">Varejo</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
        <Select value={porte} onValueChange={setPorte}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Porte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="micro">Micro</SelectItem>
            <SelectItem value="pequena">Pequena</SelectItem>
            <SelectItem value="média">Média</SelectItem>
            <SelectItem value="grande">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Razão Social</TableHead>
              <TableHead className="text-white/50">CNPJ</TableHead>
              <TableHead className="text-white/50">Segmento</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Cidade/UF</TableHead>
              <TableHead className="text-white/50">Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-12">Carregando...</TableCell></TableRow>
            ) : !clientes?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-12">Nenhum cliente encontrado</TableCell></TableRow>
            ) : (
              clientes.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-white/10 cursor-pointer hover:bg-white/5"
                  onClick={() => navigate(`/app/clientes/${c.id}`)}
                >
                  <TableCell className="text-white font-medium">{c.razao_social}</TableCell>
                  <TableCell className="text-white/60 font-mono text-xs">{formatCnpjDisplay(c.cnpj)}</TableCell>
                  <TableCell className="text-white/60 capitalize">{c.segmento ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[c.status] ?? STATUS_BADGE.prospecto}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.uf ?? "—"}
                  </TableCell>
                  <TableCell className="text-white/60">{c.responsavel_comercial ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClienteForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={createMutation.isPending} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Esta ação não pode ser desfeita. Todos os dados deste cliente serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
