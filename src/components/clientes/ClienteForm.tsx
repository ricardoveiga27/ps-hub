import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Cliente } from "@/hooks/useClientes";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const SEGMENTOS = ["transportes","saúde","indústria","logística","varejo","outros"];
const PORTES = ["micro","pequena","média","grande"];
const STATUS_OPTIONS = ["prospecto","ativo","inativo","churned"];

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0,2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8)}`;
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

const schema = z.object({
  razao_social: z.string().trim().min(1, "Razão social é obrigatória").max(200),
  nome_fantasia: z.string().trim().max(200).optional().or(z.literal("")),
  cnpj: z.string().optional().refine((v) => {
    if (!v || v === "") return true;
    return digitsOnly(v).length === 14;
  }, "CNPJ deve ter 14 dígitos"),
  segmento: z.string().optional().or(z.literal("")),
  porte: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(20).optional().or(z.literal("")),
  cidade: z.string().max(100).optional().or(z.literal("")),
  uf: z.string().max(2).optional().or(z.literal("")),
  status: z.string().default("prospecto"),
  responsavel_comercial: z.string().max(100).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});

export type ClienteFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Cliente>;
  onSubmit: (values: ClienteFormValues) => void;
  loading?: boolean;
}

export default function ClienteForm({ open, onOpenChange, defaultValues, onSubmit, loading }: Props) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      razao_social: defaultValues?.razao_social ?? "",
      nome_fantasia: defaultValues?.nome_fantasia ?? "",
      cnpj: defaultValues?.cnpj ? formatCnpj(defaultValues.cnpj) : "",
      segmento: defaultValues?.segmento ?? "",
      porte: defaultValues?.porte ?? "",
      email: defaultValues?.email ?? "",
      telefone: defaultValues?.telefone ?? "",
      cidade: defaultValues?.cidade ?? "",
      uf: defaultValues?.uf ?? "",
      status: defaultValues?.status ?? "prospecto",
      responsavel_comercial: defaultValues?.responsavel_comercial ?? "",
      observacoes: defaultValues?.observacoes ?? "",
    },
  });

  function handleSubmit(values: ClienteFormValues) {
    const cleaned = {
      ...values,
      cnpj: values.cnpj ? digitsOnly(values.cnpj) : null,
      nome_fantasia: values.nome_fantasia || null,
      segmento: values.segmento || null,
      porte: values.porte || null,
      email: values.email || null,
      telefone: values.telefone || null,
      cidade: values.cidade || null,
      uf: values.uf || null,
      responsavel_comercial: values.responsavel_comercial || null,
      observacoes: values.observacoes || null,
    };
    onSubmit(cleaned as any);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--ps-bg-dark))] border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {defaultValues?.id ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="razao_social" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-white/70">Razão Social *</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Nome Fantasia</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cnpj" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="segmento" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Segmento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{SEGMENTOS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="porte" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Porte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{PORTES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Email</FormLabel>
                  <FormControl><Input type="email" {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Telefone</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cidade" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Cidade</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="uf" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">UF</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                    <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="responsavel_comercial" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Responsável Comercial</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-white/70">Observações</FormLabel>
                  <FormControl><Textarea {...field} className="bg-white/5 border-white/10 text-white" rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/70">Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
