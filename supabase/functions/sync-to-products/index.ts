const ALLOWED = [
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

const PRODUTOS = [
  { nome: "ps-cultura", url: "https://fyelzagqyyluuinheegn.supabase.co/functions/v1/receive-hub-sync" },
  { nome: "ps-index",   url: "https://apdsugxhkuwpllzdnpof.supabase.co/functions/v1/receive-hub-sync" },
];

const EVENTOS_VALIDOS = new Set([
  "empresa.atualizada",
  "funcionario.criado",
  "funcionario.atualizado",
  "funcionario.desativado",
]);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const expected = Deno.env.get("HUB_API_SECRET");
    const provided = req.headers.get("x-hub-secret");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let body: { evento?: string; dados?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const evento = body.evento;
    const dados = body.dados;
    if (!evento || !EVENTOS_VALIDOS.has(evento)) {
      return new Response(
        JSON.stringify({ error: "Evento inválido", evento }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const payload = JSON.stringify({ evento, dados });

    const settled = await Promise.allSettled(
      PRODUTOS.map(async (p) => {
        const resp = await fetch(p.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hub-secret": expected,
          },
          body: payload,
        });
        return { produto: p.nome, status: resp.status, ok: resp.ok };
      }),
    );

    const resultados = settled.map((r, i) => {
      if (r.status === "fulfilled") {
        console.log("sync-to-products", r.value);
        return r.value;
      }
      console.log("sync-to-products fail", {
        produto: PRODUTOS[i].nome,
        error: String(r.reason),
      });
      return { produto: PRODUTOS[i].nome, status: 0, ok: false };
    });

    return new Response(
      JSON.stringify({ success: true, evento, resultados }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("sync-to-products error", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
