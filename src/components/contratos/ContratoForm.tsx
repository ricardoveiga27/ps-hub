import { useForm } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface ContratoFormValues {
  vidas: number;
  valor_mensal: number;
  dia_vencimento: number;
  indice_reajuste: string;
  ps_index_ativo: boolean;
  ps_escuta_ativo: boolean;
  ps_cultura_ativo: boolean;
  observacoes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: ContratoFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<ContratoFormValues>;
}

export default function ContratoForm({ open, onOpenChange, onSubmit, loading, defaultValues }: Props) {
  const { register, handleSubmit, setValue, watch } = useForm<ContratoFormValues>({
    defaultValues: {
      vidas: defaultValues?.vidas ?? 1,
      valor_mensal: defaultValues?.valor_mensal ?? 0,
      dia_vencimento: defaultValues?.dia_vencimento ?? 10,
      indice_reajuste: defaultValues?.indice_reajuste ?? "IGPM",
      ps_index_ativo: defaultValues?.ps_index_ativo ?? true,
      ps_escuta_ativo: defaultValues?.ps_escuta_ativo ?? true,
      ps_cultura_ativo: defaultValues?.ps_cultura_ativo ?? true,
      observacoes: defaultValues?.observacoes ?? "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60">Vidas</Label>
              <Input type="number" min={1} {...register("vidas", { valueAsNumber: true })} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60">Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" min={0} {...register("valor_mensal", { valueAsNumber: true })} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60">Dia Vencimento</Label>
              <Input type="number" min={1} max={31} {...register("dia_vencimento", { valueAsNumber: true })} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60">Índice Reajuste</Label>
              <Select value={watch("indice_reajuste")} onValueChange={(v) => setValue("indice_reajuste", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IGPM">IGP-M</SelectItem>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                  <SelectItem value="FIXO">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/60">Produtos Ativos</Label>
            <div className="flex gap-4">
              {([
                ["ps_index_ativo", "PS Index", "#3B82F6"],
                ["ps_escuta_ativo", "PS Escuta", "#8B5CF6"],
                ["ps_cultura_ativo", "PS Cultura", "#10B981"],
              ] as const).map(([key, label, color]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-white/70">
                  <Checkbox
                    checked={watch(key)}
                    onCheckedChange={(v) => setValue(key, !!v)}
                  />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-white/60">Observações</Label>
            <Textarea {...register("observacoes")} className="bg-white/5 border-white/10 text-white" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60">Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
