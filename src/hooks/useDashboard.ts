import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KPIs {
  clientesAtivos: number;
  mrr: number;
  vidasTotais: number;
  inadimplencia: number;
}

interface FaturamentoMensal {
  mes: string;
  recebido: number;
  pendente: number;
}

interface PropostaAberta {
  id: string;
  titulo: string | null;
  numero_proposta: string | null;
  valor_final: number;
  enviada_em: string | null;
  cliente: string;
}

interface FaturaVencida {
  id: string;
  numero_fatura: string | null;
  valor: number;
  data_vencimento: string;
  cliente: string;
}

export interface DashboardData {
  kpis: KPIs;
  faturamentoMensal: FaturamentoMensal[];
  propostasAbertas: PropostaAberta[];
  faturasVencidas: FaturaVencida[];
}

function formatMesLabel(date: Date): string {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;
}

function getPrimeiroDia6MesesAtras(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function buildMesesMap(): Map<string, FaturamentoMensal> {
  const map = new Map<string, FaturamentoMensal>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, { mes: formatMesLabel(d), recebido: 0, pendente: 0 });
  }
  return map;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const [clientesRes, contratosRes, overdueRes, faturasChartRes, propostasRes, faturasVencidasRes] =
        await Promise.all([
          supabase.from("crm_clientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
          supabase.from("crm_contratos").select("valor_mensal, vidas").eq("status", "ativo"),
          supabase.from("crm_faturas").select("valor").eq("status", "OVERDUE"),
          supabase
            .from("crm_faturas")
            .select("valor, status, data_vencimento")
            .gte("data_vencimento", getPrimeiroDia6MesesAtras()),
          supabase
            .from("crm_propostas")
            .select("id, titulo, numero_proposta, valor_final, enviada_em, crm_clientes(razao_social)")
            .eq("status", "enviada")
            .order("enviada_em", { ascending: false })
            .limit(5),
          supabase
            .from("crm_faturas")
            .select("id, numero_fatura, valor, data_vencimento, crm_clientes(razao_social)")
            .eq("status", "OVERDUE")
            .order("data_vencimento", { ascending: true })
            .limit(5),
        ]);

      // KPIs
      const clientesAtivos = clientesRes.count ?? 0;
      const contratos = contratosRes.data ?? [];
      const mrr = contratos.reduce((s, c) => s + Number(c.valor_mensal), 0);
      const vidasTotais = contratos.reduce((s, c) => s + Number(c.vidas), 0);
      const inadimplencia = (overdueRes.data ?? []).reduce((s, f) => s + Number(f.valor), 0);

      // Faturamento mensal — agregação frontend
      const mesesMap = buildMesesMap();
      for (const f of faturasChartRes.data ?? []) {
        const d = new Date(f.data_vencimento + "T00:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = mesesMap.get(key);
        if (!entry) continue;
        if (f.status === "RECEIVED") {
          entry.recebido += Number(f.valor);
        } else {
          entry.pendente += Number(f.valor);
        }
      }
      const faturamentoMensal = Array.from(mesesMap.values());

      // Propostas abertas
      const propostasAbertas: PropostaAberta[] = (propostasRes.data ?? []).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        numero_proposta: p.numero_proposta,
        valor_final: p.valor_final,
        enviada_em: p.enviada_em,
        cliente: p.crm_clientes?.razao_social ?? "—",
      }));

      // Faturas vencidas
      const faturasVencidas: FaturaVencida[] = (faturasVencidasRes.data ?? []).map((f: any) => ({
        id: f.id,
        numero_fatura: f.numero_fatura,
        valor: f.valor,
        data_vencimento: f.data_vencimento,
        cliente: f.crm_clientes?.razao_social ?? "—",
      }));

      return { kpis: { clientesAtivos, mrr, vidasTotais, inadimplencia }, faturamentoMensal, propostasAbertas, faturasVencidas };
    },
  });
}
