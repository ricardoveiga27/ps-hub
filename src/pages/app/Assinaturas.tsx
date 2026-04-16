import { useState } from "react";
import { useAssinaturas, useUpdateAssinatura, type Assinatura } from "@/hooks/useAssinaturas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Ativa", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  SUSPENDED: { label: "Suspensa", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  CANCELED: { label: "Cancelada", className: "bg-white/10 text-white/50 border-white/20" },
};

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function Assinaturas() {
  const { data: assinaturas = [], isLoading } = useAssinaturas();
  const updateAssinatura = useUpdateAssinatura();
  const [editing, setEditing] = useState<Assinatura | null>(null);
  const [editVidas, setEditVidas] = useState(0);
  const [editValor, setEditValor] = useState(0);

  const openEdit = (a: Assinatura) => {
    setEditing(a);
    setEditVidas(a.crm_contratos?.vidas ?? 0);
    setEditValor(Number(a.valor));
  };

  const handleSave = () => {
    if (!editing) return;
    updateAssinatura.mutate(
      { id: editing.id, contrato_id: editing.contrato_id, vidas: editVidas, valor: editValor },
      {
        onSuccess: () => { toast.success("Assinatura atualizada"); setEditing(null); },
        onError: () => toast.error("Erro ao atualizar"),
      },
    );
  };

  return (
    <div className="space-y-6">

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white/70">Cliente</TableHead>
              <TableHead className="text-white/70">Contrato</TableHead>
              <TableHead className="text-white/70">Produtos</TableHead>
              <TableHead className="text-white/70">Vidas</TableHead>
              <TableHead className="text-white/70">Valor Mensal</TableHead>
              <TableHead className="text-white/70">Dia Venc.</TableHead>
              <TableHead className="text-white/70">Próx. Reajuste</TableHead>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-white/40 py-8">Carregando...</TableCell></TableRow>
            ) : assinaturas.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-white/40 py-8">Nenhuma assinatura encontrada</TableCell></TableRow>
            ) : (
              assinaturas.map((a) => {
                const s = statusMap[a.status] || statusMap.ACTIVE;
                const cliente = a.crm_clientes?.nome_fantasia || a.crm_clientes?.razao_social || "—";
                const c = a.crm_contratos;
                return (
                  <TableRow key={a.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white">{cliente}</TableCell>
                    <TableCell className="text-white font-mono text-xs">{c?.codigo_contrato || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {c?.ps_index_ativo && <span className="h-2.5 w-2.5 rounded-full bg-blue-400" title="PS Index" />}
                        {c?.ps_escuta_ativo && <span className="h-2.5 w-2.5 rounded-full bg-purple-400" title="PS Escuta" />}
                        {c?.ps_cultura_ativo && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" title="PS Cultura" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{c?.vidas ?? "—"}</TableCell>
                    <TableCell className="text-white">{fmtCurrency(Number(a.valor))}</TableCell>
                    <TableCell className="text-white/70">{a.dia_vencimento}</TableCell>
                    <TableCell className="text-white/70">{fmtDate(a.proximo_reajuste_em)}</TableCell>
                    <TableCell><Badge className={s.className}>{s.label}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-white/70 hover:text-white" onClick={() => openEdit(a)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Assinatura</DialogTitle>
            <DialogDescription className="text-white/50">Altere vidas e valor mensal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Vidas</Label>
              <Input type="number" min={1} className="bg-white/5 border-white/10 text-white mt-1" value={editVidas} onChange={(e) => setEditVidas(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-white/70">Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" min={0} className="bg-white/5 border-white/10 text-white mt-1" value={editValor} onChange={(e) => setEditValor(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={updateAssinatura.isPending}>
              {updateAssinatura.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
