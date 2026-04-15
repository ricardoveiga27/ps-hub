import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PropostaPublica from "./pages/PropostaPublica.tsx";
import Login from "./pages/app/Login.tsx";
import AppLayout from "./components/app/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Clientes from "./pages/app/Clientes.tsx";
import ClienteDetalhe from "./pages/app/ClienteDetalhe.tsx";
import Propostas from "./pages/app/Propostas.tsx";
import PropostaDetalhe from "./pages/app/PropostaDetalhe.tsx";
import Contratos from "./pages/app/Contratos.tsx";
import ContratoDetalhe from "./pages/app/ContratoDetalhe.tsx";
import Financeiro from "./pages/app/Financeiro.tsx";
import Assinaturas from "./pages/app/Assinaturas.tsx";
import Pacotes from "./pages/app/Pacotes.tsx";
import Configuracoes from "./pages/app/Configuracoes.tsx";
import Usuarios from "./pages/app/Usuarios.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/proposta/:token" element={<PropostaPublica />} />
          <Route path="/app/login" element={<Login />} />
          <Route path="/app" element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="pacotes" element={<Pacotes />} />
            <Route path="clientes/:id" element={<ClienteDetalhe />} />
            <Route path="propostas" element={<Propostas />} />
            <Route path="propostas/:id" element={<PropostaDetalhe />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="contratos/:id" element={<ContratoDetalhe />} />
            <Route path="assinaturas" element={<Assinaturas />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
