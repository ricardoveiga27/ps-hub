import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = "https://api-sandbox.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { faturaId } = await req.json();
    if (!faturaId) {
      return new Response(JSON.stringify({ error: "faturaId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch config
    const { data: config } = await supabase
      .from("crm_asaas_config")
      .select("api_key")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!config) {
      return new Response(JSON.stringify({ error: "Configuração Asaas não encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch fatura
    const { data: fatura, error: fatErr } = await supabase
      .from("crm_faturas")
      .select("*, crm_clientes(razao_social)")
      .eq("id", faturaId)
      .single();
    if (fatErr || !fatura) {
      return new Response(JSON.stringify({ error: "Fatura não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (fatura.status !== "RECEIVED") {
      return new Response(JSON.stringify({ error: "Fatura não está com status RECEIVED" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fatura.asaas_payment_id) {
      return new Response(JSON.stringify({ error: "Fatura não possui pagamento Asaas vinculado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing NF
    const { data: existingNf } = await supabase
      .from("crm_notas_fiscais")
      .select("id")
      .eq("fatura_id", faturaId)
      .maybeSingle();
    if (existingNf) {
      return new Response(JSON.stringify({ error: "Já existe nota fiscal para esta fatura" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasHeaders = {
      "Content-Type": "application/json",
      access_token: config.api_key,
      "User-Agent": "PSHub-Veiga",
    };

    const invoicePayload = {
      payment: fatura.asaas_payment_id,
      serviceDescription: `Licença PS Hub - ${fatura.periodo_referencia || ""}`.trim(),
      observations: fatura.descricao,
    };

    const res = await fetch(`${ASAAS_BASE}/invoices`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify(invoicePayload),
    });
    const invoice = await res.json();
    if (!res.ok) {
      console.error("Asaas invoice error", invoice);
      return new Response(JSON.stringify({ error: "Erro ao emitir NFS-e no Asaas", details: invoice }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert NF record
    const { error: nfErr } = await supabase.from("crm_notas_fiscais").insert({
      fatura_id: faturaId,
      cliente_id: fatura.cliente_id,
      asaas_invoice_id: invoice.id,
      status: "PROCESSING",
      valor: Number(fatura.valor),
    });
    if (nfErr) console.error("Insert NF error", nfErr);

    return new Response(JSON.stringify({ success: true, asaas_invoice_id: invoice.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pshub-emit-nfse error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
