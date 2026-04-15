export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      crm_asaas_config: {
        Row: {
          api_key: string
          created_at: string
          environment: string
          id: string
          is_active: boolean
          nfse_enabled: boolean
          nome: string
          wallet_id: string | null
          webhook_token: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          nfse_enabled?: boolean
          nome?: string
          wallet_id?: string | null
          webhook_token?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          nfse_enabled?: boolean
          nome?: string
          wallet_id?: string | null
          webhook_token?: string | null
        }
        Relationships: []
      }
      crm_asaas_customers: {
        Row: {
          asaas_customer_id: string
          cliente_id: string
          cpf_cnpj: string | null
          email: string | null
          id: string
          name: string | null
          synchronized_at: string
        }
        Insert: {
          asaas_customer_id: string
          cliente_id: string
          cpf_cnpj?: string | null
          email?: string | null
          id?: string
          name?: string | null
          synchronized_at?: string
        }
        Update: {
          asaas_customer_id?: string
          cliente_id?: string
          cpf_cnpj?: string | null
          email?: string | null
          id?: string
          name?: string | null
          synchronized_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_asaas_customers_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_assinaturas: {
        Row: {
          asaas_customer_id: string | null
          cliente_id: string
          contrato_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_vencimento: number
          id: string
          proximo_reajuste_em: string | null
          status: string
          ultimo_reajuste_em: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          asaas_customer_id?: string | null
          cliente_id: string
          contrato_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          dia_vencimento: number
          id?: string
          proximo_reajuste_em?: string | null
          status?: string
          ultimo_reajuste_em?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          asaas_customer_id?: string | null
          cliente_id?: string
          contrato_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento?: number
          id?: string
          proximo_reajuste_em?: string | null
          status?: string
          ultimo_reajuste_em?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_assinaturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_assinaturas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "crm_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clientes: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          porte: string | null
          razao_social: string
          responsavel_comercial: string | null
          segmento: string | null
          status: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          porte?: string | null
          razao_social: string
          responsavel_comercial?: string | null
          segmento?: string | null
          status?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          porte?: string | null
          razao_social?: string
          responsavel_comercial?: string | null
          segmento?: string | null
          status?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_contatos: {
        Row: {
          ativo: boolean
          cargo: string | null
          celular: string | null
          cliente_id: string
          created_at: string
          email: string | null
          id: string
          nome: string
          principal: boolean
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          celular?: string | null
          cliente_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          principal?: boolean
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          celular?: string | null
          cliente_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          principal?: boolean
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contratos: {
        Row: {
          cliente_id: string
          codigo_contrato: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          data_proximo_reajuste: string | null
          dia_vencimento: number
          id: string
          indice_reajuste: string
          observacoes: string | null
          pacote_id: string | null
          percentual_reajuste_fixo: number | null
          proposta_id: string | null
          ps_cultura_ativo: boolean
          ps_escuta_ativo: boolean
          ps_index_ativo: boolean
          snapshot_pacote: Json | null
          status: string
          updated_at: string
          valor_mensal: number
          vidas: number
        }
        Insert: {
          cliente_id: string
          codigo_contrato?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          data_proximo_reajuste?: string | null
          dia_vencimento: number
          id?: string
          indice_reajuste?: string
          observacoes?: string | null
          pacote_id?: string | null
          percentual_reajuste_fixo?: number | null
          proposta_id?: string | null
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          snapshot_pacote?: Json | null
          status?: string
          updated_at?: string
          valor_mensal: number
          vidas: number
        }
        Update: {
          cliente_id?: string
          codigo_contrato?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          data_proximo_reajuste?: string | null
          dia_vencimento?: number
          id?: string
          indice_reajuste?: string
          observacoes?: string | null
          pacote_id?: string | null
          percentual_reajuste_fixo?: number | null
          proposta_id?: string | null
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          snapshot_pacote?: Json | null
          status?: string
          updated_at?: string
          valor_mensal?: number
          vidas?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contratos_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "crm_pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contratos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "crm_propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_faturas: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          assinatura_id: string
          boleto_url: string | null
          cliente_id: string
          created_at: string
          data_emissao: string | null
          data_vencimento: string
          descricao: string
          id: string
          invoice_url: string | null
          numero_fatura: string | null
          periodo_referencia: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          status: string
          updated_at: string
          valor: number
          vidas: number | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          assinatura_id: string
          boleto_url?: string | null
          cliente_id: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento: string
          descricao?: string
          id?: string
          invoice_url?: string | null
          numero_fatura?: string | null
          periodo_referencia?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: string
          updated_at?: string
          valor: number
          vidas?: number | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          assinatura_id?: string
          boleto_url?: string | null
          cliente_id?: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          invoice_url?: string | null
          numero_fatura?: string | null
          periodo_referencia?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vidas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_faturas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "crm_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notas_fiscais: {
        Row: {
          asaas_invoice_id: string | null
          cliente_id: string
          codigo_verificacao: string | null
          created_at: string
          data_emissao: string | null
          fatura_id: string
          id: string
          numero_nfse: string | null
          pdf_url: string | null
          status: string | null
          valor: number | null
          xml_url: string | null
        }
        Insert: {
          asaas_invoice_id?: string | null
          cliente_id: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao?: string | null
          fatura_id: string
          id?: string
          numero_nfse?: string | null
          pdf_url?: string | null
          status?: string | null
          valor?: number | null
          xml_url?: string | null
        }
        Update: {
          asaas_invoice_id?: string | null
          cliente_id?: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao?: string | null
          fatura_id?: string
          id?: string
          numero_nfse?: string | null
          pdf_url?: string | null
          status?: string | null
          valor?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notas_fiscais_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: true
            referencedRelation: "crm_faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pacotes: {
        Row: {
          acompanhamento_continuo: boolean
          catalogo_completo: boolean
          ciclos_index_ano: number | null
          cobranca_tipo: string
          codigo: string
          criado_em: string
          descontinuado_em: string | null
          descricao: string | null
          excedente_relato_valor: number | null
          faixa_max_vidas: number | null
          faixa_min_vidas: number | null
          followup_90dias: boolean
          franquia_relatos_qtd: number | null
          franquia_relatos_tipo: string
          id: string
          iris_ativo: boolean
          modulo_liderancas: boolean
          nome: string
          preco_por_vida: number | null
          ps_cultura_ativo: boolean
          ps_escuta_ativo: boolean
          ps_index_ativo: boolean
          status: string
          suporte_coleta: boolean
          updated_at: string
        }
        Insert: {
          acompanhamento_continuo?: boolean
          catalogo_completo?: boolean
          ciclos_index_ano?: number | null
          cobranca_tipo?: string
          codigo: string
          criado_em?: string
          descontinuado_em?: string | null
          descricao?: string | null
          excedente_relato_valor?: number | null
          faixa_max_vidas?: number | null
          faixa_min_vidas?: number | null
          followup_90dias?: boolean
          franquia_relatos_qtd?: number | null
          franquia_relatos_tipo?: string
          id?: string
          iris_ativo?: boolean
          modulo_liderancas?: boolean
          nome: string
          preco_por_vida?: number | null
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          status?: string
          suporte_coleta?: boolean
          updated_at?: string
        }
        Update: {
          acompanhamento_continuo?: boolean
          catalogo_completo?: boolean
          ciclos_index_ano?: number | null
          cobranca_tipo?: string
          codigo?: string
          criado_em?: string
          descontinuado_em?: string | null
          descricao?: string | null
          excedente_relato_valor?: number | null
          faixa_max_vidas?: number | null
          faixa_min_vidas?: number | null
          followup_90dias?: boolean
          franquia_relatos_qtd?: number | null
          franquia_relatos_tipo?: string
          id?: string
          iris_ativo?: boolean
          modulo_liderancas?: boolean
          nome?: string
          preco_por_vida?: number | null
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          status?: string
          suporte_coleta?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      crm_proposta_links: {
        Row: {
          aceite_cargo: string | null
          aceite_cpf: string | null
          aceite_em: string | null
          aceite_nome: string | null
          criado_em: string
          expira_em: string
          html_gerado: string
          id: string
          ip_aceite: string | null
          proposta_id: string
          status: string
          template_id: string
          token: string
        }
        Insert: {
          aceite_cargo?: string | null
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_nome?: string | null
          criado_em?: string
          expira_em?: string
          html_gerado: string
          id?: string
          ip_aceite?: string | null
          proposta_id: string
          status?: string
          template_id: string
          token?: string
        }
        Update: {
          aceite_cargo?: string | null
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_nome?: string | null
          criado_em?: string
          expira_em?: string
          html_gerado?: string
          id?: string
          ip_aceite?: string | null
          proposta_id?: string
          status?: string
          template_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_proposta_links_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "crm_propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_proposta_links_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_proposta_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_proposta_templates: {
        Row: {
          criado_em: string
          descricao: string | null
          html_content: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          html_content: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          html_content?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_propostas: {
        Row: {
          aceita_em: string | null
          cliente_id: string
          created_at: string
          desconto_tipo: string | null
          desconto_valor: number | null
          enviada_em: string | null
          id: string
          motivo_recusa: string | null
          numero_proposta: string | null
          observacoes: string | null
          pacote_id: string | null
          recusada_em: string | null
          snapshot_condicoes: Json | null
          status: string
          titulo: string | null
          updated_at: string
          validade_dias: number
          valor_final: number
          valor_mensal: number
          vidas: number
        }
        Insert: {
          aceita_em?: string | null
          cliente_id: string
          created_at?: string
          desconto_tipo?: string | null
          desconto_valor?: number | null
          enviada_em?: string | null
          id?: string
          motivo_recusa?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          pacote_id?: string | null
          recusada_em?: string | null
          snapshot_condicoes?: Json | null
          status?: string
          titulo?: string | null
          updated_at?: string
          validade_dias?: number
          valor_final: number
          valor_mensal: number
          vidas: number
        }
        Update: {
          aceita_em?: string | null
          cliente_id?: string
          created_at?: string
          desconto_tipo?: string | null
          desconto_valor?: number | null
          enviada_em?: string | null
          id?: string
          motivo_recusa?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          pacote_id?: string | null
          recusada_em?: string | null
          snapshot_condicoes?: Json | null
          status?: string
          titulo?: string | null
          updated_at?: string
          validade_dias?: number
          valor_final?: number
          valor_mensal?: number
          vidas?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_propostas_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "crm_pacotes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_reajustes: {
        Row: {
          aplicado_em: string
          assinatura_id: string
          contrato_id: string
          id: string
          indice: string | null
          observacao: string | null
          percentual_aplicado: number | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          aplicado_em?: string
          assinatura_id: string
          contrato_id: string
          id?: string
          indice?: string | null
          observacao?: string | null
          percentual_aplicado?: number | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          aplicado_em?: string
          assinatura_id?: string
          contrato_id?: string
          id?: string
          indice?: string | null
          observacao?: string | null
          percentual_aplicado?: number | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_reajustes_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "crm_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_reajustes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "crm_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_notes: string | null
          received_at: string
        }
        Insert: {
          event_type: string
          id: string
          payload: Json
          processed_at?: string | null
          processing_notes?: string | null
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_notes?: string | null
          received_at?: string
        }
        Relationships: []
      }
      licencas_ativas: {
        Row: {
          cliente_id: string
          cnpj: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          ps_cultura_ativo: boolean
          ps_escuta_ativo: boolean
          ps_index_ativo: boolean
          razao_social: string | null
          status_assinatura: string | null
          updated_at: string
          vidas: number | null
        }
        Insert: {
          cliente_id: string
          cnpj: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          razao_social?: string | null
          status_assinatura?: string | null
          updated_at?: string
          vidas?: number | null
        }
        Update: {
          cliente_id?: string
          cnpj?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          ps_cultura_ativo?: boolean
          ps_escuta_ativo?: boolean
          ps_index_ativo?: boolean
          razao_social?: string | null
          status_assinatura?: string | null
          updated_at?: string
          vidas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_ativas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "crm_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
