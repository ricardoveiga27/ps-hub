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

    const asaasHeaders = {
      "Content-Type": "application/json",
      access_token: config.api_key,
      "User-Agent": "PSHub-Veiga",
    };

    // Fetch fatura
    const { data: fatura, error: fatErr } = await supabase
      .from("crm_faturas")
      .select("*, crm_clientes(razao_social, cnpj)")
      .eq("id", faturaId)
      .single();
    if (fatErr || !fatura) {
      return new Response(JSON.stringify({ error: "Fatura não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch asaas customer
    const { data: mapping } = await supabase
      .from("crm_asaas_customers")
      .select("asaas_customer_id")
      .eq("cliente_id", fatura.cliente_id)
      .maybeSingle();
    if (!mapping?.asaas_customer_id) {
      return new Response(JSON.stringify({ error: "Cliente não sincronizado com Asaas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure dueDate is not in the past — Asaas rejects past dates
    let dueDate = fatura.data_vencimento;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (dueDate < today) {
      dueDate = today;
      // Also update the fatura record so it stays consistent
      await supabase
        .from("crm_faturas")
        .update({ data_vencimento: today })
        .eq("id", faturaId);
    }

    // Create payment
    const paymentPayload = {
      customer: mapping.asaas_customer_id,
      billingType: "UNDEFINED",
      value: Number(fatura.valor),
      dueDate,
      description: fatura.descricao,
      externalReference: fatura.id,
    };

    const res = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify(paymentPayload),
    });
    const payment = await res.json();
    if (!res.ok) {
      console.error("Asaas payment error", payment);
      return new Response(JSON.stringify({ error: "Erro ao criar cobrança no Asaas", details: payment }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update fatura
    const { error: updErr } = await supabase
      .from("crm_faturas")
      .update({
        asaas_payment_id: payment.id,
        asaas_customer_id: mapping.asaas_customer_id,
        boleto_url: payment.bankSlipUrl || null,
        pix_qr_code: null,
        pix_copy_paste: null,
        invoice_url: payment.invoiceUrl || null,
      })
      .eq("id", faturaId);
    if (updErr) console.error("Update fatura error", updErr);

    // Try to get PIX info
    try {
      const pixRes = await fetch(`${ASAAS_BASE}/payments/${payment.id}/pixQrCode`, {
        headers: asaasHeaders,
      });
      if (pixRes.ok) {
        const pix = await pixRes.json();
        await supabase
          .from("crm_faturas")
          .update({
            pix_qr_code: pix.encodedImage || null,
            pix_copy_paste: pix.payload || null,
          })
          .eq("id", faturaId);
      } else {
        await pixRes.text();
      }
    } catch (pixErr) {
      console.error("PIX fetch error (non-critical)", pixErr);
    }

    return new Response(JSON.stringify({ success: true, payment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pshub-create-payment error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
