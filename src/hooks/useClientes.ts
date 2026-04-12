import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Cliente = Tables<"crm_clientes">;
export type ClienteInsert = TablesInsert<"crm_clientes">;
export type ClienteUpdate = TablesUpdate<"crm_clientes">;

interface ClienteFilters {
  search?: string;
  status?: string;
  segmento?: string;
  porte?: string;
}

function cleanCnpj(value: string) {
  return value.replace(/[.\-\/]/g, "");
}

export function useClientes(filters: ClienteFilters = {}) {
  return useQuery({
    queryKey: ["clientes", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_clientes")
        .select("*")
        .order("razao_social");

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.segmento) {
        query = query.eq("segmento", filters.segmento);
      }
      if (filters.porte) {
        query = query.eq("porte", filters.porte);
      }
      if (filters.search) {
        const cleaned = cleanCnpj(filters.search);
        const isNumeric = /^\d+$/.test(cleaned) && cleaned.length >= 3;
        if (isNumeric) {
          query = query.ilike("cnpj", `%${cleaned}%`);
        } else {
          query = query.ilike("razao_social", `%${filters.search}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ["clientes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_clientes")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Cliente | null;
    },
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: ClienteInsert) => {
      const { data, error } = await supabase
        .from("crm_clientes")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: ClienteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_clientes")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}
