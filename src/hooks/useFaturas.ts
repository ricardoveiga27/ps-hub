import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Fatura = Tables<"crm_faturas"> & {
  crm_clientes: { razao_social: string; nome_fantasia: string | null } | null;
};

export interface FaturaFilters {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export function useFaturas(filters: FaturaFilters = {}) {
  return useQuery({
    queryKey: ["faturas", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_faturas")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .order("data_vencimento", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.dataInicio) {
        query = query.gte("data_vencimento", filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte("data_vencimento", filters.dataFim);
      }
      if (filters.busca) {
        const term = `%${filters.busca}%`;
        query = query.or(`numero_fatura.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Fatura[];
    },
  });
}

export function useUpdateFatura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<"crm_faturas"> & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_faturas")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
    },
  });
}
