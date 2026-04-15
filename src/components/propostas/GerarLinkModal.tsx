import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Copy, Link2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePropostaTemplates } from "@/hooks/usePropostaTemplates";
import { useCreatePropostaLink, buildPropostaVariables } from "@/hooks/usePropostaLinks";
import type { Proposta } from "@/hooks/usePropostas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: Proposta;
  cliente: any;
  pacote: any;
}

export default function GerarLinkModal({ open, onOpenChange, proposta, cliente, pacote }: Props) {
  const { data: templates } = usePropostaTemplates();
  const createLink = useCreatePropostaLink();

  const [templateId, setTemplateId] = useState("");
  const [validadeDias, setValidadeDias] = useState(30);
  const [showVars, setShowVars] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => (templates ?? []).filter((t) => t.status === "ativo"),
    [templates]
  );

  const selectedTemplate = activeTemplates.find((t) => t.id === templateId);
  const variables = useMemo(
    () => buildPropostaVariables(proposta, cliente, pacote),
    [proposta, cliente, pacote]
  );

  const publicUrl = generatedToken
    ? `${window.location.origin}/proposta/${generatedToken}`
    : null;

  function handleGerar() {
    if (!templateId || !selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }
    createLink.mutate(
      {
        proposta_id: proposta.id,
        template_id: templateId,
        html_content: selectedTemplate.html_content,
        variables,
        validade_dias: validadeDias,
      },
      {
        onSuccess: (data) => {
          setGeneratedToken(data.token);
          toast.success(`Link gerado com sucesso — válido por ${validadeDias} dias`);
        },
        onError: (e) => toast.error("Erro: " + e.message),
      }
    );
  }

  function handleCopy() {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado!");
    }
  }

  function handleClose(v: boolean) {
    if (!v) {
      setGeneratedToken(null);
      setTemplateId("");
      setValidadeDias(30);
      setShowVars(false);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Gerar Link da Proposta
          </DialogTitle>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTemplates.length === 0 && (
                <p className="text-white/40 text-xs">Nenhum template ativo. Crie um em Configurações → Propostas.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Validade (dias)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={validadeDias}
                onChange={(e) => setValidadeDias(Number(e.target.value) || 30)}
                className="bg-white/5 border-white/10 text-white w-32"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowVars(!showVars)}
                className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80"
              >
                {showVars ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Variáveis ({Object.keys(variables).length})
              </button>
              {showVars && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded bg-white/5 p-3 text-xs space-y-1">
                  {Object.entries(variables).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0 border-white/20 text-white/60">{`{{${k}}}`}</Badge>
                      <span className="text-white/80 truncate">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-emerald-400 text-sm">✓ Link gerado com sucesso!</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={publicUrl || ""}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} className="border-white/10 text-white hover:bg-white/5 shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!generatedToken ? (
            <Button onClick={handleGerar} disabled={!templateId || createLink.isPending}>
              {createLink.isPending ? "Gerando..." : "Gerar Link"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)} className="border-white/10 text-white hover:bg-white/5">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
