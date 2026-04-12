import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Contato } from "@/hooks/useContatos";

const schema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cargo: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(20).optional().or(z.literal("")),
  celular: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  principal: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

export type ContatoFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Contato>;
  onSubmit: (values: ContatoFormValues) => void;
  loading?: boolean;
}

export default function ContatoForm({ open, onOpenChange, defaultValues, onSubmit, loading }: Props) {
  const form = useForm<ContatoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: defaultValues?.nome ?? "",
      cargo: defaultValues?.cargo ?? "",
      email: defaultValues?.email ?? "",
      telefone: defaultValues?.telefone ?? "",
      celular: defaultValues?.celular ?? "",
      whatsapp: defaultValues?.whatsapp ?? "",
      principal: defaultValues?.principal ?? false,
      ativo: defaultValues?.ativo ?? true,
    },
  });

  function handleSubmit(values: ContatoFormValues) {
    const cleaned = {
      ...values,
      cargo: values.cargo || null,
      email: values.email || null,
      telefone: values.telefone || null,
      celular: values.celular || null,
      whatsapp: values.whatsapp || null,
    };
    onSubmit(cleaned as any);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(var(--ps-bg-dark))] border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-white">
            {defaultValues?.id ? "Editar Contato" : "Novo Contato"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-white/70">Nome *</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cargo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Cargo</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
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
                </FormItem>
              )} />
              <FormField control={form.control} name="celular" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Celular</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">WhatsApp</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10 text-white" /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="flex gap-6 pt-2">
              <FormField control={form.control} name="principal" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-white/70">Contato principal</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="ativo" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-white/70">Ativo</FormLabel>
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
