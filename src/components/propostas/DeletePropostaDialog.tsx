import { useState, useEffect } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  numeroProposta: string;
  clienteNome?: string | null;
  loading?: boolean;
  onConfirm: (motivo: string) => void;
}

export default function DeletePropostaDialog({
  open, onOpenChange, numeroProposta, clienteNome, loading, onConfirm,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [motivo, setMotivo] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setMotivo("");
      setConfirmText("");
    }
  }, [open]);

  const motivoOk = motivo.trim().length >= 10;
  const numeroOk = confirmText.trim().toUpperCase() === numeroProposta.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {step === 1 ? "Excluir proposta — Etapa 1 de 2" : "Confirmação final — Etapa 2 de 2"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200/90">
              ⚠️ Esta ação é <strong>irreversível</strong>. O motivo será gravado em auditoria
              junto com seu nome e o conteúdo completo da proposta.
            </div>
            <div>
              <Label className="text-white/70 mb-1.5 block">
                Motivo da exclusão <span className="text-red-400">*</span>
                <span className="text-white/40 text-xs ml-2">(mínimo 10 caracteres)</span>
              </Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: Proposta criada por engano, valor incorreto, cliente solicitou cancelamento..."
                rows={4}
                className="bg-white/5 border-white/10 text-white"
                autoFocus
              />
              <p className="text-xs text-white/40 mt-1">{motivo.trim().length} caracteres</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}
                className="border-white/10 text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)} disabled={!motivoOk}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40">
                Continuar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200/90">
              Você está prestes a excluir definitivamente a proposta{" "}
              <strong className="font-mono">{numeroProposta}</strong>
              {clienteNome ? <> do cliente <strong>{clienteNome}</strong></> : null}.
            </div>
            <div>
              <Label className="text-white/70 mb-1.5 block">
                Para confirmar, digite o número da proposta abaixo:
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={numeroProposta}
                className="bg-white/5 border-white/10 text-white font-mono"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}
                className="border-white/10 text-white hover:bg-white/5">
                Voltar
              </Button>
              <Button
                onClick={() => onConfirm(motivo.trim())}
                disabled={!numeroOk || loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Excluindo..." : "Excluir definitivamente"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
