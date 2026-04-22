import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, FileText, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClientes } from "@/hooks/useClientes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClienteId?: string;
}

interface ParsedRow {
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  cargo: string | null;
  setor: string | null;
  data_admissao: string | null;
}

interface RowError {
  linha: number;
  nome: string;
  campo: string;
  motivo: string;
  valorInvalido?: string;
}

interface ParseResult {
  valid: ParsedRow[];
  errors: RowError[];
}

const TEMPLATE_CSV =
  "nome;cpf;telefone;email;cargo;setor;data_admissao\n" +
  "Ricardo Veiga;123.456.789-09;11999990001;ricardo@veiga.com;Presidente;Diretoria;01/01/2020\n" +
  "Maria Santos;;11988887777;maria@empresa.com;Analista;RH;15/03/2022\n" +
  "Carlos Lima;111.222.333-96;;carlos@empresa.com;Técnico;Operações;\n";

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
  const d = digitsOnly(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10]);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDate(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  // ISO AAAA-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(`${y}-${m}-${d}T00:00:00`);
    if (!isNaN(dt.getTime()) && dt.getFullYear() === +y && dt.getMonth() + 1 === +m && dt.getDate() === +d) {
      return `${y}-${m}-${d}`;
    }
    return null;
  }
  // BR DD/MM/AAAA
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (br) {
    const [, d, m, y] = br;
    const dt = new Date(`${y}-${m}-${d}T00:00:00`);
    if (!isNaN(dt.getTime()) && dt.getFullYear() === +y && dt.getMonth() + 1 === +m && dt.getDate() === +d) {
      return `${y}-${m}-${d}`;
    }
    return null;
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  // Suporte simples a aspas duplas
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ";" && !inQ) {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): ParseResult {
  const result: ParseResult = { valid: [], errors: [] };
  // Remove BOM
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/);
  if (lines.length === 0) return result;

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const iNome = idx("nome");
  const iCpf = idx("cpf");
  const iTel = idx("telefone", "celular", "whatsapp");
  const iEmail = idx("email", "e-mail");
  const iCargo = idx("cargo");
  const iSetor = idx("setor");
  const iData = idx("data_admissao", "admissao", "data_de_admissao", "admissão", "data de admissão");

  if (iNome === -1) {
    result.errors.push({ linha: 1, nome: "(cabeçalho)", campo: "Nome", motivo: "coluna não encontrada no cabeçalho" });
    return result;
  }

  const cpfsSeen = new Set<string>();

  for (let li = 1; li < lines.length; li++) {
    const raw = lines[li];
    if (!raw || !raw.trim()) continue;
    const cols = splitCsvLine(raw);
    const fileLine = li + 1;

    const get = (i: number) => (i >= 0 && i < cols.length ? cols[i].trim() : "");

    const nome = get(iNome);
    const cpfRaw = get(iCpf);
    const telRaw = get(iTel);
    const email = get(iEmail);
    const cargo = get(iCargo);
    const setor = get(iSetor);
    const dataRaw = get(iData);

    // Linha completamente vazia
    if (!nome && !cpfRaw && !telRaw && !email && !cargo && !setor && !dataRaw) continue;

    const nomeLabel = nome || "(sem nome)";

    if (!nome) {
      result.errors.push({ linha: fileLine, nome: nomeLabel, campo: "Nome", motivo: "obrigatório" });
      continue;
    }

    let cpf: string | null = null;
    if (cpfRaw) {
      const d = digitsOnly(cpfRaw);
      if (!isValidCpf(d)) {
        result.errors.push({ linha: fileLine, nome: nomeLabel, campo: "CPF", motivo: "inválido", valorInvalido: cpfRaw });
        continue;
      }
      if (cpfsSeen.has(d)) {
        result.errors.push({ linha: fileLine, nome: nomeLabel, campo: "CPF", motivo: "duplicado no arquivo", valorInvalido: cpfRaw });
        continue;
      }
      cpfsSeen.add(d);
      cpf = d;
    }

    if (email && !EMAIL_RE.test(email)) {
      result.errors.push({ linha: fileLine, nome: nomeLabel, campo: "Email", motivo: "formato inválido", valorInvalido: email });
      continue;
    }

    let data_admissao: string | null = null;
    if (dataRaw) {
      const parsed = parseDate(dataRaw);
      if (!parsed) {
        result.errors.push({ linha: fileLine, nome: nomeLabel, campo: "Data de admissão", motivo: "formato inválido", valorInvalido: dataRaw });
        continue;
      }
      data_admissao = parsed;
    }

    const telefone = telRaw ? digitsOnly(telRaw) || null : null;

    result.valid.push({
      nome,
      cpf,
      telefone,
      email: email || null,
      cargo: cargo || null,
      setor: setor || null,
      data_admissao,
    });
  }

  return result;
}

export function ImportFuncionariosCsvDialog({ open, onOpenChange, defaultClienteId }: Props) {
  const qc = useQueryClient();
  const { data: clientes, isLoading: loadingClientes } = useClientes({ status: "ativo" });
  const inputRef = useRef<HTMLInputElement>(null);

  const [clienteId, setClienteId] = useState<string>(defaultClienteId ?? "");
  const [fileName, setFileName] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sortedClientes = useMemo(
    () => (clientes ?? []).slice().sort((a, b) => a.razao_social.localeCompare(b.razao_social)),
    [clientes]
  );

  function reset() {
    setFileName("");
    setParseResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose(o: boolean) {
    if (!o) {
      reset();
      setClienteId(defaultClienteId ?? "");
    }
    onOpenChange(o);
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_funcionarios.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }
    try {
      const text = await file.text();
      const res = parseCsv(text);
      setFileName(file.name);
      setParseResult(res);
    } catch (e: any) {
      toast.error("Erro ao ler arquivo: " + (e?.message ?? "desconhecido"));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!clienteId) throw new Error("Selecione um cliente");
      if (!parseResult || parseResult.valid.length === 0) throw new Error("Nenhuma linha válida");
      const payload = parseResult.valid.map((r) => ({
        cliente_id: clienteId,
        nome: r.nome,
        cpf: r.cpf,
        telefone: r.telefone,
        email: r.email,
        cargo: r.cargo,
        setor: r.setor,
        data_admissao: r.data_admissao,
        status: "ativo",
        origem: "importacao",
      }));
      const { error, count } = await supabase
        .from("crm_funcionarios")
        .insert(payload, { count: "exact" });
      if (error) throw error;
      return count ?? payload.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} funcionário${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"} com sucesso`);
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      qc.invalidateQueries({ queryKey: ["funcionarios-cliente"] });
      handleClose(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao importar"),
  });

  const validCount = parseResult?.valid.length ?? 0;
  const errorCount = parseResult?.errors.length ?? 0;
  const canImport = !!clienteId && validCount > 0 && !importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[hsl(var(--ps-bg-dark))] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Importar Funcionários via CSV</DialogTitle>
          <DialogDescription className="text-white/60">
            Importe funcionários em massa para o cliente selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-white/80">Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId} disabled={loadingClientes}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {sortedClientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modelo */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" /> Baixar Modelo CSV
            </Button>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-white/5" : "border-white/20 hover:bg-white/5"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-white/40 mb-2" />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                <FileText className="h-4 w-4" /> {fileName}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-white/40 hover:text-white ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-white/60 text-sm">Clique para selecionar ou arraste o arquivo CSV</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Preview */}
          {parseResult && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  {validCount} válido{validCount === 1 ? "" : "s"}
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400">
                    {errorCount} erro{errorCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              {errorCount > 0 && (
                <ScrollArea className="h-48 rounded border border-white/10 bg-white/5 p-3">
                  <ul className="space-y-1 text-sm text-red-300">
                    {parseResult.errors.map((e, i) => (
                      <li key={i}>Linha {e.line}: {e.message}</li>
                    ))}
                  </ul>
                </ScrollArea>
              )}

              {errorCount === 0 && validCount > 0 && (
                <Alert className="border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-300">Pronto para importar</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!canImport}
          >
            {importMutation.isPending
              ? "Importando..."
              : `Importar ${validCount} funcionário${validCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportFuncionariosCsvDialog;
