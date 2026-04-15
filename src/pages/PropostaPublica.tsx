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

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!link) {
    return (
      <Page>
        <StatusCard icon={<FileX className="h-10 w-10 text-gray-400" />} title="Proposta não encontrada" description="O link que você acessou não existe ou foi removido." />
      </Page>
    );
  }

  const isExpired = link.status === "expirada" || new Date(link.expira_em) < new Date();
  if (isExpired && link.status === "aguardando") {
    return (
      <Page>
        <StatusCard icon={<AlertTriangle className="h-10 w-10 text-amber-500" />} title="Proposta expirada" description="O prazo para aceite desta proposta já encerrou." />
      </Page>
    );
  }

  if (link.status === "cancelada") {
    return (
      <Page>
        <StatusCard icon={<XCircle className="h-10 w-10 text-red-500" />} title="Proposta cancelada" description="Esta proposta foi cancelada pelo emissor." />
      </Page>
    );
  }

  if (link.status === "aceita" || accepted) {
    return (
      <Page>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 text-sm font-medium">
            {accepted
              ? "Proposta aceita com sucesso. Nossa equipe entrará em contato em até 1 dia útil."
              : `Proposta aceita em ${new Date(link.aceite_em).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: link.html_gerado }} />
      </Page>
    );
  }

  // Status aguardando
  return (
    <Page>
      <Toaster />
      <div dangerouslySetInnerHTML={{ __html: link.html_gerado }} className="mb-8" />

      <div className="border-t border-gray-200 pt-8 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Para aceitar esta proposta, preencha seus dados</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
            <input
              {...form.register("nome_completo")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {form.formState.errors.nome_completo && <p className="text-red-500 text-xs mt-1">{form.formState.errors.nome_completo.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
            <input
              value={form.watch("cpf")}
              onChange={(e) => form.setValue("cpf", cpfMask(e.target.value), { shouldValidate: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="000.000.000-00"
            />
            {form.formState.errors.cpf && <p className="text-red-500 text-xs mt-1">{form.formState.errors.cpf.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input
              {...form.register("cargo")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="aceite"
              onChange={(e) => form.setValue("aceite", e.target.checked as any, { shouldValidate: true })}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="aceite" className="text-sm text-gray-600">
              Declaro que li e aceito os termos desta proposta em nome da empresa indicada acima.
            </label>
          </div>
          {form.formState.errors.aceite && <p className="text-red-500 text-xs">{form.formState.errors.aceite.message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Processando..." : "Confirmar aceite"}
          </button>
        </form>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">PS Hub — Veiga Perícias</p>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="flex justify-center">{icon}</div>
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
