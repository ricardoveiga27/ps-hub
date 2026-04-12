import { useState } from "react";
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContatos, useCreateContato, useUpdateContato, useDeleteContato } from "@/hooks/useContatos";
import ContatoForm, { type ContatoFormValues } from "./ContatoForm";
import { useToast } from "@/hooks/use-toast";
import type { Contato } from "@/hooks/useContatos";

interface Props {
  clienteId: string;
}

export default function ContatosList({ clienteId }: Props) {
  const { toast } = useToast();
  const { data: contatos, isLoading } = useContatos(clienteId);
  const createMutation = useCreateContato();
  const updateMutation = useUpdateContato();
  const deleteMutation = useDeleteContato();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contato | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleCreate(values: ContatoFormValues) {
    createMutation.mutate({ ...values, cliente_id: clienteId } as any, {
      onSuccess: () => { toast({ title: "Contato adicionado" }); setFormOpen(false); },
      onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  function handleUpdate(values: ContatoFormValues) {
    if (!editing) return;
    updateMutation.mutate({ id: editing.id, ...values } as any, {
      onSuccess: () => { toast({ title: "Contato atualizado" }); setEditing(null); },
      onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId, clienteId }, {
      onSuccess: () => { toast({ title: "Contato excluído" }); setDeleteId(null); },
      onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Nome</TableHead>
              <TableHead className="text-white/50">Cargo</TableHead>
              <TableHead className="text-white/50">Email</TableHead>
              <TableHead className="text-white/50">Celular</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50 w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">Carregando...</TableCell></TableRow>
            ) : !contatos?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">Nenhum contato cadastrado</TableCell></TableRow>
            ) : (
              contatos.map((c) => (
                <TableRow key={c.id} className="border-white/10">
                  <TableCell className="text-white font-medium flex items-center gap-2">
                    {c.principal && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                    {c.nome}
                  </TableCell>
                  <TableCell className="text-white/60">{c.cargo ?? "—"}</TableCell>
                  <TableCell className="text-white/60">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-white/60">{c.celular ?? c.telefone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={c.ativo ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ContatoForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} loading={createMutation.isPending} />
      {editing && (
        <ContatoForm open={!!editing} onOpenChange={() => setEditing(null)} defaultValues={editing} onSubmit={handleUpdate} loading={updateMutation.isPending} />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">Esta ação não pode ser desfeita.</AlertDialogDescription>
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
