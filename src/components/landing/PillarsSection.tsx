import { Radar, ShieldCheck, GraduationCap } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const pillars = [
  {
    num: "01",
    badge: "AVALIAR",
    icon: Radar,
    title: "PS Index",
    subtitle: "Mapeamento de Riscos Psicossociais",
    description:
      "Avalia, mapeia e propõe planos de ação para o enfrentamento dos riscos psicossociais na sua organização. Entregue via link ou QR Code, com relatórios automáticos e recomendações práticas alinhadas à NR-01.",
    color: "#0C1BC9",
    tw: "ps-blue",
  },
  {
    num: "02",
    badge: "ACOLHER",
    icon: ShieldCheck,
    title: "PS Escuta",
    subtitle: "Canal de Escuta, Acolhimento e Denúncia",
    description:
      "Um canal seguro e sigiloso onde colaboradores podem registrar denúncias e situações sensíveis. Nossa equipe realiza a triagem inicial, encaminha para a empresa contratante conduzir a investigação e garante a devolutiva ao denunciante — com rastreabilidade e conformidade com a LGPD.",
    color: "#7C3AED",
    tw: "ps-violet",
  },
  {
    num: "03",
    badge: "DESENVOLVER",
    icon: GraduationCap,
    title: "PS Cultura",
    subtitle: "Treinamento e Educação Organizacional",
    description:
      "Treina e educa toda a estrutura organizacional — do trabalhador ao empregador. Conteúdos formativos sobre saúde mental, liderança saudável, prevenção de assédio e cultura organizacional positiva, adaptados a cada nível hierárquico.",
    color: "#00D857",
    tw: "ps-green",
  },
];

const PillarsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="pilares" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className={`font-heading text-3xl md:text-4xl font-bold text-center text-foreground mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Os Três Pilares
        </h2>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((p, i) => (
            <div
              key={p.num}
              className={`glass-card rounded-2xl p-8 relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{
                borderTop: `3px solid ${p.color}`,
                transitionDelay: isVisible ? `${i * 150 + 200}ms` : "0ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px -15px ${p.color}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Watermark number */}
              <span
                className="absolute -top-4 -right-2 font-heading text-[120px] font-bold leading-none pointer-events-none select-none"
                style={{ color: p.color, opacity: 0.05 }}
              >
                {p.num}
              </span>

              {/* Badge */}
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest mb-6 border"
                style={{ color: p.color, borderColor: `${p.color}60` }}
              >
                {p.badge}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${p.color}15` }}
              >
                <p.icon style={{ color: p.color }} size={24} />
              </div>

              {/* Title */}
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                {p.title}
              </h3>
              <p className="text-muted-foreground text-sm font-semibold mb-4">
                {p.subtitle}
              </p>

              {/* Description */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PillarsSection;
