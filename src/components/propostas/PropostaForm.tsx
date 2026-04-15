import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useClientes } from "@/hooks/useClientes";
import { usePacotes, type Pacote } from "@/hooks/usePacotes";
import { useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export const DESCONTO_PCT: Record<string, number> = {
  tabela: 0,
  autonomia_10: 0.10,
  autonomia_20: 0.20,
  aprovacao_30: 0.30,
  campanha_40: 0.40,
  supremo_50: 0.50,
};

const NIVEL_LABELS: Record<string, { label: string; auth: string }> = {
  tabela: { label: "Tabela", auth: "sem desconto" },
  autonomia_10: { label: "−10% Autonomia", auth: "autonomia vendedor" },
  autonomia_20: { label: "−20% Autonomia", auth: "autonomia vendedor" },
  aprovacao_30: { label: "−30% ★ Aprovação", auth: "requer aprovação Ricardo" },
  campanha_40: { label: "−40% Campanha", auth: "Ricardo + cliente SST Veiga" },
  supremo_50: { label: "−50% Supremo", auth: "teto absoluto — Ricardo" },
};

const NIVEL_KEYS = Object.keys(DESCONTO_PCT) as [string, ...string[]];
const REQUER_JUSTIFICATIVA = ["aprovacao_30", "campanha_40", "supremo_50"];

const propostaSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  pacote_id: z.string().optional(),
  titulo: z.string().min(1, "Informe o título").max(200),
  vidas: z.coerce.number().min(1, "Mínimo 1 vida"),
  valor_mensal: z.coerce.number().min(0),
  valor_tabela: z.coerce.number().min(0).default(0),
  nivel_desconto: z.enum(NIVEL_KEYS).default("tabela"),
  justificativa_desconto: z.string().max(500).optional(),
  dia_vencimento: z.coerce.number().min(1).max(28),
  validade_dias: z.coerce.number().min(1).max(365),
  observacoes: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (REQUER_JUSTIFICATIVA.includes(data.nivel_desconto)) {
    if (!data.justificativa_desconto || data.justificativa_desconto.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Justificativa obrigatória para este nível de desconto (mín. 10 caracteres)",
        path: ["justificativa_desconto"],
      });
    }
  }
});

export type PropostaFormValues = z.infer<typeof propostaSchema>;

interface PropostaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PropostaFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<PropostaFormValues>;
  lockedClienteId?: string;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function PropostaForm({
  open, onOpenChange, onSubmit, loading, defaultValues, lockedClienteId,
}: PropostaFormProps) {
  const { data: clientes } = useClientes();
  const { data: pacotesAtivos } = usePacotes("ativo");

  const form = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      cliente_id: "",
      pacote_id: "",
      titulo: "",
      vidas: 1,
      valor_mensal: 0,
      valor_tabela: 0,
      nivel_desconto: "tabela",
      justificativa_desconto: "",
      dia_vencimento: 10,
      validade_dias: 30,
      observacoes: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        cliente_id: "",
        pacote_id: "",
        titulo: "",
        vidas: 1,
        valor_mensal: 0,
        valor_tabela: 0,
        nivel_desconto: "tabela",
        justificativa_desconto: "",
        dia_vencimento: 10,
        validade_dias: 30,
        observacoes: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues]);

  const pacoteId = form.watch("pacote_id");
  const vidas = form.watch("vidas");
  const nivelDesconto = form.watch("nivel_desconto");

  const selectedPacote = useMemo(() => {
    if (!pacoteId || !pacotesAtivos) return null;
    return pacotesAtivos.find((p) => p.id === pacoteId) || null;
  }, [pacoteId, pacotesAtivos]);

  // Auto-calculate valor_tabela and valor_mensal
  useEffect(() => {
    if (selectedPacote?.preco_por_vida && vidas > 0) {
      const tabela = selectedPacote.preco_por_vida * vidas;
      const pct = DESCONTO_PCT[nivelDesconto] || 0;
      const final = Math.round(tabela * (1 - pct) * 100) / 100;
      form.setValue("valor_tabela", tabela);
      form.setValue("valor_mensal", final);
    }
  }, [selectedPacote, vidas, nivelDesconto]);

  const valorTabela = form.watch("valor_tabela");
  const valorMensal = form.watch("valor_mensal");
  const requerAprovacao = REQUER_JUSTIFICATIVA.includes(nivelDesconto);

  function handleSubmit(values: PropostaFormValues) {
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#1a1a2e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {defaultValues?.cliente_id ? "Editar Proposta" : "Nova Proposta"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="cliente_id" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!lockedClienteId}>
                  <FormControl>
                    <SelectTrigger className={`bg-white/5 border-white/10 text-white ${lockedClienteId ? "opacity-60 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {clientes?.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-white">
                        {c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Pacote select */}
            <FormField control={form.control} name="pacote_id" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Pacote</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione um pacote (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="nenhum" className="text-white/50">Sem pacote</SelectItem>
                    {pacotesAtivos?.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-white">
                        {p.nome} — R$ {p.preco_por_vida?.toFixed(2)}/vida
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Pacote summary */}
            {selectedPacote && <PacoteSummary pacote={selectedPacote} />}

            <FormField control={form.control} name="titulo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Título</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 text-white" placeholder="Ex: Licença PS Hub - Plano Completo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="vidas" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Vidas</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} className="bg-white/5 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="valor_mensal" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Valor mensal (R$)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min={0}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!!selectedPacote}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Nível de desconto */}
            <FormField control={form.control} name="nivel_desconto" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Nível de Desconto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {NIVEL_KEYS.map((key) => {
                      const pct = DESCONTO_PCT[key];
                      const valorCalc = valorTabela > 0
                        ? formatBRL(valorTabela * (1 - pct))
                        : "—";
                      const info = NIVEL_LABELS[key];
                      return (
                        <SelectItem key={key} value={key} className="text-white">
                          <span className="flex items-center gap-2">
                            <span>{info.label}</span>
                            <span className="text-white/40 text-xs">→ {valorCalc}</span>
                            <span className="text-white/30 text-xs">({info.auth})</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Valor final preview */}
            <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center space-y-1">
              {valorTabela > 0 && valorTabela !== valorMensal && (
                <div>
                  <span className="text-white/40 text-sm line-through">{formatBRL(valorTabela)}</span>
                  <span className="text-white/30 text-xs ml-2">valor de tabela</span>
                </div>
              )}
              <div>
                <span className="text-white/50 text-sm">Valor final mensal: </span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatBRL(Math.max(0, valorMensal))}
                </span>
              </div>
            </div>

            {/* Justificativa condicional */}
            {requerAprovacao && (
              <>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-amber-300 text-sm">
                    Este desconto requer aprovação prévia de <strong>Ricardo Veiga</strong> antes de enviar ao cliente.
                  </span>
                </div>
                <FormField control={form.control} name="justificativa_desconto" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Justificativa do desconto *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                        placeholder="Explique o motivo deste desconto (mín. 10 caracteres)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dia_vencimento" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Dia vencimento (1–28)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} max={28} className="bg-white/5 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="validade_dias" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Validade (dias)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} className="bg-white/5 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="observacoes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} className="bg-white/5 border-white/10 text-white" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                className="border-white/10 text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PacoteSummary({ pacote }: { pacote: Pacote }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-white/40">{pacote.codigo}</span>
        <div className="flex gap-1 ml-auto">
          {pacote.ps_index_ativo && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} title="PS Index" />}
          {pacote.ps_escuta_ativo && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#8B5CF6" }} title="PS Escuta" />}
          {pacote.ps_cultura_ativo && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#10B981" }} title="PS Cultura" />}
        </div>
      </div>
      <div className="flex gap-4 text-xs text-white/50">
        {pacote.ciclos_index_ano && <span>{pacote.ciclos_index_ano === 999 ? "∞" : pacote.ciclos_index_ano} ciclo(s)/ano</span>}
        {pacote.franquia_relatos_qtd != null && (
          <span>Franquia: {pacote.franquia_relatos_qtd} relato(s) {pacote.franquia_relatos_tipo === "por_func" ? "/func" : "fixo"}</span>
        )}
        <span>{pacote.cobranca_tipo === "mensal" ? "Mensal" : "Anual 12x"}</span>
      </div>
    </div>
  );
}
