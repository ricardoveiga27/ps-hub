import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, Search, RefreshCw, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Fatura, FaturaFilters } from "@/hooks/useFaturas";
import { exportarCSV } from "./ExportarCSV";
import FaturaDetalhe from "./FaturaDetalhe";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  faturas: Fatura[];
  isLoading: boolean;
  filters: FaturaFilters;
  onFilterChange: (filters: FaturaFilters) => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDENTE_APROVACAO: { label: "Aguardando Aprovação", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  PENDING: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  RECEIVED: { label: "Recebido", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  OVERDUE: { label: "Vencido", className: "bg-red-500/20 text-red-300 border-red-500/30" },
  CANCELLED: { label: "Cancelado", className: "bg-white/10 text-white/50 border-white/20" },
};

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function FaturasList({ faturas, isLoading, filters, onFilterChange }: Props) {
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [emittingId, setEmittingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const setFilter = (key: keyof FaturaFilters, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleSync = async (fatura: Fatura) => {
    setSyncingId(fatura.id);
    try {
      // Step 1: Sync customer
      const { data: syncData, error: syncError } = await supabase.functions.invoke(
        "pshub-sync-asaas-customer",
        { body: { clienteId: fatura.cliente_id } },
      );
      if (syncError) throw syncError;
      if (syncData?.error) throw new Error(syncData.error);

      // Step 2: Create payment
      const { data: payData, error: payError } = await supabase.functions.invoke(
        "pshub-create-payment",
        { body: { faturaId: fatura.id } },
      );
      if (payError) throw payError;
      if (payData?.error) throw new Error(payData.error);

      toast.success("Fatura sincronizada com Asaas");
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao sincronizar com Asaas");
    } finally {
      setSyncingId(null);
    }
  };

  const handleEmitNf = async (fatura: Fatura) => {
    setEmittingId(fatura.id);
    try {
      const { data, error } = await supabase.functions.invoke("pshub-emit-nfse", {
        body: { faturaId: fatura.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("NFS-e solicitada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao emitir NFS-e");
    } finally {
      setEmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por número..."
            className="pl-9 bg-white/5 border-white/10 text-white"
            value={filters.busca || ""}
            onChange={(e) => setFilter("busca", e.target.value || undefined)}
          />
        </div>

        <Select
          value={filters.status || "all"}
          onValueChange={(v) => setFilter("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDENTE_APROVACAO">Aguardando Aprovação</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="RECEIVED">Recebido</SelectItem>
            <SelectItem value="OVERDUE">Vencido</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal bg-white/5 border-white/10 text-white", !filters.dataInicio && "text-white/40")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataInicio ? format(new Date(filters.dataInicio + "T12:00:00"), "dd/MM/yyyy") : "De"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataInicio ? new Date(filters.dataInicio + "T12:00:00") : undefined}
              onSelect={(d) => setFilter("dataInicio", d ? format(d, "yyyy-MM-dd") : undefined)}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal bg-white/5 border-white/10 text-white", !filters.dataFim && "text-white/40")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataFim ? format(new Date(filters.dataFim + "T12:00:00"), "dd/MM/yyyy") : "Até"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataFim ? new Date(filters.dataFim + "T12:00:00") : undefined}
              onSelect={(d) => setFilter("dataFim", d ? format(d, "yyyy-MM-dd") : undefined)}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          className="bg-white/5 border-white/10 text-white"
          onClick={() => exportarCSV(faturas)}
          disabled={faturas.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white/70">Número</TableHead>
              <TableHead className="text-white/70">Cliente</TableHead>
              <TableHead className="text-white/70">Valor</TableHead>
              <TableHead className="text-white/70">Vencimento</TableHead>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70">Período</TableHead>
              <TableHead className="text-white/70">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-white/40 py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : faturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-white/40 py-8">
                  Nenhuma fatura encontrada
                </TableCell>
              </TableRow>
            ) : (
              faturas.map((f) => {
                const s = statusMap[f.status] || statusMap.PENDING;
                const cliente = f.crm_clientes?.nome_fantasia || f.crm_clientes?.razao_social || "—";
                const isSyncing = syncingId === f.id;
                const isEmitting = emittingId === f.id;
                const hasSynced = !!f.asaas_payment_id;
                return (
                  <TableRow
                    key={f.id}
                    className="border-white/10 hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedFatura(f)}
                  >
                    <TableCell className="text-white font-mono text-xs">{f.numero_fatura || "—"}</TableCell>
                    <TableCell className="text-white">{cliente}</TableCell>
                    <TableCell className="text-white">{fmtCurrency(Number(f.valor))}</TableCell>
                    <TableCell className="text-white/70">{fmtDate(f.data_vencimento)}</TableCell>
                    <TableCell>
                      <Badge className={s.className}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-white/50 text-xs">{f.periodo_referencia || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!hasSynced && f.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-white/70 hover:text-white"
                            disabled={isSyncing}
                            onClick={() => handleSync(f)}
                          >
                            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            <span className="ml-1">Sincronizar</span>
                          </Button>
                        )}
                        {f.status === "RECEIVED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-white/70 hover:text-white"
                            disabled={isEmitting}
                            onClick={() => handleEmitNf(f)}
                          >
                            {isEmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                            <span className="ml-1">Emitir NF</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <FaturaDetalhe
        fatura={selectedFatura}
        open={!!selectedFatura}
        onOpenChange={(open) => { if (!open) setSelectedFatura(null); }}
      />
    </div>
  );
}
