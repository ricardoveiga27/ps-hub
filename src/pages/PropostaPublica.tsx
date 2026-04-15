import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orig = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "transparent";
    return () => { document.body.style.backgroundColor = orig; };
  }, []);

  useEffect(() => {
    if (!token) return;
    supabase
      .from("crm_proposta_links")
      .select("html_gerado")
      .eq("token", token)
      .maybeSingle()
      .then(({ data }) => {
        setHtml(data?.html_gerado ?? null);
        setLoading(false);
      });
  }, [token]);

  if (loading) return null;
  if (!html) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Proposta não encontrada.</div>;

  return <div style={{ margin: 0, padding: 0, background: "transparent" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
