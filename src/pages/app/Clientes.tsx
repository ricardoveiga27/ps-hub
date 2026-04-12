import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function Clientes() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Clientes</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestão de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/40">CRUD de clientes será implementado na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
