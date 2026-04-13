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

    const { clienteId } = await req.json();
    if (!clienteId) {
      return new Response(JSON.stringify({ error: "clienteId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Asaas config
    const { data: config, error: cfgErr } = await supabase
      .from("crm_asaas_config")
      .select("api_key")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (cfgErr || !config) {
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

    // Fetch cliente
    const { data: cliente, error: cliErr } = await supabase
      .from("crm_clientes")
      .select("id, razao_social, cnpj, email, telefone")
      .eq("id", clienteId)
      .single();
    if (cliErr || !cliente) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing mapping
    const { data: existing } = await supabase
      .from("crm_asaas_customers")
      .select("asaas_customer_id")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    // Sanitize CPF/CNPJ — digits only
    const rawDoc = (cliente.cnpj || "").replace(/\D/g, "");
    if (!rawDoc || (rawDoc.length !== 11 && rawDoc.length !== 14)) {
      return new Response(
        JSON.stringify({ error: `CPF/CNPJ inválido para o cliente "${cliente.razao_social}". Atualize o cadastro com um documento válido (11 ou 14 dígitos).` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Reject obviously fake docs (all same digit)
    if (/^(\d)\1+$/.test(rawDoc)) {
      return new Response(
        JSON.stringify({ error: `CPF/CNPJ "${rawDoc}" é inválido (todos os dígitos iguais). Atualize o cadastro do cliente.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Sanitize phone — digits only
    const cleanPhone = (cliente.telefone || "").replace(/\D/g, "") || undefined;

    const payload = {
      name: cliente.razao_social,
      cpfCnpj: rawDoc,
      email: cliente.email || undefined,
      mobilePhone: cleanPhone,
    };

    let asaasCustomerId: string;

    if (existing?.asaas_customer_id) {
      // Update
      const res = await fetch(`${ASAAS_BASE}/customers/${existing.asaas_customer_id}`, {
        method: "PUT",
        headers: asaasHeaders,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        console.error("Asaas PUT error", body);
        return new Response(JSON.stringify({ error: "Erro ao atualizar cliente no Asaas", details: body }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      asaasCustomerId = body.id;
    } else {
      // Create
      const res = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        console.error("Asaas POST error", body);
        return new Response(JSON.stringify({ error: "Erro ao criar cliente no Asaas", details: body }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      asaasCustomerId = body.id;
    }

    // Upsert local mapping
    const { error: upsertErr } = await supabase
      .from("crm_asaas_customers")
      .upsert(
        {
          cliente_id: clienteId,
          asaas_customer_id: asaasCustomerId,
          name: cliente.razao_social,
          cpf_cnpj: cliente.cnpj,
          email: cliente.email,
          synchronized_at: new Date().toISOString(),
        },
        { onConflict: "cliente_id" },
      );
    if (upsertErr) {
      console.error("Upsert error", upsertErr);
    }

    return new Response(JSON.stringify({ success: true, asaas_customer_id: asaasCustomerId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pshub-sync-asaas-customer error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
