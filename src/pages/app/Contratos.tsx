import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function Contratos() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Contratos</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Gestão de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/40">Contratos serão implementados na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
