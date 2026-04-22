// Edge Function: send-product-invite
// Orquestra status e envio de convites para PS Cultura e PS Index
// Requer JWT (admin) — valida via crm_usuarios.is_admin

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PS_CULTURA_URL = "https://fyelzagqyyluuinheegn.supabase.co";
const PS_INDEX_URL = "https://apdsugxhkuwpllzdnpof.supabase.co";

type Produto = "ps_cultura" | "ps_index" | "todos";
type Action = "status" | "invite";

interface RequestBody {
  action: Action;
  produto?: Produto;
  email?: string;
  nome?: string;
  cliente_hub_id: string;
}

interface InviteResult {
  enviado: boolean;
  motivo: string | null;
}

interface CulturaStatus {
  status: "sem_rh" | "pendente" | "expirado" | "ativo";
  email: string | null;
  nome: string | null;
  empresa_importada: boolean;
}

interface IndexStatus {
  status: "configurado" | "nao_configurado";
  empresa_importada: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolveEmpresaId(
  baseUrl: string,
  anonKey: string,
  hubId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${baseUrl}/rest/v1/empresas?hub_id=eq.${hubId}&select=id&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );
    if (!res.ok) {
      console.error(`[resolveEmpresaId ${baseUrl}] HTTP ${res.status}`);
      return null;
    }
    const arr = await res.json();
    return Array.isArray(arr) && arr[0]?.id ? String(arr[0].id) : null;
  } catch (e) {
    console.error(`[resolveEmpresaId ${baseUrl}] erro:`, (e as Error).message);
    return null;
  }
}

async function getCulturaStatus(
  hubId: string,
  anonKey: string,
): Promise<CulturaStatus> {
  const empresaId = await resolveEmpresaId(PS_CULTURA_URL, anonKey, hubId);
  if (!empresaId) {
    return { status: "sem_rh", email: null, nome: null, empresa_importada: false };
  }
  try {
    const res = await fetch(
      `${PS_CULTURA_URL}/rest/v1/perfis?empresa_id=eq.${empresaId}&role=eq.cliente&select=email,nome,invite_sent_at,invite_accepted_at&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );
    if (!res.ok) {
      console.error(`[getCulturaStatus] perfis HTTP ${res.status}`);
      return { status: "sem_rh", email: null, nome: null, empresa_importada: true };
    }
    const arr = await res.json();
    const row = Array.isArray(arr) ? arr[0] : null;
    if (!row) {
      return { status: "sem_rh", email: null, nome: null, empresa_importada: true };
    }
    if (row.invite_accepted_at) {
      return {
        status: "ativo",
        email: row.email ?? null,
        nome: row.nome ?? null,
        empresa_importada: true,
      };
    }
    if (row.invite_sent_at) {
      const sent = new Date(row.invite_sent_at).getTime();
      const now = Date.now();
      const diasMs = 7 * 24 * 60 * 60 * 1000;
      if (now - sent > diasMs) {
        return {
          status: "expirado",
          email: row.email ?? null,
          nome: row.nome ?? null,
          empresa_importada: true,
        };
      }
      return {
        status: "pendente",
        email: row.email ?? null,
        nome: row.nome ?? null,
        empresa_importada: true,
      };
    }
    return {
      status: "sem_rh",
      email: row.email ?? null,
      nome: row.nome ?? null,
      empresa_importada: true,
    };
  } catch (e) {
    console.error("[getCulturaStatus] erro:", (e as Error).message);
    return { status: "sem_rh", email: null, nome: null, empresa_importada: true };
  }
}

async function getIndexStatus(
  hubId: string,
  anonKey: string,
): Promise<IndexStatus> {
  const empresaId = await resolveEmpresaId(PS_INDEX_URL, anonKey, hubId);
  if (!empresaId) {
    return { status: "nao_configurado", empresa_importada: false };
  }
  try {
    const res = await fetch(
      `${PS_INDEX_URL}/rest/v1/user_roles?empresa_id=eq.${empresaId}&role=eq.admin_empresa&select=id&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );
    if (!res.ok) {
      console.error(`[getIndexStatus] user_roles HTTP ${res.status}`);
      return { status: "nao_configurado", empresa_importada: true };
    }
    const arr = await res.json();
    return {
      status: Array.isArray(arr) && arr.length > 0 ? "configurado" : "nao_configurado",
      empresa_importada: true,
    };
  } catch (e) {
    console.error("[getIndexStatus] erro:", (e as Error).message);
    return { status: "nao_configurado", empresa_importada: true };
  }
}

async function inviteCultura(
  hubId: string,
  email: string,
  nome: string,
  anonKey: string,
  hubSecret: string,
): Promise<InviteResult> {
  try {
    const empresaId = await resolveEmpresaId(PS_CULTURA_URL, anonKey, hubId);
    if (!empresaId) {
      return { enviado: false, motivo: "empresa não importada no produto" };
    }
    const res = await fetch(`${PS_CULTURA_URL}/functions/v1/invite-rh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "x-hub-secret": hubSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, empresa_id: empresaId, nome }),
    });
    const text = await res.text();
    console.log(`[inviteCultura] HTTP ${res.status}`);
    if (!res.ok) {
      return {
        enviado: false,
        motivo: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { enviado: true, motivo: null };
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[inviteCultura] erro:", msg);
    return { enviado: false, motivo: msg };
  }
}

async function inviteIndex(
  hubId: string,
  email: string,
  nome: string,
  anonKey: string,
): Promise<InviteResult> {
  try {
    const empresaId = await resolveEmpresaId(PS_INDEX_URL, anonKey, hubId);
    if (!empresaId) {
      return { enviado: false, motivo: "empresa não importada no produto" };
    }
    const res = await fetch(`${PS_INDEX_URL}/functions/v1/invite-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, nome, empresa_id: empresaId }),
    });
    const text = await res.text();
    console.log(`[inviteIndex] HTTP ${res.status}`);
    if (!res.ok) {
      return {
        enviado: false,
        motivo: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { enviado: true, motivo: null };
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[inviteIndex] erro:", msg);
    return { enviado: false, motivo: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const PS_CULTURA_ANON_KEY = Deno.env.get("PS_CULTURA_ANON_KEY") ?? "";
  const PS_INDEX_ANON_KEY = Deno.env.get("PS_INDEX_ANON_KEY") ?? "";
  const HUB_API_SECRET = Deno.env.get("HUB_API_SECRET") ?? "";

  if (!PS_CULTURA_ANON_KEY || !PS_INDEX_ANON_KEY || !HUB_API_SECRET) {
    console.error("Faltam secrets PS_CULTURA_ANON_KEY / PS_INDEX_ANON_KEY / HUB_API_SECRET");
    return json({ error: "Server misconfigured" }, 500);
  }

  // Auth: JWT do chamador
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }
  // Admin check
  const { data: perfil, error: perfilErr } = await supabase
    .from("crm_usuarios")
    .select("is_admin, is_ativo")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfilErr) {
    console.error("[perfil] erro:", perfilErr.message);
    return json({ error: "Forbidden" }, 403);
  }
  if (!perfil?.is_admin || !perfil?.is_ativo) {
    return json({ error: "Forbidden — admin only" }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body || typeof body.cliente_hub_id !== "string" || !body.cliente_hub_id) {
    return json({ error: "cliente_hub_id obrigatório" }, 400);
  }
  if (body.action !== "status" && body.action !== "invite") {
    return json({ error: "action deve ser 'status' ou 'invite'" }, 400);
  }

  if (body.action === "status") {
    const [cultura, index] = await Promise.all([
      getCulturaStatus(body.cliente_hub_id, PS_CULTURA_ANON_KEY),
      getIndexStatus(body.cliente_hub_id, PS_INDEX_ANON_KEY),
    ]);
    return json({ ps_cultura: cultura, ps_index: index });
  }

  // action === 'invite'
  const produto = body.produto;
  if (produto !== "ps_cultura" && produto !== "ps_index" && produto !== "todos") {
    return json({ error: "produto inválido" }, 400);
  }
  const email = (body.email ?? "").trim();
  const nome = (body.nome ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "email inválido" }, 400);
  }
  if (!nome) {
    return json({ error: "nome obrigatório" }, 400);
  }

  const result: {
    ps_cultura: InviteResult | null;
    ps_index: InviteResult | null;
  } = { ps_cultura: null, ps_index: null };

  const tasks: Promise<void>[] = [];
  if (produto === "ps_cultura" || produto === "todos") {
    tasks.push(
      inviteCultura(body.cliente_hub_id, email, nome, PS_CULTURA_ANON_KEY, HUB_API_SECRET).then(
        (r) => {
          result.ps_cultura = r;
        },
      ),
    );
  }
  if (produto === "ps_index" || produto === "todos") {
    tasks.push(
      inviteIndex(body.cliente_hub_id, email, nome, PS_INDEX_ANON_KEY).then((r) => {
        result.ps_index = r;
      }),
    );
  }
  await Promise.all(tasks);
  return json(result);
});
