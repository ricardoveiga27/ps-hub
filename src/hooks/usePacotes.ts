import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Pacote = Tables<"crm_pacotes">;
export type PacoteInsert = TablesInsert<"crm_pacotes">;
export type PacoteUpdate = TablesUpdate<"crm_pacotes">;

export function usePacotes(status?: string) {
  return useQuery({
    queryKey: ["pacotes", status],
    queryFn: async () => {
      let query = supabase
        .from("crm_pacotes")
        .select("*")
        .order("faixa_min_vidas", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pacote[];
    },
  });
}

export function usePacote(id: string | undefined) {
  return useQuery({
    queryKey: ["pacotes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pacotes")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Pacote | null;
    },
  });
}

export function useCreatePacote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PacoteInsert) => {
      const { data, error } = await supabase
        .from("crm_pacotes")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pacotes"] }),
  });
}

export function useUpdatePacote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: PacoteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_pacotes")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pacotes"] }),
  });
}

export function useClonePacote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pacote: Pacote) => {
      const {
        id: _id,
        criado_em: _criado,
        descontinuado_em: _desc,
        updated_at: _upd,
        ...fields
      } = pacote;

      const { data, error } = await supabase
        .from("crm_pacotes")
        .insert({
          ...fields,
          codigo: pacote.codigo + "-CLONE",
          status: "ativo",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacotes"] });
      toast.success("Pacote clonado — edite o código e as condições antes de ativar");
    },
  });
}
