import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Reajuste = Tables<"crm_reajustes">;

export function useReajustes(contratoId: string | undefined) {
  return useQuery({
    queryKey: ["reajustes", contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_reajustes")
        .select("*")
        .eq("contrato_id", contratoId!)
        .order("aplicado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

interface CreateReajusteParams {
  contrato_id: string;
  assinatura_id: string;
  percentual_aplicado: number;
  valor_anterior: number;
  valor_novo: number;
  indice: string | null;
  observacao: string | null;
}

export function useCreateReajuste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateReajusteParams) => {
      const { data, error: insertError } = await supabase
        .from("crm_reajustes")
        .insert({
          contrato_id: params.contrato_id,
          assinatura_id: params.assinatura_id,
          percentual_aplicado: params.percentual_aplicado,
          valor_anterior: params.valor_anterior,
          valor_novo: params.valor_novo,
          indice: params.indice,
          observacao: params.observacao,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const { error: contratoError } = await supabase
        .from("crm_contratos")
        .update({ valor_mensal: params.valor_novo })
        .eq("id", params.contrato_id);
      if (contratoError) throw contratoError;

      const { error: assinaturaError } = await supabase
        .from("crm_assinaturas")
        .update({ valor: params.valor_novo })
        .eq("id", params.assinatura_id);
      if (assinaturaError) throw assinaturaError;

      return data;
    },
    onSuccess: (_data, params) => {
      qc.invalidateQueries({ queryKey: ["reajustes", params.contrato_id] });
      qc.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
