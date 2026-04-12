import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Proposta = Tables<"crm_propostas"> & {
  crm_clientes?: { razao_social: string; nome_fantasia: string | null } | null;
};
export type PropostaInsert = TablesInsert<"crm_propostas">;
export type PropostaUpdate = TablesUpdate<"crm_propostas">;

interface PropostaFilters {
  search?: string;
  status?: string;
}

export function usePropostas(filters: PropostaFilters = {}) {
  return useQuery({
    queryKey: ["propostas", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_propostas")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .order("created_at", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.or(
          `titulo.ilike.%${filters.search}%,numero_proposta.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Proposta[];
    },
  });
}

export function useProposta(id: string | undefined) {
  return useQuery({
    queryKey: ["propostas", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_propostas")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Proposta | null;
    },
  });
}

export function useCreateProposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PropostaInsert) => {
      const { data, error } = await supabase
        .from("crm_propostas")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas"] }),
  });
}

export function useUpdateProposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: PropostaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_propostas")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas"] }),
  });
}

export function useDeleteProposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_propostas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas"] }),
  });
}
