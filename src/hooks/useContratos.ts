import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Contrato = Tables<"crm_contratos"> & {
  crm_clientes?: { razao_social: string; nome_fantasia: string | null } | null;
};
export type ContratoUpdate = TablesUpdate<"crm_contratos">;

interface ContratoFilters {
  search?: string;
  status?: string;
}

export function useContratos(filters: ContratoFilters = {}) {
  return useQuery({
    queryKey: ["contratos", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_contratos")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .order("created_at", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.or(
          `codigo_contrato.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contrato[];
    },
  });
}

export function useContrato(id: string | undefined) {
  return useQuery({
    queryKey: ["contratos", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contratos")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Contrato | null;
    },
  });
}

export function useUpdateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: ContratoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_contratos")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contratos"] }),
  });
}
