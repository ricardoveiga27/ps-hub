import { useScrollReveal } from "@/hooks/useScrollReveal";

const CtaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      id="cta"
      ref={ref}
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0C1BC9, #7C3AED, #00D857)" }}
    >
      <div
        className={`max-w-2xl mx-auto text-center relative z-10 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Pronto para transformar o ambiente da sua empresa?
        </h2>
        <p className="text-white/80 text-base md:text-lg mb-10">
          Conheça como o PS Hub pode ser implementado na sua organização.
        </p>
        <a
          href="#"
          className="inline-block px-10 py-4 rounded-lg bg-white text-ps-dark font-heading font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          Solicitar uma demonstração
        </a>
      </div>
    </section>
  );
};

export default CtaSection;
