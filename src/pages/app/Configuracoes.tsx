import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, Eye, EyeOff, Save, Info, Plus, Edit, Trash2, ToggleLeft } from "lucide-react";
import { useAsaasConfig, useUpdateAsaasConfig } from "@/hooks/useAsaasConfig";
import { usePropostaTemplates, useCreatePropostaTemplate, useUpdatePropostaTemplate, useDeletePropostaTemplate } from "@/hooks/usePropostaTemplates";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import PropostaTemplateForm, { type TemplateFormValues } from "@/components/configuracoes/PropostaTemplateForm";

const VARIAVEIS_DOC = [
  ["empresa_razao_social", "Razão social do cliente"],
  ["empresa_nome_fantasia", "Nome fantasia do cliente"],
  ["empresa_cnpj", "CNPJ formatado (XX.XXX.XXX/XXXX-XX)"],
  ["proposta_numero", "Número da proposta (ex: PROP-001-2026)"],
  ["proposta_titulo", "Título da proposta"],
  ["proposta_vidas", "Quantidade de vidas"],
  ["proposta_valor_por_vida", "Valor por vida (R$)"],
  ["proposta_valor_tabela", "Valor tabela sem desconto (R$)"],
  ["proposta_valor_desconto", "Valor do desconto (R$)"],
  ["proposta_desconto_pct", "Percentual do desconto"],
  ["proposta_valor_mensal", "Valor mensal final (R$)"],
  ["proposta_validade", "Data de expiração do link"],
  ["pacote_nome", "Nome do pacote"],
  ["pacote_ciclos_index", "Ciclos PS Index por ano"],
  ["pacote_franquia_relatos", "Franquia de relatos"],
  ["pacote_iris", "Incluso ou Não incluso"],
  ["pacote_modulo_liderancas", "Incluso ou Não incluso"],
  ["pacote_catalogo_completo", "Incluso ou Não incluso"],
  ["data_emissao", "Data de emissão (DD/MM/AAAA)"],
  ["veiga_responsavel", "Responsável comercial"],
];

export default function Configuracoes() {
  const { data: config, isLoading } = useAsaasConfig();
  const updateMutation = useUpdateAsaasConfig();
  const { toast: legacyToast } = useToast();

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
        onSuccess: () => legacyToast({ title: "Configuração salva com sucesso" }),
        onError: () => legacyToast({ title: "Erro ao salvar configuração", variant: "destructive" }),
      }
    );
  }

  // Templates state
  const { data: templates, isLoading: templatesLoading } = usePropostaTemplates();
  const createTemplate = useCreatePropostaTemplate();
  const updateTemplate = useUpdatePropostaTemplate();
  const deleteTemplate = useDeletePropostaTemplate();

  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  function handleCreateTemplate(values: TemplateFormValues) {
    createTemplate.mutate(values, {
      onSuccess: () => { toast.success("Template criado"); setTemplateFormOpen(false); },
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  function handleEditTemplate(values: TemplateFormValues) {
    if (!editingTemplate) return;
    updateTemplate.mutate({ id: editingTemplate.id, ...values }, {
      onSuccess: () => { toast.success("Template atualizado"); setEditingTemplate(null); },
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  function handleToggleTemplate(t: any) {
    updateTemplate.mutate({ id: t.id, status: t.status === "ativo" ? "inativo" : "ativo" }, {
      onSuccess: () => toast.success("Status atualizado"),
      onError: (e) => toast.error("Erro: " + e.message),
    });
  }

  function handleDeleteTemplate() {
    if (!deleteTemplateId) return;
    deleteTemplate.mutate(deleteTemplateId, {
      onSuccess: () => { toast.success("Template excluído"); setDeleteTemplateId(null); },
      onError: (e) => toast.error("Erro: " + e.message),
    });
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

      <Tabs defaultValue="asaas">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="asaas" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">Asaas</TabsTrigger>
          <TabsTrigger value="propostas" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">Propostas</TabsTrigger>
        </TabsList>

        {/* Aba Asaas */}
        <TabsContent value="asaas" className="space-y-6 mt-4">
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
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Ambiente</Label>
                  <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Wallet ID</Label>
                  <Input value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Webhook Token</Label>
                <Input value={form.webhook_token} onChange={(e) => setForm({ ...form, webhook_token: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Token de autenticação do webhook" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={form.nfse_enabled} onCheckedChange={(v) => setForm({ ...form, nfse_enabled: v })} />
                  <Label className="text-white/70">Emissão automática de NFS-e</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label className="text-white/70">Integração ativa</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2"><Info className="h-5 w-5" /> Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-white/50">Instância</span><span className="text-white/80">{form.nome}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/50">Versão</span><span className="text-white/80">1.0.0 — Fase 7</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Propostas */}
        <TabsContent value="propostas" className="space-y-6 mt-4">
          {/* Templates */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white/70">Templates de Proposta</CardTitle>
              <Button size="sm" onClick={() => setTemplateFormOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Novo Template
              </Button>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <Skeleton className="h-24 w-full bg-white/10" />
              ) : !templates?.length ? (
                <p className="text-white/40 text-sm text-center py-6">Nenhum template cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/50">Nome</TableHead>
                      <TableHead className="text-white/50">Status</TableHead>
                      <TableHead className="text-white/50">Criado em</TableHead>
                      <TableHead className="text-white/50 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((t) => (
                      <TableRow key={t.id} className="border-white/10">
                        <TableCell className="text-white">{t.nome}</TableCell>
                        <TableCell>
                          <Badge className={t.status === "ativo" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">{new Date(t.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(t)} className="text-white/50 hover:text-white h-8 w-8">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleTemplate(t)} className="text-white/50 hover:text-white h-8 w-8">
                            <ToggleLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTemplateId(t.id)} className="text-red-400/60 hover:text-red-400 h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Variáveis disponíveis */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white/70">Variáveis disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/50">Variável</TableHead>
                    <TableHead className="text-white/50">Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VARIAVEIS_DOC.map(([v, desc]) => (
                    <TableRow key={v} className="border-white/10">
                      <TableCell><code className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-emerald-400">{`{{${v}}}`}</code></TableCell>
                      <TableCell className="text-white/60 text-sm">{desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialogs */}
      <PropostaTemplateForm
        open={templateFormOpen}
        onOpenChange={setTemplateFormOpen}
        onSubmit={handleCreateTemplate}
        loading={createTemplate.isPending}
      />
      {editingTemplate && (
        <PropostaTemplateForm
          open={!!editingTemplate}
          onOpenChange={(v) => { if (!v) setEditingTemplate(null); }}
          onSubmit={handleEditTemplate}
          loading={updateTemplate.isPending}
          defaultValues={{
            nome: editingTemplate.nome,
            descricao: editingTemplate.descricao || "",
            html_content: editingTemplate.html_content,
            status: editingTemplate.status,
          }}
        />
      )}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(v) => { if (!v) setDeleteTemplateId(null); }}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
