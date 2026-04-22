import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED = [
  "https://psindex.app.br",
  "https://pscultura.app.br",
  "https://pshub.app.br",
];

function corsHeaders(origin: string | null) {
  let ok = false;
  if (origin) {
    if (ALLOWED.includes(origin)) {
      ok = true;
    } else {
      try {
        const host = new URL(origin).hostname;
        if (/\.lovableproject\.com$/.test(host) || /\.lovable\.app$/.test(host)) {
          ok = true;
        }
      } catch {
        ok = false;
      }
    }
  }
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-hub-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    // Validate secret header
    const expected = Deno.env.get("HUB_API_SECRET");
    const provided = req.headers.get("x-hub-secret");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: clientes, error } = await supabase
      .from("crm_clientes")
      .select("id, razao_social, nome_fantasia, cnpj")
      .eq("status", "ativo")
      .order("razao_social")
      .limit(1000);

    if (error) {
      console.error("Erro ao buscar clientes", error);
      return new Response(JSON.stringify({ error: "Erro interno" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const payload = {
      clientes: (clientes ?? []).map((c) => ({
        hub_id: c.id,
        razao_social: c.razao_social,
        nome_fantasia: c.nome_fantasia,
        cnpj: c.cnpj,
      })),
      total: clientes?.length ?? 0,
    };

    console.log(
      `get-clientes-hub: origin=${origin ?? "none"} total=${payload.total}`,
    );

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-clientes-hub error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
