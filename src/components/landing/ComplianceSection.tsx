import { useScrollReveal } from "@/hooks/useScrollReveal";

const badges = [
  { label: "NR-01", color: "#0C1BC9" },
  { label: "Lei 14.457/22", color: "#7C3AED" },
  { label: "LGPD", color: "#00D857" },
];

const ComplianceSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className={`font-heading text-3xl md:text-4xl font-bold text-foreground mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Desenvolvido para conformidade total
        </h2>

        <div
          className={`flex flex-wrap items-center justify-center gap-4 mb-10 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {badges.map((b) => (
            <span
              key={b.label}
              className="px-6 py-3 rounded-xl font-heading font-semibold text-sm md:text-base border-2 glass-card"
              style={{ borderColor: `${b.color}80`, color: b.color }}
            >
              {b.label}
            </span>
          ))}
        </div>

        <p
          className={`text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          O PS Hub foi construído sobre os pilares regulatórios que regem a saúde psicossocial no Brasil, garantindo que sua empresa esteja protegida, documentada e em dia com as exigências legais.
        </p>
      </div>
    </section>
  );
};

export default ComplianceSection;
