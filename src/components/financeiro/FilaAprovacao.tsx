import { useState } from "react";
import { useFaturasPendentes, useAprovarFatura } from "@/hooks/useFaturas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function FilaAprovacao() {
  const { data: pendentes = [], isLoading } = useFaturasPendentes();
  const aprovarFatura = useAprovarFatura();
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Edit vidas dialog
  const [editingFatura, setEditingFatura] = useState<any | null>(null);
  const [editVidas, setEditVidas] = useState(0);
  const [editValor, setEditValor] = useState(0);
  const [originalVidas, setOriginalVidas] = useState(0);
  const [originalValor, setOriginalValor] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isLoading && pendentes.length === 0) return null;

  const openEditVidas = (f: any) => {
    const vidas = f.crm_assinaturas?.vidas ?? f.vidas ?? 1;
    setEditingFatura(f);
    setEditVidas(vidas);
    setEditValor(Number(f.valor));
    setOriginalVidas(vidas);
    setOriginalValor(Number(f.valor));
  };

  const handleVidasChange = (novasVidas: number) => {
    setEditVidas(novasVidas);
    if (originalVidas > 0) {
      setEditValor(Math.round((novasVidas / originalVidas) * originalValor * 100) / 100);
    }
  };

  const handleSaveVidas = async () => {
    if (!editingFatura) return;
    setSaving(true);
    try {
      // Update assinatura vidas
      await supabase.from("crm_assinaturas").update({ valor: editValor }).eq("id", editingFatura.assinatura_id);
      // Update fatura vidas + valor
      await supabase.from("crm_faturas").update({ vidas: editVidas, valor: editValor }).eq("id", editingFatura.id);
      toast.success("Vidas e valor atualizados");
      queryClient.invalidateQueries({ queryKey: ["faturas-pendentes"] });
      setEditingFatura(null);
    } catch {
      toast.error("Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async (f: any) => {
    setApprovingId(f.id);
    aprovarFatura.mutate(
      { faturaId: f.id, clienteId: f.cliente_id },
      {
        onSuccess: () => {
          toast.success("Cobrança enviada ao Asaas");
          setApprovingId(null);
        },
        onError: (err: any) => {
          toast.error(err.message || "Erro ao aprovar fatura");
          setApprovingId(null);
        },
      },
    );
  };

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-white text-lg">Fila de Aprovação</CardTitle>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              {isLoading ? "…" : pendentes.length} {pendentes.length === 1 ? "fatura" : "faturas"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-white/40 text-sm py-4 text-center">Carregando...</p>
          ) : (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70">Cliente</TableHead>
                    <TableHead className="text-white/70">Vidas</TableHead>
                    <TableHead className="text-white/70">Valor</TableHead>
                    <TableHead className="text-white/70">Vencimento</TableHead>
                    <TableHead className="text-white/70">Período</TableHead>
                    <TableHead className="text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.map((f) => {
                    const cliente = f.crm_clientes?.nome_fantasia || f.crm_clientes?.razao_social || "—";
                    const isApproving = approvingId === f.id;
                    return (
                      <TableRow key={f.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">{cliente}</TableCell>
                        <TableCell className="text-white">{f.vidas ?? "—"}</TableCell>
                        <TableCell className="text-white">{fmtCurrency(Number(f.valor))}</TableCell>
                        <TableCell className="text-white/70">{fmtDate(f.data_vencimento)}</TableCell>
                        <TableCell className="text-white/50 text-xs">{f.periodo_referencia || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-white/70 hover:text-white"
                              onClick={() => openEditVidas(f)}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Editar Vidas
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                              disabled={isApproving}
                              onClick={() => handleAprovar(f)}
                            >
                              {isApproving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              Aprovar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingFatura} onOpenChange={(o) => { if (!o) setEditingFatura(null); }}>
        <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Vidas e Valor</DialogTitle>
            <DialogDescription className="text-white/50">Ajuste antes de aprovar. O valor é recalculado proporcionalmente mas pode ser editado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Vidas</Label>
              <Input type="number" min={1} className="bg-white/5 border-white/10 text-white mt-1" value={editVidas} onChange={(e) => handleVidasChange(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-white/70">Valor (R$)</Label>
              <Input type="number" step="0.01" min={0} className="bg-white/5 border-white/10 text-white mt-1" value={editValor} onChange={(e) => setEditValor(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={handleSaveVidas} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
