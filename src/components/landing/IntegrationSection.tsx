import { Radar, ShieldCheck, GraduationCap, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: Radar, label: "PS Index", sub: "Identifica riscos", color: "#0C1BC9" },
  { icon: ShieldCheck, label: "PS Escuta", sub: "Recebe e trata casos", color: "#7C3AED" },
  { icon: GraduationCap, label: "PS Cultura", sub: "Educa e previne", color: "#00D857" },
];

const IntegrationSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 px-6" style={{ backgroundColor: "#0A0E1C" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className={`font-heading text-3xl md:text-4xl font-bold text-center text-foreground mb-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Como o Ecossistema se Integra
        </h2>

        <div
          className={`flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mt-16 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center text-center w-40">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border"
                  style={{ backgroundColor: `${step.color}15`, borderColor: `${step.color}40` }}
                >
                  <step.icon style={{ color: step.color }} size={28} />
                </div>
                <span className="font-heading font-bold text-foreground text-sm">{step.label}</span>
                <span className="text-muted-foreground text-xs mt-1">{step.sub}</span>
              </div>

              {i < steps.length - 1 && (
                <ArrowRight className="text-muted-foreground mx-2 hidden md:block" size={24} />
              )}
            </div>
          ))}

          {/* Return arrow */}
          <div className="hidden md:flex items-center ml-2">
            <ArrowRight className="text-muted-foreground" size={24} />
            <span className="text-xs text-muted-foreground ml-2 font-body">↻ ciclo</span>
          </div>
        </div>

        <p
          className={`text-center text-muted-foreground text-base mt-12 max-w-xl mx-auto transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Cada pilar alimenta o ciclo de melhoria contínua da saúde organizacional.
        </p>
      </div>
    </section>
  );
};

export default IntegrationSection;
