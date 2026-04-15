import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, ShieldAlert, RefreshCw, Clock, KeyRound } from "lucide-react";

type CrmUsuario = {
  id: string;
  nome: string;
  email: string;
  is_ativo: boolean;
  is_comercial: boolean;
  is_financeiro: boolean;
  is_operador: boolean;
  is_admin: boolean;
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  nome: string;
  invited_at: string;
};

export default function Usuarios() {
  const { perfil } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviting, setInviting] = useState(false);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["crm_usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_usuarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as CrmUsuario[];
    },
    enabled: perfil.is_admin,
  });

  const { data: pendingInvites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ["pending_invites"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("pshub-list-pending-invites", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      return (res.data as PendingInvite[]) || [];
    },
    enabled: perfil.is_admin,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, campo, valor }: { userId: string; campo: "is_comercial" | "is_financeiro" | "is_operador" | "is_ativo"; valor: boolean }) => {
      if (campo === "is_admin" as string) return;
      const updateObj: Record<string, boolean> = {};
      updateObj[campo] = valor;
      const { error } = await supabase
        .from("crm_usuarios")
        .update(updateObj as any)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_usuarios"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar perfil" });
    },
  });

  const [resending, setResending] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  const handleResetPassword = async (email: string) => {
    setResettingPassword(email);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("pshub-reset-password", {
        body: { email },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const body = res.data as { ok?: boolean; error?: string };
      if (body?.error) throw new Error(body.error);
      toast({ title: "Email enviado", description: `Redefinição de senha enviada para ${email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao enviar reset", description: err.message });
    } finally {
      setResettingPassword(null);
    }
  };

  const handleResendInvite = async (email: string, nome: string) => {
    setResending(email);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("pshub-invite-user", {
        body: { email, nome, resend: true },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const body = res.data as { ok?: boolean; error?: string };
      if (body?.error) throw new Error(body.error);
      toast({ title: "Convite reenviado", description: `Novo e-mail enviado para ${email}` });
      queryClient.invalidateQueries({ queryKey: ["pending_invites"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao reenviar", description: err.message });
    } finally {
      setResending(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("pshub-invite-user", {
        body: { email: inviteEmail, nome: inviteNome || inviteEmail.split("@")[0] },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const body = res.data as { ok?: boolean; error?: string };
      if (body?.error) throw new Error(body.error);
      toast({ title: "Convite enviado", description: `E-mail enviado para ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteNome("");
      queryClient.invalidateQueries({ queryKey: ["pending_invites"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao convidar", description: err.message });
    } finally {
      setInviting(false);
    }
  };

  if (!perfil.is_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-white/50 text-sm">Gerencie perfis e permissões dos usuários do sistema.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Nome</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60 text-center">Comercial</TableHead>
                <TableHead className="text-white/60 text-center">Financeiro</TableHead>
                <TableHead className="text-white/60 text-center">Operador</TableHead>
                <TableHead className="text-white/60 text-center">Ativo</TableHead>
                <TableHead className="text-white/60 text-center">Ações</TableHead>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {u.nome}
                    {u.is_admin && (
                      <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-400">
                        admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white/70">{u.email}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.is_comercial}
                      onCheckedChange={(v) => toggleMutation.mutate({ userId: u.id, campo: "is_comercial", valor: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.is_financeiro}
                      onCheckedChange={(v) => toggleMutation.mutate({ userId: u.id, campo: "is_financeiro", valor: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.is_operador}
                      onCheckedChange={(v) => toggleMutation.mutate({ userId: u.id, campo: "is_operador", valor: v })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.is_ativo}
                      onCheckedChange={(v) => {
                        if (!v && !confirm("Deseja realmente desativar este usuário?")) return;
                        toggleMutation.mutate({ userId: u.id, campo: "is_ativo", valor: v });
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-white/60 hover:text-white"
                      disabled={resettingPassword === u.email}
                      onClick={() => handleResetPassword(u.email)}
                    >
                      {resettingPassword === u.email ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" />
                      )}
                      Redefinir Senha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-white/40 py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Convites Pendentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-white/50" />
          <h2 className="text-lg font-semibold text-white">Convites Pendentes</h2>
          {pendingInvites.length > 0 && (
            <Badge variant="secondary" className="text-xs">{pendingInvites.length}</Badge>
          )}
        </div>

        {loadingInvites ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-white/50" />
          </div>
        ) : pendingInvites.length === 0 ? (
          <p className="text-white/40 text-sm py-4">Nenhum convite pendente.</p>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Nome</TableHead>
                  <TableHead className="text-white/60">Email</TableHead>
                  <TableHead className="text-white/60">Convidado em</TableHead>
                  <TableHead className="text-white/60 text-center">Status</TableHead>
                  <TableHead className="text-white/60 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{invite.nome}</TableCell>
                    <TableCell className="text-white/70">{invite.email}</TableCell>
                    <TableCell className="text-white/50 text-sm">{formatDate(invite.invited_at)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">
                        pendente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-white/60 hover:text-white"
                        disabled={resending === invite.email}
                        onClick={() => handleResendInvite(invite.email, invite.nome)}
                      >
                        {resending === invite.email ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Reenviar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome completo"
                value={inviteNome}
                onChange={(e) => setInviteNome(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
              {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
