import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateFatura, type Fatura } from "@/hooks/useFaturas";
import { toast } from "sonner";

interface Props {
  fatura: Fatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  RECEIVED: { label: "Recebido", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  OVERDUE: { label: "Vencido", className: "bg-red-500/20 text-red-300 border-red-500/30" },
  CANCELLED: { label: "Cancelado", className: "bg-white/10 text-white/50 border-white/20" },
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function FaturaDetalhe({ fatura, open, onOpenChange }: Props) {
  const updateFatura = useUpdateFatura();

  if (!fatura) return null;

  const s = statusMap[fatura.status] || statusMap.PENDING;

  const handleMarcarPaga = () => {
    updateFatura.mutate(
      { id: fatura.id, status: "RECEIVED" },
      {
        onSuccess: () => {
          toast.success("Fatura marcada como paga");
          onOpenChange(false);
        },
        onError: () => toast.error("Erro ao atualizar fatura"),
      },
    );
  };

  const handleCancelar = () => {
    updateFatura.mutate(
      { id: fatura.id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.success("Fatura cancelada");
          onOpenChange(false);
        },
        onError: () => toast.error("Erro ao cancelar fatura"),
      },
    );
  };

  const cliente = fatura.crm_clientes?.nome_fantasia || fatura.crm_clientes?.razao_social || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            Fatura {fatura.numero_fatura || "—"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Detalhes da fatura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Cliente</span>
            <span>{cliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Valor</span>
            <span className="font-semibold">{fmt(Number(fatura.valor))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Emissão</span>
            <span>{fmtDate(fatura.data_emissao)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Vencimento</span>
            <span>{fmtDate(fatura.data_vencimento)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Período</span>
            <span>{fatura.periodo_referencia || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50">Status</span>
            <Badge className={s.className}>{s.label}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Descrição</span>
            <span className="text-right max-w-[60%]">{fatura.descricao}</span>
          </div>

          {(fatura.boleto_url || fatura.pix_copy_paste || fatura.invoice_url) && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-wider">Links</p>
              {fatura.boleto_url && (
                <a href={fatura.boleto_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block text-xs">
                  Boleto
                </a>
              )}
              {fatura.pix_copy_paste && (
                <p className="text-xs text-white/70 break-all">PIX: {fatura.pix_copy_paste}</p>
              )}
              {fatura.invoice_url && (
                <a href={fatura.invoice_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block text-xs">
                  Invoice
                </a>
              )}
            </div>
          )}
        </div>

        {fatura.status !== "RECEIVED" && fatura.status !== "CANCELLED" && (
          <div className="flex gap-2 pt-4">
            <Button size="sm" onClick={handleMarcarPaga} disabled={updateFatura.isPending}>
              Marcar como Paga
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={updateFatura.isPending}>
                  Cancelar Fatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar fatura?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50">
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 text-white">Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelar} className="bg-destructive text-destructive-foreground">
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
