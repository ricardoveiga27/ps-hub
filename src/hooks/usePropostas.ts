import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Proposta = Tables<"crm_propostas"> & {
  crm_clientes?: { razao_social: string; nome_fantasia: string | null; cnpj: string | null; responsavel_comercial: string | null } | null;
  crm_pacotes?: { codigo: string; nome: string; preco_por_vida: number | null; ciclos_index_ano: number | null; franquia_relatos_qtd: number | null; franquia_relatos_tipo: string; iris_ativo: boolean; modulo_liderancas: boolean; catalogo_completo: boolean } | null;
};
export type PropostaInsert = TablesInsert<"crm_propostas">;
export type PropostaUpdate = TablesUpdate<"crm_propostas">;

const SELECT_QUERY = "*, crm_clientes(razao_social, nome_fantasia, cnpj, responsavel_comercial), crm_pacotes(codigo, nome, preco_por_vida, ciclos_index_ano, franquia_relatos_qtd, franquia_relatos_tipo, iris_ativo, modulo_liderancas, catalogo_completo)";

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
        .select(SELECT_QUERY)
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
        .select(SELECT_QUERY)
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

interface DeletePropostaInput {
  id: string;
  motivo: string;
}

export function useDeleteProposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeletePropostaInput | string) => {
      // Compat: aceita string (sem motivo, fluxo antigo) ou objeto.
      const id = typeof input === "string" ? input : input.id;
      const motivo = typeof input === "string" ? "(sem motivo informado)" : input.motivo;

      // 1. Snapshot completo (com cliente)
      const { data: snapshot, error: snapErr } = await supabase
        .from("crm_propostas")
        .select("*, crm_clientes(razao_social, cnpj)")
        .eq("id", id)
        .maybeSingle();
      if (snapErr) throw snapErr;
      if (!snapshot) throw new Error("Proposta não encontrada");

      // 2. Quem está excluindo
      const { data: { user } } = await supabase.auth.getUser();
      let nome: string | null = null;
      if (user) {
        const { data: u } = await supabase
          .from("crm_usuarios").select("nome").eq("id", user.id).maybeSingle();
        nome = u?.nome ?? user.email ?? null;
      }

      // 3. Auditoria
      const { error: audErr } = await supabase.from("crm_propostas_excluidas").insert({
        proposta_id: snapshot.id,
        numero_proposta: snapshot.numero_proposta,
        cliente_id: snapshot.cliente_id,
        motivo,
        excluida_por: user?.id ?? null,
        excluida_por_nome: nome,
        snapshot,
      });
      if (audErr) throw audErr;

      // 4. Remove links dependentes (sem FK declarada)
      const { error: linksErr } = await supabase
        .from("crm_proposta_links").delete().eq("proposta_id", id);
      if (linksErr) throw linksErr;

      // 5. Remove a proposta
      const { error } = await supabase.from("crm_propostas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["propostas"] }),
  });
}
