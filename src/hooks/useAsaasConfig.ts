import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type AsaasConfig = Tables<"crm_asaas_config">;

export function useAsaasConfig() {
  return useQuery({
    queryKey: ["asaas-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_asaas_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AsaasConfig | null;
    },
  });
}

export function useUpdateAsaasConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"crm_asaas_config"> & { id?: string }) => {
      if (values.id) {
        const { data, error } = await supabase
          .from("crm_asaas_config")
          .update(values)
          .eq("id", values.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("crm_asaas_config")
        .insert({ api_key: values.api_key ?? "", ...values } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asaas-config"] }),
  });
}
