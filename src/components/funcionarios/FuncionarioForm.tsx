import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useClientes } from "@/hooks/useClientes";
import type { Funcionario } from "@/hooks/useFuncionarios";

const STATUS_OPTIONS = ["ativo", "inativo", "afastado"];

function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

const schema = z.object({
  cliente_id: z.string().uuid("Cliente é obrigatório"),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cpf: z.string().optional().refine((v) => {
    if (!v || v === "") return true;
    return digitsOnly(v).length === 11;
  }, "CPF deve ter 11 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(20).optional().or(z.literal("")),
  cargo: z.string().max(100).optional().or(z.literal("")),
  setor: z.string().max(100).optional().or(z.literal("")),
  data_admissao: z.string().optional().or(z.literal("")),
  status: z.string().default("ativo"),
});

export type FuncionarioFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Funcionario>;
  onSubmit: (values: FuncionarioFormValues) => void;
  loading?: boolean;
  lockedClienteId?: string;
}

export default function FuncionarioForm({
  open, onOpenChange, defaultValues, onSubmit, loading, lockedClienteId,
}: Props) {
  const { data: clientes } = useClientes({ status: "ativo" });

  const form = useForm<FuncionarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: defaultValues?.cliente_id ?? lockedClienteId ?? "",
      nome: defaultValues?.nome ?? "",
      cpf: defaultValues?.cpf ? formatCpf(defaultValues.cpf) : "",
      email: defaultValues?.email ?? "",
      telefone: defaultValues?.telefone ?? "",
      cargo: defaultValues?.cargo ?? "",
      setor: defaultValues?.setor ?? "",
      data_admissao: defaultValues?.data_admissao ?? "",
      status: defaultValues?.status ?? "ativo",
    },
  });

  // Reset when reopening with different defaults
  useEffect(() => {
    if (open) {
      form.reset({
        cliente_id: defaultValues?.cliente_id ?? lockedClienteId ?? "",
        nome: defaultValues?.nome ?? "",
        cpf: defaultValues?.cpf ? formatCpf(defaultValues.cpf) : "",
        email: defaultValues?.email ?? "",
        telefone: defaultValues?.telefone ?? "",
        cargo: defaultValues?.cargo ?? "",
        setor: defaultValues?.setor ?? "",
        data_admissao: defaultValues?.data_admissao ?? "",
        status: defaultValues?.status ?? "ativo",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues?.id, lockedClienteId]);

  function handleSubmit(values: FuncionarioFormValues) {
    const cleaned = {
      cliente_id: values.cliente_id,
      nome: values.nome,
      cpf: values.cpf ? digitsOnly(values.cpf) : null,
      email: values.email || null,
      telefone: values.telefone ? digitsOnly(values.telefone) : null,
      cargo: values.cargo || null,
      setor: values.setor || null,
      data_admissao: values.data_admissao || null,
      status: values.status,
      origem: defaultValues?.origem ?? "manual",
      ps_index_id: defaultValues?.ps_index_id ?? null,
      ps_cultura_id: defaultValues?.ps_cultura_id ?? null,
    };
    onSubmit(cleaned as any);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--ps-bg-dark))] border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {defaultValues?.id ? "Editar funcionário" : "Novo funcionário"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cliente_id" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-white/70">Cliente *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!lockedClienteId}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clientes ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-white/70">Nome completo *</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">CPF</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000.000.000-00"
                      className="bg-white/5 border-white/10 text-white"
                      onChange={(e) => field.onChange(formatCpf(e.target.value))}
                    />
                  </FormControl>
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
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(00) 00000-0000"
                      className="bg-white/5 border-white/10 text-white"
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cargo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Cargo</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="setor" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Setor</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="data_admissao" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Data de admissão</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/70">
                Cancelar
              </Button>
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
