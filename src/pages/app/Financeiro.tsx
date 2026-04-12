import { useState } from "react";
import { useFaturas, type FaturaFilters } from "@/hooks/useFaturas";
import FinanceiroResumo from "@/components/financeiro/FinanceiroResumo";
import FaturasList from "@/components/financeiro/FaturasList";

export default function Financeiro() {
  const [filters, setFilters] = useState<FaturaFilters>({});
  const { data: faturas = [], isLoading } = useFaturas(filters);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Financeiro</h1>
      <FinanceiroResumo faturas={faturas} />
      <FaturasList
        faturas={faturas}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  );
}
