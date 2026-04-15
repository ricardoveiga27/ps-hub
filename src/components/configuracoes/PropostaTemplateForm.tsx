import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  descricao: z.string().max(500).optional(),
  html_content: z.string().min(1, "HTML obrigatório"),
  status: z.enum(["ativo", "inativo"]),
});

export type TemplateFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TemplateFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<TemplateFormValues>;
}

export default function PropostaTemplateForm({ open, onOpenChange, onSubmit, loading, defaultValues }: Props) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: defaultValues?.nome || "",
      descricao: defaultValues?.descricao || "",
      html_content: defaultValues?.html_content || "",
      status: defaultValues?.status || "ativo",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues?.nome ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Nome *</Label>
            <Input {...form.register("nome")} className="bg-white/5 border-white/10 text-white" placeholder="Ex: Proposta Padrão 2026" />
            {form.formState.errors.nome && <p className="text-red-400 text-xs">{form.formState.errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Descrição</Label>
            <Textarea {...form.register("descricao")} className="bg-white/5 border-white/10 text-white" rows={2} placeholder="Descrição breve do template" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">HTML do Template *</Label>
            <Textarea
              {...form.register("html_content")}
              className="bg-white/5 border-white/10 text-white font-mono text-xs min-h-[300px]"
              placeholder={'Cole aqui o HTML do template. Use {{variavel}} para campos dinâmicos.'}
            />
            {form.formState.errors.html_content && <p className="text-red-400 text-xs">{form.formState.errors.html_content.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Status</Label>
            <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as any)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white hover:bg-white/5">Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
