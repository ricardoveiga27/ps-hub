import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, AlertTriangle, XCircle, FileX } from "lucide-react";

const aceiteSchema = z.object({
  nome_completo: z.string().min(3, "Nome obrigatório").max(200),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (formato: 000.000.000-00)"),
  cargo: z.string().max(100).optional(),
  aceite: z.literal(true, { errorMap: () => ({ message: "Você precisa aceitar os termos" }) }),
});

type AceiteForm = z.infer<typeof aceiteSchema>;

function cpfMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function useResetBodyStyles() {
  useEffect(() => {
    const origBody = {
      background: document.body.style.background,
      margin: document.body.style.margin,
      padding: document.body.style.padding,
    };
    const origHtml = {
      background: document.documentElement.style.background,
    };

    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.background = "transparent";

    return () => {
      document.body.style.background = origBody.background;
      document.body.style.margin = origBody.margin;
      document.body.style.padding = origBody.padding;
      document.documentElement.style.background = origHtml.background;
    };
  }, []);
}

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useResetBodyStyles();

  const form = useForm<AceiteForm>({
    resolver: zodResolver(aceiteSchema),
    defaultValues: { nome_completo: "", cpf: "", cargo: "", aceite: undefined as any },
  });

  useEffect(() => {
    if (!token) return;
    supabase
      .from("crm_proposta_links")
      .select("*")
      .eq("token", token)
      .maybeSingle()
      .then(({ data }) => {
        setLink(data);
        setLoading(false);
      });
  }, [token]);

  async function onSubmit(values: AceiteForm) {
    if (!link) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("crm_proposta_links")
        .update({
          status: "aceita",
          aceite_nome: values.nome_completo,
          aceite_cpf: values.cpf,
          aceite_cargo: values.cargo || null,
          aceite_em: new Date().toISOString(),
        })
        .eq("id", link.id);
      if (error) throw error;
      setAccepted(true);
      toast.success("Proposta aceita com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao aceitar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SystemPage>
        <p className="text-gray-400">Carregando...</p>
      </SystemPage>
    );
  }

  if (!link) {
    return (
      <SystemPage>
        <StatusCard icon={<FileX className="h-10 w-10 text-gray-400" />} title="Proposta não encontrada" description="O link que você acessou não existe ou foi removido." />
      </SystemPage>
    );
  }

  const isExpired = link.status === "expirada" || new Date(link.expira_em) < new Date();
  if (isExpired && link.status === "aguardando") {
    return (
      <SystemPage>
        <StatusCard icon={<AlertTriangle className="h-10 w-10 text-amber-500" />} title="Proposta expirada" description="O prazo para aceite desta proposta já encerrou." />
      </SystemPage>
    );
  }

  if (link.status === "cancelada") {
    return (
      <SystemPage>
        <StatusCard icon={<XCircle className="h-10 w-10 text-red-500" />} title="Proposta cancelada" description="Esta proposta foi cancelada pelo emissor." />
      </SystemPage>
    );
  }

  if (link.status === "aceita" || accepted) {
    return (
      <>
        <Toaster />
        <div dangerouslySetInnerHTML={{ __html: link.html_gerado }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle2 className="h-5 w-5" style={{ color: "#059669", flexShrink: 0 }} />
            <p style={{ color: "#065f46", fontSize: 14, fontWeight: 500, margin: 0 }}>
              {accepted
                ? "Proposta aceita com sucesso. Nossa equipe entrará em contato em até 1 dia útil."
                : `Proposta aceita em ${new Date(link.aceite_em).toLocaleDateString("pt-BR")}`}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Status aguardando
  return (
    <>
      <Toaster />
      <div dangerouslySetInnerHTML={{ __html: link.html_gerado }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1f2937", marginBottom: 16 }}>Para aceitar esta proposta, preencha seus dados</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 448 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Nome completo *</label>
              <input
                {...form.register("nome_completo")}
                style={{ width: "100%", borderRadius: 6, border: "1px solid #d1d5db", padding: "8px 12px", fontSize: 14, outline: "none" }}
              />
              {form.formState.errors.nome_completo && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{form.formState.errors.nome_completo.message}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>CPF *</label>
              <input
                value={form.watch("cpf")}
                onChange={(e) => form.setValue("cpf", cpfMask(e.target.value), { shouldValidate: true })}
                style={{ width: "100%", borderRadius: 6, border: "1px solid #d1d5db", padding: "8px 12px", fontSize: 14, outline: "none" }}
                placeholder="000.000.000-00"
              />
              {form.formState.errors.cpf && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{form.formState.errors.cpf.message}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Cargo</label>
              <input
                {...form.register("cargo")}
                style={{ width: "100%", borderRadius: 6, border: "1px solid #d1d5db", padding: "8px 12px", fontSize: 14, outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <input
                type="checkbox"
                id="aceite"
                onChange={(e) => form.setValue("aceite", e.target.checked as any, { shouldValidate: true })}
                style={{ marginTop: 3, width: 16, height: 16 }}
              />
              <label htmlFor="aceite" style={{ fontSize: 14, color: "#4b5563" }}>
                Declaro que li e aceito os termos desta proposta em nome da empresa indicada acima.
              </label>
            </div>
            {form.formState.errors.aceite && <p style={{ color: "#ef4444", fontSize: 12 }}>{form.formState.errors.aceite.message}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? "Processando..." : "Confirmar aceite"}
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 24 }}>PS Hub — Veiga Perícias</p>
      </div>
    </>
  );
}

function SystemPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 600, width: "100%", margin: "0 auto", padding: "48px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6", padding: 32 }}>
          {children}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 24 }}>PS Hub — Veiga Perícias</p>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>{title}</h1>
      <p style={{ color: "#6b7280", fontSize: 14 }}>{description}</p>
    </div>
  );
}
