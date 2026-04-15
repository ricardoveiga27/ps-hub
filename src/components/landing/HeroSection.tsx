import { ArrowDown, MessageCircle, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/Logotipo_pshub.png";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Access button */}
      <Link
        to={user ? "/app/dashboard" : "/app/login"}
        className="absolute top-6 right-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 border border-white/10 backdrop-blur-md transition-all duration-300 hover:text-white hover:border-white/30 hover:bg-white/5"
      >
        <LogIn size={16} />
        {user ? "Ir para o painel" : "Acesso restrito"}
      </Link>

      {/* Mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-ps-blue/20 blur-[120px] animate-mesh-1" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-ps-violet/15 blur-[120px] animate-mesh-2" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] rounded-full bg-ps-green/10 blur-[120px] animate-mesh-3" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Logo */}
        <img src={logo} alt="PS Hub - Gestão de Risco Psicossocial" className="h-20 md:h-28 mx-auto mb-8" />

        {/* Tagline */}
        <p className="font-heading text-xl md:text-2xl lg:text-3xl font-semibold text-foreground max-w-3xl mx-auto mb-4 leading-tight">
          O ecossistema completo de saúde psicossocial e compliance para sua empresa.
        </p>

        {/* Subtítulo */}
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Avalie riscos, acolha denúncias e desenvolva uma cultura organizacional saudável — em uma única plataforma integrada.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pilares"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-heading font-semibold text-white text-base transition-all duration-300 hover:brightness-110 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #0C1BC9, #00D857)" }}
          >
            Conhecer os Pilares
            <ArrowDown size={18} />
          </a>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-heading font-semibold text-ps-green text-base border-2 border-ps-green/60 transition-all duration-300 hover:bg-ps-green/10 hover:border-ps-green hover:scale-105"
          >
            <MessageCircle size={18} />
            Falar com um especialista
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
