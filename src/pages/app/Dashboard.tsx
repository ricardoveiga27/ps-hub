import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Dashboard</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/40">Métricas e indicadores serão implementados na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
