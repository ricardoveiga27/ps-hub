import logo from "@/assets/Logotipo_pshub.png";

const Footer = () => {
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: "#06091A" }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <img src={logo} alt="PS Hub" className="h-12 mx-auto mb-4" />

        <p className="text-muted-foreground text-sm mb-1">
          PS Hub é uma solução da <span className="text-foreground font-medium">Veiga Saúde Ocupacional</span>
        </p>

        <p className="text-muted-foreground/60 text-xs tracking-[0.2em] uppercase mb-8">
          Gestão de Risco Psicossocial
        </p>

        <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
          <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
