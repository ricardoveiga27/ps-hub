import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  codigo: z.string().min(1, "Obrigatório").transform((v) => v.toUpperCase()),
  nome: z.string().min(1, "Obrigatório"),
  descricao: z.string().optional(),
  status: z.enum(["ativo", "legado", "cancelado"]),
  preco_por_vida: z.coerce.number().min(0.01, "Informe o preço"),
  faixa_min_vidas: z.coerce.number().min(1),
  faixa_max_vidas: z.coerce.number().optional().nullable(),
  cobranca_tipo: z.enum(["mensal", "anual_12x"]),
  ps_index_ativo: z.boolean(),
  ciclos_index_ano: z.coerce.number().min(1).optional(),
  suporte_coleta: z.boolean(),
  followup_90dias: z.boolean(),
  acompanhamento_continuo: z.boolean(),
  ps_escuta_ativo: z.boolean(),
  iris_ativo: z.boolean(),
  franquia_relatos_tipo: z.enum(["fixo", "por_func"]),
  franquia_relatos_qtd: z.coerce.number().min(0).optional(),
  excedente_relato_valor: z.coerce.number().optional().nullable(),
  ps_cultura_ativo: z.boolean(),
  modulo_liderancas: z.boolean(),
  catalogo_completo: z.boolean(),
});

export type PacoteFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PacoteFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<PacoteFormValues>;
}

const defaults: PacoteFormValues = {
  codigo: "",
  nome: "",
  descricao: "",
  status: "ativo",
  preco_por_vida: 0,
  faixa_min_vidas: 1,
  faixa_max_vidas: null,
  cobranca_tipo: "mensal",
  ps_index_ativo: true,
  ciclos_index_ano: 1,
  suporte_coleta: false,
  followup_90dias: false,
  acompanhamento_continuo: false,
  ps_escuta_ativo: true,
  iris_ativo: false,
  franquia_relatos_tipo: "por_func",
  franquia_relatos_qtd: 1,
  excedente_relato_valor: null,
  ps_cultura_ativo: true,
  modulo_liderancas: false,
  catalogo_completo: false,
};

export default function PacoteForm({ open, onOpenChange, onSubmit, loading, defaultValues }: Props) {
  const form = useForm<PacoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaults, ...defaultValues },
  });

  useEffect(() => {
    if (open) form.reset({ ...defaults, ...defaultValues });
  }, [open, defaultValues]);

  const psIndex = form.watch("ps_index_ativo");
  const psEscuta = form.watch("ps_escuta_ativo");
  const psCultura = form.watch("ps_cultura_ativo");
  const isEdit = !!defaultValues?.codigo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1a2e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{isEdit ? "Editar Pacote" : "Novo Pacote"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Identificação */}
            <Section title="Identificação">
              <div className="grid grid-cols-2 gap-4">
                <TextField control={form.control} name="codigo" label="Código" placeholder="EX: PREMIUM-2026" />
                <TextField control={form.control} name="nome" label="Nome" placeholder="Ex: Profissional" />
              </div>
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Descrição</FormLabel>
                  <FormControl><Textarea {...field} className="bg-white/5 border-white/10 text-white" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="ativo" className="text-white">Ativo</SelectItem>
                      <SelectItem value="legado" className="text-white">Legado</SelectItem>
                      <SelectItem value="cancelado" className="text-white">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </Section>

            {/* Precificação */}
            <Section title="Precificação">
              <div className="grid grid-cols-3 gap-4">
                <TextField control={form.control} name="preco_por_vida" label="Preço/vida (R$)" type="number" step="0.01" />
                <TextField control={form.control} name="faixa_min_vidas" label="Mín. vidas" type="number" />
                <TextField control={form.control} name="faixa_max_vidas" label="Máx. vidas" type="number" placeholder="Ilimitado" />
              </div>
              <FormField control={form.control} name="cobranca_tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Tipo de cobrança</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="mensal" className="text-white">Mensal</SelectItem>
                      <SelectItem value="anual_12x" className="text-white">Anual (12x)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </Section>

            {/* PS Index */}
            <Section title="PS Index" dot="#3B82F6">
              <SwitchField control={form.control} name="ps_index_ativo" label="Ativo" />
              {psIndex && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-500/30">
                  <TextField control={form.control} name="ciclos_index_ano" label="Ciclos/ano" type="number" />
                  <div className="space-y-3">
                    <SwitchField control={form.control} name="suporte_coleta" label="Suporte à coleta" />
                    <SwitchField control={form.control} name="followup_90dias" label="Follow-up 90 dias" />
                    <SwitchField control={form.control} name="acompanhamento_continuo" label="Acompanhamento contínuo" />
                  </div>
                </div>
              )}
            </Section>

            {/* PS Escuta */}
            <Section title="PS Escuta" dot="#8B5CF6">
              <SwitchField control={form.control} name="ps_escuta_ativo" label="Ativo" />
              {psEscuta && (
                <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                  <SwitchField control={form.control} name="iris_ativo" label="ÍRIS ativo" />
                  <FormField control={form.control} name="franquia_relatos_tipo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Franquia de relatos</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="fixo" className="text-white">Fixo</SelectItem>
                          <SelectItem value="por_func" className="text-white">Por funcionário</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <TextField control={form.control} name="franquia_relatos_qtd" label="Qtd. relatos" type="number" />
                    <TextField control={form.control} name="excedente_relato_valor" label="Excedente (R$)" type="number" step="0.01" placeholder="A negociar" />
                  </div>
                </div>
              )}
            </Section>

            {/* PS Cultura */}
            <Section title="PS Cultura" dot="#10B981">
              <SwitchField control={form.control} name="ps_cultura_ativo" label="Ativo" />
              {psCultura && (
                <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
                  <SwitchField control={form.control} name="modulo_liderancas" label="Módulo Lideranças" />
                  <SwitchField control={form.control} name="catalogo_completo" label="Catálogo completo" />
                </div>
              )}
            </Section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white hover:bg-white/5">Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, dot, children }: { title: string; dot?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
        {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function TextField({ control, name, label, type, step, placeholder }: { control: any; name: string; label: string; type?: string; step?: string; placeholder?: string }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel className="text-white/70">{label}</FormLabel>
        <FormControl>
          <Input
            {...field}
            type={type || "text"}
            step={step}
            placeholder={placeholder}
            value={field.value ?? ""}
            className="bg-white/5 border-white/10 text-white"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function SwitchField({ control, name, label }: { control: any; name: string; label: string }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem className="flex items-center gap-3">
        <FormControl>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </FormControl>
        <FormLabel className="text-white/70 !mt-0">{label}</FormLabel>
      </FormItem>
    )} />
  );
}
