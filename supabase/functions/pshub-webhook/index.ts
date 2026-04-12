import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-webhook-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Validate webhook token
    const token = req.headers.get("asaas-webhook-token");
    const { data: config } = await supabase
      .from("crm_asaas_config")
      .select("webhook_token")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (config?.webhook_token && token !== config.webhook_token) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const eventType = payload.event as string;
    const eventId = payload.id || crypto.randomUUID();

    // Persist event immediately
    await supabase.from("crm_webhook_events").upsert({
      id: eventId,
      event_type: eventType,
      payload,
      received_at: new Date().toISOString(),
    }, { onConflict: "id" });

    const payment = payload.payment;

    // Ignore subscription payments
    if (payment?.subscription) {
      console.log("Ignoring subscription payment", payment.id);
      await supabase
        .from("crm_webhook_events")
        .update({ processed_at: new Date().toISOString(), processing_notes: "Ignored: subscription payment" })
        .eq("id", eventId);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notes = `Processed ${eventType}`;

    if (payment?.id) {
      const asaasPaymentId = payment.id;

      if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
        await supabase
          .from("crm_faturas")
          .update({ status: "RECEIVED" })
          .eq("asaas_payment_id", asaasPaymentId);
      } else if (eventType === "PAYMENT_OVERDUE") {
        await supabase
          .from("crm_faturas")
          .update({ status: "OVERDUE" })
          .eq("asaas_payment_id", asaasPaymentId);
      } else if (eventType === "PAYMENT_DELETED" || eventType === "PAYMENT_REFUNDED") {
        await supabase
          .from("crm_faturas")
          .update({ status: "CANCELLED" })
          .eq("asaas_payment_id", asaasPaymentId);
      }
    }

    const invoice = payload.invoice;
    if (invoice?.id) {
      if (eventType === "INVOICE_AUTHORIZED") {
        await supabase
          .from("crm_notas_fiscais")
          .update({
            status: "EMITIDA",
            pdf_url: invoice.pdfUrl || null,
            numero_nfse: invoice.number?.toString() || null,
          })
          .eq("asaas_invoice_id", invoice.id);
      } else if (eventType === "INVOICE_ERROR") {
        await supabase
          .from("crm_notas_fiscais")
          .update({ status: "ERRO" })
          .eq("asaas_invoice_id", invoice.id);
        notes += ` - Invoice error`;
      }
    }

    // Mark as processed
    await supabase
      .from("crm_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_notes: notes })
      .eq("id", eventId);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pshub-webhook error", err);
    // Always return 200
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
