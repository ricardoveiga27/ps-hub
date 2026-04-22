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

    // Parse body
    let body: { cliente_id?: string };
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const clienteId = body.cliente_id;
    if (!clienteId) {
      return new Response(
        JSON.stringify({ error: "cliente_id obrigatório" }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch empresa
    const { data: cliente, error: cliErr } = await supabase
      .from("crm_clientes")
      .select(
        "id, razao_social, nome_fantasia, cnpj, email, telefone, cidade, uf, segmento, porte",
      )
      .eq("id", clienteId)
      .eq("status", "ativo")
      .maybeSingle();

    if (cliErr) {
      console.error("Erro ao buscar cliente", cliErr);
      return new Response(JSON.stringify({ error: "Erro interno" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!cliente) {
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        {
          status: 404,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch funcionários
    const { data: funcionarios, error: funcErr } = await supabase
      .from("crm_funcionarios")
      .select(
        "id, nome, cpf, email, telefone, cargo, setor, data_admissao, status",
      )
      .eq("cliente_id", clienteId)
      .eq("status", "ativo")
      .order("nome");

    if (funcErr) {
      console.error("Erro ao buscar funcionários", funcErr);
      return new Response(JSON.stringify({ error: "Erro interno" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const payload = {
      empresa: {
        hub_id: cliente.id,
        razao_social: cliente.razao_social,
        nome_fantasia: cliente.nome_fantasia,
        cnpj: cliente.cnpj,
        email: cliente.email,
        telefone: cliente.telefone,
        cidade: cliente.cidade,
        uf: cliente.uf,
        segmento: cliente.segmento,
        porte: cliente.porte,
      },
      funcionarios: (funcionarios ?? []).map((f) => ({
        hub_id: f.id,
        nome: f.nome,
        cpf: f.cpf,
        email: f.email,
        telefone: f.telefone,
        cargo: f.cargo,
        setor: f.setor,
        data_admissao: f.data_admissao,
        status: f.status,
      })),
      total: funcionarios?.length ?? 0,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-empresa-funcionarios error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
