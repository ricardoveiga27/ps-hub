import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Assinatura = {
  id: string;
  cliente_id: string;
  contrato_id: string;
  valor: number;
  dia_vencimento: number;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proximo_reajuste_em: string | null;
  created_at: string;
  updated_at: string;
  crm_clientes: { razao_social: string; nome_fantasia: string | null } | null;
  crm_contratos: {
    codigo_contrato: string | null;
    ps_index_ativo: boolean;
    ps_escuta_ativo: boolean;
    ps_cultura_ativo: boolean;
    vidas: number;
  } | null;
};

export function useAssinaturas() {
  return useQuery({
    queryKey: ["assinaturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_assinaturas")
        .select("*, crm_clientes(razao_social, nome_fantasia), crm_contratos(codigo_contrato, ps_index_ativo, ps_escuta_ativo, ps_cultura_ativo, vidas)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Assinatura[];
    },
  });
}

export function useUpdateAssinatura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contrato_id, vidas, valor }: { id: string; contrato_id: string; vidas: number; valor: number }) => {
      // Update assinatura
      const { error: assErr } = await supabase
        .from("crm_assinaturas")
        .update({ valor })
        .eq("id", id);
      if (assErr) throw assErr;

      // Update linked contrato
      const { error: contErr } = await supabase
        .from("crm_contratos")
        .update({ vidas, valor_mensal: valor })
        .eq("id", contrato_id);
      if (contErr) throw contErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assinaturas"] });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
