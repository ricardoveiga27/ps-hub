import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Loader2, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const { user, loading, temAcesso, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ROUTE_TITLES: Record<string, string> = {
    dashboard: "Dashboard",
    clientes: "Clientes",
    propostas: "Propostas",
    contratos: "Contratos",
    assinaturas: "Assinaturas",
    financeiro: "Financeiro",
    comercial: "Comercial",
    configuracoes: "Configurações",
    usuarios: "Usuários",
    pacotes: "Pacotes",
    funcionarios: "Funcionários",
  };

  const segment = location.pathname.split("/")[2] || "dashboard";
  const pageTitle = ROUTE_TITLES[segment] || "Painel";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(226,60%,8%)]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!user) return null;

  if (!temAcesso) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(226,60%,8%)]">
        <div className="text-center space-y-4 max-w-md px-6">
          <ShieldAlert className="h-12 w-12 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Acesso pendente</h1>
          <p className="text-white/60 text-sm">
            Sua conta foi criada mas ainda não tem permissões atribuídas.
            Aguarde a liberação pelo administrador.
          </p>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="mt-4 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(226,60%,8%)]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-white/10 px-4 shrink-0">
            <SidebarTrigger className="text-white/70 hover:text-white" />
            <div className="ml-4 text-lg text-white font-semibold font-heading">
              {pageTitle}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
