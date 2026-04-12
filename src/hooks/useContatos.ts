import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Contato = Tables<"crm_contatos">;
export type ContatoInsert = TablesInsert<"crm_contatos">;
export type ContatoUpdate = TablesUpdate<"crm_contatos">;

export function useContatos(clienteId: string | undefined) {
  return useQuery({
    queryKey: ["contatos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contatos")
        .select("*")
        .eq("cliente_id", clienteId!)
        .order("principal", { ascending: false })
        .order("nome");
      if (error) throw error;
      return data as Contato[];
    },
  });
}

export function useCreateContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: ContatoInsert) => {
      const { data, error } = await supabase
        .from("crm_contatos")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["contatos", vars.cliente_id] }),
  });
}

export function useUpdateContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: ContatoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_contatos")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ["contatos", data.cliente_id] }),
  });
}

export function useDeleteContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clienteId }: { id: string; clienteId: string }) => {
      const { error } = await supabase.from("crm_contatos").delete().eq("id", id);
      if (error) throw error;
      return clienteId;
    },
    onSuccess: (clienteId) =>
      qc.invalidateQueries({ queryKey: ["contatos", clienteId] }),
  });
}
