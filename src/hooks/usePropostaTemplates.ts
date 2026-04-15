import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PropostaTemplate = Tables<"crm_proposta_templates">;
export type PropostaTemplateInsert = TablesInsert<"crm_proposta_templates">;
export type PropostaTemplateUpdate = TablesUpdate<"crm_proposta_templates">;

export function usePropostaTemplates() {
  return useQuery({
    queryKey: ["proposta-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_proposta_templates")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as PropostaTemplate[];
    },
  });
}

export function usePropostaTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["proposta-templates", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_proposta_templates")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as PropostaTemplate | null;
    },
  });
}

export function useCreatePropostaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PropostaTemplateInsert) => {
      const { data, error } = await supabase
        .from("crm_proposta_templates")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposta-templates"] }),
  });
}

export function useUpdatePropostaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: PropostaTemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_proposta_templates")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposta-templates"] }),
  });
}

export function useDeletePropostaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_proposta_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposta-templates"] }),
  });
}
