import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { Fatura } from "@/hooks/useFaturas";

interface Props {
  faturas: Fatura[];
}

export default function FinanceiroResumo({ faturas }: Props) {
  const totais = faturas.reduce(
    (acc, f) => {
      const v = Number(f.valor);
      acc.faturado += v;
      if (f.status === "RECEIVED") acc.recebido += v;
      if (f.status === "PENDING") acc.pendente += v;
      if (f.status === "OVERDUE") acc.vencido += v;
      return acc;
    },
    { faturado: 0, recebido: 0, pendente: 0, vencido: 0 },
  );

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cards = [
    { label: "Total Faturado", value: fmt(totais.faturado), icon: DollarSign, color: "text-blue-400" },
    { label: "Recebido", value: fmt(totais.recebido), icon: CheckCircle, color: "text-emerald-400" },
    { label: "Pendente", value: fmt(totais.pendente), icon: Clock, color: "text-yellow-400" },
    { label: "Vencido", value: fmt(totais.vencido), icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-white/10 bg-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <c.icon className={`h-8 w-8 ${c.color}`} />
            <div>
              <p className="text-xs text-white/50">{c.label}</p>
              <p className="text-lg font-semibold text-white">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
