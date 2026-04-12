import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Eye, EyeOff, Save, Info } from "lucide-react";
import { useAsaasConfig, useUpdateAsaasConfig } from "@/hooks/useAsaasConfig";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { data: config, isLoading } = useAsaasConfig();
  const updateMutation = useUpdateAsaasConfig();
  const { toast } = useToast();

  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    api_key: "",
    environment: "sandbox",
    wallet_id: "",
    webhook_token: "",
    nfse_enabled: false,
    is_active: true,
    nome: "PS Hub - Veiga Perícias",
  });

  useEffect(() => {
    if (config) {
      setForm({
        api_key: config.api_key,
        environment: config.environment,
        wallet_id: config.wallet_id ?? "",
        webhook_token: config.webhook_token ?? "",
        nfse_enabled: config.nfse_enabled,
        is_active: config.is_active,
        nome: config.nome,
      });
    }
  }, [config]);

  function handleSave() {
    updateMutation.mutate(
      {
        id: config?.id,
        api_key: form.api_key,
        environment: form.environment,
        wallet_id: form.wallet_id || null,
        webhook_token: form.webhook_token || null,
        nfse_enabled: form.nfse_enabled,
        is_active: form.is_active,
        nome: form.nome,
      },
      {
        onSuccess: () => toast({ title: "Configuração salva com sucesso" }),
        onError: () => toast({ title: "Erro ao salvar configuração", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-white">Configurações</h1>
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white">Configurações</h1>

      {/* Integração Asaas */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integração Asaas
          </CardTitle>
          <Badge variant={form.is_active ? "default" : "secondary"}>
            {form.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-white/70">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                className="bg-white/5 border-white/10 text-white pr-10"
                placeholder="Insira a API Key do Asaas"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ambiente */}
            <div className="space-y-2">
              <Label className="text-white/70">Ambiente</Label>
              <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wallet ID */}
            <div className="space-y-2">
              <Label className="text-white/70">Wallet ID</Label>
              <Input
                value={form.wallet_id}
                onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Webhook Token */}
          <div className="space-y-2">
            <Label className="text-white/70">Webhook Token</Label>
            <Input
              value={form.webhook_token}
              onChange={(e) => setForm({ ...form, webhook_token: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="Token de autenticação do webhook"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* NFS-e */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.nfse_enabled}
                onCheckedChange={(v) => setForm({ ...form, nfse_enabled: v })}
              />
              <Label className="text-white/70">Emissão automática de NFS-e</Label>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label className="text-white/70">Integração ativa</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Instância</span>
            <span className="text-white/80">{form.nome}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Versão</span>
            <span className="text-white/80">1.0.0 — Fase 7</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
