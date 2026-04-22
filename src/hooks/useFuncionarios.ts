import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Funcionario = Tables<"crm_funcionarios">;
export type FuncionarioInsert = TablesInsert<"crm_funcionarios">;
export type FuncionarioUpdate = TablesUpdate<"crm_funcionarios">;

export type FuncionarioWithCliente = Funcionario & {
  crm_clientes: { razao_social: string; nome_fantasia: string | null } | null;
};

interface FuncionarioFilters {
  search?: string;
  status?: string;
  cliente_id?: string;
}

function digits(v: string) {
  return v.replace(/\D/g, "");
}

export function useFuncionarios(filters: FuncionarioFilters = {}) {
  return useQuery({
    queryKey: ["funcionarios", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_funcionarios")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .order("nome", { ascending: true });

      if (filters.cliente_id) query = query.eq("cliente_id", filters.cliente_id);
      if (filters.status && filters.status !== "todos") query = query.eq("status", filters.status);

      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim();
        const numeric = digits(s);
        if (numeric.length >= 3 && /^\d+$/.test(s.replace(/[\s.\-]/g, ""))) {
          query = query.ilike("cpf", `%${numeric}%`);
        } else {
          query = query.or(`nome.ilike.%${s}%,email.ilike.%${s}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FuncionarioWithCliente[];
    },
  });
}

export function useFuncionario(id: string | undefined) {
  return useQuery({
    queryKey: ["funcionario", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_funcionarios")
        .select("*, crm_clientes(razao_social, nome_fantasia)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as FuncionarioWithCliente | null;
    },
  });
}

export function useCreateFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: FuncionarioInsert) => {
      const { data, error } = await supabase.from("crm_funcionarios").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      qc.invalidateQueries({ queryKey: ["funcionarios-cliente"] });
    },
  });
}

export function useUpdateFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: FuncionarioUpdate & { id: string }) => {
      const { data, error } = await supabase.from("crm_funcionarios").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      qc.invalidateQueries({ queryKey: ["funcionarios-cliente"] });
    },
  });
}

export function useDeleteFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_funcionarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      qc.invalidateQueries({ queryKey: ["funcionarios-cliente"] });
    },
  });
}
