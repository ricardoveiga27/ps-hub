import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PropostaLink = Tables<"crm_proposta_links"> & {
  crm_proposta_templates?: { nome: string } | null;
};
export type PropostaLinkInsert = TablesInsert<"crm_proposta_links">;
export type PropostaLinkUpdate = TablesUpdate<"crm_proposta_links">;

export function substituirVariaveis(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value ?? "");
  }, html);
}

export function usePropostaLinks(propostaId: string | undefined) {
  return useQuery({
    queryKey: ["proposta-links", propostaId],
    enabled: !!propostaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_proposta_links")
        .select("*, crm_proposta_templates(nome)")
        .eq("proposta_id", propostaId!)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as PropostaLink[];
    },
  });
}

export function useCreatePropostaLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      proposta_id,
      template_id,
      html_content,
      variables,
      validade_dias,
    }: {
      proposta_id: string;
      template_id: string;
      html_content: string;
      variables: Record<string, string>;
      validade_dias: number;
    }) => {
      const html_gerado = substituirVariaveis(html_content, variables);
      const expira_em = new Date();
      expira_em.setDate(expira_em.getDate() + validade_dias);

      const { data, error } = await supabase
        .from("crm_proposta_links")
        .insert({
          proposta_id,
          template_id,
          html_gerado,
          expira_em: expira_em.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["proposta-links", vars.proposta_id] }),
  });
}

export function useUpdatePropostaLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: PropostaLinkUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_proposta_links")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposta-links"] }),
  });
}

export function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return "—";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function buildPropostaVariables(
  proposta: any,
  cliente: any,
  pacote: any
): Record<string, string> {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const hoje = new Date();

  const valorTabela = pacote?.preco_por_vida
    ? pacote.preco_por_vida * proposta.vidas
    : proposta.valor_mensal * proposta.vidas;

  const descontoPct =
    proposta.desconto_tipo === "percentual" && proposta.desconto_valor
      ? `${proposta.desconto_valor}%`
      : "—";

  const descontoValor =
    proposta.desconto_tipo === "fixo" && proposta.desconto_valor
      ? fmt(proposta.desconto_valor)
      : proposta.desconto_tipo === "percentual" && proposta.desconto_valor
        ? fmt(valorTabela * (proposta.desconto_valor / 100))
        : "—";

  const validadeDate = new Date();
  validadeDate.setDate(validadeDate.getDate() + (proposta.validade_dias || 30));

  return {
    empresa_razao_social: cliente?.razao_social || "—",
    empresa_nome_fantasia: cliente?.nome_fantasia || "—",
    empresa_cnpj: formatCnpj(cliente?.cnpj),
    proposta_numero: proposta.numero_proposta || "—",
    proposta_titulo: proposta.titulo || "—",
    proposta_vidas: String(proposta.vidas),
    proposta_valor_por_vida: fmt(proposta.valor_mensal),
    proposta_valor_tabela: fmt(valorTabela),
    proposta_valor_desconto: descontoValor,
    proposta_desconto_pct: descontoPct,
    proposta_valor_mensal: fmt(proposta.valor_final),
    proposta_validade: validadeDate.toLocaleDateString("pt-BR"),
    pacote_nome: pacote?.nome || "—",
    pacote_ciclos_index:
      pacote?.ciclos_index_ano === 999
        ? "Ilimitados"
        : String(pacote?.ciclos_index_ano ?? "—"),
    pacote_franquia_relatos: pacote?.franquia_relatos_qtd
      ? `${pacote.franquia_relatos_qtd} (${pacote.franquia_relatos_tipo})`
      : "—",
    pacote_iris: pacote?.iris_ativo ? "Incluso" : "Não incluso",
    pacote_modulo_liderancas: pacote?.modulo_liderancas ? "Incluso" : "Não incluso",
    pacote_catalogo_completo: pacote?.catalogo_completo ? "Incluso" : "Não incluso",
    data_emissao: hoje.toLocaleDateString("pt-BR"),
    veiga_responsavel: cliente?.responsavel_comercial || "—",
  };
}
