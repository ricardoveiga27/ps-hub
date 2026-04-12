import type { Fatura } from "@/hooks/useFaturas";

export function exportarCSV(faturas: Fatura[]) {
  const header = "Número;Cliente;Valor;Emissão;Vencimento;Status;Período\n";
  const rows = faturas.map((f) => {
    const cliente = f.crm_clientes?.nome_fantasia || f.crm_clientes?.razao_social || "—";
    const valor = Number(f.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const emissao = f.data_emissao || "—";
    const vencimento = f.data_vencimento;
    const periodo = f.periodo_referencia || "—";
    return `${f.numero_fatura || "—"};${cliente};${valor};${emissao};${vencimento};${f.status};${periodo}`;
  });

  const csv = header + rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `faturas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
