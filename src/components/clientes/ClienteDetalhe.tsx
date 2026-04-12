import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useClientes";
import ClienteForm, { type ClienteFormValues } from "./ClienteForm";
import ContatosList from "./ContatosList";
import PropostaForm, { type PropostaFormValues } from "@/components/propostas/PropostaForm";
import { useCreateProposta } from "@/hooks/usePropostas";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_BADGE: Record<string, string> = {
  prospecto: "bg-white/10 text-white/60",
  ativo: "bg-emerald-500/20 text-emerald-400",
  inativo: "bg-yellow-500/20 text-yellow-400",
  churned: "bg-red-500/20 text-red-400",
};

const PROPOSTA_STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-white/10 text-white/60",
  enviada: "bg-blue-500/20 text-blue-400",
  aceita: "bg-emerald-500/20 text-emerald-400",
  recusada: "bg-red-500/20 text-red-400",
  expirada: "bg-yellow-500/20 text-yellow-400",
};

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: cliente, isLoading } = useCliente(id);
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [propostaFormOpen, setPropostaFormOpen] = useState(false);
  const createPropostaMutation = useCreateProposta();
  const queryClient = useQueryClient();

  // Read-only lists
  const { data: propostas } = useQuery({
    queryKey: ["propostas-cliente", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_propostas").select("*").eq("cliente_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contratos } = useQuery({
    queryKey: ["contratos-cliente", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contratos").select("*").eq("cliente_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: faturas } = useQuery({
    queryKey: ["faturas-cliente", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_faturas").select("*").eq("cliente_id", id!).order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  function handleCreateProposta(values: PropostaFormValues) {
    const bruto = values.valor_mensal * values.vidas;
    let valorFinal = bruto;
    if (values.desconto_tipo === "percentual" && values.desconto_valor > 0) {
      valorFinal = bruto * (1 - values.desconto_valor / 100);
    } else if (values.desconto_tipo === "fixo" && values.desconto_valor > 0) {
      valorFinal = bruto - values.desconto_valor;
    }
    createPropostaMutation.mutate(
      {
        cliente_id: values.cliente_id,
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
          sonnerToast.success("Proposta criada com sucesso");
          setPropostaFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ["propostas-cliente", id] });
        },
        onError: (e) => sonnerToast.error("Erro ao criar proposta: " + e.message),
      }
    );
  }

  function handleUpdate(values: ClienteFormValues) {
    if (!id) return;
    updateMutation.mutate({ id, ...values } as any, {
      onSuccess: () => { toast({ title: "Cliente atualizado" }); setEditOpen(false); },
      onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => { toast({ title: "Cliente excluído" }); navigate("/app/clientes"); },
      onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  }

  if (isLoading) return <div className="text-white/40 py-12 text-center">Carregando...</div>;
  if (!cliente) return <div className="text-white/40 py-12 text-center">Cliente não encontrado</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/clientes")} className="text-white/60 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-white">{cliente.razao_social}</h1>
          {cliente.nome_fantasia && <p className="text-white/50 text-sm">{cliente.nome_fantasia}</p>}
        </div>
        <Badge className={STATUS_BADGE[cliente.status] ?? STATUS_BADGE.prospecto}>
          {cliente.status.charAt(0).toUpperCase() + cliente.status.slice(1)}
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} className="text-white/60 hover:text-white">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} className="text-white/60 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="dados" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">Dados</TabsTrigger>
          <TabsTrigger value="contatos" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">Contatos</TabsTrigger>
          <TabsTrigger value="propostas" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">Propostas</TabsTrigger>
          <TabsTrigger value="contratos" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">Contratos</TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">Financeiro</TabsTrigger>
        </TabsList>

        {/* Dados */}
        <TabsContent value="dados">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ["CNPJ", formatCnpj(cliente.cnpj)],
                  ["Segmento", cliente.segmento ? cliente.segmento.charAt(0).toUpperCase() + cliente.segmento.slice(1) : "—"],
                  ["Porte", cliente.porte ? cliente.porte.charAt(0).toUpperCase() + cliente.porte.slice(1) : "—"],
                  ["Email", cliente.email ?? "—"],
                  ["Telefone", cliente.telefone ?? "—"],
                  ["Cidade/UF", cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : "—"],
                  ["Responsável Comercial", cliente.responsavel_comercial ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <p className="text-white/80 text-sm">{value}</p>
                  </div>
                ))}
                {cliente.observacoes && (
                  <div className="col-span-full">
                    <p className="text-xs text-white/40 mb-1">Observações</p>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{cliente.observacoes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contatos */}
        <TabsContent value="contatos">
          <ContatosList clienteId={id!} />
        </TabsContent>

        {/* Propostas */}
        <TabsContent value="propostas">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setPropostaFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Proposta
              </Button>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Nº</TableHead>
                    <TableHead className="text-white/50">Título</TableHead>
                    <TableHead className="text-white/50 text-center">Vidas</TableHead>
                    <TableHead className="text-white/50 text-right">Valor Final</TableHead>
                    <TableHead className="text-white/50">Status</TableHead>
                    <TableHead className="text-white/50">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!propostas?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">Nenhuma proposta</TableCell></TableRow>
                  ) : propostas.map((p) => (
                    <TableRow
                      key={p.id}
                      className="border-white/10 cursor-pointer hover:bg-white/5"
                      onClick={() => navigate(`/app/propostas/${p.id}`)}
                    >
                      <TableCell className="text-white/60 font-mono text-xs">{p.numero_proposta ?? "—"}</TableCell>
                      <TableCell className="text-white">{p.titulo ?? "—"}</TableCell>
                      <TableCell className="text-white/60 text-center">{p.vidas}</TableCell>
                      <TableCell className="text-white text-right font-medium">{formatCurrency(p.valor_final)}</TableCell>
                      <TableCell><Badge className={PROPOSTA_STATUS_BADGE[p.status] || ""}>{p.status}</Badge></TableCell>
                      <TableCell className="text-white/60">{formatDate(p.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Contratos */}
        <TabsContent value="contratos">
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Código</TableHead>
                  <TableHead className="text-white/50">Vidas</TableHead>
                  <TableHead className="text-white/50">Valor Mensal</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!contratos?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-8">Nenhum contrato</TableCell></TableRow>
                ) : contratos.map((c) => (
                  <TableRow key={c.id} className="border-white/10">
                    <TableCell className="text-white/60 font-mono text-xs">{c.codigo_contrato ?? "—"}</TableCell>
                    <TableCell className="text-white/60">{c.vidas}</TableCell>
                    <TableCell className="text-white/60">{formatCurrency(c.valor_mensal)}</TableCell>
                    <TableCell><Badge className={c.status === "ativo" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-white/60">{formatDate(c.data_inicio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financeiro">
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">Nº Fatura</TableHead>
                  <TableHead className="text-white/50">Referência</TableHead>
                  <TableHead className="text-white/50">Valor</TableHead>
                  <TableHead className="text-white/50">Vencimento</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!faturas?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-8">Nenhuma fatura</TableCell></TableRow>
                ) : faturas.map((f) => (
                  <TableRow key={f.id} className="border-white/10">
                    <TableCell className="text-white/60 font-mono text-xs">{f.numero_fatura ?? "—"}</TableCell>
                    <TableCell className="text-white/60">{f.periodo_referencia ?? "—"}</TableCell>
                    <TableCell className="text-white/60">{formatCurrency(f.valor)}</TableCell>
                    <TableCell className="text-white/60">{formatDate(f.data_vencimento)}</TableCell>
                    <TableCell>
                      <Badge className={
                        f.status === "CONFIRMED" || f.status === "RECEIVED" ? "bg-emerald-500/20 text-emerald-400" :
                        f.status === "OVERDUE" ? "bg-red-500/20 text-red-400" :
                        "bg-white/10 text-white/60"
                      }>{f.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ClienteForm open={editOpen} onOpenChange={setEditOpen} defaultValues={cliente} onSubmit={handleUpdate} loading={updateMutation.isPending} />

      <PropostaForm
        open={propostaFormOpen}
        onOpenChange={setPropostaFormOpen}
        onSubmit={handleCreateProposta}
        loading={createPropostaMutation.isPending}
        defaultValues={{ cliente_id: id }}
        lockedClienteId={id}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir cliente?</AlertDialogTitle>
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
