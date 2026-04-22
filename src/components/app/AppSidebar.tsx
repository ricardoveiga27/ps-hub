import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  ScrollText,
  Repeat,
  Wallet,
  Settings,
  LogOut,
  Users,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, perfil } = useAuth();

  const menuItems = [
    { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, show: true },
    { title: "Comercial", url: "/app/comercial", icon: TrendingUp,
      show: perfil.is_admin || perfil.is_comercial },
    { title: "Pacotes", url: "/app/pacotes", icon: Package,
      show: perfil.is_admin || perfil.is_comercial },
    { title: "Clientes", url: "/app/clientes", icon: Building2,
      show: perfil.is_admin || perfil.is_comercial || perfil.is_financeiro || perfil.is_operador },
    { title: "Funcionários", url: "/app/funcionarios", icon: Users,
      show: perfil.is_admin || perfil.is_comercial || perfil.is_operador },
    { title: "Propostas", url: "/app/propostas", icon: FileText,
      show: perfil.is_admin || perfil.is_comercial || perfil.is_operador },
    { title: "Contratos", url: "/app/contratos", icon: ScrollText,
      show: perfil.is_admin || perfil.is_comercial || perfil.is_financeiro || perfil.is_operador },
    { title: "Assinaturas", url: "/app/assinaturas", icon: Repeat,
      show: perfil.is_admin || perfil.is_comercial || perfil.is_financeiro || perfil.is_operador },
    { title: "Financeiro", url: "/app/financeiro", icon: Wallet,
      show: perfil.is_admin || perfil.is_financeiro },
    { title: "Configurações", url: "/app/configuracoes", icon: Settings,
      show: perfil.is_admin },
    { title: "Usuários", url: "/app/usuarios", icon: Users,
      show: perfil.is_admin },
  ].filter(item => item.show);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(235,85%,42%)] to-[hsl(263,84%,58%)]">
            <span className="text-sm font-bold text-white">PS</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-heading font-bold text-white">
              PS Hub
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                      activeClassName="bg-white/10 text-white font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {!collapsed && (
          <div className="px-2 pb-2">
            <div className="flex flex-wrap gap-1">
              {perfil.is_comercial && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">comercial</Badge>}
              {perfil.is_financeiro && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">financeiro</Badge>}
              {perfil.is_operador && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">operador</Badge>}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={() => signOut()}
          className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
