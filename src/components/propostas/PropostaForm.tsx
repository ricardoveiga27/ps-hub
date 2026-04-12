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
import { useEffect, useMemo } from "react";

const propostaSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  titulo: z.string().min(1, "Informe o título").max(200),
  vidas: z.coerce.number().min(1, "Mínimo 1 vida"),
  valor_mensal: z.coerce.number().min(0.01, "Informe o valor por vida"),
  desconto_tipo: z.enum(["percentual", "fixo", "nenhum"]),
  desconto_valor: z.coerce.number().min(0).default(0),
  dia_vencimento: z.coerce.number().min(1).max(28),
  validade_dias: z.coerce.number().min(1).max(365),
  observacoes: z.string().max(2000).optional(),
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

export default function PropostaForm({
  open, onOpenChange, onSubmit, loading, defaultValues, lockedClienteId,
}: PropostaFormProps) {
  const { data: clientes } = useClientes();

  const form = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      cliente_id: "",
      titulo: "",
      vidas: 1,
      valor_mensal: 0,
      desconto_tipo: "nenhum",
      desconto_valor: 0,
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
        titulo: "",
        vidas: 1,
        valor_mensal: 0,
        desconto_tipo: "nenhum",
        desconto_valor: 0,
        dia_vencimento: 10,
        validade_dias: 30,
        observacoes: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues]);

  const vidas = form.watch("vidas");
  const valorMensal = form.watch("valor_mensal");
  const descontoTipo = form.watch("desconto_tipo");
  const descontoValor = form.watch("desconto_valor");

  const valorFinal = useMemo(() => {
    const bruto = valorMensal * vidas;
    if (descontoTipo === "percentual" && descontoValor > 0) {
      return bruto * (1 - descontoValor / 100);
    }
    if (descontoTipo === "fixo" && descontoValor > 0) {
      return bruto - descontoValor;
    }
    return bruto;
  }, [vidas, valorMensal, descontoTipo, descontoValor]);

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
                  <FormLabel className="text-white/70">Valor/vida (R$)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min={0} className="bg-white/5 border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="desconto_tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Desconto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="nenhum" className="text-white">Nenhum</SelectItem>
                      <SelectItem value="percentual" className="text-white">Percentual (%)</SelectItem>
                      <SelectItem value="fixo" className="text-white">Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {descontoTipo !== "nenhum" && (
                <FormField control={form.control} name="desconto_valor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">
                      {descontoTipo === "percentual" ? "% Desconto" : "Valor (R$)"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min={0} className="bg-white/5 border-white/10 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
              <span className="text-white/50 text-sm">Valor final mensal: </span>
              <span className="text-lg font-bold text-emerald-400">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, valorFinal))}
              </span>
            </div>

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
