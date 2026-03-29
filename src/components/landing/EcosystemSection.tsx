import { BarChart3, Shield, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: BarChart3, label: "Avaliar", color: "text-ps-blue", bg: "bg-ps-blue/10", border: "border-ps-blue/30" },
  { icon: Shield, label: "Acolher", color: "text-ps-violet", bg: "bg-ps-violet/10", border: "border-ps-violet/30" },
  { icon: Users, label: "Desenvolver", color: "text-ps-green", bg: "bg-ps-green/10", border: "border-ps-green/30" },
];

const EcosystemSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 px-6" style={{ backgroundColor: "#0A0E1C" }}>
      <div
        className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
          Por que um ecossistema?
        </h2>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
          A NR-01 exige que empresas identifiquem, previnam e respondam aos riscos psicossociais. O PS Hub foi desenhado para cobrir cada etapa desse ciclo — com ferramentas especializadas que se complementam.
        </p>
      </div>

      <div
        className={`max-w-2xl mx-auto flex items-center justify-between relative transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Gradient connecting line */}
        <div
          className="absolute top-1/2 left-[15%] right-[15%] h-0.5 -translate-y-1/2 rounded-full"
          style={{ background: "linear-gradient(90deg, #0C1BC9, #7C3AED, #00D857)" }}
        />

        {steps.map((step) => (
          <div key={step.label} className="relative z-10 flex flex-col items-center gap-3">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center backdrop-blur-sm`}>
              <step.icon className={`${step.color} w-7 h-7 md:w-8 md:h-8`} />
            </div>
            <span className={`font-heading font-semibold text-sm md:text-base ${step.color}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EcosystemSection;
