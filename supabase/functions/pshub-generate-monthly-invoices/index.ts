import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const diaAtual = now.getDate();
    const mesAtual = String(now.getMonth() + 1).padStart(2, "0");
    const anoAtual = now.getFullYear();
    const periodoReferencia = `${mesAtual}/${anoAtual}`;

    // Fetch active subscriptions due today
    const { data: assinaturas, error: assErr } = await supabase
      .from("crm_assinaturas")
      .select("id, cliente_id, contrato_id, valor, dia_vencimento")
      .eq("status", "ACTIVE")
      .eq("dia_vencimento", diaAtual);

    if (assErr) {
      console.error("Fetch assinaturas error", assErr);
      return new Response(JSON.stringify({ error: "Erro ao buscar assinaturas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let faturasGeradas = 0;

    for (const ass of assinaturas || []) {
      // Check if invoice already exists for this period
      const { data: existing } = await supabase
        .from("crm_faturas")
        .select("id")
        .eq("assinatura_id", ass.id)
        .eq("periodo_referencia", periodoReferencia)
        .maybeSingle();

      if (existing) continue;

      // Calculate due date
      const dueDate = `${anoAtual}-${mesAtual}-${String(ass.dia_vencimento).padStart(2, "0")}`;

      const { error: insErr } = await supabase.from("crm_faturas").insert({
        assinatura_id: ass.id,
        cliente_id: ass.cliente_id,
        valor: ass.valor,
        data_vencimento: dueDate,
        data_emissao: now.toISOString().split("T")[0],
        status: "PENDING",
        descricao: "Licença PS Hub",
        periodo_referencia: periodoReferencia,
      });

      if (insErr) {
        console.error(`Insert fatura error for assinatura ${ass.id}`, insErr);
      } else {
        faturasGeradas++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, faturas_geradas: faturasGeradas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("pshub-generate-monthly-invoices error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
