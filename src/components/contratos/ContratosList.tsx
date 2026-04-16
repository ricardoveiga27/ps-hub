import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useContratos } from "@/hooks/useContratos";

const STATUS_BADGE: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400",
  cancelado: "bg-red-500/20 text-red-400",
  encerrado: "bg-white/10 text-white/60",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function ProductDots({ index, escuta, cultura }: { index: boolean; escuta: boolean; cultura: boolean }) {
  return (
    <div className="flex gap-1.5">
      {index && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} title="PS Index" />}
      {escuta && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#8B5CF6" }} title="PS Escuta" />}
      {cultura && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10B981" }} title="PS Cultura" />}
    </div>
  );
}

export default function ContratosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data: contratos, isLoading } = useContratos({ search, status });

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={status || "todos"} onValueChange={(v) => setStatus(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Código</TableHead>
              <TableHead className="text-white/50">Cliente</TableHead>
              <TableHead className="text-white/50 text-center">Vidas</TableHead>
              <TableHead className="text-white/50 text-right">Valor Mensal</TableHead>
              <TableHead className="text-white/50">Produtos</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Início</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-white/40 py-8">Carregando...</TableCell></TableRow>
            ) : !contratos?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-white/40 py-8">Nenhum contrato encontrado</TableCell></TableRow>
            ) : contratos.map((c) => (
              <TableRow
                key={c.id}
                className="border-white/10 cursor-pointer hover:bg-white/5"
                onClick={() => navigate(`/app/contratos/${c.id}`)}
              >
                <TableCell className="text-white/60 font-mono text-xs">{c.codigo_contrato ?? "—"}</TableCell>
                <TableCell className="text-white">{c.crm_clientes?.razao_social ?? "—"}</TableCell>
                <TableCell className="text-white/60 text-center">{c.vidas}</TableCell>
                <TableCell className="text-white text-right font-medium">{formatCurrency(c.valor_mensal)}</TableCell>
                <TableCell>
                  <ProductDots index={c.ps_index_ativo} escuta={c.ps_escuta_ativo} cultura={c.ps_cultura_ativo} />
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_BADGE[c.status] || "bg-white/10 text-white/60"}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-white/60">{formatDate(c.data_inicio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
