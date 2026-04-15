import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: perfil } = await supabase
      .from("crm_usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!perfil?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to list auth users with pending invites
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // List all users and filter pending invites
    const pendingInvites: Array<{
      id: string;
      email: string;
      nome: string;
      invited_at: string;
    }> = [];

    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) throw error;

      for (const u of users) {
        if (u.invited_at && !u.email_confirmed_at) {
          pendingInvites.push({
            id: u.id,
            email: u.email || "",
            nome: (u.user_metadata as any)?.nome || u.email?.split("@")[0] || "",
            invited_at: u.invited_at,
          });
        }
      }

      hasMore = users.length === perPage;
      page++;
    }

    return new Response(JSON.stringify(pendingInvites), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
