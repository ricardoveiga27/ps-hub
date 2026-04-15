import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface PerfilUsuario {
  is_admin: boolean;
  is_comercial: boolean;
  is_financeiro: boolean;
  is_operador: boolean;
  is_ativo: boolean;
  nome?: string;
  email?: string;
}

const PERFIL_VAZIO: PerfilUsuario = {
  is_admin: false,
  is_comercial: false,
  is_financeiro: false,
  is_operador: false,
  is_ativo: false,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<PerfilUsuario>(PERFIL_VAZIO);

  const fetchOrCreatePerfil = useCallback(async (u: User) => {
    // Try to fetch existing profile
    const { data } = await supabase
      .from("crm_usuarios")
      .select("is_admin, is_comercial, is_financeiro, is_operador, is_ativo, nome, email")
      .eq("id", u.id)
      .maybeSingle();

    if (data) {
      setPerfil(data);
      return;
    }

    // Auto-create profile on first login
    const nome = u.user_metadata?.nome || u.email?.split("@")[0] || "Usuário";
    const email = u.email || "";
    const { error } = await supabase
      .from("crm_usuarios")
      .insert({ id: u.id, nome, email });

    if (!error) {
      // Freshly created — all booleans default to false, is_ativo to true
      setPerfil({ ...PERFIL_VAZIO, is_ativo: true, nome, email });
    } else {
      // If insert failed (race condition), try fetching again
      const { data: retry } = await supabase
        .from("crm_usuarios")
        .select("is_admin, is_comercial, is_financeiro, is_operador, is_ativo, nome, email")
        .eq("id", u.id)
        .maybeSingle();
      setPerfil(retry ?? PERFIL_VAZIO);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchOrCreatePerfil(session.user);
        } else {
          setPerfil(PERFIL_VAZIO);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchOrCreatePerfil(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchOrCreatePerfil]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const temAcesso = perfil.is_ativo && (
    perfil.is_admin || perfil.is_comercial ||
    perfil.is_financeiro || perfil.is_operador
  );

  return { user, session, loading, perfil, temAcesso, signIn, signOut };
}
