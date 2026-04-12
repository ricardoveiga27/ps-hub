import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (values: { percentual_aplicado: number; observacao: string }) => void;
  loading?: boolean;
  valorAtual: number;
}

export default function ReajusteForm({ open, onOpenChange, onSubmit, loading, valorAtual }: Props) {
  const [percentual, setPercentual] = useState("");
  const [observacao, setObservacao] = useState("");

  const pct = parseFloat(percentual) || 0;
  const valorNovo = valorAtual * (1 + pct / 100);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ percentual_aplicado: pct, observacao });
    setPercentual("");
    setObservacao("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Registrar Reajuste</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/60">Valor Anterior</Label>
            <Input
              value={formatCurrency(valorAtual)}
              readOnly
              disabled
              className="bg-white/5 border-white/10 text-white/50"
            />
          </div>
          <div>
            <Label className="text-white/60">Percentual (%)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              placeholder="Ex: 5.5"
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div>
            <Label className="text-white/60">Valor Novo (calculado)</Label>
            <Input
              value={formatCurrency(valorNovo)}
              readOnly
              disabled
              className="bg-white/5 border-white/10 text-white/50"
            />
          </div>
          <div>
            <Label className="text-white/60">Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60">Cancelar</Button>
            <Button type="submit" disabled={loading || pct <= 0}>{loading ? "Salvando..." : "Aplicar Reajuste"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
