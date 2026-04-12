import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Configurações</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/40">Configuração da API Asaas será implementada na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
