import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, DollarSign, Heart, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const chartConfig = {
  recebido: { label: "Recebido", color: "hsl(142, 71%, 45%)" },
  pendente: { label: "Pendente / Vencido", color: "hsl(45, 93%, 47%)" },
};

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const navigate = useNavigate();

  const kpis = data?.kpis;

  const kpiCards = [
    { title: "Clientes Ativos", value: kpis?.clientesAtivos ?? 0, icon: Users, format: (v: number) => String(v) },
    { title: "MRR", value: kpis?.mrr ?? 0, icon: DollarSign, format: fmtCurrency },
    { title: "Vidas Totais", value: kpis?.vidasTotais ?? 0, icon: Heart, format: (v: number) => String(v) },
    { title: "Inadimplência", value: kpis?.inadimplencia ?? 0, icon: AlertTriangle, format: fmtCurrency },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/60">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-white/10" />
              ) : (
                <p className="text-2xl font-bold text-white">{kpi.format(kpi.value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 text-base">Faturamento Mensal — Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full bg-white/10" />
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={data?.faturamentoMensal ?? []} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="recebido" stackId="a" fill="var(--color-recebido)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pendente" stackId="a" fill="var(--color-pendente)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Propostas Abertas */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white/70 text-base">Propostas Abertas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><Skeleton className="h-32 w-full bg-white/10" /></div>
            ) : !data?.propostasAbertas.length ? (
              <p className="text-white/40 text-sm p-6">Nenhuma proposta enviada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Proposta</TableHead>
                    <TableHead className="text-white/50">Cliente</TableHead>
                    <TableHead className="text-white/50 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.propostasAbertas.map((p) => (
                    <TableRow
                      key={p.id}
                      className="border-white/10 cursor-pointer hover:bg-white/5"
                      onClick={() => navigate(`/app/propostas/${p.id}`)}
                    >
                      <TableCell className="text-white/80 font-medium">
                        {p.numero_proposta ?? p.titulo ?? "—"}
                      </TableCell>
                      <TableCell className="text-white/60">{p.cliente}</TableCell>
                      <TableCell className="text-white/80 text-right">{fmtCurrency(p.valor_final)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Faturas Vencidas */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white/70 text-base">Faturas Vencidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><Skeleton className="h-32 w-full bg-white/10" /></div>
            ) : !data?.faturasVencidas.length ? (
              <p className="text-white/40 text-sm p-6">Nenhuma fatura vencida.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Fatura</TableHead>
                    <TableHead className="text-white/50">Cliente</TableHead>
                    <TableHead className="text-white/50">Vencimento</TableHead>
                    <TableHead className="text-white/50 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.faturasVencidas.map((f) => (
                    <TableRow
                      key={f.id}
                      className="border-white/10 cursor-pointer hover:bg-white/5"
                      onClick={() => navigate("/app/financeiro")}
                    >
                      <TableCell className="text-white/80 font-medium">{f.numero_fatura ?? "—"}</TableCell>
                      <TableCell className="text-white/60">{f.cliente}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">{fmtDate(f.data_vencimento)}</Badge>
                      </TableCell>
                      <TableCell className="text-white/80 text-right">{fmtCurrency(f.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
