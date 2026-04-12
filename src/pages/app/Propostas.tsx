import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Propostas() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Propostas</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestão de Propostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/40">Propostas comerciais serão implementadas na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
